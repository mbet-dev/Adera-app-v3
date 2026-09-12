-- ============================================
-- ADERA HYBRID APP - GENERATE DEFAULT SHOP LOGOS
-- ============================================
-- Creates appealing default logos using shop name initials
-- Partners can later upload their own custom logos
-- This uses a placeholder URL that your app will render as initials
-- ============================================

DO $$
DECLARE
  shop_record RECORD;
  initials TEXT;
  words TEXT[];
  word TEXT;
  logo_placeholder TEXT;
  color_palette TEXT[] := ARRAY[
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#457B9D', '#F77F00', '#06FFA5', '#8338EC'
  ];
  color_index INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎨 GENERATING DEFAULT SHOP LOGOS';
  RAISE NOTICE '================================================';
  
  color_index := 1;
  
  FOR shop_record IN SELECT id, name FROM public.shops ORDER BY created_at LOOP
    -- Extract initials from shop name
    words := string_to_array(shop_record.name, ' ');
    initials := '';
    
    -- Get first letter of each word (max 3 letters)
    FOR word IN SELECT unnest(words) LOOP
      IF length(initials) < 3 AND length(word) > 0 THEN
        initials := initials || upper(substring(word from 1 for 1));
      END IF;
    END LOOP;
    
    -- If no initials, use first 2 chars of name
    IF length(initials) = 0 THEN
      initials := upper(substring(shop_record.name from 1 for 2));
    END IF;
    
    -- Create logo placeholder URL with initials and color
    -- Format: logo-placeholder://INITIALS/COLOR
    -- Your app will render this as a colored circle with initials
    logo_placeholder := 'logo-placeholder://' || initials || '/' || color_palette[color_index];
    
    -- Update shop with default logo
    UPDATE public.shops
    SET logo_url = logo_placeholder
    WHERE id = shop_record.id;
    
    RAISE NOTICE '✅ % → Initials: % (Color: %)', 
      shop_record.name, 
      initials, 
      color_palette[color_index];
    
    -- Cycle through colors
    color_index := color_index + 1;
    IF color_index > array_length(color_palette, 1) THEN
      color_index := 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DEFAULT LOGOS GENERATED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All shops now have default initial-based logos';
  RAISE NOTICE 'Partners can upload custom logos to replace these';
  RAISE NOTICE '================================================';
END $$;

-- Verify the results
SELECT 
  name,
  logo_url,
  CASE 
    WHEN logo_url LIKE 'logo-placeholder://%' THEN '🎨 Default Initials'
    WHEN logo_url LIKE 'https://%' THEN '✅ Custom Logo'
    ELSE '❌ No Logo'
  END as logo_type
FROM public.shops
ORDER BY is_hub DESC, name
LIMIT 10;
