import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@adera/auth/src/supabase';

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAddresses([]);
        return;
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .select('id, label, full_address, latitude, longitude, phone, notes, is_default, created_at')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((a) => ({
        id: a.id,
        label: a.label || 'Home',
        fullAddress: a.full_address,
        latitude: a.latitude ? Number(a.latitude) : null,
        longitude: a.longitude ? Number(a.longitude) : null,
        phone: a.phone,
        notes: a.notes,
        isDefault: a.is_default,
      }));

      setAddresses(mapped);

      // Auto-select default
      if (!selectedAddress && mapped.length > 0) {
        const defaultAddr = mapped.find((a) => a.isDefault) || mapped[0];
        setSelectedAddress(defaultAddr);
      }
    } catch (err) {
      console.error('[useAddresses] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = useCallback(async ({ label, fullAddress, latitude, longitude, phone, notes }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be signed in');

      const isFirst = addresses.length === 0;

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          label: label || 'Home',
          full_address: fullAddress,
          latitude: latitude || null,
          longitude: longitude || null,
          phone: phone || null,
          notes: notes || null,
          is_default: isFirst,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAddresses();
      return { id: data.id, label: data.label, fullAddress: data.full_address };
    } catch (err) {
      console.error('[useAddresses] Add error:', err);
      return null;
    }
  }, [addresses.length, fetchAddresses]);

  const deleteAddress = useCallback(async (addressId) => {
    try {
      const { error } = await supabase.from('saved_addresses').delete().eq('id', addressId);
      if (error) throw error;
      if (selectedAddress?.id === addressId) setSelectedAddress(null);
      await fetchAddresses();
      return true;
    } catch (err) {
      console.error('[useAddresses] Delete error:', err);
      return false;
    }
  }, [selectedAddress, fetchAddresses]);

  const setDefault = useCallback(async (addressId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all defaults first
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
      await fetchAddresses();
    } catch (err) {
      console.error('[useAddresses] SetDefault error:', err);
    }
  }, [fetchAddresses]);

  return {
    addresses,
    selectedAddress,
    setSelectedAddress,
    addAddress,
    deleteAddress,
    setDefault,
    loading,
    refresh: fetchAddresses,
  };
};

export default useAddresses;
