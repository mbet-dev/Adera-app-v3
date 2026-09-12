import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@adera/auth';

const STATUS_LABELS = ['Created', 'At Drop-off', 'In Transit', 'At Hub', 'Dispatched', 'At Pickup Point', 'Delivered'];

export const statusToLabel = (status) => STATUS_LABELS[status] || 'Unknown';

export const useParcelHistory = ({ filter = 'all', searchQuery = '' } = {}) => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ total: 0, delivered: 0, cancelled: 0, active: 0, totalSpent: 0 });
  const abortRef = useRef(null);

  const fetchParcels = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setParcels([]);
        setSummary({ total: 0, delivered: 0, cancelled: 0, active: 0, totalSpent: 0 });
        return;
      }

      // Fetch all parcels for this user (sender)
      const { data: parcelData, error: parcelError } = await supabase
        .from('parcels')
        .select(`
          id, tracking_id, status, recipient_name, recipient_phone,
          pickup_address, delivery_address, delivery_fee, total_amount,
          payment_method, payment_status, fragile, urgent,
          created_at, updated_at, estimated_delivery,
          description, weight
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (controller.signal.aborted) return;

      if (parcelError) {
        throw parcelError;
      }

      // Map raw DB data to UI-friendly format
      const mapped = (parcelData || []).map((p) => ({
        id: p.id,
        trackingId: p.tracking_id,
        status: p.status,
        statusKey: getStatusKey(p.status),
        recipient: p.recipient_name || 'Unknown',
        recipientPhone: p.recipient_phone,
        date: p.created_at,
        price: Number(p.total_amount) || Number(p.delivery_fee) || 0,
        pickupPartner: p.pickup_address || 'N/A',
        destination: p.delivery_address || 'N/A',
        paymentMethod: p.payment_method,
        paymentStatus: p.payment_status,
        fragile: p.fragile,
        urgent: p.urgent,
        description: p.description,
        weight: p.weight,
        estimatedDelivery: p.estimated_delivery,
      }));

      setParcels(mapped);

      // Compute summary stats
      const delivered = mapped.filter((p) => p.status === 6).length;
      const cancelled = mapped.filter((p) => p.status < 0).length;
      const active = mapped.filter((p) => p.status >= 0 && p.status < 6).length;
      const totalSpent = mapped.reduce((sum, p) => sum + (p.price || 0), 0);

      setSummary({
        total: mapped.length,
        delivered,
        cancelled,
        active,
        totalSpent,
      });
    } catch (err) {
      if (err?.name === 'AbortError' || controller?.signal?.aborted) return;
      console.error('[useParcelHistory] Error:', err);
      setError(err.message || 'Failed to load parcel history');
    } finally {
      if (!controller?.signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) fetchParcels();
    }, 100);
    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchParcels]);

  const refresh = useCallback(() => fetchParcels(true), [fetchParcels]);

  // Filter parcels based on filter and search
  const filteredParcels = parcels.filter((parcel) => {
    // Apply status filter
    if (filter === 'active') {
      if (parcel.status < 0 || parcel.status >= 6) return false;
    } else if (filter === 'delivered') {
      if (parcel.status !== 6) return false;
    } else if (filter === 'cancelled') {
      if (parcel.status >= 0) return false;
    }
    // 'all' passes everything

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        parcel.trackingId.toLowerCase().includes(q) ||
        parcel.recipient.toLowerCase().includes(q) ||
        parcel.destination.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return {
    parcels: filteredParcels,
    allParcels: parcels,
    summary,
    loading,
    refreshing,
    error,
    refresh,
  };
};

// Map numeric status to a stable string key for UI
function getStatusKey(status) {
  if (status < 0) return 'cancelled';
  const keys = ['created', 'dropoff', 'in_transit_to_hub', 'at_hub', 'dispatched', 'at_pickup_partner', 'delivered'];
  return keys[status] || 'created';
}

export default useParcelHistory;
