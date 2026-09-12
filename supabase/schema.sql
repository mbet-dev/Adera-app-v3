-- Adera Hybrid App Database Schema
-- This file contains the complete database structure for both PTP and Shop systems

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS parcel_events CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create custom types
CREATE OR REPLACE FUNCTION create_user_role_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'partner', 'driver', 'staff', 'admin');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_user_role_if_not_exists();

CREATE OR REPLACE FUNCTION create_parcel_status_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parcel_status') THEN
    CREATE TYPE parcel_status AS ENUM ('created', 'dropoff', 'in_transit_to_hub', 'at_hub', 'dispatched', 'at_pickup_partner', 'delivered');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_parcel_status_if_not_exists();

CREATE OR REPLACE FUNCTION create_payment_method_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('telebirr', 'chapa', 'arifpay', 'wallet', 'cod');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_payment_method_if_not_exists();

CREATE OR REPLACE FUNCTION create_payment_status_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_payment_status_if_not_exists();

CREATE OR REPLACE FUNCTION create_parcel_status_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parcel_status') THEN
    CREATE TYPE parcel_status AS ENUM ('created', 'dropoff', 'in_transit_to_hub', 'at_hub', 'dispatched', 'at_pickup_partner', 'delivered');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_parcel_status_if_not_exists();

CREATE OR REPLACE FUNCTION create_payment_method_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('telebirr', 'chapa', 'arifpay', 'wallet', 'cod');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_payment_method_if_not_exists();

CREATE OR REPLACE FUNCTION create_payment_status_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_payment_status_if_not_exists();

-- Create public.profiles table for user profile management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  language TEXT DEFAULT 'en',
  avatar_url TEXT,
  email_confirmed BOOLEAN DEFAULT false,
  phone_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with role-based access (legacy, consider migrating to profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  
  -- Profile information
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Business information (for partners)
  business_name TEXT,
  business_license TEXT,
  
  -- Location information
  address TEXT,
  location POINT,
  
  -- Settings
  language TEXT DEFAULT 'en',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);
-- Partner shops
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  
  -- Shop information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  logo_url TEXT,
  
  -- Location and contact
  location POINT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  
  -- Operating information
  operating_hours JSONB NOT NULL DEFAULT '{}',
  delivery_radius INTEGER DEFAULT 5000, -- meters
  
  -- Payment methods accepted
  accepted_payment_methods payment_method[] DEFAULT '{cod}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Statistics
  total_orders INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Products for e-commerce
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  
  -- Product information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  
  -- Media
  images TEXT[] DEFAULT '{}',
  
  -- Attributes
  weight DECIMAL(8,2),
  dimensions JSONB, -- {length, width, height}
  
  -- SEO and discovery
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Parcels for logistics
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT UNIQUE NOT NULL,
  
  
  -- Parties involved
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  dropoff_partner_id UUID REFERENCES users(id),
  pickup_partner_id UUID REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  
  -- Locations
  pickup_location POINT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_location POINT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- Parcel details
  description TEXT,
  weight DECIMAL(8,2),
  dimensions JSONB, -- {length, width, height}
  declared_value DECIMAL(10,2),
  
  -- Pricing
  delivery_fee DECIMAL(10,2) NOT NULL,
  insurance_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status and tracking
  status INTEGER NOT NULL DEFAULT 0, -- 0-6 corresponding to parcel_status
  current_location POINT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Special instructions
  pickup_instructions TEXT,
  delivery_instructions TEXT,
  fragile BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);
-- Parcel event logs for tracking
CREATE TABLE IF NOT EXISTS parcel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  
  
  -- Event details
  status INTEGER NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role user_role NOT NULL,
  
  -- Location and time
  location POINT,
  address TEXT,
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional information
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  signature_url TEXT,
  
  -- QR code verification
  qr_code_hash TEXT,
  verification_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Orders for e-commerce
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  
  
  -- Customer information
  customer_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  
  -- Delivery information
  delivery_address TEXT NOT NULL,
  delivery_location POINT NOT NULL,
  delivery_phone TEXT,
  delivery_notes TEXT,
  
  -- Order totals
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered, cancelled
  
  -- Auto-delivery integration
  auto_create_parcel BOOLEAN DEFAULT false,
  parcel_id UUID REFERENCES parcels(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);
-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Item details at time of order
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  
  -- Totals
  item_total DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  
  -- Reference
  parcel_id UUID REFERENCES parcels(id),
  order_id UUID REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  
  -- Gateway information
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- parcel_update, order_update, payment, promo, system
  
  -- Reference data
  reference_id UUID,
  reference_type TEXT,
  
  -- Delivery
  is_read BOOLEAN DEFAULT false,
  is_push_sent BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  is_sms_sent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

