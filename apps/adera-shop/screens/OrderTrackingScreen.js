import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { MapView, Marker, parsePoint } from '@adera/maps';
import { supabase } from '@adera/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * OrderTrackingScreen — live parcel tracking for a shop order.
 *
 * Finds the parcel linked to the order, renders:
 *  - a status timeline from parcel_events,
 *  - a cross-platform map with the delivery location pinned and the
 *    assigned pickup partner's branded pin,
 *  - order and delivery summaries.
 */
const STATUS_STEPS = [
  { status: 0, label: 'Order Placed', icon: 'receipt-text-check-outline' },
  { status: 1, label: 'At Drop-off Point', icon: 'package-variant-closed' },
  { status: 2, label: 'In Transit', icon: 'truck-fast-outline' },
  { status: 3, label: 'At Sorting Hub', icon: 'warehouse-outline' },
  { status: 4, label: 'Dispatched', icon: 'truck-delivery-outline' },
  { status: 5, label: 'At Pickup Point', icon: 'map-marker-check-outline' },
  { status: 6, label: 'Delivered', icon: 'check-circle-outline' },
];

const OrderTrackingScreen = ({ route }) => {
  const theme = useTheme();
  const orderId = route?.params?.orderId;
  const [parcel, setParcel] = useState(null);
  const [events, setEvents] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    setRefreshing(false);
    try {
      // Find the parcel linked to this order (auto-create-parcel flow)
      let parcelData = null;
      if (orderId) {
        const { data: byOrder } = await supabase
          .from('parcels')
          .select('*')
          .eq('order_id', orderId)
          .maybeSingle();
        parcelData = byOrder;
      }
      if (!parcelData && route?.params?.parcelId) {
        const { data: byId } = await supabase
          .from('parcels')
          .select('*')
          .eq('id', route.params.parcelId)
          .maybeSingle();
        parcelData = byId;
      }
      if (!parcelData) {
        setParcel(null);
        setEvents([]);
        return;
      }
      setParcel(parcelData);

      const [eventsRes, partnerRes] = await Promise.all([
        supabase
          .from('parcel_events')
          .select('id, status, address, notes, event_time')
          .eq('parcel_id', parcelData.id)
          .order('event_time', { ascending: true }),
        parcelData.pickup_partner_id
          ? supabase
              .from('users')
              .select('id, business_name, location, address')
              .eq('id', parcelData.pickup_partner_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setEvents(eventsRes.data || []);
      setPartner(partnerRes.data || null);
    } catch (e) {
      setParcel(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [orderId, route?.params?.parcelId]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTracking();
  }, [fetchTracking]);

  const currentStatus = parcel?.status ?? 0;

  const deliveryCoord = useMemo(() => {
    const c = parsePoint(parcel?.delivery_location);
    return c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude) ? c : null;
  }, [parcel?.delivery_location]);

  const partnerCoord = useMemo(() => {
    const c = parsePoint(partner?.location);
    return c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude) ? c : null;
  }, [partner?.location]);

  const region = useMemo(() => {
    const pts = [deliveryCoord, partnerCoord].filter(Boolean);
    if (pts.length === 0) return null;
    const lats = pts.map((p) => p.latitude);
    const lngs = pts.map((p) => p.longitude);
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitudeDelta: Math.max(0.03, Math.abs(Math.max(...lats) - Math.min(...lats)) * 1.8),
      longitudeDelta: Math.max(0.03, Math.abs(Math.max(...lngs) - Math.min(...lngs)) * 1.8),
    };
  }, [deliveryCoord, partnerCoord]);

  return (
    <SafeArea style={styles.container} withBottomNav={false}>
      <AppBar title="Track Order" subtitle={parcel?.tracking_id ? `#${parcel.tracking_id}` : undefined} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!loading && !parcel && (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="package-variant-remove" size={56} color={theme.colors.text.disabled} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No parcel linked yet
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyBody, { color: theme.colors.text.secondary }]}>
              Tracking appears here once your order is handed to Adera for delivery.
            </Text>
          </Card>
        )}

        {parcel && (
          <>
            {/* Status timeline */}
            <Card style={styles.sectionCard}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Delivery Progress
              </Text>
              {STATUS_STEPS.map((step) => {
                const done = currentStatus >= step.status;
                const isCurrent = currentStatus === step.status;
                return (
                  <View key={step.status} style={styles.timelineRow}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={22}
                      color={done ? theme.colors.primary : theme.colors.text.disabled}
                    />
                    <View style={styles.timelineTextWrap}>
                      <Text
                        variant="bodyMedium"
                        style={[styles.timelineLabel, done && { color: theme.colors.text.primary, fontWeight: '600' }]}
                      >
                        {step.label}
                        {isCurrent ? '  ●' : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {events.length > 0 && (
                <View style={styles.eventsBlock}>
                  <Text variant="labelLarge" style={styles.eventsTitle}>
                    Latest updates
                  </Text>
                  {events.slice(-3).reverse().map((ev) => (
                    <Text key={ev.id} variant="bodySmall" style={[styles.eventLine, { color: theme.colors.text.secondary }]}>
                      {new Date(ev.event_time).toLocaleString()} — {ev.address || ev.notes || 'Status update'}
                    </Text>
                  ))}
                </View>
              )}
            </Card>

            {/* Map */}
            {region && (
              <Card style={styles.mapCard}>
                <MapView
                  style={styles.map}
                  region={region}
                  initialRegion={region}
                  fallbackMessage="Map requires a development build."
                >
                  {deliveryCoord && (
                    <Marker coordinate={deliveryCoord} title="Delivery location" pinColor={theme.colors.success || '#4CAF50'} />
                  )}
                  {partnerCoord && (
                    <Marker
                      coordinate={partnerCoord}
                      title={partner?.business_name || 'Adera Partner'}
                      description={partner?.address || ''}
                      pinColor={theme.colors.primary}
                    />
                  )}
                </MapView>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                    <Text variant="bodySmall">Partner</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.success || '#4CAF50' }]} />
                    <Text variant="bodySmall">Delivery</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Delivery summary */}
            <Card style={styles.sectionCard}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Delivery Details
              </Text>
              <Text variant="bodyMedium">{parcel.delivery_address}</Text>
              <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.text.secondary }]}>
                Recipient: {parcel.recipient_name} · {parcel.recipient_phone}
              </Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={parcel.status} />
                {parcel.paid_at && <StatusBadge label="PAID" tone={theme.colors.success || '#4CAF50'} size="small" />}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  sectionCard: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  timelineTextWrap: { flex: 1 },
  timelineLabel: { color: '#9E9E9E' },
  eventsBlock: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  eventsTitle: { marginBottom: 6 },
  eventLine: { marginBottom: 3 },
  mapCard: { margin: 16, padding: 0, borderRadius: 16, overflow: 'hidden' },
  map: { height: 240, width: '100%' },
  legendRow: { flexDirection: 'row', gap: 16, padding: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  muted: { marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  emptyCard: { margin: 16, padding: 32, alignItems: 'center', borderRadius: 16 },
  emptyTitle: { marginTop: 12, fontWeight: '600', marginBottom: 6 },
  emptyBody: { textAlign: 'center', lineHeight: 20 },
});

export default OrderTrackingScreen;
