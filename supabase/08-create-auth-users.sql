-- ============================================
-- ADERA HYBRID APP - CREATE AUTH USERS
-- ============================================
-- Creates authentication records for all sample users
-- Password for all users: MBet4321
-- Run AFTER 03-sample-data-population.sql
-- ============================================

-- IMPORTANT: This uses Supabase's auth.users table directly
-- The password will be hashed automatically by Supabase

DO $$
DECLARE
  user_record RECORD;
  auth_user_id UUID;
  user_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔐 CREATING AUTH USERS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Password for all users: MBet4321';
  RAISE NOTICE '';

  -- Loop through all users in public.users
  FOR user_record IN 
    SELECT id, email, role, first_name, last_name, phone 
    FROM public.users 
    ORDER BY role, created_at
  LOOP
    -- Check if auth user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_record.id) THEN
      
      -- Insert into auth.users
      -- Note: Supabase will hash the password automatically
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        aud,
        role
      ) VALUES (
        user_record.id,
        '00000000-0000-0000-0000-000000000000',
        user_record.email,
        crypt('MBet4321', gen_salt('bf')), -- Bcrypt hash
        NOW(), -- Email confirmed
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object(
          'role', user_record.role,
          'first_name', user_record.first_name,
          'last_name', user_record.last_name,
          'phone', user_record.phone
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated'
      );

      -- Create identity record
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        user_record.id,
        user_record.id::text,
        jsonb_build_object(
          'sub', user_record.id::text,
          'email', user_record.email
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
      );

      user_count := user_count + 1;
      
      RAISE NOTICE '✅ Created auth user: % (%) - Role: %', 
        user_record.email, 
        COALESCE(user_record.first_name || ' ' || user_record.last_name, 'No name'),
        user_record.role;
    ELSE
      RAISE NOTICE '⚠️  Auth user already exists: %', user_record.email;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ AUTH USERS CREATED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total auth users created: %', user_count;
  RAISE NOTICE 'Password for all users: MBet4321';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Sample Login Credentials:';
  RAISE NOTICE '---';
  
  -- Show sample credentials by role
  RAISE NOTICE 'CUSTOMERS:';
  FOR user_record IN 
    SELECT email, first_name, last_name 
    FROM public.users 
    WHERE role = 'customer' 
    LIMIT 3
  LOOP
    RAISE NOTICE '  📧 % (% %) - Password: MBet4321', 
      user_record.email, 
      user_record.first_name, 
      user_record.last_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'DRIVERS:';
  FOR user_record IN 
    SELECT email, first_name, last_name 
    FROM public.users 
    WHERE role = 'driver' 
    LIMIT 2
  LOOP
    RAISE NOTICE '  📧 % (% %) - Password: MBet4321', 
      user_record.email, 
      user_record.first_name, 
      user_record.last_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'PARTNERS:';
  FOR user_record IN 
    SELECT email, first_name, last_name 
    FROM public.users 
    WHERE role = 'partner' 
    LIMIT 3
  LOOP
    RAISE NOTICE '  📧 % (% %) - Password: MBet4321', 
      user_record.email, 
      user_record.first_name, 
      user_record.last_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'STAFF:';
  FOR user_record IN 
    SELECT email, first_name, last_name 
    FROM public.users 
    WHERE role = 'staff' 
    LIMIT 2
  LOOP
    RAISE NOTICE '  📧 % (% %) - Password: MBet4321', 
      user_record.email, 
      user_record.first_name, 
      user_record.last_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎉 READY TO TEST!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'You can now log in with any of the above credentials';
  RAISE NOTICE 'All users have the same password: MBet4321';
  RAISE NOTICE '================================================';
END $$;

-- Verify auth users were created
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users;

-- Show auth users by role
SELECT 
  u.role,
  COUNT(*) as count
FROM auth.users au
JOIN public.users u ON au.id = u.id
GROUP BY u.role
ORDER BY u.role;