CREATE INDEX IF NOT EXISTS idx_parcels_tracking_id ON parcels(tracking_id);
CREATE INDEX IF NOT EXISTS idx_parcels_sender_id ON parcels(sender_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON parcels(created_at);

CREATE INDEX IF NOT EXISTS idx_parcel_events_parcel_id ON parcel_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_events_event_time ON parcel_events(event_time);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;


-- Row Level Security (RLS) Policies
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Users can see their own data
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY users_supabase_auth_admin_insert ON users FOR INSERT WITH CHECK (TRUE);

-- Shops: owners can manage, others can view active shops
CREATE POLICY shops_owner_full_access ON shops FOR ALL USING (owner_id = auth.uid());
CREATE POLICY shops_public_read ON shops FOR SELECT USING (is_active = true);

-- Products: shop owners can manage, others can view available products
CREATE POLICY products_shop_owner_access ON products FOR ALL USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);
CREATE POLICY products_public_read ON products FOR SELECT USING (
  is_available = true AND shop_id IN (SELECT id FROM shops WHERE is_active = true)
);

-- Parcels: complex visibility rules
CREATE POLICY parcels_stakeholder_access ON parcels FOR ALL USING (
  auth.uid() = sender_id OR
  auth.uid() = dropoff_partner_id OR
  auth.uid() = pickup_partner_id OR
  auth.uid() = driver_id OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('staff', 'admin')
  )
);

-- Parcel events: same as parcels
CREATE POLICY parcel_events_stakeholder_access ON parcel_events FOR ALL USING (
  parcel_id IN (
    SELECT id FROM parcels WHERE
    auth.uid() = sender_id OR
    auth.uid() = dropoff_partner_id OR
    auth.uid() = pickup_partner_id OR
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('staff', 'admin')
    )
  )
);

-- Orders: customers and shop owners can access
CREATE POLICY orders_customer_access ON orders FOR ALL USING (customer_id = auth.uid());
CREATE POLICY orders_shop_owner_access ON orders FOR ALL USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- Order items: through orders
CREATE POLICY order_items_access ON order_items FOR ALL USING (
  order_id IN (
    SELECT id FROM orders WHERE 
    customer_id = auth.uid() OR 
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  )
);

-- Payments: users can see their own payments
CREATE POLICY payments_user_access ON payments FOR ALL USING (user_id = auth.uid());

-- Notifications: users can see their own notifications
CREATE POLICY notifications_user_access ON notifications FOR ALL USING (user_id = auth.uid());

-- Trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to create/update profile when auth.users changes
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  default_role text := 'customer';
  user_role text;
  user_full_name text;
  user_phone text;
  user_lang text;
  avatar text;
BEGIN
  -- Get metadata (can be null)
  meta := coalesce(new.raw_user_meta, new.user_metadata)::jsonb;

  -- Extract and normalize values with fallbacks
  user_role := coalesce(
    nullif((meta->>'role')::text,''),
    default_role
  );
  user_full_name := coalesce(
    nullif(meta->>'full_name',''), 
    nullif(new.user_name,''), 
    nullif(new.email,'')
  );
  user_phone := coalesce(
    nullif(new.phone,''), 
    nullif(meta->>'phone','')
  );
  user_lang := coalesce(
    nullif(meta->>'language',''), 
    'en'
  );
  avatar := coalesce(
    nullif(meta->>'avatar_url',''),
    nullif(meta->>'avatar','')
  );

  -- Handle existing profile (update missing fields)
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    UPDATE public.profiles SET
      email = coalesce(public.profiles.email, new.email),
      full_name = coalesce(public.profiles.full_name, user_full_name),
      phone = coalesce(public.profiles.phone, user_phone),
      role = coalesce(public.profiles.role, user_role),
      language = coalesce(public.profiles.language, user_lang),
      avatar_url = coalesce(public.profiles.avatar_url, avatar),
      email_confirmed = coalesce(
        public.profiles.email_confirmed, 
        (new.email_confirmed_at IS NOT NULL)
      ),
      phone_confirmed = coalesce(public.profiles.phone_confirmed, false),
      updated_at = NOW()
    WHERE id = new.id;
    RETURN new;
  END IF;

  -- Create new profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    language,
    avatar_url,
    email_confirmed,
    phone_confirmed,
    created_at
  ) VALUES (
    new.id,
    new.email,
    user_full_name,
    user_phone,
    user_role,
    user_lang,
    avatar,
    (new.email_confirmed_at IS NOT NULL),
    false,
    NOW()
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
