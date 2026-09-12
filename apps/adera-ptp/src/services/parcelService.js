import { supabase } from '@adera/auth';

const TRACKING_PREFIX = 'ADE';

const formatPoint = (location) => {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return null;
  }

  return `POINT(${Number(location.longitude).toFixed(6)} ${Number(location.latitude).toFixed(6)})`;
};

export const generateTrackingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${TRACKING_PREFIX}${timestamp}${random}`;
};

export const createParcelRecord = async ({
  parcel,
  initialEvent,
}) => {
  const payload = {
    ...parcel,
    tracking_id: parcel.tracking_id || generateTrackingId(),
    pickup_location: formatPoint(parcel.pickup_location),
    delivery_location: formatPoint(parcel.delivery_location),
    current_location: parcel.current_location ? formatPoint(parcel.current_location) : null,
  };

  const { data, error } = await supabase
    .from('parcels')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (initialEvent) {
    const { error: eventError } = await supabase.from('parcel_events').insert([{
      parcel_id: data.id,
      status: initialEvent.status ?? data.status ?? 0,
      actor_id: initialEvent.actorId,
      actor_role: initialEvent.actorRole || 'customer',
      location: initialEvent.location ? formatPoint(initialEvent.location) : payload.pickup_location,
      notes: initialEvent.notes || 'Parcel created',
    }]);

    if (eventError) {
      throw eventError;
    }
  }

  return data;
};

export const parcelLocationToPoint = formatPoint;

