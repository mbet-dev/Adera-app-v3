import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import useCartStore from '../store/cartStore';
import NotificationBell from '../components/NotificationBell';

const CATEGORIES = ['All', 'Food', 'Fashion', 'Crafts', 'Electronics', 'Household'];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest', icon: 'clock-outline' },
  { key: 'price_asc', label: 'Price ↑', icon: 'sort-ascending' },
  { key: 'price_desc', label: 'Price ↓', icon: 'sort-descending' },
  { key: 'featured', label: 'Featured', icon: 'star' },
  { key: 'name', label: 'A–Z', icon: 'alphabetical' },
];

const MarketDiscoveryScreen = ({ navigation, onLoginRequest }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);
  const requestIdRef = useRef(0);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  /**
   * Build and execute a Supabase query with optional FTS, category, and sort.
   *
   * When `searchTerm` is provided we use Supabase full-text search via `.textSearch()`
   * on a pre-built GIN index (`products_search`), falling back to ILIKE on the server
   * side when FTS is unavailable.
   */
  const fetchProducts = useCallback(async (searchTerm = '', category = 'All', sort = 'newest') => {
    const thisRequestId = ++requestIdRef.current;
    try {
      setLoading(true);

      let query = supabase
        .from('products')
        .select(`
          id, name, price, original_price, category, images, stock_quantity,
          is_available, is_featured, shop_id, created_at,
          shops (name, is_verified)
        `)
        .eq('is_available', true);

      // --- Full-text search via Supabase RPC or textSearch ---
      if (searchTerm && searchTerm.trim().length > 0) {
        const trimmed = searchTerm.trim();
        // Try the generated-column FTS approach first. If the column
        // `search_vector` exists and has a GIN index this will be fast.
        // Fall back to server-side ILIKE which still avoids transferring
        // every row to the client.
        try {
          query = query.textSearch('search_vector', trimmed, {
            type: 'websearch',
            config: 'english',
          });
        } catch {
          // FTS column may not exist yet — fall back to ILIKE
          query = query.or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
        }
      }

      // --- Category filter ---
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      // --- Sort ---
      switch (sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'featured':
          query = query
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      // Ignore stale responses — a newer request has already been dispatched
      if (thisRequestId !== requestIdRef.current) return;

      if (error) {
        console.error('[MarketDiscovery] Error fetching products:', error);
      } else {
        setProducts(
          (data || []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            originalPrice: item.original_price ? Number(item.original_price) : null,
            shop: item.shops?.name || 'Shop',
            shopVerified: item.shops?.is_verified || false,
            image: item.images?.[0] || 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image',
            category: item.category,
            shopId: item.shop_id,
            stock: item.stock_quantity,
            isFeatured: item.is_featured,
          })),
        );
      }
    } catch (e) {
      console.error('[MarketDiscovery] Exception fetching products:', e);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts('', 'All', 'newest');
  }, [fetchProducts]);

  // Re-fetch whenever category or sort changes
  useEffect(() => {
    fetchProducts(searchQuery, selectedCategory, sortBy);
  }, [selectedCategory, sortBy]);

  // Debounced search
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProducts(text, selectedCategory, sortBy);
    }, 400);
  }, [fetchProducts, selectedCategory, sortBy]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    fetchProducts('', selectedCategory, sortBy);
  }, [fetchProducts, selectedCategory, sortBy]);

  const renderProduct = ({ item }) => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}
        activeOpacity={0.85}
        onPress={() =>
          navigation?.navigate?.('productDetail', { productId: item.id, productName: item.name })
        }
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        {hasDiscount && (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>
              -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
            </Text>
          </View>
        )}
        {item.isFeatured && (
          <View style={[styles.featuredPill, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="star" size={12} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text.primary }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.shopName, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {item.shop}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              {item.price.toFixed(2)} ETB
            </Text>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: theme.colors.text.secondary }]}>
                {item.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          <Text style={[styles.stockText, { color: item.stock > 0 ? '#4CAF50' : '#F44336' }]}>
            {item.stock > 0 ? 'In stock' : 'Out of stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.text.secondary }}>Loading products…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Adera Shop</Text>
        <View style={styles.headerActions}>
          <NotificationBell size={22} color={theme.colors.text.primary} />
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate?.('cart')}>
            <MaterialCommunityIcons name="cart-outline" size={24} color={theme.colors.text.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {onLoginRequest && (
            <TouchableOpacity style={styles.headerBtn} onPress={onLoginRequest}>
              <MaterialCommunityIcons name="account-circle-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text.secondary} />
          <RNTextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search products, shops…"
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 4 }} />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={clearSearch}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={[styles.categoriesContainer, { backgroundColor: theme.colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: isActive ? theme.colors.primary : theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isActive ? theme.colors.onPrimary : theme.colors.text.primary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Bar */}
      <View style={[styles.sortContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: isActive ? theme.colors.primaryContainer : 'transparent',
                    borderColor: isActive ? theme.colors.primary : theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => setSortBy(opt.key)}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={14}
                  color={isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.sortChipText,
                    { color: isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.resultCount, { color: theme.colors.text.secondary }]}>
          {products.length} result{products.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={48} color={theme.colors.text.secondary} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No products found</Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Text style={[styles.clearSearchLink, { color: theme.colors.primary }]}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  categoriesContainer: { paddingBottom: 8 },
  categoriesScroll: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sortScroll: { flex: 1, gap: 8 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 12, fontWeight: '600' },
  resultCount: { fontSize: 11, marginLeft: 8 },
  listContent: { padding: 12 },
  columnWrapper: { justifyContent: 'space-between' },
  productCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: 120 },
  discountPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productInfo: { padding: 10, gap: 3 },
  productName: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  shopName: { fontSize: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '800' },
  originalPrice: { fontSize: 11, textDecorationLine: 'line-through' },
  stockText: { fontSize: 11, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 14 },
  clearSearchLink: { fontSize: 14, fontWeight: '600', marginTop: 4 },
});

export default MarketDiscoveryScreen;
