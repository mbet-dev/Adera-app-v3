-- ============================================
-- ADERA HYBRID APP - SAMPLE DATA POPULATION
-- ============================================
-- Generates realistic Ethiopian context-based sample data
-- 14 customers, 4 drivers, 30 partners (+ 2 hubs), 6 staff
-- All users have password: MBet4321
-- Run AFTER schema alterations and data erasure
-- ============================================

-- NOTE: This script creates auth users with pre-hashed passwords
-- Since Supabase handles password hashing, you'll need to either:
-- 1. Use Supabase Admin API to create users programmatically
-- 2. Or manually sign up users through the app with password 'MBet4321'
-- 
-- For testing purposes, this script will create the application data
-- and you can manually create auth users through Supabase dashboard

-- ============================================
-- STEP 1: Create sample auth users via Supabase Dashboard
-- ============================================
-- Go to Authentication > Users > Add User
-- Create users with these emails and password 'MBet4321':
--
-- CUSTOMERS (14):
-- abebe.kebede@gmail.com, tigist.alemu@gmail.com, dawit.haile@gmail.com
-- meron.tadesse@gmail.com, yohannes.bekele@gmail.com, selamawit.girma@gmail.com
-- mulugeta.tesfaye@gmail.com, hanna.wolde@gmail.com, getachew.assefa@gmail.com
-- bethlehem.mekonnen@gmail.com, alemayehu.desta@gmail.com, rahel.yosef@gmail.com
-- tesfaye.negash@gmail.com, sara.amare@gmail.com
--
-- DRIVERS (4):
-- mulatu.gebru@adera.et, berhanu.lemma@adera.et
-- yared.mengistu@adera.et, kidus.teshome@adera.et
--
-- PARTNERS (32):
-- partner1@shop.et through partner32@shop.et
--
-- STAFF (6):
-- staff.hub1.1@adera.et, staff.hub1.2@adera.et, staff.hub1.3@adera.et
-- staff.hub2.1@adera.et, staff.hub2.2@adera.et, staff.hub2.3@adera.et

-- ============================================
-- ALTERNATIVE: Use this SQL to create test users
-- ============================================
-- This creates users in public.users table
-- The auth trigger will sync them

