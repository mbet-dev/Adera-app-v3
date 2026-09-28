-- ============================================================
-- 12: Staff broadcast policy + support ticket surfacing
-- ============================================================
-- Allows staff/admin to insert notifications for ALL users (broadcasts and
-- support replies). Without this, RLS silently drops staff-authored rows
-- targeting other users.

-- Staff/admin may insert notifications for any user
CREATE POLICY notifications_staff_insert ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );

-- Staff/admin may read all notifications (support queue visibility)
CREATE POLICY notifications_staff_select ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );

-- Staff/admin may mark tickets read/resolved
CREATE POLICY notifications_staff_update ON notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
    )
  );
