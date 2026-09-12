-- Add is_pickup and is_dropoff columns to the shops table
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS is_pickup BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_dropoff BOOLEAN DEFAULT TRUE;

-- Backfill existing rows to ensure they have the default value
UPDATE public.shops
SET is_pickup = TRUE
WHERE is_pickup IS NULL;

UPDATE public.shops
SET is_dropoff = TRUE
WHERE is_dropoff IS NULL;
