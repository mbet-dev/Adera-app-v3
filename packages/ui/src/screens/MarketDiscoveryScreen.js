import React, { useState, useEffect, useCallback } from 'react';
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
    Platform
} from 'react-native';
import TextInput from '../TextInput';
import Button from '../Button';
import Card from '../Card';
import { useTheme } from '../ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import { debounce } from 'lodash'; // You might need to add lodash or write a simple debounce

// Simple debounce implementation if lodash is not available
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const CATEGORIES = ['All', 'Food & Beverage', 'Fashion', 'Grocery', 'Electronics', 'Household', 'Crafts'];
const SORT_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
];

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 24;

export default function MarketDiscoveryScreen({ onLoginRequest, onBackToSelector }) {
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [debouncedSearchQuery, selectedCategory, sortBy]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('products')
                .select(`
          *,
          shops (
            name,
            location
          )
        `)
                .eq('is_available', true);

            if (selectedCategory !== 'All') {
                query = query.eq('category', selectedCategory);
            }

            if (debouncedSearchQuery) {
                query = query.ilike('name', `%${debouncedSearchQuery}%`);
            }

            if (sortBy === 'newest') {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === 'price_asc') {
                query = query.order('price', { ascending: true });
            } else if (sortBy === 'price_desc') {
                query = query.order('price', { ascending: false });
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                // Transform data
                const formattedProducts = data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    currency: 'ETB',
                    shop: item.shops?.name || 'Unknown Shop',
                    image: item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/cccccc/ffffff?text=No+Image',
                    category: item.category,
                    rating: 4.5, // Placeholder until reviews table is populated
                    reviewCount: 0
                }));
                setProducts(formattedProducts);
            }
        } catch (e) {
            console.error('Exception fetching products:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const handleAction = (action) => {
        Alert.alert(
            "Login Required",
            `You need to log in to ${action}.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log In", onPress: onLoginRequest }
            ]
        );
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleAction('view details')}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={() => handleAction('add to wishlist')}
                >
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.productInfo}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>

                <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
                    {item.name}
                </Text>

                <View style={styles.shopRow}>
                    <Ionicons name="storefront-outline" size={12} color={theme.colors.placeholder} />
                    <Text style={[styles.shopName, { color: theme.colors.placeholder }]} numberOfLines={1}>
                        {item.shop}
                    </Text>
                </View>

                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewCount}>({item.reviewCount})</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                        {item.price.toLocaleString()} {item.currency}
                    </Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleAction('add to cart')}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.headerLeft}>
                    {onBackToSelector && (
                        <TouchableOpacity
                            onPress={onBackToSelector}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Back to app selector"
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Discover</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
                        Best local products
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => handleAction('view wishlist')} style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAction('view cart')} style={styles.iconButton}>
                        <Ionicons name="cart-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search & Filter */}
            <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.background }]}>
                    <Ionicons name="search" size={20} color={theme.colors.placeholder} />
                    <TextInput
                        placeholder="Search products..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor={theme.colors.placeholder}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.placeholder} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && { backgroundColor: theme.colors.primary },
                                selectedCategory !== cat && { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === cat ? { color: '#fff' } : { color: theme.colors.text }
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
                            <Ionicons name="basket-outline" size={64} color={theme.colors.placeholder} />
                            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
                                No products found
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 15,
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        height: '100%',
    },
    categoriesContainer: {
        marginBottom: 10,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    categoryChipText: {
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 160,
        resizeMode: 'cover',
    },
    wishlistButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 6,
    },
    productInfo: {
        padding: 12,
    },
    categoryBadge: {
        backgroundColor: '#f0f0f0',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    categoryText: {
        fontSize: 10,
        color: '#666',
        fontWeight: '600',
    },
    productName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    shopName: {
        fontSize: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewCount: {
        fontSize: 12,
        color: '#999',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 8,
        borderRadius: 12,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    },
});
