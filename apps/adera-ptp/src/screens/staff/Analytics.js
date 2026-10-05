import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { supabase } from '@adera/auth';

/**
 * Analytics — live platform metrics from Supabase (parcels, orders, revenue).
 * Falls back to a zero-state when RLS restricts staff aggregates rather than
 * showing invented numbers.
 */
const Analytics = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setRefreshing(false);
    try {
      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [parcelsRes, transitRes, ordersRes, paymentsRes] = await Promise.all([
        supabase.from('parcels').select('id, total_amount', { count: 'exact' }).gte('created_at', dayAgo),
        supabase.from('parcels').select('id', { count: 'exact' }).in('status', [2, 3, 4]),
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', dayAgo),
        supabase.from('payments').select('amount').eq('status', 'completed'),
      ]);

      const revenue = (paymentsRes.data || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0,
      );

      setMetrics({
        parcelsToday: parcelsRes.count ?? 0,
        inTransit: transitRes.count ?? 0,
        ordersToday: ordersRes.count ?? 0,
        revenue,
      });
    } catch (e) {
      setMetrics({ parcelsToday: 0, inTransit: 0, ordersToday: 0, revenue: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMetrics();
  }, [fetchMetrics]);

  const m = metrics || { parcelsToday: '—', inTransit: '—', ordersToday: '—', revenue: '—' };

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar title="Analytics" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.metricCard}>
          <Text variant="titleMedium" style={styles.metricTitle}>
            Live Platform Metrics
          </Text>
          <Text variant="displaySmall" style={[styles.metricValue, { color: theme.colors.primary }]}>
            {m.inTransit}
          </Text>
          <Text variant="bodyMedium">Parcels Currently In Transit</Text>
        </Card>

        <View style={styles.gridRow}>
          <Card style={styles.gridCard}>
            <Text variant="headlineMedium" style={[styles.gridValue, { color: theme.colors.primary }]}>
              {m.parcelsToday}
            </Text>
            <Text variant="bodySmall" style={styles.gridLabel}>
              Parcels (24h)
            </Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text variant="headlineMedium" style={[styles.gridValue, { color: '#03A9F4' }]}>
              {m.ordersToday}
            </Text>
            <Text variant="bodySmall" style={styles.gridLabel}>
              Shop Orders (24h)
            </Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <Text variant="titleMedium" style={styles.summaryTitle}>
            Revenue (completed payments)
          </Text>
          <Text variant="headlineMedium" style={[styles.revenueValue, { color: theme.colors.success || '#4CAF50' }]}>
            {typeof m.revenue === 'number' ? `${m.revenue.toLocaleString()} ETB` : m.revenue}
          </Text>
        </Card>

        <Text variant="bodySmall" style={[styles.note, { color: theme.colors.text.secondary }]}>
          Metrics reflect RLS-visible rows only. Pull down to refresh.
        </Text>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  metricCard: { padding: 24, marginBottom: 16, alignItems: 'center', borderRadius: 18 },
  metricTitle: { marginBottom: 12, fontWeight: '500' },
  metricValue: { fontWeight: 'bold', marginBottom: 8 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCard: { flex: 1, padding: 18, alignItems: 'center', borderRadius: 16 },
  gridValue: { fontWeight: 'bold', marginBottom: 4 },
  gridLabel: { color: '#666', textAlign: 'center' },
  summaryCard: { padding: 20, borderRadius: 16 },
  summaryTitle: { fontWeight: '500', marginBottom: 10 },
  revenueValue: { fontWeight: 'bold' },
  note: { marginTop: 12, textAlign: 'center' },
});

export default Analytics;
