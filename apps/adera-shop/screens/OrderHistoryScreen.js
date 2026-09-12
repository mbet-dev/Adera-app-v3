import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import ReviewPromptBanner from '../components/ReviewPromptBanner';

const ORDER_STATUS_META = {
  pending: { label: 'Pending', icon: 'clock-outline', color: '#FF9800' },
  confirmed: { label: 'Confirmed', icon: 'check-outline', color: '#2196F3' },
  preparing: { label: 'Preparing', icon: 'pot-steam', color: '#7C4DFF' },
  ready: { label: 'Ready', icon: 'check-circle', color: '#4CAF50' },
  delivered: { label: 'Delivered', icon: 'check-all', color: '#2E7D32' },
  cancelled: { label: 'Cancelled', icon: 'close-circle', color: '#F44336' },
};

const formatCurrency = (amount) => `${Number(amount || 0).toFixed(2)} ETB`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const getMonthBucket = (date) => {
  const d = new Date(date);
  const bucket = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return { bucket, label, sortValue };
};

const OrderHistoryScreen = ({ navigation }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, subtotal, delivery_fee, tax_amount,
          discount_amount, total_amount, payment_method, payment_status,
          delivery_address, delivery_notes,
          created_at, updated_at, delivered_at,
          shops (id, name, logo_url),
          order_items (
            id, product_name, product_price, quantity, item_total
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        subtotal: Number(o.subtotal) || 0,
        deliveryFee: Number(o.delivery_fee) || 0,
        discount: Number(o.discount_amount) || 0,
        total: Number(o.total_amount) || 0,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        deliveryAddress: o.delivery_address,
        deliveryNotes: o.delivery_notes,
        shopName: o.shops?.name || 'Unknown Shop',
        shopLogo: o.shops?.logo_url || null,
        items: (o.order_items || []).map((oi) => ({
          name: oi.product_name,
          price: Number(oi.product_price),
          quantity: oi.quantity,
          total: Number(oi.item_total),
        })),
        itemCount: (o.order_items || []).reduce((s, oi) => s + oi.quantity, 0),
        createdAt: o.created_at,
        deliveredAt: o.delivered_at,
      }));

      setOrders(formatted);
    } catch (err) {
      console.error('[OrderHistory] Error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') return orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const filterConfig = useMemo(() => {
    const counts = {
      all: orders.length,
      active: orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
    return [
      { id: 'all', label: 'All', icon: 'receipt', count: counts.all, tint: theme.colors.primary },
      { id: 'active', label: 'Active', icon: 'progress-clock', count: counts.active, tint: '#FF9800' },
      { id: 'delivered', label: 'Delivered', icon: 'check-circle', count: counts.delivered, tint: '#4CAF50' },
      { id: 'cancelled', label: 'Cancelled', icon: 'close-circle', count: counts.cancelled, tint: '#F44336' },
    ];
  }, [orders, theme.colors.primary]);

  const sections = useMemo(() => {
    const map = new Map();
    filteredOrders.forEach((order) => {
      const bucket = getMonthBucket(order.createdAt);
      if (!map.has(bucket.bucket)) {
        map.set(bucket.bucket, { title: bucket.label, sortValue: bucket.sortValue, data: [] });
      }
      map.get(bucket.bucket).data.push(order);
    });
    return Array.from(map.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .map((s) => ({
        ...s,
        data: s.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      }));
  }, [filteredOrders]);

  const renderOrderCard = ({ item }) => {
    const statusMeta = ORDER_STATUS_META[item.status] || ORDER_STATUS_META.pending;

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={[styles.orderNumber, { color: theme.colors.text.primary }]}>{item.orderNumber}</Text>
            <Text style={[styles.orderDate, { color: theme.colors.text.secondary }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? `${statusMeta.color}22` : `${statusMeta.color}18` }]}>
            <MaterialCommunityIcons name={statusMeta.icon} size={14} color={statusMeta.color} />
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Shop */}
        <View style={styles.shopRow}>
          <View style={[styles.shopIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="storefront" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.shopInfo}>
            <Text style={[styles.shopName, { color: theme.colors.text.primary }]}>{item.shopName}</Text>
            <Text style={[styles.itemCountText, { color: theme.colors.text.secondary }]}>
              {item.itemCount} item{item.itemCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Items Preview */}
        <View style={[styles.itemsPreview, { borderTopColor: theme.colors.outlineVariant }]}>
          {item.items.slice(0, 3).map((oi, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                {oi.quantity}× {oi.name}
              </Text>
              <Text style={[styles.itemTotal, { color: theme.colors.text.secondary }]}>{formatCurrency(oi.total)}</Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={[styles.moreItems, { color: theme.colors.text.secondary }]}>
              +{item.items.length - 3} more item{item.items.length - 3 > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Total */}
        <View style={[styles.totalRow, { borderTopColor: theme.colors.outlineVariant }]}>
          <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{formatCurrency(item.total)}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.text.secondary }]}>{section.title}</Text>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="receipt" size={64} color={theme.colors.text.secondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {loading ? 'Loading orders…' : 'No orders yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {loading ? 'Fetching your order history' : 'Your completed orders will appear here.'}
      </Text>
      {!loading && (
        <TouchableOpacity
          style={[styles.browseBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.browseBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeaderComponent = () => (
    <View style={styles.listHeader}>
      {/* Review prompt for delivered orders */}
      <ReviewPromptBanner navigation={navigation} />
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterConfig.map((f) => {
          const isActive = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, { backgroundColor: isActive ? f.tint : theme.colors.surfaceVariant }]}
              onPress={() => setFilter(f.id)}
            >
              <MaterialCommunityIcons name={f.icon} size={16} color={isActive ? '#FFF' : f.tint} />
              <Text style={[styles.filterText, { color: isActive ? '#FFF' : theme.colors.text.primary }]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 80 },
  listHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  filterRow: { gap: 10 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderLeft: { flex: 1, gap: 2 },
  orderNumber: { fontSize: 16, fontWeight: '700' },
  orderDate: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1, gap: 2 },
  shopName: { fontSize: 14, fontWeight: '600' },
  itemCountText: { fontSize: 12 },
  itemsPreview: { borderTopWidth: 1, borderTopStyle: 'solid', paddingTop: 10, gap: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 13, flex: 1, marginRight: 8 },
  itemTotal: { fontSize: 13 },
  moreItems: { fontSize: 12, marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    paddingTop: 10,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40, paddingBottom: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  browseBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default OrderHistoryScreen;
