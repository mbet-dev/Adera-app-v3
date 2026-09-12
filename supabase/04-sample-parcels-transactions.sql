-- ============================================
-- ADERA HYBRID APP - SAMPLE PARCELS & TRANSACTIONS
-- ============================================
-- Creates realistic parcel transactions with various statuses
-- Run AFTER 03-sample-data-population.sql
-- ============================================

-- ============================================
-- STEP 4: CREATE SAMPLE PARCELS
-- ============================================

DO $$
DECLARE
  customer_record RECORD;
  driver_record RECORD;
  dropoff_shop RECORD;
  pickup_shop RECORD;
  hub_shop RECORD;
  parcel_count INTEGER;
  tracking_id TEXT;
  parcel_id UUID;
  parcel_status INTEGER;
  days_ago INTEGER;
  lat1 DECIMAL;
  lon1 DECIMAL;
  lat2 DECIMAL;
  lon2 DECIMAL;
  delivery_fee DECIMAL;
  payment_methods payment_method[] := ARRAY['wallet', 'telebirr', 'chapa', 'cod'];
  payment_method_choice payment_method;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '📦 CREATING SAMPLE PARCELS';
  RAISE NOTICE '================================================';
  
  -- Get a hub for reference
  SELECT * INTO hub_shop FROM public.shops WHERE is_hub = true LIMIT 1;
  
  -- Heavy users (customers 1-5): 8-12 parcels each
  FOR customer_record IN 
    SELECT * FROM public.users WHERE role = 'customer' ORDER BY created_at LIMIT 5
  LOOP
    parcel_count := 8 + floor(random() * 5)::INTEGER;
    
    FOR i IN 1..parcel_count LOOP
      -- Random shops
      SELECT * INTO dropoff_shop FROM public.shops WHERE is_hub = false ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO pickup_shop FROM public.shops WHERE is_hub = false AND id != dropoff_shop.id ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO driver_record FROM public.users WHERE role = 'driver' ORDER BY RANDOM() LIMIT 1;
      
      -- Generate tracking ID
      tracking_id := 'ADE-' || TO_CHAR(NOW() - (i || ' days')::INTERVAL, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
      parcel_id := gen_random_uuid();
      
      -- Random locations in Addis
      lat1 := 8.9 + (RANDOM() * 0.2);
      lon1 := 38.7 + (RANDOM() * 0.2);
      lat2 := 8.9 + (RANDOM() * 0.2);
      lon2 := 38.7 + (RANDOM() * 0.2);
      
      -- Calculate delivery fee (simplified)
      delivery_fee := (100 + RANDOM() * 200)::DECIMAL(10,2);
      
      -- Determine status based on age
      days_ago := i;
      IF days_ago <= 1 THEN
        parcel_status := 6; -- Delivered
      ELSIF days_ago <= 3 THEN
        parcel_status := 5; -- At pickup partner
      ELSIF days_ago <= 5 THEN
        parcel_status := 4; -- Dispatched
      ELSIF days_ago <= 7 THEN
        parcel_status := 3; -- At hub
      ELSIF days_ago <= 10 THEN
        parcel_status := 2; -- In transit to hub
      ELSE
        parcel_status := 1; -- At dropoff
      END IF;
      
      -- Random payment method
      payment_method_choice := payment_methods[1 + floor(random() * 4)::INTEGER];
      
      INSERT INTO public.parcels (
        id, tracking_id,
        sender_id, recipient_name, recipient_phone,
        dropoff_partner_id, pickup_partner_id, driver_id,
        pickup_location, pickup_address,
        delivery_location, delivery_address,
        description, weight,
        delivery_fee, total_amount,
        status, payment_method, payment_status,
        paid_at, created_at, updated_at
      ) VALUES (
        parcel_id, tracking_id,
        customer_record.id,
        'Recipient ' || i,
        '+251911' || (100000 + floor(random() * 900000)::INTEGER),
        dropoff_shop.owner_id, pickup_shop.owner_id, driver_record.id,
        POINT(lon1, lat1), 'Addis Ababa, Ethiopia',
        POINT(lon2, lat2), 'Addis Ababa, Ethiopia',
        'Package ' || i,
        (1 + RANDOM() * 10)::DECIMAL(8,2),
        delivery_fee, delivery_fee,
        parcel_status, payment_method_choice, 'completed',
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - ((days_ago - 1) || ' days')::INTERVAL
      );
      
      -- Create parcel events
      INSERT INTO public.parcel_events (
        parcel_id, status, actor_id, actor_role,
        location, address, event_time, created_at
      ) VALUES
        (parcel_id, 0, customer_record.id, 'customer', POINT(lon1, lat1), 'Created', NOW() - (days_ago || ' days')::INTERVAL, NOW()),
        (parcel_id, 1, dropoff_shop.owner_id, 'partner', dropoff_shop.location, 'At dropoff', NOW() - ((days_ago - 1) || ' days')::INTERVAL, NOW());
      
      IF parcel_status >= 2 THEN
        INSERT INTO public.parcel_events (parcel_id, status, actor_id, actor_role, location, address, event_time, created_at)
        VALUES (parcel_id, 2, driver_record.id, 'driver', dropoff_shop.location, 'Picked up', NOW() - ((days_ago - 2) || ' days')::INTERVAL, NOW());
      END IF;
      
      IF parcel_status >= 3 THEN
        INSERT INTO public.parcel_events (parcel_id, status, actor_id, actor_role, location, address, event_time, created_at)
        VALUES (parcel_id, 3, (SELECT id FROM users WHERE role = 'staff' LIMIT 1), 'staff', hub_shop.location, 'At hub', NOW() - ((days_ago - 3) || ' days')::INTERVAL, NOW());
      END IF;
      
      IF parcel_status >= 4 THEN
        INSERT INTO public.parcel_events (parcel_id, status, actor_id, actor_role, location, address, event_time, created_at)
        VALUES (parcel_id, 4, driver_record.id, 'driver', hub_shop.location, 'Dispatched', NOW() - ((days_ago - 4) || ' days')::INTERVAL, NOW());
      END IF;
      
      IF parcel_status >= 5 THEN
        INSERT INTO public.parcel_events (parcel_id, status, actor_id, actor_role, location, address, event_time, created_at)
        VALUES (parcel_id, 5, pickup_shop.owner_id, 'partner', pickup_shop.location, 'At pickup', NOW() - ((days_ago - 5) || ' days')::INTERVAL, NOW());
      END IF;
      
      IF parcel_status = 6 THEN
        INSERT INTO public.parcel_events (parcel_id, status, actor_id, actor_role, location, address, event_time, created_at)
        VALUES (parcel_id, 6, pickup_shop.owner_id, 'partner', pickup_shop.location, 'Delivered', NOW() - ((days_ago - 6) || ' days')::INTERVAL, NOW());
      END IF;
      
      -- Create payment record
      INSERT INTO public.payments (
        parcel_id, user_id, amount, payment_method, payment_status,
        completed_at, created_at, updated_at
      ) VALUES (
        parcel_id, customer_record.id, delivery_fee, payment_method_choice, 'completed',
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - (days_ago || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Created parcels for heavy users (5 customers)';
  
  -- Medium users (customers 6-10): 4-7 parcels each
  FOR customer_record IN 
    SELECT * FROM public.users WHERE role = 'customer' ORDER BY created_at OFFSET 5 LIMIT 5
  LOOP
    parcel_count := 4 + floor(random() * 4)::INTEGER;
    
    FOR i IN 1..parcel_count LOOP
      SELECT * INTO dropoff_shop FROM public.shops WHERE is_hub = false ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO pickup_shop FROM public.shops WHERE is_hub = false AND id != dropoff_shop.id ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO driver_record FROM public.users WHERE role = 'driver' ORDER BY RANDOM() LIMIT 1;
      
      tracking_id := 'ADE-' || TO_CHAR(NOW() - (i || ' days')::INTERVAL, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
      parcel_id := gen_random_uuid();
      
      lat1 := 8.9 + (RANDOM() * 0.2);
      lon1 := 38.7 + (RANDOM() * 0.2);
      lat2 := 8.9 + (RANDOM() * 0.2);
      lon2 := 38.7 + (RANDOM() * 0.2);
      
      delivery_fee := (100 + RANDOM() * 200)::DECIMAL(10,2);
      days_ago := i;
      
      IF days_ago <= 2 THEN parcel_status := 6;
      ELSIF days_ago <= 4 THEN parcel_status := 5;
      ELSIF days_ago <= 6 THEN parcel_status := 4;
      ELSE parcel_status := 3;
      END IF;
      
      payment_method_choice := payment_methods[1 + floor(random() * 4)::INTEGER];
      
      INSERT INTO public.parcels (
        id, tracking_id,
        sender_id, recipient_name, recipient_phone,
        dropoff_partner_id, pickup_partner_id, driver_id,
        pickup_location, pickup_address,
        delivery_location, delivery_address,
        description, weight,
        delivery_fee, total_amount,
        status, payment_method, payment_status,
        paid_at, created_at, updated_at
      ) VALUES (
        parcel_id, tracking_id,
        customer_record.id,
        'Recipient ' || i,
        '+251911' || (100000 + floor(random() * 900000)::INTEGER),
        dropoff_shop.owner_id, pickup_shop.owner_id, driver_record.id,
        POINT(lon1, lat1), 'Addis Ababa',
        POINT(lon2, lat2), 'Addis Ababa',
        'Package ' || i,
        (1 + RANDOM() * 10)::DECIMAL(8,2),
        delivery_fee, delivery_fee,
        parcel_status, payment_method_choice, 'completed',
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW()
      );
      
      INSERT INTO public.payments (
        parcel_id, user_id, amount, payment_method, payment_status,
        completed_at, created_at, updated_at
      ) VALUES (
        parcel_id, customer_record.id, delivery_fee, payment_method_choice, 'completed',
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW() - (days_ago || ' days')::INTERVAL,
        NOW()
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Created parcels for medium users (5 customers)';
  
  -- Light users (customers 11-13): 1-3 parcels each
  FOR customer_record IN 
    SELECT * FROM public.users WHERE role = 'customer' ORDER BY created_at OFFSET 10 LIMIT 3
  LOOP
    parcel_count := 1 + floor(random() * 3)::INTEGER;
    
    FOR i IN 1..parcel_count LOOP
      SELECT * INTO dropoff_shop FROM public.shops WHERE is_hub = false ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO pickup_shop FROM public.shops WHERE is_hub = false AND id != dropoff_shop.id ORDER BY RANDOM() LIMIT 1;
      SELECT * INTO driver_record FROM public.users WHERE role = 'driver' ORDER BY RANDOM() LIMIT 1;
      
      tracking_id := 'ADE-' || TO_CHAR(NOW() - (i || ' days')::INTERVAL, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
      parcel_id := gen_random_uuid();
      
      lat1 := 8.9 + (RANDOM() * 0.2);
      lon1 := 38.7 + (RANDOM() * 0.2);
      lat2 := 8.9 + (RANDOM() * 0.2);
      lon2 := 38.7 + (RANDOM() * 0.2);
      
      delivery_fee := (100 + RANDOM() * 200)::DECIMAL(10,2);
      parcel_status := 6; -- All delivered
      payment_method_choice := payment_methods[1 + floor(random() * 4)::INTEGER];
      
      INSERT INTO public.parcels (
        id, tracking_id,
        sender_id, recipient_name, recipient_phone,
        dropoff_partner_id, pickup_partner_id, driver_id,
        pickup_location, pickup_address,
        delivery_location, delivery_address,
        description, weight,
        delivery_fee, total_amount,
        status, payment_method, payment_status,
        paid_at, created_at, updated_at
      ) VALUES (
        parcel_id, tracking_id,
        customer_record.id,
        'Recipient ' || i,
        '+251911' || (100000 + floor(random() * 900000)::INTEGER),
        dropoff_shop.owner_id, pickup_shop.owner_id, driver_record.id,
        POINT(lon1, lat1), 'Addis Ababa',
        POINT(lon2, lat2), 'Addis Ababa',
        'Package ' || i,
        (1 + RANDOM() * 10)::DECIMAL(8,2),
        delivery_fee, delivery_fee,
        parcel_status, payment_method_choice, 'completed',
        NOW() - (i || ' days')::INTERVAL,
        NOW() - (i || ' days')::INTERVAL,
        NOW()
      );
      
      INSERT INTO public.payments (
        parcel_id, user_id, amount, payment_method, payment_status,
        completed_at, created_at, updated_at
      ) VALUES (
        parcel_id, customer_record.id, delivery_fee, payment_method_choice, 'completed',
        NOW() - (i || ' days')::INTERVAL,
        NOW() - (i || ' days')::INTERVAL,
        NOW()
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Created parcels for light users (3 customers)';
  
  -- Customer 14 (Sara Amare): No parcels yet (new user)
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ PARCEL CREATION COMPLETE';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- STEP 5: CREATE NOTIFICATIONS
-- ============================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔔 CREATING SAMPLE NOTIFICATIONS';
  RAISE NOTICE '================================================';
  
  FOR user_record IN SELECT * FROM public.users WHERE role IN ('customer', 'driver', 'partner') LOOP
    -- Welcome notification
    INSERT INTO public.notifications (
      user_id, title, body, type,
      is_read, created_at
    ) VALUES (
      user_record.id,
      'Welcome to Adera! 🇪🇹',
      CASE 
        WHEN user_record.role = 'customer' THEN 'Start sending and receiving parcels across Addis Ababa!'
        WHEN user_record.role = 'partner' THEN 'Welcome to the Adera partner network!'
        WHEN user_record.role = 'driver' THEN 'Ready to start delivering?'
        ELSE 'Welcome to Adera!'
      END,
      'system',
      true,
      user_record.created_at
    );
  END LOOP;
  
  RAISE NOTICE '✅ Created welcome notifications for all users';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

DO $$
DECLARE
  user_count INTEGER;
  shop_count INTEGER;
  product_count INTEGER;
  parcel_count INTEGER;
  payment_count INTEGER;
  notification_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO shop_count FROM public.shops;
  SELECT COUNT(*) INTO product_count FROM public.products;
  SELECT COUNT(*) INTO parcel_count FROM public.parcels;
  SELECT COUNT(*) INTO payment_count FROM public.payments;
  SELECT COUNT(*) INTO notification_count FROM public.notifications;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 DATABASE POPULATION SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE '  - Customers: %', (SELECT COUNT(*) FROM users WHERE role = 'customer');
  RAISE NOTICE '  - Drivers: %', (SELECT COUNT(*) FROM users WHERE role = 'driver');
  RAISE NOTICE '  - Partners: %', (SELECT COUNT(*) FROM users WHERE role = 'partner');
  RAISE NOTICE '  - Staff: %', (SELECT COUNT(*) FROM users WHERE role = 'staff');
  RAISE NOTICE 'Shops: % (including % hubs)', shop_count, (SELECT COUNT(*) FROM shops WHERE is_hub = true);
  RAISE NOTICE 'Products: %', product_count;
  RAISE NOTICE 'Parcels: %', parcel_count;
  RAISE NOTICE 'Payments: %', payment_count;
  RAISE NOTICE 'Notifications: %', notification_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DATA POPULATION COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All users have password: MBet4321';
  RAISE NOTICE 'Ready for testing!';
  RAISE NOTICE '================================================';
END $$;
