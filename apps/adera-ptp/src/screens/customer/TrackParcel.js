import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeArea, Card, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Haptic + sound feedback for real-time updates
let Haptics = null;
let Audio = null;
try {
  Haptics = require('expo-haptics');
} catch {}
try {
  Audio = require('expo-av');
} catch {}

const STATUS_META = [
  { key: 'created', label: 'Created', icon: 'package-variant', color: '#9E9E9E' },
  { key: 'dropoff', label: 'At Drop-off', icon: 'storefront', color: '#4CAF50' },
  { key: 'in_transit_to_hub', label: 'In Transit to Hub', icon: 'truck-fast', color: '#FF9800' },
  { key: 'at_hub', label: 'At Hub', icon: 'warehouse', color: '#7C4DFF' },
  { key: 'dispatched', label: 'Dispatched', icon: 'map-marker-path', color: '#2196F3' },
  { key: 'at_pickup_partner', label: 'At Pickup Point', icon: 'map-marker-check', color: '#1565C0' },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle', color: '#2E7D32' },
];

const TrackParcel = ({ navigation, route }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [trackingId, setTrackingId] = useState(route?.params?.trackingId || '');
  const [parcelData, setParcelData] = useState(null);
  const [parcelEvents, setParcelEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [empty, setEmpty] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const abortRef = useRef(null);
  const channelRef = useRef(null);
  const lastStatusRef = useRef(null);

  // Play haptic + sound feedback when a real-time update arrives
  const playUpdateFeedback = useCallback(async (newStatus) => {
    // Haptic feedback
    try {
      if (Haptics?.impactAsync) {
        if (newStatus === 6) {
          // Delivered — celebration pattern
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            try { Haptics?.impactAsync && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
          }, 200);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch {}

    // Audio chime via expo-av if available
    try {
      if (Audio?.Audio) {
        // Use the system notification sound
        const { sound } = await Audio.Audio.Sound.createAsync(
          Audio.Audio.Sound.COMPATIBLE_NOTIFICATION_URI || null,
          { shouldPlay: true, volume: 0.4, isLooping: false }
        );
        setTimeout(() => { try { sound.unloadAsync(); } catch {} }, 3000);
      }
    } catch {
      // Audio not available — haptics only
    }
  }, []);

  const isValidTrackingId = useMemo(() => {
    const re = /^ADE\d{8}-\d+$/i;
    return re.test(trackingId.trim());
  }, [trackingId]);

  // Auto-track if navigated with trackingId
  useEffect(() => {
    if (route?.params?.trackingId) {
      setTrackingId(route.params.trackingId);
      fetchParcel(route.params.trackingId);
    }
  }, [route?.params?.trackingId]);

  // ── Offline cache helpers ──
  const saveParcelCache = useCallback(async (pId, pTrackingId, pData, eData) => {
    try {
      await AsyncStorage.setItem(`@adera_parcel_${pTrackingId}`, JSON.stringify({ data: pData, ts: Date.now() }));
      await AsyncStorage.setItem(`@adera_events_${pTrackingId}`, JSON.stringify({ data: eData, ts: Date.now() }));
    } catch {}
  }, []);

  const loadParcelCache = useCallback(async (tid) => {
    try {
      const parcelJson = await AsyncStorage.getItem(`@adera_parcel_${tid}`);
      const eventsJson = await AsyncStorage.getItem(`@adera_events_${tid}`);
      if (!parcelJson) return null;
      const parcel = JSON.parse(parcelJson);
      const events = eventsJson ? JSON.parse(eventsJson) : { data: [] };
      // Cache valid for 1 hour
      if (Date.now() - parcel.ts > 3600000) return null;
      return { parcelData: parcel.data, events: events.data };
    } catch { return null; }
  }, []);

  const fetchParcel = useCallback(async (code) => {
    setIsLoading(true);
    setError('');
    setEmpty(false);
    setParcelData(null);
    setParcelEvents([]);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const normalizedCode = code.trim().toUpperCase();

    try {
      // Fetch parcel from Supabase
      const { data: parcel, error: parcelError } = await supabase
        .from('parcels')
        .select(`
          id, tracking_id, status, recipient_name, recipient_phone,
          pickup_address, delivery_address, delivery_fee, total_amount,
          payment_method, payment_status, fragile, urgent,
          created_at, updated_at, estimated_delivery,
          description, weight, sender_id
        `)
        .eq('tracking_id', normalizedCode)
        .single();

      if (controller.signal.aborted) return;

      if (parcelError || !parcel) {
        // Network failed — try offline cache
        const cached = await loadParcelCache(normalizedCode);
        if (cached) {
          setParcelData(cached.parcelData);
          setParcelEvents(cached.events);
          setLastUpdate(new Date());
          setEmpty(false);
        } else {
          setEmpty(true);
        }
        setIsLoading(false);
        return;
      }

      // Fetch parcel events (timeline)
      const { data: events } = await supabase
        .from('parcel_events')
        .select('id, status, actor_id, actor_role, location, address, notes, event_time, created_at')
        .eq('parcel_id', parcel.id)
        .order('event_time', { ascending: true });

      if (controller.signal.aborted) return;

      const mappedParcel = {
        id: parcel.id,
        trackingId: parcel.tracking_id,
        currentStatus: parcel.status,
        statusLabel: STATUS_META[parcel.status]?.label || 'Unknown',
        recipient: parcel.recipient_name,
        recipientPhone: parcel.recipient_phone,
        estimatedDelivery: parcel.estimated_delivery,
        pickupAddress: parcel.pickup_address,
        deliveryAddress: parcel.delivery_address,
        totalAmount: parcel.total_amount,
        paymentMethod: parcel.payment_method,
        paymentStatus: parcel.payment_status,
        fragile: parcel.fragile,
        urgent: parcel.urgent,
        description: parcel.description,
        createdAt: parcel.created_at,
      };

      const mappedEvents = events || [];

      setParcelData(mappedParcel);
      setParcelEvents(mappedEvents);
      setLastUpdate(new Date());
      setEmpty(false);

      // Cache for offline access
      saveParcelCache(parcel.id, parcel.tracking_id, mappedParcel, mappedEvents);
    } catch (e) {
      if (e?.name === 'AbortError' || controller?.signal?.aborted) return;
      // Last resort: try cache
      const cached = await loadParcelCache(normalizedCode);
      if (cached) {
        setParcelData(cached.parcelData);
        setParcelEvents(cached.events);
        setLastUpdate(new Date());
        setEmpty(false);
      } else {
        setError('Failed to fetch tracking information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveParcelCache, loadParcelCache]);

  // ─── Real-time subscription ───
  useEffect(() => {
    if (!parcelData?.id) {
      // Clean up if no parcel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsLive(false);
      }
      return;
    }

    let mounted = true;

    const setupRealtime = async () => {
      // Clean up previous channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const parcelId = parcelData.id;

      // Subscribe to parcel status changes
      const channel = supabase
        .channel(`parcel:${parcelId}`)
        // Listen for parcel row updates (status changes)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'parcels',
            filter: `id=eq.${parcelId}`,
          },
          (payload) => {
            if (!mounted) return;
            const updated = payload.new;
            const prevStatus = lastStatusRef.current;
            setParcelData((prev) => {
              if (!prev) return prev;
              lastStatusRef.current = updated.status;
              return {
                ...prev,
                currentStatus: updated.status,
                statusLabel: STATUS_META[updated.status]?.label || 'Unknown',
                estimatedDelivery: updated.estimated_delivery || prev.estimatedDelivery,
              };
            });
            setLastUpdate(new Date());
            // Play feedback only if status actually changed
            if (prevStatus !== null && prevStatus !== updated.status) {
              playUpdateFeedback(updated.status);
            }
            lastStatusRef.current = updated.status;
          },
        )
        // Listen for new parcel events (timeline additions)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'parcel_events',
            filter: `parcel_id=eq.${parcelId}`,
          },
          (payload) => {
            if (!mounted) return;
            const newEvent = payload.new;
            setParcelEvents((prev) => {
              // Avoid duplicates
              if (prev.some((e) => e.id === newEvent.id)) return prev;
              return [...prev, {
                id: newEvent.id,
                status: newEvent.status,
                actor_id: newEvent.actor_id,
                actor_role: newEvent.actor_role,
                location: newEvent.location,
                address: newEvent.address,
                notes: newEvent.notes,
                event_time: newEvent.event_time,
                created_at: newEvent.created_at,
              }].sort((a, b) => new Date(a.event_time || a.created_at) - new Date(b.event_time || b.created_at));
            });
            setLastUpdate(new Date());
            // Haptic feedback for new events
            try {
              if (Haptics?.notificationAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            } catch {}
          },
        )
        .subscribe((status) => {
          if (mounted) {
            setIsLive(status === 'SUBSCRIBED');
          }
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsLive(false);
      }
    };
  }, [parcelData?.id]);

  const handleTrack = useCallback(() => {
    const code = trackingId.trim();
    if (!code) {
      Alert.alert('Required', 'Please enter a tracking ID');
      return;
    }
    if (!isValidTrackingId) {
      Alert.alert('Invalid Format', 'Tracking ID format looks incorrect. Example: ADE20250110-3');
      return;
    }
    fetchParcel(code);
  }, [trackingId, isValidTrackingId, fetchParcel]);

  const handleClear = useCallback(() => {
    setTrackingId('');
    setParcelData(null);
    setParcelEvents([]);
    setError('');
    setEmpty(false);
    setIsLive(false);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!parcelData) return;
    try {
      await Share.share({
        message: `Track my Adera parcel: ${parcelData.trackingId}\nStatus: ${parcelData.statusLabel}`,
        title: 'Track Parcel',
      });
    } catch {}
  }, [parcelData]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const getStatusColor = (status) => STATUS_META[status]?.color || '#9E9E9E';
  const getStatusIcon = (status) => STATUS_META[status]?.icon || 'progress-clock';

  const buildTimeline = () => {
    if (!parcelData) return [];
    const currentStatus = parcelData.currentStatus;
    return STATUS_META.map((meta, index) => {
      const matchingEvent = parcelEvents.find((e) => e.status === index);
      const isCompleted = currentStatus >= index;
      const isActive = currentStatus === index;
      return {
        id: String(index),
        ...meta,
        completed: isCompleted,
        active: isActive,
        timestamp: matchingEvent?.event_time || matchingEvent?.created_at || null,
        notes: matchingEvent?.notes || null,
      };
    });
  };

  const renderLiveIndicator = () => (
    <View style={styles.liveIndicator}>
      <View style={[styles.liveDot, { backgroundColor: isLive ? '#4CAF50' : theme.colors.outline }]} />
      <Text style={[styles.liveText, { color: isLive ? '#4CAF50' : theme.colors.text.secondary }]}>
        {isLive ? 'Live — tracking updates in real time' : 'Connecting…'}
      </Text>
      {lastUpdate && (
        <Text style={[styles.liveTimestamp, { color: theme.colors.text.secondary }]}>
          Updated {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      )}
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <Card style={styles.searchCard}>
        <Text style={[styles.searchTitle, { color: theme.colors.text.primary }]}>Track Your Parcel</Text>
        <Text style={[styles.searchSubtitle, { color: theme.colors.text.secondary }]}>Enter your tracking ID to view real-time status</Text>
        <View style={styles.searchInputContainer}>
          <View style={[styles.searchInputWrapper, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.text.secondary} style={styles.searchIcon} />
            <RNTextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="e.g., ADE20250110-3"
              placeholderTextColor={theme.colors.text.secondary}
              value={trackingId}
              onChangeText={setTrackingId}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Tracking ID Input"
              testID="tracking-id-input"
              keyboardType="default"
              returnKeyType="search"
              onSubmitEditing={handleTrack}
            />
            {trackingId.length > 0 && (
              <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear Tracking ID" testID="clear-tracking-id">
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          {!isValidTrackingId && trackingId.length > 0 && (
            <Text style={{ color: theme.colors.error, marginTop: 4 }} accessibilityLabel="Invalid tracking id message">
              Invalid tracking ID. Example: ADE20250110-3
            </Text>
          )}
          <Button
            title="Track Parcel"
            onPress={handleTrack}
            loading={isLoading}
            size="lg"
            style={styles.trackButton}
            disabled={!isValidTrackingId || isLoading}
            accessibilityLabel="Track Button"
            testID="track-button"
          />
        </View>
      </Card>
    </View>
  );

  const renderParcelDetails = () => {
    if (isLoading) {
      return (
        <View style={[styles.detailsSection, { alignItems: 'center', paddingVertical: 32 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.text.secondary, fontSize: 15 }}>Fetching tracking info…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.detailsSection, { gap: 12 }]} accessibilityLabel="Error Section" testID="error-section">
          <Card style={{ padding: 16, borderColor: theme.colors.error, borderWidth: 1 }}>
            <Text style={{ color: theme.colors.error, fontWeight: '700', marginBottom: 6 }}>Error</Text>
            <Text style={{ color: theme.colors.text.primary }}>{error}</Text>
          </Card>
          <Button title="Retry" onPress={handleTrack} leftIcon="reload" />
        </View>
      );
    }

    if (empty) {
      return (
        <View style={[styles.detailsSection, { gap: 12 }]} accessibilityLabel="Empty State" testID="empty-state">
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={48} color={theme.colors.text.secondary} />
            <Text style={{ marginTop: 12, color: theme.colors.text.primary, fontWeight: '700', fontSize: 18 }}>No parcel found</Text>
            <Text style={{ marginTop: 8, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
              No parcel matches tracking ID "{trackingId.trim().toUpperCase()}". Please check and try again.
            </Text>
          </Card>
        </View>
      );
    }

    if (!parcelData) return null;

    const timeline = buildTimeline();
    const statusColor = getStatusColor(parcelData.currentStatus);

    return (
      <View style={styles.detailsSection}>
        {/* Live Indicator */}
        {renderLiveIndicator()}

        {/* Status Hero Card */}
        <Card style={[styles.statusCard, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: isDark ? `${statusColor}22` : `${statusColor}15` }]}>
              <MaterialCommunityIcons name={getStatusIcon(parcelData.currentStatus)} size={36} color={statusColor} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>Current Status</Text>
              <Text style={[styles.statusText, { color: statusColor }]}>{parcelData.statusLabel}</Text>
            </View>
            {isLive && (
              <View style={[styles.liveIconWrap, { backgroundColor: isDark ? '#4CAF5022' : '#E8F5E9' }]}>
                <MaterialCommunityIcons name="access-point" size={20} color="#4CAF50" />
              </View>
            )}
          </View>

          <View style={[styles.statusDivider, { backgroundColor: theme.colors.outline }]} />

          {[
            { icon: 'barcode', label: 'Tracking ID', value: parcelData.trackingId },
            { icon: 'account', label: 'Recipient', value: parcelData.recipient },
            parcelData.deliveryAddress && { icon: 'map-marker', label: 'Destination', value: parcelData.deliveryAddress },
            parcelData.estimatedDelivery && {
              icon: 'calendar-clock',
              label: 'Est. Delivery',
              value: new Date(parcelData.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            },
            { icon: 'cash', label: 'Total', value: `${Number(parcelData.totalAmount).toFixed(2)} ETB` },
          ]
            .filter(Boolean)
            .map((row) => (
              <View key={row.label} style={styles.statusDetailRow}>
                <MaterialCommunityIcons name={row.icon} size={18} color={theme.colors.text.secondary} />
                <Text style={[styles.statusDetailLabel, { color: theme.colors.text.secondary }]}>{row.label}</Text>
                <Text style={[styles.statusDetailValue, { color: theme.colors.text.primary }]} numberOfLines={1}>{row.value}</Text>
              </View>
            ))}

          <View style={styles.tagsRow}>
            {parcelData.urgent && (
              <View style={[styles.tag, { backgroundColor: isDark ? '#FF8A6522' : '#FFF3E0', borderColor: '#FF9800' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FF9800" />
                <Text style={[styles.tagText, { color: '#FF9800' }]}>Urgent</Text>
              </View>
            )}
            {parcelData.fragile && (
              <View style={[styles.tag, { backgroundColor: isDark ? '#EF535022' : '#FFEBEE', borderColor: '#F44336' }]}>
                <MaterialCommunityIcons name="shield-alert" size={14} color="#F44336" />
                <Text style={[styles.tagText, { color: '#F44336' }]}>Fragile</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
              <MaterialCommunityIcons name="credit-card" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>{parcelData.paymentMethod}</Text>
            </View>
          </View>
        </Card>

        {/* Timeline Card */}
        <Card style={styles.timelineCard}>
          <Text style={[styles.timelineTitle, { color: theme.colors.text.primary }]}>Delivery Timeline</Text>
          <View style={styles.timeline}>
            {timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineLeftColumn}>
                  {event.timestamp && (
                    <Text style={[styles.timelineTime, { color: theme.colors.text.secondary }]}>
                      {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <View style={styles.timelineCenter}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: event.completed ? event.color : theme.colors.surfaceVariant,
                        borderColor: event.active ? event.color : 'transparent',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name={event.icon} size={16} color={event.completed ? '#FFF' : theme.colors.text.secondary} />
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: event.completed ? event.color : theme.colors.surfaceVariant }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: event.completed ? theme.colors.text.primary : theme.colors.text.secondary,
                        fontWeight: event.active ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {event.label}
                  </Text>
                  {event.notes && (
                    <Text style={[styles.timelineDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                      {event.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Contact Support"
            onPress={() => Alert.alert('Support', 'Support chat coming soon')}
            variant="outline"
            leftIcon="chat"
            style={{ flex: 1 }}
          />
          <Button
            title="Share Tracking"
            onPress={handleShare}
            variant="outline"
            leftIcon="share-variant"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSearchSection()}
        {renderParcelDetails()}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  searchSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  searchCard: { padding: 20 },
  searchTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  searchSubtitle: { fontSize: 14, marginBottom: 20 },
  searchInputContainer: { gap: 12 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 14 },
  trackButton: { width: '100%' },
  detailsSection: { paddingHorizontal: 20, paddingTop: 12 },
  // Live indicator
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '600', flex: 1 },
  liveTimestamp: { fontSize: 11 },
  liveIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Status card
  statusCard: { padding: 20, marginBottom: 16 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  statusIconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 14, marginBottom: 4 },
  statusText: { fontSize: 20, fontWeight: '700' },
  statusDivider: { height: 1, marginBottom: 16 },
  statusDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  statusDetailLabel: { fontSize: 14, flex: 1 },
  statusDetailValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },
  // Timeline
  timelineCard: { padding: 20, marginBottom: 16 },
  timelineTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineLeftColumn: { width: 56, paddingTop: 4 },
  timelineTime: { fontSize: 11 },
  timelineCenter: { width: 40, alignItems: 'center' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  timelineLine: { flex: 1, width: 2, marginVertical: 4 },
  timelineContent: { flex: 1, paddingTop: 4, paddingBottom: 12 },
  timelineLabel: { fontSize: 15, marginBottom: 2 },
  timelineDescription: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});

export default TrackParcel;
