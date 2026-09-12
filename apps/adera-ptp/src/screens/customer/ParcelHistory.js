import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import { SafeArea, Card, StatusBadge, TextInput, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STATUS_META = {
  in_transit_to_hub: {
    label: 'In Transit',
    icon: 'truck-fast',
    color: '#FF9800',
  },
  at_pickup_partner: {
    label: 'Ready for Pickup',
    icon: 'storefront',
    color: '#2196F3',
  },
  dispatched: {
    label: 'Dispatched',
    icon: 'map-marker-path',
    color: '#7C4DFF',
  },
  delivered: {
    label: 'Delivered',
    icon: 'check-circle',
    color: '#4CAF50',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'close-circle',
    color: '#F44336',
  },
};

const MOCK_HISTORY = [
  {
    id: '1',
    trackingId: 'ADE20250110-3',
    recipient: 'Beza Tesfaye',
    status: 'in_transit_to_hub',
    date: '2025-01-10',
    price: 150.0,
    pickupPartner: 'CMC Drop-off',
    destination: 'Bole, Addis Ababa',
  },
  {
    id: '2',
    trackingId: 'ADE20250108-6',
    recipient: 'Dawit Kebede',
    status: 'delivered',
    date: '2025-01-08',
    price: 120.0,
    pickupPartner: 'CMC Drop-off',
    destination: '22 Mazoria, Addis Ababa',
  },
  {
    id: '3',
    trackingId: 'ADE20250105-2',
    recipient: 'Selam Amare',
    status: 'delivered',
    date: '2025-01-05',
    price: 180.0,
    pickupPartner: 'Summit Hub',
    destination: 'Piassa, Addis Ababa',
  },
  {
    id: '4',
    trackingId: 'ADE20250103-1',
    recipient: 'Yonas Desta',
    status: 'cancelled',
    date: '2025-01-03',
    price: 100.0,
    pickupPartner: 'CMC Drop-off',
    destination: 'Debre Zeit',
  },
  {
    id: '5',
    trackingId: 'ADE20241228-5',
    recipient: 'Mahlet Girma',
    status: 'delivered',
    date: '2024-12-28',
    price: 200.0,
    pickupPartner: 'CMC Drop-off',
    destination: 'Gondar',
  },
  {
    id: '6',
    trackingId: 'ADE20241220-4',
    recipient: 'Henok Tadesse',
    status: 'at_pickup_partner',
    date: '2024-12-20',
    price: 130.0,
    pickupPartner: 'CMC Drop-off',
    destination: 'Hawassa',
  },
];

const formatCurrency = (amount) => `${amount.toFixed(2)} ETB`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const getMonthBucket = (date) => {
  const d = new Date(date);
  const bucket = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const label = d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return { bucket, label, sortValue };
};

const ParcelHistory = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [parcels, setParcels] = useState(MOCK_HISTORY);

  const summary = useMemo(() => {
    const total = parcels.length;
    const delivered = parcels.filter((p) => p.status === 'delivered').length;
    const cancelled = parcels.filter((p) => p.status === 'cancelled').length;
    const active = parcels.filter((p) => !['delivered', 'cancelled'].includes(p.status)).length;
    const totalSpent = parcels.reduce((sum, p) => sum + (p.price || 0), 0);
    const successRate = total ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, cancelled, active, totalSpent, successRate };
  }, [parcels]);

  const filterConfig = useMemo(
    () => [
      {
        id: 'all',
        label: 'All Parcels',
        icon: 'inbox-full',
        tint: theme.colors.primary,
        count: summary.total,
      },
      {
        id: 'active',
        label: 'Active',
        icon: 'progress-clock',
        tint: '#FF9800',
        count: summary.active,
      },
      {
        id: 'delivered',
        label: 'Delivered',
        icon: 'check-circle',
        tint: '#4CAF50',
        count: summary.delivered,
      },
      {
        id: 'cancelled',
        label: 'Cancelled',
        icon: 'close-circle',
        tint: '#F44336',
        count: summary.cancelled,
      },
    ],
    [summary, theme.colors.primary]
  );

  const filteredParcels = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return parcels.filter((parcel) => {
      if (filter !== 'all') {
        if (filter === 'active' && ['delivered', 'cancelled'].includes(parcel.status)) {
          return false;
        }
        if (filter !== 'active' && parcel.status !== filter) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        parcel.trackingId.toLowerCase().includes(normalizedSearch) ||
        parcel.recipient.toLowerCase().includes(normalizedSearch) ||
        parcel.destination.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filter, parcels, searchQuery]);

  const sections = useMemo(() => {
    const map = new Map();

    filteredParcels.forEach((parcel) => {
      const bucket = getMonthBucket(parcel.date);
      if (!map.has(bucket.bucket)) {
        map.set(bucket.bucket, {
          title: bucket.label,
          sortValue: bucket.sortValue,
          data: [],
        });
      }
      map.get(bucket.bucket).data.push(parcel);
    });

    return Array.from(map.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .map((section) => ({
        ...section,
        data: section.data.sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));
  }, [filteredParcels]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setParcels((prev) => [...prev]);
    setRefreshing(false);
  };

  const renderHero = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroCopy}>
        <Text style={[styles.heroEyebrow, { color: theme.colors.text.secondary }]}>Your deliveries at a glance</Text>
        <Text style={[styles.heroTitle, { color: theme.colors.text.primary }]}>Parcel history</Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.text.secondary }]}>Monitor every journey, spot delays early, and re-send confirmations with one tap.</Text>
      </View>
      <Card style={styles.heroInsightCard}>
        <Text style={[styles.heroMetricLabel, { color: theme.colors.text.secondary }]}>Success rate</Text>
        <Text style={[styles.heroMetricValue, { color: theme.colors.primary }]}>{summary.successRate}%</Text>
        <View style={styles.heroMetricDivider} />
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

  const renderStats = () => {
    const cards = [
      {
        label: 'Total spent',
        value: formatCurrency(summary.totalSpent),
        icon: 'currency-eth',
        color: theme.colors.primary,
      },
      {
        label: 'Deliveries',
        value: summary.total,
        icon: 'package-variant',
        color: '#009688',
      },
      {
        label: 'Cancelled',
        value: summary.cancelled,
        icon: 'close-octagon',
        color: '#F44336',
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        {cards.map((card) => (
          <Card key={card.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: card.color + '22' }]}>
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
    >
      {filterConfig.map((item) => {
        const isActive = filter === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? item.tint : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() => setFilter(item.id)}
          >
            <View style={styles.filterChipIconWrap}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={isActive ? '#FFF' : item.tint}
              />
            </View>
            <View style={styles.filterChipLabel}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isActive ? '#FFF' : theme.colors.text.primary },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.filterBadgeText,
                  { color: isActive ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary },
                ]}
              >
                {item.count} items
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderParcelCard = ({ item }) => {
    const status = STATUS_META[item.status] || STATUS_META.in_transit_to_hub;

    return (
      <Card style={styles.parcelCard}>
        <View style={styles.parcelHeader}>
          <View>
            <Text style={[styles.trackingLabel, { color: theme.colors.text.secondary }]}>Tracking ID</Text>
            <Text style={[styles.trackingValue, { color: theme.colors.text.primary }]}>{item.trackingId}</Text>
          </View>
          <StatusBadge
            status={item.status === 'delivered' ? 6 : item.status === 'cancelled' ? 0 : 2}
            variant="outlined"
            size="small"
          />
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
            <Text style={[styles.parcelText, { color: theme.colors.text.primary }]}>{item.destination}</Text>
          </View>
        </View>
        <View style={styles.parcelFooter}>
          <View style={styles.parcelStatus}>
            <View style={[styles.statusIconWrap, { backgroundColor: status.color + '22' }]}>
              <MaterialCommunityIcons name={status.icon} size={18} color={status.color} />
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: theme.colors.text.primary }]}>{status.label}</Text>
              <Text style={[styles.statusDate, { color: theme.colors.text.secondary }]}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={styles.parcelActions}>
            <TouchableOpacity style={styles.parcelActionBtn}>
              <MaterialCommunityIcons name="map-marker-path" size={16} color={theme.colors.primary} />
              <Text style={[styles.parcelActionText, { color: theme.colors.primary }]}>Track</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.parcelActionBtn}>
              <MaterialCommunityIcons name="share-variant" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.parcelActionText, { color: theme.colors.text.secondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>Charge</Text>
          <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>{formatCurrency(item.price)}</Text>
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
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No parcels match your filters</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Try adjusting the filter or searching another tracking code.</Text>
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
    <SafeArea edges={['top']}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 20,
  },
  heroContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroInsightCard: {
    width: 160,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroMetricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMetricValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  heroMetricDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 12,
  },
  heroMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetricItem: {
    alignItems: 'flex-start',
    gap: 4,
  },
  heroMetricMini: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    marginTop: 4,
  },
  statsRow: {
    gap: 12,
    paddingRight: 20,
  },
  statCard: {
    width: 150,
    padding: 16,
    gap: 10,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  filterChipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  filterChipLabel: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterBadgeText: {
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  parcelCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    gap: 14,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackingValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  parcelBody: {
    gap: 6,
  },
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parcelText: {
    fontSize: 14,
    flex: 1,
  },
  parcelFooter: {
    gap: 10,
  },
  parcelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 12,
  },
  parcelActions: {
    flexDirection: 'row',
    gap: 12,
  },
  parcelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  parcelActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ParcelHistory;