DO $$
DECLARE
  customer_emails TEXT[] := ARRAY[
    'abebe.kebede@gmail.com', 'tigist.alemu@gmail.com', 'dawit.haile@gmail.com',
    'meron.tadesse@gmail.com', 'yohannes.bekele@gmail.com', 'selamawit.girma@gmail.com',
    'mulugeta.tesfaye@gmail.com', 'hanna.wolde@gmail.com', 'getachew.assefa@gmail.com',
    'bethlehem.mekonnen@gmail.com', 'alemayehu.desta@gmail.com', 'rahel.yosef@gmail.com',
    'tesfaye.negash@gmail.com', 'sara.amare@gmail.com'
  ];
  customer_names TEXT[] := ARRAY[
    'Abebe Kebede', 'Tigist Alemu', 'Dawit Haile',
    'Meron Tadesse', 'Yohannes Bekele', 'Selamawit Girma',
    'Mulugeta Tesfaye', 'Hanna Wolde', 'Getachew Assefa',
    'Bethlehem Mekonnen', 'Alemayehu Desta', 'Rahel Yosef',
    'Tesfaye Negash', 'Sara Amare'
  ];
  driver_emails TEXT[] := ARRAY[
    'mulatu.gebru@adera.et', 'berhanu.lemma@adera.et',
    'yared.mengistu@adera.et', 'kidus.teshome@adera.et'
  ];
  driver_names TEXT[] := ARRAY[
    'Mulatu Gebru', 'Berhanu Lemma',
    'Yared Mengistu', 'Kidus Teshome'
  ];
  user_id UUID;
  i INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '👥 CREATING SAMPLE USERS';
  RAISE NOTICE '================================================';
  
  -- Create customers
  FOR i IN 1..array_length(customer_emails, 1) LOOP
    user_id := gen_random_uuid();
    INSERT INTO public.users (
      id, email, phone, role,
      first_name, last_name,
      wallet_balance, language,
      is_verified, is_active,
      created_at, updated_at
    ) VALUES (
      user_id,
      customer_emails[i],
      '+25191123' || (4500 + i),
      'customer',
      split_part(customer_names[i], ' ', 1),
      split_part(customer_names[i], ' ', 2),
      (RANDOM() * 1000)::DECIMAL(10,2),
      'en',
      true,
      true,
      NOW() - (i || ' days')::INTERVAL,
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Created 14 customers';
  
  -- Create drivers
  FOR i IN 1..array_length(driver_emails, 1) LOOP
    user_id := gen_random_uuid();
    INSERT INTO public.users (
      id, email, phone, role,
      first_name, last_name,
      wallet_balance, language,
      is_verified, is_active,
      created_at, updated_at
    ) VALUES (
      user_id,
      driver_emails[i],
      '+25191123' || (4600 + i),
      'driver',
      split_part(driver_names[i], ' ', 1),
      split_part(driver_names[i], ' ', 2),
      0.00,
      'en',
      true,
      true,
      NOW() - (i || ' days')::INTERVAL,
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Created 4 drivers';
  
  -- Create partners (32 total: 30 shops + 2 hubs)
  FOR i IN 1..32 LOOP
    user_id := gen_random_uuid();
    INSERT INTO public.users (
      id, email, phone, role,
      first_name, last_name,
      business_name,
      wallet_balance, language,
      is_verified, is_active,
      created_at, updated_at
    ) VALUES (
      user_id,
      'partner' || i || '@shop.et',
      '+25191123' || (4700 + i),
      'partner',
      'Partner',
      i::TEXT,
      'Shop ' || i,
      0.00,
      'en',
      true,
      true,
      NOW() - (i || ' days')::INTERVAL,
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Created 32 partners';
  
  -- Create staff (6 total: 3 per hub)
  FOR i IN 1..6 LOOP
    user_id := gen_random_uuid();
    INSERT INTO public.users (
      id, email, phone, role,
      first_name, last_name,
      wallet_balance, language,
      is_verified, is_active,
      created_at, updated_at
    ) VALUES (
      user_id,
      CASE 
        WHEN i <= 3 THEN 'staff.hub1.' || i || '@adera.et'
        ELSE 'staff.hub2.' || (i-3) || '@adera.et'
      END,
      '+25191123' || (4800 + i),
      'staff',
      'Staff',
      'Member-' || i,
      0.00,
      'en',
      true,
      true,
      NOW() - (i || ' days')::INTERVAL,
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Created 6 staff members';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ USER CREATION COMPLETE';
  RAISE NOTICE 'Total: 56 users (14 customers + 4 drivers + 32 partners + 6 staff)';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- STEP 2: CREATE SHOPS (30 regular + 2 hubs)
-- ============================================

DO $$
DECLARE
  partner_user RECORD;
  shop_names TEXT[] := ARRAY[
    'Bole Minimarket', 'Piazza General Store', 'Merkato Electronics Hub', 'CMC Pharmacy',
    'Kazanchis Supermarket', 'Arat Kilo Books', 'Meskel Square Fashion',
    'Lideta Grocery', 'Gerji Tech Shop', 'Bole Medhanialem Bakery',
    'Addis Ketema Hardware', 'Yeka Electronics', 'Kirkos Furniture', 'Arada Clothing',
    'Nifas Silk Market', 'Kolfe Store', 'Gulele Pharmacy', 'Akaki Shop',
    'Lemi Kura Minimarket', 'Sarbet Store', 'Megenagna Electronics', 'Hayat Supermarket',
    'Aware Grocery', 'Jemo Pharmacy', 'Kality Tech Hub', 'Saris Minimarket',
    'Teklehaimanot Books', 'Shiro Meda Fashion', 'Gofa Grocery', 'Lebu Hardware'
  ];
  shop_categories TEXT[] := ARRAY[
    'Grocery', 'General Store', 'Electronics', 'Pharmacy',
    'Supermarket', 'Books', 'Fashion',
    'Grocery', 'Electronics', 'Bakery',
    'Hardware', 'Electronics', 'Furniture', 'Clothing',
    'Market', 'General Store', 'Pharmacy', 'General Store',
    'Grocery', 'General Store', 'Electronics', 'Supermarket',
    'Grocery', 'Pharmacy', 'Electronics', 'Grocery',
    'Books', 'Fashion', 'Grocery', 'Hardware'
  ];
  -- Addis Ababa coordinates: lat 8.9-9.1, lon 38.7-38.9
  lat DECIMAL;
  lon DECIMAL;
  counter INTEGER := 1;
  hub_counter INTEGER := 1;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🏪 CREATING SHOPS AND HUBS';
  RAISE NOTICE '================================================';
  
  -- Create 2 Sorting Facility Hubs first
  FOR partner_user IN 
    SELECT * FROM public.users WHERE role = 'partner' ORDER BY created_at LIMIT 2
  LOOP
    lat := 8.9 + (RANDOM() * 0.2);
    lon := 38.7 + (RANDOM() * 0.2);
    
    INSERT INTO public.shops (
      owner_id, name, description, category, logo_url,
      location, address, phone,
      operating_hours, delivery_radius,
      accepted_payment_methods,
      is_active, is_verified, is_hub, hub_capacity,
      created_at, updated_at
    ) VALUES (
      partner_user.id,
      'Adera Sorting Hub ' || hub_counter,
      'Adera central sorting and distribution facility',
      'Logistics Hub',
      'hub' || hub_counter || '.jpeg',
      POINT(lon, lat),
      'Addis Ababa, Ethiopia - Hub ' || hub_counter,
      partner_user.phone,
      '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}'::jsonb,
      50000,
      ARRAY['telebirr', 'chapa', 'wallet']::payment_method[],
      true, true, true, 1000,
      NOW(), NOW()
    );
    
    hub_counter := hub_counter + 1;
  END LOOP;
  RAISE NOTICE '✅ Created 2 sorting hubs';
  
  -- Create 30 regular partner shops
  FOR partner_user IN 
    SELECT * FROM public.users WHERE role = 'partner' ORDER BY created_at OFFSET 2 LIMIT 30
  LOOP
    lat := 8.9 + (RANDOM() * 0.2);
    lon := 38.7 + (RANDOM() * 0.2);
    
    INSERT INTO public.shops (
      owner_id, name, description, category, logo_url,
      location, address, phone,
      operating_hours, delivery_radius,
      accepted_payment_methods,
      is_active, is_verified, is_hub,
      created_at, updated_at
    ) VALUES (
      partner_user.id,
      shop_names[counter],
      'Quality products and services',
      shop_categories[counter],
      's' || counter || '.jpg',
      POINT(lon, lat),
      'Addis Ababa, Ethiopia',
      partner_user.phone,
      '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "08:00-20:00", "sunday": "10:00-18:00"}'::jsonb,
      5000,
      ARRAY['cod', 'telebirr', 'chapa', 'wallet']::payment_method[],
      true, true, false,
      NOW(), NOW()
    );
    
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Created 30 partner shops';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SHOPS CREATION COMPLETE (32 total)';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- STEP 3: CREATE SAMPLE PRODUCTS
-- ============================================

DO $$
DECLARE
  shop_record RECORD;
  product_count INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '📦 CREATING SAMPLE PRODUCTS';
  RAISE NOTICE '================================================';
  
  FOR shop_record IN SELECT * FROM public.shops WHERE is_hub = false LOOP
    product_count := 5 + floor(random() * 10)::INTEGER;
    
    FOR i IN 1..product_count LOOP
      INSERT INTO public.products (
        shop_id, name, description, category, sku,
        price, stock_quantity,
        images, weight, is_available,
        created_at, updated_at
      ) VALUES (
        shop_record.id,
        'Product ' || i || ' - ' || shop_record.name,
        'High quality product',
        shop_record.category,
        'SKU-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
        (50 + RANDOM() * 950)::DECIMAL(10,2),
        (10 + floor(random() * 90))::INTEGER,
        ARRAY['product_' || i || '.jpg'],
        (0.5 + RANDOM() * 5)::DECIMAL(8,2),
        true,
        NOW(), NOW()
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Created products for all shops';
  RAISE NOTICE '================================================';
END $$;

-- Continue in next file...
