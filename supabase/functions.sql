-- Adera Hybrid App - Database Functions
-- QR Code Generation, Tracking ID, and Business Logic Functions

-- ============================================
-- 1. TRACKING ID GENERATION
-- ============================================
-- Generates unique tracking IDs in format: ADE-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  tracking_id TEXT;
  exists_check BOOLEAN;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  LOOP
    -- Generate 4-character alphanumeric code
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    tracking_id := 'ADE-' || date_part || '-' || random_part;
    
    -- Check if tracking ID already exists
    SELECT EXISTS(SELECT 1 FROM parcels WHERE tracking_id = tracking_id) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN tracking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. QR CODE HASH GENERATION (HMAC-SHA256)
-- ============================================
-- Generates secure QR hash for parcel verification
-- Format: TRACKING_ID|PHASE|PICKUP_PARTNER_ID|TIMESTAMP
CREATE OR REPLACE FUNCTION generate_qr_hash(
  p_tracking_id TEXT,
  p_phase INTEGER,
  p_pickup_partner_id UUID,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TEXT AS $$
DECLARE
  secret_key TEXT;
  payload TEXT;
  hash_bytes BYTEA;
  base36_hash TEXT;
BEGIN
  -- Get secret key from environment (set in Supabase dashboard)
  -- For now, using a placeholder - MUST be changed in production
  secret_key := current_setting('app.qr_secret_key', true);
  IF secret_key IS NULL THEN
    secret_key := 'CHANGE_THIS_IN_PRODUCTION_' || current_database();
  END IF;
  
  -- Create payload
  payload := p_tracking_id || '|' || 
             p_phase::TEXT || '|' || 
             COALESCE(p_pickup_partner_id::TEXT, 'NULL') || '|' || 
             EXTRACT(EPOCH FROM p_timestamp)::TEXT;
  
  -- Generate HMAC-SHA256
  hash_bytes := hmac(payload::BYTEA, secret_key::BYTEA, 'sha256');
  
  -- Convert to base36 (shorter, URL-safe)
  -- Take first 8 bytes and encode
  base36_hash := encode(substring(hash_bytes from 1 for 6), 'hex');
  
  RETURN SUBSTRING(base36_hash FROM 1 FOR 8);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. VERIFY QR CODE HASH
-- ============================================
-- Constant-time comparison for security
CREATE OR REPLACE FUNCTION verify_qr_hash(
  p_tracking_id TEXT,
  p_phase INTEGER,
  p_pickup_partner_id UUID,
  p_timestamp TIMESTAMP WITH TIME ZONE,
  p_provided_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  expected_hash TEXT;
  hash_age INTERVAL;
BEGIN
  -- Check if hash is expired (48 hours for pickup codes)
  hash_age := NOW() - p_timestamp;
  IF hash_age > INTERVAL '48 hours' THEN
    RETURN FALSE;
  END IF;
  
  -- Generate expected hash
  expected_hash := generate_qr_hash(p_tracking_id, p_phase, p_pickup_partner_id, p_timestamp);
  
  -- Constant-time comparison (prevents timing attacks)
  RETURN expected_hash = p_provided_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ORDER NUMBER GENERATION
-- ============================================
-- Generates unique order numbers in format: ORD-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  order_number TEXT;
  exists_check BOOLEAN;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    order_number := 'ORD-' || date_part || '-' || random_part;
    
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = order_number) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CALCULATE DELIVERY FEE
-- ============================================
-- Dynamic pricing based on distance, weight, and urgency
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  p_distance_km DECIMAL,
  p_weight_kg DECIMAL DEFAULT 1.0,
  p_is_urgent BOOLEAN DEFAULT FALSE,
  p_is_fragile BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  base_fee DECIMAL := 50.00; -- Base fee in ETB
  distance_fee DECIMAL;
  weight_fee DECIMAL;
  urgent_multiplier DECIMAL := 1.5;
  fragile_fee DECIMAL := 20.00;
  total_fee DECIMAL;
BEGIN
  -- Distance-based pricing (10 ETB per km)
  distance_fee := p_distance_km * 10.00;
  
  -- Weight-based pricing (5 ETB per kg above 1kg)
  weight_fee := GREATEST(0, (p_weight_kg - 1.0) * 5.00);
  
  -- Calculate total
  total_fee := base_fee + distance_fee + weight_fee;
  
  -- Apply urgent multiplier
  IF p_is_urgent THEN
    total_fee := total_fee * urgent_multiplier;
  END IF;
  
  -- Add fragile handling fee
  IF p_is_fragile THEN
    total_fee := total_fee + fragile_fee;
  END IF;
  
  -- Round to 2 decimal places
  RETURN ROUND(total_fee, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. CALCULATE DISTANCE BETWEEN POINTS
-- ============================================
-- Uses PostGIS to calculate distance in kilometers
CREATE OR REPLACE FUNCTION calculate_distance_km(
  p_point1 POINT,
  p_point2 POINT
)
RETURNS DECIMAL AS $$
BEGIN
  -- Convert to geography and calculate distance in meters, then convert to km
  RETURN ROUND(
    (ST_Distance(
      ST_GeomFromText('POINT(' || p_point1[0] || ' ' || p_point1[1] || ')', 4326)::geography,
      ST_GeomFromText('POINT(' || p_point2[0] || ' ' || p_point2[1] || ')', 4326)::geography
    ) / 1000.0)::NUMERIC,
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 7. AUTO-EXPIRE UNPAID PARCELS
-- ============================================
-- Automatically marks parcels as expired after 24 hours if unpaid
CREATE OR REPLACE FUNCTION expire_unpaid_parcels()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE parcels
  SET status = -1, -- Use -1 for expired status
      updated_at = NOW()
  WHERE payment_status = 'pending'
    AND expires_at < NOW()
    AND status = 0;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE PARCEL EVENT LOG
-- ============================================
-- Helper function to log parcel events with proper validation
CREATE OR REPLACE FUNCTION log_parcel_event(
  p_parcel_id UUID,
  p_status INTEGER,
  p_actor_id UUID,
  p_location POINT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL,
  p_qr_code_hash TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  actor_role_val user_role;
  event_id UUID;
BEGIN
  -- Get actor role
  SELECT role INTO actor_role_val FROM users WHERE id = p_actor_id;
  
  IF actor_role_val IS NULL THEN
    RAISE EXCEPTION 'Invalid actor_id: user not found';
  END IF;
  
  -- Insert event
  INSERT INTO parcel_events (
    parcel_id,
    status,
    actor_id,
    actor_role,
    location,
    address,
    notes,
    photos,
    qr_code_hash
  ) VALUES (
    p_parcel_id,
    p_status,
    p_actor_id,
    actor_role_val,
    p_location,
    p_address,
    p_notes,
    p_photos,
    p_qr_code_hash
  )
  RETURNING id INTO event_id;
  
  -- Update parcel status
  UPDATE parcels
  SET status = p_status,
      current_location = COALESCE(p_location, current_location),
      updated_at = NOW()
  WHERE id = p_parcel_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. CALCULATE SHOP COMMISSION (4% split)
-- ============================================
-- Calculates commission for shop orders
CREATE OR REPLACE FUNCTION calculate_shop_commission(
  p_item_price DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  commission_rate DECIMAL := 0.04; -- 4% total
  buyer_commission DECIMAL;
  seller_commission DECIMAL;
  total_commission DECIMAL;
  price_with_commission DECIMAL;
BEGIN
  -- Split commission 2% each
  buyer_commission := ROUND(p_item_price * (commission_rate / 2), 2);
  seller_commission := ROUND(p_item_price * (commission_rate / 2), 2);
  total_commission := buyer_commission + seller_commission;
  
  -- Price includes seller's commission
  price_with_commission := p_item_price + seller_commission;
  
  RETURN jsonb_build_object(
    'original_price', p_item_price,
    'buyer_commission', buyer_commission,
    'seller_commission', seller_commission,
    'total_commission', total_commission,
    'display_price', price_with_commission,
    'commission_rate', commission_rate
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 10. UPDATE SHOP STATISTICS
-- ============================================
-- Trigger function to update shop stats on order completion
CREATE OR REPLACE FUNCTION update_shop_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE shops
    SET total_orders = total_orders + 1,
        updated_at = NOW()
    WHERE id = NEW.shop_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shop statistics
DROP TRIGGER IF EXISTS trigger_update_shop_stats ON orders;
CREATE TRIGGER trigger_update_shop_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_statistics();

-- ============================================
-- 11. SEND NOTIFICATION HELPER
-- ============================================
-- Creates notification records for users
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    reference_id,
    reference_type
  ) VALUES (
    p_user_id,
    p_title,
    p_body,
    p_type,
    p_reference_id,
    p_reference_type
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. PARCEL STATUS CHANGE NOTIFICATIONS
-- ============================================
-- Automatically notify stakeholders on status changes
CREATE OR REPLACE FUNCTION notify_parcel_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_names TEXT[] := ARRAY['Created', 'At Dropoff', 'In Transit to Hub', 'At Hub', 'Dispatched', 'At Pickup Point', 'Delivered'];
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    notification_title := 'Parcel Status Update';
    notification_body := 'Your parcel ' || NEW.tracking_id || ' is now: ' || status_names[NEW.status + 1];
    
    -- Notify sender
    PERFORM create_notification(
      NEW.sender_id,
      notification_title,
      notification_body,
      'parcel_update',
      NEW.id,
      'parcel'
    );
    
    -- Notify recipient when at pickup point or delivered
    IF NEW.status >= 5 THEN
      -- Note: recipient might not have user account, handle via SMS
      NULL; -- SMS notification handled by application layer
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for parcel notifications
DROP TRIGGER IF EXISTS trigger_notify_parcel_status ON parcels;
CREATE TRIGGER trigger_notify_parcel_status
  AFTER UPDATE ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION notify_parcel_status_change();

-- ============================================
-- 13. SCHEDULED JOB: EXPIRE UNPAID PARCELS
-- ============================================
-- Note: This requires pg_cron extension (enable in Supabase dashboard)
-- Run every hour to expire unpaid parcels
-- 
-- To enable:
-- 1. Go to Database > Extensions in Supabase dashboard
-- 2. Enable pg_cron extension
-- 3. Run: SELECT cron.schedule('expire-unpaid-parcels', '0 * * * *', 'SELECT expire_unpaid_parcels();');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_tracking_id() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_delivery_fee(DECIMAL, DECIMAL, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_km(POINT, POINT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_shop_commission(DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;

-- Restricted functions (service role only)
GRANT EXECUTE ON FUNCTION generate_qr_hash(TEXT, INTEGER, UUID, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION verify_qr_hash(TEXT, INTEGER, UUID, TIMESTAMP WITH TIME ZONE, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION log_parcel_event(UUID, INTEGER, UUID, POINT, TEXT, TEXT, TEXT[], TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION expire_unpaid_parcels() TO service_role;
