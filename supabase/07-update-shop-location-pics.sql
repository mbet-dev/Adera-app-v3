-- ============================================
-- ADERA HYBRID APP - UPDATE SHOP LOCATION PICTURES
-- ============================================
-- Run this AFTER uploading images to shop-loc-pics bucket
-- This updates the shop_location_pic field with public URLs
-- ============================================

-- IMPORTANT: Replace with your actual Supabase project URL
DO $$
DECLARE
  base_url TEXT := 'https://ehrmscvjuxnqpxcixnvq.supabase.co/storage/v1/object/public/shop-loc-pics/';
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🏪 UPDATING SHOP LOCATION PICTURES';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Base URL: %', base_url;
  RAISE NOTICE '';

  -- Update Hub 1
  UPDATE public.shops
  SET shop_location_pic = base_url || 'adera-hub-1-storefront.jpeg'
  WHERE name = 'Adera Sorting Hub 1';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Updated: Adera Sorting Hub 1';
  END IF;

  -- Update Hub 2
  UPDATE public.shops
  SET shop_location_pic = base_url || 'adera-hub-2-storefront.jpg'
  WHERE name = 'Adera Sorting Hub 2';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Updated: Adera Sorting Hub 2';
  END IF;

  -- Update Partner Shops with descriptive filenames
  UPDATE public.shops SET shop_location_pic = base_url || 'bole-minimarket-storefront.webp' WHERE name = 'Bole Minimarket';
  RAISE NOTICE '✅ Updated: Bole Minimarket';

  UPDATE public.shops SET shop_location_pic = base_url || 'piazza-general-store-storefront.jpg' WHERE name = 'Piazza General Store';
  RAISE NOTICE '✅ Updated: Piazza General Store';

  UPDATE public.shops SET shop_location_pic = base_url || 'merkato-electronics-hub-storefront.jpg' WHERE name = 'Merkato Electronics Hub';
  RAISE NOTICE '✅ Updated: Merkato Electronics Hub';

  UPDATE public.shops SET shop_location_pic = base_url || 'cmc-pharmacy-storefront.jpg' WHERE name = 'CMC Pharmacy';
  RAISE NOTICE '✅ Updated: CMC Pharmacy';

  UPDATE public.shops SET shop_location_pic = base_url || 'kazanchis-supermarket-storefront.jpg' WHERE name = 'Kazanchis Supermarket';
  RAISE NOTICE '✅ Updated: Kazanchis Supermarket';

  UPDATE public.shops SET shop_location_pic = base_url || 'arat-kilo-books-storefront.jpg' WHERE name = 'Arat Kilo Books';
  RAISE NOTICE '✅ Updated: Arat Kilo Books';

  UPDATE public.shops SET shop_location_pic = base_url || 'meskel-square-fashion-storefront.jpg' WHERE name = 'Meskel Square Fashion';
  RAISE NOTICE '✅ Updated: Meskel Square Fashion';

  UPDATE public.shops SET shop_location_pic = base_url || 'lideta-grocery-storefront.jpg' WHERE name = 'Lideta Grocery';
  RAISE NOTICE '✅ Updated: Lideta Grocery';

  UPDATE public.shops SET shop_location_pic = base_url || 'gerji-tech-shop-storefront.jpg' WHERE name = 'Gerji Tech Shop';
  RAISE NOTICE '✅ Updated: Gerji Tech Shop';

  UPDATE public.shops SET shop_location_pic = base_url || 'bole-medhanialem-bakery-storefront.jpg' WHERE name = 'Bole Medhanialem Bakery';
  RAISE NOTICE '✅ Updated: Bole Medhanialem Bakery';

  UPDATE public.shops SET shop_location_pic = base_url || 'addis-ketema-hardware-storefront.jpg' WHERE name = 'Addis Ketema Hardware';
  RAISE NOTICE '✅ Updated: Addis Ketema Hardware';

  UPDATE public.shops SET shop_location_pic = base_url || 'yeka-electronics-storefront.jpg' WHERE name = 'Yeka Electronics';
  RAISE NOTICE '✅ Updated: Yeka Electronics';

  UPDATE public.shops SET shop_location_pic = base_url || 'kirkos-furniture-storefront.jpg' WHERE name = 'Kirkos Furniture';
  RAISE NOTICE '✅ Updated: Kirkos Furniture';

  UPDATE public.shops SET shop_location_pic = base_url || 'arada-clothing-storefront.jpg' WHERE name = 'Arada Clothing';
  RAISE NOTICE '✅ Updated: Arada Clothing';

  UPDATE public.shops SET shop_location_pic = base_url || 'nifas-silk-market-storefront.jpg' WHERE name = 'Nifas Silk Market';
  RAISE NOTICE '✅ Updated: Nifas Silk Market';

  UPDATE public.shops SET shop_location_pic = base_url || 'kolfe-store-storefront.jpg' WHERE name = 'Kolfe Store';
  RAISE NOTICE '✅ Updated: Kolfe Store';

  UPDATE public.shops SET shop_location_pic = base_url || 'gulele-pharmacy-storefront.jpg' WHERE name = 'Gulele Pharmacy';
  RAISE NOTICE '✅ Updated: Gulele Pharmacy';

  UPDATE public.shops SET shop_location_pic = base_url || 'akaki-shop-storefront.jpg' WHERE name = 'Akaki Shop';
  RAISE NOTICE '✅ Updated: Akaki Shop';

  UPDATE public.shops SET shop_location_pic = base_url || 'lemi-kura-minimarket-storefront.jpg' WHERE name = 'Lemi Kura Minimarket';
  RAISE NOTICE '✅ Updated: Lemi Kura Minimarket';

  UPDATE public.shops SET shop_location_pic = base_url || 'sarbet-store-storefront.jpg' WHERE name = 'Sarbet Store';
  RAISE NOTICE '✅ Updated: Sarbet Store';

  UPDATE public.shops SET shop_location_pic = base_url || 'megenagna-electronics-storefront.jpg' WHERE name = 'Megenagna Electronics';
  RAISE NOTICE '✅ Updated: Megenagna Electronics';

  UPDATE public.shops SET shop_location_pic = base_url || 'hayat-supermarket-storefront.jpg' WHERE name = 'Hayat Supermarket';
  RAISE NOTICE '✅ Updated: Hayat Supermarket';

  UPDATE public.shops SET shop_location_pic = base_url || 'aware-grocery-storefront.jpg' WHERE name = 'Aware Grocery';
  RAISE NOTICE '✅ Updated: Aware Grocery';

  UPDATE public.shops SET shop_location_pic = base_url || 'jemo-pharmacy-storefront.jpg' WHERE name = 'Jemo Pharmacy';
  RAISE NOTICE '✅ Updated: Jemo Pharmacy';

  UPDATE public.shops SET shop_location_pic = base_url || 'kality-tech-hub-storefront.jpg' WHERE name = 'Kality Tech Hub';
  RAISE NOTICE '✅ Updated: Kality Tech Hub';

  UPDATE public.shops SET shop_location_pic = base_url || 'saris-minimarket-storefront.jpg' WHERE name = 'Saris Minimarket';
  RAISE NOTICE '✅ Updated: Saris Minimarket';

  UPDATE public.shops SET shop_location_pic = base_url || 'teklehaimanot-books-storefront.jpg' WHERE name = 'Teklehaimanot Books';
  RAISE NOTICE '✅ Updated: Teklehaimanot Books';

  UPDATE public.shops SET shop_location_pic = base_url || 'shiro-meda-fashion-storefront.jpg' WHERE name = 'Shiro Meda Fashion';
  RAISE NOTICE '✅ Updated: Shiro Meda Fashion';

  UPDATE public.shops SET shop_location_pic = base_url || 'gofa-grocery-storefront.jpg' WHERE name = 'Gofa Grocery';
  RAISE NOTICE '✅ Updated: Gofa Grocery';

  UPDATE public.shops SET shop_location_pic = base_url || 'lebu-hardware-storefront.jpg' WHERE name = 'Lebu Hardware';
  RAISE NOTICE '✅ Updated: Lebu Hardware';

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SHOP LOCATION PICTURES UPDATED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total shops updated: 32 (2 hubs + 30 partner shops)';
  RAISE NOTICE 'Location pictures are now linked to shops';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run 06-generate-default-shop-logos.sql';
  RAISE NOTICE 'This will create default initial-based logos';
  RAISE NOTICE '================================================';
END $$;

-- Verify the updates
SELECT 
  name, 
  shop_location_pic,
  logo_url,
  CASE 
    WHEN shop_location_pic IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_location_pic,
  CASE 
    WHEN logo_url IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_logo
FROM shops
ORDER BY is_hub DESC, name
LIMIT 10;
