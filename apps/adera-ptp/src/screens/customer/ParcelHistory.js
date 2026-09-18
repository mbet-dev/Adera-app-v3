import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  Share,
  Alert,
} from 'react-native';
import { SafeArea, Card, StatusBadge, TextInput, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useParcelHistory from '../../hooks/useParcelHistory';

const STATUS_META = {
  0: { label: 'Created', icon: 'package-variant', color: '#9E9E9E' },
  1: { label: 'At Drop-off', icon: 'storefront-outline', color: '#4CAF50' },
  2: { label: 'In Transit', icon: 'truck-fast', color: '#FF9800' },
  3: { label: 'At Hub', icon: 'warehouse', color: '#7C4DFF' },
  4: { label: 'Dispatched', icon: 'map-marker-path', color: '#2196F3' },
  5: { label: 'At Pickup', icon: 'map-marker-check', color: '#1565C0' },
  6: { label: 'Delivered', icon: 'check-circle', color: '#4CAF50' },
  '-1': { label: 'Cancelled', icon: 'close-circle', color: '#F44336' },
  '-2': { label: 'Expired', icon: 'clock-alert', color: '#F44336' },
};

const getMonthBucket = (date) => {
  const d = new Date(date);
  const bucket = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return { bucket, label, sortValue };
};

const formatCurrency = (amount) => `${Number(amount || 0).toFixed(2)} ETB`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const ParcelHistory = ({ navigation }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { parcels, summary, loading, refreshing, refresh } = useParcelHistory({ filter, searchQuery });

  const filterConfig = useMemo(
    () => [
      { id: 'all', label: 'All Parcels', icon: 'inbox-full', tint: theme.colors.primary, count: summary.total },
      { id: 'active', label: 'Active', icon: 'progress-clock', tint: '#FF9800', count: summary.active },
      { id: 'delivered', label: 'Delivered', icon: 'check-circle', tint: '#4CAF50', count: summary.delivered },
      { id: 'cancelled', label: 'Cancelled', icon: 'close-circle', tint: '#F44336', count: summary.cancelled },
    ],
    [summary, theme.colors.primary],
  );

  const sections = useMemo(() => {
    const map = new Map();
    parcels.forEach((parcel) => {
      const bucket = getMonthBucket(parcel.date);
      if (!map.has(bucket.bucket)) {
        map.set(bucket.bucket, { title: bucket.label, sortValue: bucket.sortValue, data: [] });
      }
      map.get(bucket.bucket).data.push(parcel);
    });
    return Array.from(map.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .map((section) => ({
        ...section,
        data: section.data.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));
  }, [parcels]);

  const handleShare = useCallback(async (parcel) => {
    try {
      await Share.share({
        message: `Track my Adera parcel: ${parcel.trackingId}\nStatus: ${STATUS_META[parcel.status]?.label || 'Unknown'}`,
        title: 'Share Tracking',
      });
    } catch {}
  }, []);

  const handleTrack = useCallback(
    (parcel) => {
      navigation?.navigate?.('track', { trackingId: parcel.trackingId });
    },
    [navigation],
  );

  const renderHero = () => {
    const successRate = summary.total > 0 ? Math.round((summary.delivered / summary.total) * 100) : 0;
    return (
      <View style={styles.heroContainer}>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: theme.colors.text.secondary }]}>Your deliveries at a glance</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.text.primary }]}>Parcel history</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.text.secondary }]}>
            Monitor every journey, spot delays early, and re-send confirmations with one tap.
          </Text>
        </View>
        <Card style={styles.heroInsightCard}>
          <Text style={[styles.heroMetricLabel, { color: theme.colors.text.secondary }]}>Success rate</Text>
          <Text style={[styles.heroMetricValue, { color: theme.colors.primary }]}>{successRate}%</Text>
          <View style={[styles.heroMetricDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.heroMetricRow}>
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.text.secondary }]}>Active</Text>
              <Text style={[styles.heroMetricMini, { color: theme.colors.text.primary }]}>{summary.active}</Text>
            </View>
            <View style={styles.heroMetricItem}>
              <Text style={[styles.heroMetricLabel, { color: theme.colors.text.secondary }]}>Delivered</Text>
              <Text style={[styles.heroMetricMini, { color: theme.colors.text.primary }]}>{summary.delivered}</Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderStats = () => {
    const cards = [
      { label: 'Total spent', value: formatCurrency(summary.totalSpent), icon: 'cash', color: theme.colors.primary },
      { label: 'Deliveries', value: summary.total, icon: 'package-variant', color: '#009688' },
      { label: 'Cancelled', value: summary.cancelled, icon: 'close-octagon', color: '#F44336' },
    ];
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {cards.map((card) => (
          <Card key={card.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? `${card.color}22` : `${card.color}15` }]}>
              <MaterialCommunityIcons name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{card.value}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{card.label}</Text>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderFilterChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
      {filterConfig.map((item) => {
        const isActive = filter === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, { backgroundColor: isActive ? item.tint : theme.colors.surfaceVariant }]}
            onPress={() => setFilter(item.id)}
          >
            <View style={styles.filterChipIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={18} color={isActive ? '#FFF' : item.tint} />
            </View>
            <View style={styles.filterChipLabel}>
              <Text style={[styles.filterLabel, { color: isActive ? '#FFF' : theme.colors.text.primary }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.filterBadgeText, { color: isActive ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary }]}>
                {item.count} items
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderParcelCard = ({ item }) => {
    const status = STATUS_META[item.status] || STATUS_META[0];
    const isCompleted = item.status === 6;
    const isCancelled = item.status < 0;

    return (
      <Card style={styles.parcelCard}>
        <View style={styles.parcelHeader}>
          <View>
            <Text style={[styles.trackingLabel, { color: theme.colors.text.secondary }]}>Tracking ID</Text>
            <Text style={[styles.trackingValue, { color: theme.colors.text.primary }]}>{item.trackingId}</Text>
          </View>
          <StatusBadge status={item.status} variant="outlined" size="small" />
        </View>

        <View style={styles.parcelBody}>
          <View style={styles.parcelRow}>
            <MaterialCommunityIcons name="account" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.parcelText, { color: theme.colors.text.primary }]}>Recipient · {item.recipient}</Text>
          </View>
          <View style={styles.parcelRow}>
            <MaterialCommunityIcons name="storefront" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.parcelText, { color: theme.colors.text.primary }]}>Pickup · {item.pickupPartner}</Text>
          </View>
          <View style={styles.parcelRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.parcelText, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        </View>

        <View style={styles.parcelFooter}>
          <View style={styles.parcelStatus}>
            <View style={[styles.statusIconWrap, { backgroundColor: isDark ? `${status.color}22` : `${status.color}15` }]}>
              <MaterialCommunityIcons name={status.icon} size={18} color={status.color} />
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: theme.colors.text.primary }]}>{status.label}</Text>
              <Text style={[styles.statusDate, { color: theme.colors.text.secondary }]}>{formatDate(item.date)}</Text>
            </View>
          </View>

          <View style={styles.parcelActions}>
            {!isCancelled && (
              <TouchableOpacity style={styles.parcelActionBtn} onPress={() => handleTrack(item)}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color={theme.colors.primary} />
                <Text style={[styles.parcelActionText, { color: theme.colors.primary }]}>Track</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.parcelActionBtn} onPress={() => handleShare(item)}>
              <MaterialCommunityIcons name="share-variant" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.parcelActionText, { color: theme.colors.text.secondary }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.amountRow, { borderTopColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>Charge</Text>
            <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>{formatCurrency(item.price)}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>{section.title}</Text>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="package-variant-closed" size={72} color={theme.colors.text.secondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {loading ? 'Loading parcels…' : 'No parcels match your filters'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {loading ? 'Fetching your delivery history' : 'Try adjusting the filter or searching another tracking code.'}
      </Text>
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.listHeader}>
      {renderHero()}
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by tracking ID, recipient, or destination"
        leftIcon="magnify"
        autoCapitalize="characters"
        style={styles.searchInput}
      />
      {renderStats()}
      {renderFilterChips()}
    </View>
  );

  return (
    <SafeArea edges={['top', 'bottom']} withBottomNav={true}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderParcelCard}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 16 },
  listHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 20 },
  heroContainer: { flexDirection: 'row', gap: 16 },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { fontSize: 13, letterSpacing: 0.2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 28, fontWeight: '700' },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  heroInsightCard: { width: 160, padding: 16, justifyContent: 'space-between' },
  heroMetricLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetricValue: { fontSize: 32, fontWeight: '700' },
  heroMetricDivider: { height: 1, marginVertical: 12 },
  heroMetricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroMetricItem: { alignItems: 'flex-start', gap: 4 },
  heroMetricMini: { fontSize: 18, fontWeight: '600' },
  searchInput: { marginTop: 8 },
  statsRow: { gap: 12, paddingRight: 20 },
  statCard: { width: 150, padding: 16, gap: 10 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  filterContent: { flexDirection: 'row', gap: 12, paddingRight: 20 },
  filterChip: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  filterChipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  filterChipLabel: { flex: 1 },
  filterLabel: { fontSize: 15, fontWeight: '600' },
  filterBadgeText: { fontSize: 12 },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  parcelCard: { marginHorizontal: 20, marginBottom: 12, padding: 16, gap: 14 },
  parcelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackingLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  trackingValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  parcelBody: { gap: 6 },
  parcelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parcelText: { fontSize: 14, flex: 1 },
  parcelFooter: { gap: 10 },
  parcelStatus: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 15, fontWeight: '600' },
  statusDate: { fontSize: 12 },
  parcelActions: { flexDirection: 'row', gap: 12 },
  parcelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  parcelActionText: { fontSize: 13, fontWeight: '600' },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  amountLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  amountValue: { fontSize: 20, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 48, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});

export default ParcelHistory;
