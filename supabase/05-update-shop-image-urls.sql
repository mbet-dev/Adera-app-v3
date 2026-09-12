-- ============================================
-- ADERA HYBRID APP - UPDATE SHOP IMAGE URLS
-- ============================================
-- Run this AFTER uploading images to Supabase Storage
-- This updates the logo_url field in shops table with public URLs
-- ============================================

-- IMPORTANT: Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
-- Example: https://ehrmscvjuxnqpxcixnvq.supabase.co/storage/v1/object/public/shop-logos/

DO $$
DECLARE
  base_url TEXT := 'https://ehrmscvjuxnqpxcixnvq.supabase.co/storage/v1/object/public/shop-logos/';
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🖼️  UPDATING SHOP IMAGE URLS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Base URL: %', base_url;
  RAISE NOTICE '';

  -- Update Hub 1
  UPDATE public.shops
  SET logo_url = base_url || 'hub1.jpeg'
  WHERE name = 'Adera Sorting Hub 1';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Updated: Adera Sorting Hub 1';
  END IF;

  -- Update Hub 2
  UPDATE public.shops
  SET logo_url = base_url || 'hub2.jpg'
  WHERE name = 'Adera Sorting Hub 2';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Updated: Adera Sorting Hub 2';
  END IF;

  -- Update Partner Shops
  UPDATE public.shops SET logo_url = base_url || 's1.webp' WHERE name = 'Bole Minimarket';
  RAISE NOTICE '✅ Updated: Bole Minimarket';

  UPDATE public.shops SET logo_url = base_url || 's2.jpg' WHERE name = 'Piazza General Store';
  RAISE NOTICE '✅ Updated: Piazza General Store';

  UPDATE public.shops SET logo_url = base_url || 's3.jpg' WHERE name = 'Merkato Electronics Hub';
  RAISE NOTICE '✅ Updated: Merkato Electronics Hub';

  UPDATE public.shops SET logo_url = base_url || 's4.jpg' WHERE name = 'CMC Pharmacy';
  RAISE NOTICE '✅ Updated: CMC Pharmacy';

  UPDATE public.shops SET logo_url = base_url || 's5.jpg' WHERE name = 'Kazanchis Supermarket';
  RAISE NOTICE '✅ Updated: Kazanchis Supermarket';

  UPDATE public.shops SET logo_url = base_url || 's6.jpg' WHERE name = 'Arat Kilo Books';
  RAISE NOTICE '✅ Updated: Arat Kilo Books';

  UPDATE public.shops SET logo_url = base_url || 's7.jpg' WHERE name = 'Meskel Square Fashion';
  RAISE NOTICE '✅ Updated: Meskel Square Fashion';

  UPDATE public.shops SET logo_url = base_url || 's8.jpg' WHERE name = 'Lideta Grocery';
  RAISE NOTICE '✅ Updated: Lideta Grocery';

  UPDATE public.shops SET logo_url = base_url || 's9.jpg' WHERE name = 'Gerji Tech Shop';
  RAISE NOTICE '✅ Updated: Gerji Tech Shop';

  UPDATE public.shops SET logo_url = base_url || 's10.jpg' WHERE name = 'Bole Medhanialem Bakery';
  RAISE NOTICE '✅ Updated: Bole Medhanialem Bakery';

  UPDATE public.shops SET logo_url = base_url || 's11.jpg' WHERE name = 'Addis Ketema Hardware';
  RAISE NOTICE '✅ Updated: Addis Ketema Hardware';

  UPDATE public.shops SET logo_url = base_url || 's12.jpg' WHERE name = 'Yeka Electronics';
  RAISE NOTICE '✅ Updated: Yeka Electronics';

  UPDATE public.shops SET logo_url = base_url || 's13.jpg' WHERE name = 'Kirkos Furniture';
  RAISE NOTICE '✅ Updated: Kirkos Furniture';

  UPDATE public.shops SET logo_url = base_url || 's14.jpg' WHERE name = 'Arada Clothing';
  RAISE NOTICE '✅ Updated: Arada Clothing';

  UPDATE public.shops SET logo_url = base_url || 's15.jpg' WHERE name = 'Nifas Silk Market';
  RAISE NOTICE '✅ Updated: Nifas Silk Market';

  UPDATE public.shops SET logo_url = base_url || 's16.jpg' WHERE name = 'Kolfe Store';
  RAISE NOTICE '✅ Updated: Kolfe Store';

  UPDATE public.shops SET logo_url = base_url || 's17.jpg' WHERE name = 'Gulele Pharmacy';
  RAISE NOTICE '✅ Updated: Gulele Pharmacy';

  UPDATE public.shops SET logo_url = base_url || 's18.jpg' WHERE name = 'Akaki Shop';
  RAISE NOTICE '✅ Updated: Akaki Shop';

  UPDATE public.shops SET logo_url = base_url || 's19.jpg' WHERE name = 'Lemi Kura Minimarket';
  RAISE NOTICE '✅ Updated: Lemi Kura Minimarket';

  UPDATE public.shops SET logo_url = base_url || 's20.jpg' WHERE name = 'Sarbet Store';
  RAISE NOTICE '✅ Updated: Sarbet Store';

  UPDATE public.shops SET logo_url = base_url || 's21.jpg' WHERE name = 'Megenagna Electronics';
  RAISE NOTICE '✅ Updated: Megenagna Electronics';

  UPDATE public.shops SET logo_url = base_url || 's22.jpg' WHERE name = 'Hayat Supermarket';
  RAISE NOTICE '✅ Updated: Hayat Supermarket';

  UPDATE public.shops SET logo_url = base_url || 's23.jpg' WHERE name = 'Aware Grocery';
  RAISE NOTICE '✅ Updated: Aware Grocery';

  UPDATE public.shops SET logo_url = base_url || 's24.jpg' WHERE name = 'Jemo Pharmacy';
  RAISE NOTICE '✅ Updated: Jemo Pharmacy';

  UPDATE public.shops SET logo_url = base_url || 's25.jpg' WHERE name = 'Kality Tech Hub';
  RAISE NOTICE '✅ Updated: Kality Tech Hub';

  UPDATE public.shops SET logo_url = base_url || 's26.jpg' WHERE name = 'Saris Minimarket';
  RAISE NOTICE '✅ Updated: Saris Minimarket';

  UPDATE public.shops SET logo_url = base_url || 's27.jpg' WHERE name = 'Teklehaimanot Books';
  RAISE NOTICE '✅ Updated: Teklehaimanot Books';

  UPDATE public.shops SET logo_url = base_url || 's28.jpg' WHERE name = 'Shiro Meda Fashion';
  RAISE NOTICE '✅ Updated: Shiro Meda Fashion';

  UPDATE public.shops SET logo_url = base_url || 's29.jpg' WHERE name = 'Gofa Grocery';
  RAISE NOTICE '✅ Updated: Gofa Grocery';

  UPDATE public.shops SET logo_url = base_url || 's30.jpg' WHERE name = 'Lebu Hardware';
  RAISE NOTICE '✅ Updated: Lebu Hardware';

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SHOP IMAGE URLS UPDATED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total shops updated: 32 (2 hubs + 30 partner shops)';
  RAISE NOTICE 'Images are now linked to shops in the database';
  RAISE NOTICE '================================================';
END $$;

-- Verify the updates
SELECT name, logo_url, is_hub
FROM public.shops
ORDER BY is_hub DESC, name
LIMIT 10;
