-- ============================================================
-- 11-notifications-push.sql
-- Notifications table + push token support for Expo Push Notifications
-- ============================================================

-- Add push_token column to users table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE users ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'parcel_update', 'order_update', 'payment', 'promo')),
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('parcel', 'order', 'payment', 'shop')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications (for server-side triggers)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT DEFAULT 'info',
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, reference_id, reference_type, data)
  VALUES (p_user_id, p_title, p_body, p_type, p_reference_id, p_reference_type, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_notification_id IS NOT NULL THEN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE id = p_notification_id AND user_id = p_user_id;
  ELSE
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE user_id = p_user_id AND is_read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notify sender when parcel status changes
CREATE OR REPLACE FUNCTION notify_parcel_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_id UUID;
  v_tracking_id TEXT;
  v_status_text TEXT;
BEGIN
  -- Only notify on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_sender_id := NEW.sender_id;
  v_tracking_id := NEW.tracking_id;

  -- Map status code to human-readable text
  v_status_text := CASE NEW.status
    WHEN 0 THEN 'created'
    WHEN 1 THEN 'picked up'
    WHEN 2 THEN 'in transit'
    WHEN 3 THEN 'delivered'
    WHEN 4 THEN 'cancelled'
    ELSE 'updated'
  END;

  PERFORM create_notification(
    v_sender_id,
    'Parcel ' || v_status_text,
    'Your parcel ' || v_tracking_id || ' has been ' || v_status_text || '.',
    'parcel_update',
    NEW.id,
    'parcel',
    jsonb_build_object('tracking_id', v_tracking_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to parcels table
DROP TRIGGER IF EXISTS trg_parcel_status_notify ON parcels;
CREATE TRIGGER trg_parcel_status_notify
  AFTER UPDATE OF status ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION notify_parcel_status_change();
