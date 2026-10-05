import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { MapView, Marker, getCurrentLocation } from '@adera/maps';
import { useAuth } from '@adera/auth';
import { supabase } from '@adera/auth';

const DEFAULT_REGION = {
  latitude: 9.0054,
  longitude: 38.7578,
  latitudeDelta: 0.18,
  longitudeDelta: 0.14,
};

/**
 * RouteMap — driver's live route board.
 *
 * Shows every stop for the driver's assigned parcels on a real map:
 *  - pickup stops for parcels not yet collected (status <= 1),
 *  - delivery stops for parcels in the driver's custody (status 2–5),
 * plus the driver's own position. Data comes from Supabase; a demo set is
 * used when no parcels are assigned so the screen is never empty.
 */
const RouteMap = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const fetchRoute = React.useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('parcels')
        .select(
          'id, tracking_id, status, pickup_location, pickup_address, delivery_location, delivery_address, estimated_delivery',
        )
        .in('status', [0, 1, 2, 3, 4, 5])
        .order('estimated_delivery', { ascending: true })
        .limit(20);
      if (user?.id) {
        query = query.or(`driver_id.eq.${user.id},driver_id.is.null`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setParcels(data);
      } else {
        setParcels([]);
      }
    } catch (e) {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Best-effort driver position (never blocks the map)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = await getCurrentLocation();
        if (!cancelled && loc) {
          setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
        }
      } catch (e) {
        // permission denied etc. — map still renders stops
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Demo stops when nothing assigned
  const demoStops = [
    { id: 'demo-1', type: 'pickup', tracking_id: 'AD001234', status: 1, label: 'Bole Atlas Depot', address: 'Near Atlas Hotel, Bole', latitude: 9.0054, longitude: 38.7578 },
    { id: 'demo-2', type: 'delivery', tracking_id: 'AD001235', status: 2, label: 'Gerji Mebrat Hail', address: 'Gerji Road, House 45', latitude: 8.9861, longitude: 38.8085 },
    { id: 'demo-3', type: 'delivery', tracking_id: 'AD001236', status: 3, label: 'CMC Sorting Hub', address: 'CMC Road', latitude: 9.0356, longitude: 38.8025 },
  ];

  const stops = useMemo(() => {
    if (parcels.length === 0) return demoStops;
    const out = [];
    parcels.forEach((p) => {
      if (p.status <= 1 && p.pickup_location) {
        const c = normalizePoint(p.pickup_location);
        if (c) {
          out.push({
            id: `pk-${p.id}`,
            type: 'pickup',
            tracking_id: p.tracking_id,
            status: p.status,
            label: `Pickup: ${p.pickup_address || 'Partner location'}`,
            address: p.pickup_address || '',
            latitude: c.latitude,
            longitude: c.longitude,
          });
        }
      }
      if (p.status >= 2 && p.status < 6 && p.delivery_location) {
        const c = normalizePoint(p.delivery_location);
        if (c) {
          out.push({
            id: `dl-${p.id}`,
            type: 'delivery',
            tracking_id: p.tracking_id,
            status: p.status,
            label: `Deliver: ${p.delivery_address || 'Customer'}`,
            address: p.delivery_address || '',
            latitude: c.latitude,
            longitude: c.longitude,
          });
        }
      }
    });
    return out.length > 0 ? out : demoStops;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcels]);

  // Region fits all stops + driver position
  const region = useMemo(() => {
    const pts = stops.map((s) => [s.latitude, s.longitude]);
    if (userLocation) pts.push([userLocation.latitude, userLocation.longitude]);
    if (pts.length === 0) return DEFAULT_REGION;
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const center = {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
    const spanLat = Math.max(0.03, Math.abs(Math.max(...lats) - Math.min(...lats)) * 1.6);
    const spanLng = Math.max(0.03, Math.abs(Math.max(...lngs) - Math.min(...lngs)) * 1.6);
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: spanLat,
      longitudeDelta: spanLng,
    };
  }, [stops, userLocation]);

  const stopColor = (stop) => {
    if (stop.type === 'pickup') return theme.colors.warning || '#FF9800';
    if (stop.status >= 5) return theme.colors.success || '#4CAF50';
    return theme.colors.primary;
  };

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar title="Route Map" subtitle={`${stops.length} stop${stops.length !== 1 ? 's' : ''} today`} />

      <MapView
        style={styles.map}
        region={region}
        initialRegion={region}
        fallbackMessage="Map requires a development build.\nStops are listed below."
        showsUserLocation
      >
        {userLocation && <Marker coordinate={userLocation} title="You are here" pinColor="#FF3B30" />}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={`${stop.type === 'pickup' ? 'Pickup' : 'Deliver'} #${stop.tracking_id}`}
            description={stop.address || stop.label}
            pinColor={stopColor(stop)}
          />
        ))}
      </MapView>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRoute} />}
      >
        {stops.map((stop) => (
          <Card key={stop.id} style={styles.stopCard}>
            <View style={styles.stopRow}>
              <View style={[styles.stopDot, { backgroundColor: stopColor(stop) }]} />
              <View style={styles.stopInfo}>
                <Text variant="bodyLarge" style={styles.stopTitle}>
                  {stop.label}
                </Text>
                <Text variant="bodySmall" style={[styles.stopAddress, { color: theme.colors.text.secondary }]}>
                  #{stop.tracking_id} · {stop.address || stop.label}
                </Text>
              </View>
              <StatusBadge status={stop.status} size="small" />
            </View>
          </Card>
        ))}
        {stops.length === 0 && !loading && (
          <Card style={styles.emptyCard}>
            <Text variant="bodyMedium">No route stops assigned.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeArea>
  );
};

// Local helper: POINT string "(lng,lat)" or object → {latitude, longitude}
function normalizePoint(point) {
  if (!point) return null;
  if (typeof point === 'object' && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
    return point;
  }
  if (typeof point === 'object' && Number.isFinite(point.x) && Number.isFinite(point.y)) {
    return { latitude: point.y, longitude: point.x };
  }
  if (typeof point === 'string') {
    const m = point.match(/\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
    if (m) return { latitude: parseFloat(m[2]), longitude: parseFloat(m[1]) };
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  map: { height: 280, width: '100%' },
  sheet: { flex: 1, marginTop: 8 },
  sheetContent: { padding: 16, paddingBottom: 96 },
  stopCard: { padding: 12, marginBottom: 8, borderRadius: 14 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopDot: { width: 14, height: 14, borderRadius: 7 },
  stopInfo: { flex: 1 },
  stopTitle: { fontWeight: '600' },
  stopAddress: { marginTop: 2 },
  emptyCard: { padding: 24, alignItems: 'center', borderRadius: 14 },
});

export default RouteMap;
