import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { supabase } from '@adera/auth';
import { useAuth } from '@adera/auth';

/**
 * ParcelManagement — live view of parcels flowing through this partner's
 * location (drop-off point or pickup point), straight from Supabase with
 * pull-to-refresh and a clear empty state.
 */
const ParcelManagement = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParcels = useCallback(async () => {
    if (!user?.id) {
      setParcels([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('parcels')
        .select(
          'id, tracking_id, status, sender_id, recipient_name, recipient_phone, pickup_address, delivery_address, created_at',
        )
        .or(`dropoff_partner_id.eq.${user.id},pickup_partner_id.eq.${user.id}`)
        .in('status', [0, 1, 2, 3, 4, 5])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setParcels(data || []);
    } catch (e) {
      setParcels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, [fetchParcels]);

  const partnerLabel = (parcel) => {
    if (parcel.recipient_name) {
      return `To: ${parcel.recipient_name}`;
    }
    return 'Parcel in custody';
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar title="Parcel Management" subtitle={`${parcels.length} active`} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {parcels.map((parcel) => (
          <Card key={parcel.id} style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <Text variant="titleMedium">#{parcel.tracking_id}</Text>
              <StatusBadge status={parcel.status} />
            </View>
            <Text variant="bodyMedium" style={styles.parcelInfo}>
              {partnerLabel(parcel)}
            </Text>
            <Text variant="bodySmall" style={[styles.parcelTime, { color: theme.colors.text.secondary }]}>
              {timeAgo(parcel.created_at)} · {parcel.pickup_address || ''}
            </Text>
          </Card>
        ))}

        {!loading && parcels.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No active parcels
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              Parcels dropped off at or awaiting pickup from your location will appear here.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  parcelCard: { padding: 16, marginBottom: 8, borderRadius: 14 },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parcelInfo: { marginBottom: 4 },
  parcelTime: {},
  emptyCard: { padding: 32, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  emptyTitle: { fontWeight: '600', marginBottom: 8 },
  emptyText: { textAlign: 'center', lineHeight: 20 },
});

export default ParcelManagement;
