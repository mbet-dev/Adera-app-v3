-- 2025-01-17 Parcel creation + map enhancements
-- This script is idempotent and safe to re-run.

BEGIN;

-- Ensure partner metadata exists
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS is_pickup BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_dropoff BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_hub BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_location_pic TEXT;

-- Persist selected shop references on parcels
ALTER TABLE public.parcels
  ADD COLUMN IF NOT EXISTS dropoff_shop_id UUID REFERENCES public.shops(id),
  ADD COLUMN IF NOT EXISTS pickup_shop_id UUID REFERENCES public.shops(id);

-- Capture package level metadata used by the app wizard
ALTER TABLE public.parcels
  ADD COLUMN IF NOT EXISTS package_size TEXT,
  ADD COLUMN IF NOT EXISTS package_type TEXT,
  ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_location POINT;

-- Helpful composite indexes
CREATE INDEX IF NOT EXISTS idx_parcels_dropoff_shop_id ON public.parcels(dropoff_shop_id);
CREATE INDEX IF NOT EXISTS idx_parcels_pickup_shop_id ON public.parcels(pickup_shop_id);

COMMIT;

