-- ============================================================
-- SUPABASE STORAGE BUCKETS
-- ============================================================
-- Run this after schema.sql to create storage buckets.
-- Supabase Storage uses the storage schema automatically.

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, '{image/jpeg,image/png,image/webp,image/gif}'),
  ('products', 'products', true, 10485760, '{image/jpeg,image/png,image/webp}'),
  ('parcels', 'parcels', false, 10485760, '{image/jpeg,image/png,image/webp,application/pdf}'),
  ('shops', 'shops', true, 10485760, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Avatars: anyone can read, owner can upload/update/delete
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Products: anyone can read, shop owners can manage their shop's products
CREATE POLICY "products_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products_shop_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM shops
      WHERE owner_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[1]
    )
  );

CREATE POLICY "products_shop_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products'
    AND EXISTS (
      SELECT 1 FROM shops
      WHERE owner_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[1]
    )
  );

-- Parcels: stakeholder access (sender, partners, driver, staff)
CREATE POLICY "parcels_stakeholder_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'parcels'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin')
      )
    )
  );

CREATE POLICY "parcels_sender_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'parcels'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Shops: anyone can read, owner can manage
CREATE POLICY "shops_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'shops');

CREATE POLICY "shops_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shops'
    AND EXISTS (
      SELECT 1 FROM shops
      WHERE owner_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[1]
    )
  );

CREATE POLICY "shops_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'shops'
    AND EXISTS (
      SELECT 1 FROM shops
      WHERE owner_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[1]
    )
  );
