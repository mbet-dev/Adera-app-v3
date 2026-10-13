-- ============================================================
-- Widen notifications.type to include 'support' and 'broadcast'
-- ------------------------------------------------------------
-- Migration 11 constrained type to:
--   ('info','success','warning','error','parcel_update','order_update','payment','promo')
-- but the staff Support screen inserts type='broadcast' rows and both the
-- staff queue and the customer Support screen use type='support' tickets.
-- Without this widening, those inserts fail the CHECK constraint.
-- ============================================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'info',
    'success',
    'warning',
    'error',
    'parcel_update',
    'order_update',
    'payment',
    'promo',
    'support',
    'broadcast'
  ));
