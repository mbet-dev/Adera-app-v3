import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { supabase } from '@adera/auth';

/**
 * ParcelOversight — real operations view. Surfaces parcels likely needing
 * attention: in transit but stale (no update in 12h+) and pending parcels
 * expiring soon. Pull-to-refresh keeps the list fresh.
 */
const ParcelOversight = () => {
  const theme = useTheme();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    setRefreshing(false);
    try {
      const staleBefore = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('parcels')
        .select(
          'id, tracking_id, status, recipient_name, recipient_phone, pickup_address, delivery_address, updated_at, expires_at, created_at',
        )
        .in('status', [0, 1, 2, 3, 4])
        .or(`updated_at.lt.${staleBefore},expires_at.lt.${new Date().toISOString()}`)
        .order('updated_at', { ascending: true })
        .limit(40);
      if (error) throw error;
      setParcels(data || []);
    } catch (e) {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, [fetchParcels]);

  const issueFor = (parcel) => {
    const expired = parcel.expires_at && new Date(parcel.expires_at) < new Date();
    if (expired) return { label: '⚠️ Pickup window expired', color: '#F44336' };
    const hoursStale = (Date.now() - new Date(parcel.updated_at).getTime()) / 3600000;
    if (hoursStale > 24) return { label: `🚨 Stale ${Math.floor(hoursStale / 24)}d+`, color: '#F44336' };
    return { label: '⏳ No movement 12h+', color: '#FF9800' };
  };

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar title="Parcel Oversight" subtitle={`${parcels.length} need attention`} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {parcels.map((parcel) => {
          const issue = issueFor(parcel);
          return (
            <Card key={parcel.id} style={styles.parcelCard}>
              <View style={styles.parcelHeader}>
                <Text variant="titleMedium">#{parcel.tracking_id}</Text>
                <StatusBadge status={parcel.status} />
              </View>
              <Text variant="bodyMedium" style={[styles.issue, { color: issue.color }]}>
                {issue.label}
              </Text>
              <Text variant="bodySmall" style={[styles.meta, { color: theme.colors.text.secondary }]}>
                {parcel.recipient_name ? `To: ${parcel.recipient_name}` : 'Unassigned recipient'} ·{' '}
                {parcel.delivery_address || 'no address'}
              </Text>
              <Text variant="bodySmall" style={[styles.meta, { color: theme.colors.text.secondary }]}>
                Last update: {new Date(parcel.updated_at).toLocaleString()}
              </Text>
            </Card>
          );
        })}

        {!loading && parcels.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              All clear ✓
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No stale or expiring parcels right now.
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
  issue: { marginBottom: 4, fontWeight: '600' },
  meta: { marginTop: 2 },
  emptyCard: { padding: 32, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  emptyTitle: { fontWeight: '600', marginBottom: 8 },
  emptyText: { textAlign: 'center' },
});

export default ParcelOversight;
