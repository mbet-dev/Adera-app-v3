import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import TextInput from '../TextInput';
import Button from '../Button';
import Card from '../Card';
import { useTheme } from '../ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const CATEGORIES = ['All', 'Food & Beverage', 'Fashion', 'Grocery', 'Electronics', 'Household', 'Crafts'];

export default function MarketDiscoveryScreen({ onLoginRequest, onBackToSelector }) {
    const theme = useTheme();
    const isDark = theme.isDark;
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchProducts(); }, [debouncedSearchQuery, selectedCategory]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('products')
                .select(`*, shops (name, location)`)
                .eq('is_available', true);

            if (selectedCategory !== 'All') query = query.eq('category', selectedCategory);
            if (debouncedSearchQuery) query = query.ilike('name', `%${debouncedSearchQuery}%`);
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (!error && data) {
                setProducts(data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    currency: 'ETB',
                    shop: item.shops?.name || 'Unknown Shop',
                    image: item.images?.length > 0 ? item.images[0] : 'https://placehold.co/400x400/cccccc/ffffff?text=No+Image',
                    category: item.category,
                    rating: 4.5,
                    reviewCount: 0,
                })));
            }
        } catch (e) {
            console.error('Error fetching products:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => { setRefreshing(true); fetchProducts(); };

    const handleAction = (action) => {
        Alert.alert('Login Required', `You need to log in to ${action}.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: onLoginRequest },
        ]);
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.colors.surfaceContainer }]}
            onPress={() => handleAction('view details')}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <TouchableOpacity style={[styles.wishlistButton, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}
                    onPress={() => handleAction('add to wishlist')}>
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
            <View style={styles.productInfo}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                    <Text style={[styles.categoryText, { color: theme.colors.onSurfaceVariant }]}>{item.category}</Text>
                </View>
                <Text style={[styles.productName, { color: theme.colors.onSurface }]} numberOfLines={2}>{item.name}</Text>
                <View style={styles.shopRow}>
                    <Ionicons name="storefront-outline" size={12} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.shopName, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>{item.shop}</Text>
                </View>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={[styles.ratingText, { color: theme.colors.onSurface }]}>{item.rating}</Text>
                    <Text style={[styles.reviewCount, { color: theme.colors.onSurfaceVariant }]}>({item.reviewCount})</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                        {item.price.toLocaleString()} {item.currency}
                    </Text>
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleAction('add to cart')}>
                        <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
                <View style={styles.headerLeft}>
                    {onBackToSelector && (
                        <TouchableOpacity onPress={onBackToSelector} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Discover</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>Best local products</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => handleAction('view wishlist')} style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={24} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAction('view cart')} style={styles.iconButton}>
                        <Ionicons name="cart-outline" size={24} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceContainer }]}>
                    <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} />
                    <TextInput placeholder="Search products..." value={searchQuery} onChangeText={setSearchQuery}
                        style={styles.searchInput} placeholderTextColor={theme.colors.onSurfaceVariant} />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity key={cat}
                            style={[styles.categoryChip,
                                selectedCategory === cat
                                    ? { backgroundColor: theme.colors.primary }
                                    : { backgroundColor: theme.colors.surfaceContainer, borderWidth: 1, borderColor: theme.colors.outlineVariant }
                            ]}
                            onPress={() => setSelectedCategory(cat)}>
                            <Text style={[styles.categoryChipText,
                                selectedCategory === cat ? { color: theme.colors.onPrimary } : { color: theme.colors.onSurface }
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Product Grid */}
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="basket-outline" size={64} color={theme.colors.onSurfaceVariant} />
                            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No products found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 15, borderBottomWidth: 1 },
    headerLeft: { width: 40 },
    backButton: { padding: 4 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 13, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 15 },
    iconButton: { padding: 4 },
    searchSection: { paddingHorizontal: 20, paddingVertical: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10 },
    searchInput: { flex: 1, marginLeft: 6, fontSize: 16, height: '100%' },
    categoriesContainer: { marginBottom: 8 },
    categoriesContent: { paddingHorizontal: 20, paddingVertical: 6, gap: 10 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    categoryChipText: { fontWeight: '600', fontSize: 14 },
    listContent: { padding: 16, paddingBottom: 32 },
    columnWrapper: { justifyContent: 'space-between' },
    productCard: { width: '48%', marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    imageContainer: { position: 'relative' },
    productImage: { width: '100%', height: 160, resizeMode: 'cover' },
    wishlistButton: { position: 'absolute', top: 10, right: 10, borderRadius: 20, padding: 6 },
    productInfo: { padding: 12 },
    categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
    categoryText: { fontSize: 10, fontWeight: '600' },
    productName: { fontSize: 15, fontWeight: '700', marginBottom: 4, height: 40 },
    shopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 4 },
    shopName: { fontSize: 12 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
    ratingText: { fontSize: 12, fontWeight: 'bold' },
    reviewCount: { fontSize: 12 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { fontSize: 16, fontWeight: '700' },
    addButton: { padding: 8, borderRadius: 12 },
    emptyText: { marginTop: 12, fontSize: 16 },
});
