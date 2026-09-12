import React, { useState, useEffect, useCallback } from 'react';import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import useCartStore from '../store/cartStore';
import NotificationBell from '../components/NotificationBell';

const CATEGORIES = ['All', 'Food', 'Fashion', 'Crafts', 'Electronics', 'Household'];

const MarketDiscoveryScreen = ({ navigation, onLoginRequest }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, original_price, category, images, stock_quantity,
          is_available, is_featured, shop_id,
          shops (name, is_verified)
        `)
        .eq('is_available', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
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
      console.error('Exception fetching products:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            {item.stock > 0 ? `In stock` : 'Out of stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
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
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
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

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
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
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1 },
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
});

export default MarketDiscoveryScreen;
