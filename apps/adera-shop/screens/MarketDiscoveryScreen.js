import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { TextInput, Button, Card, useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';

const CATEGORIES = ['All', 'Food', 'Fashion', 'Crafts', 'Electronics', 'Household'];

export default function MarketDiscoveryScreen({ onLoginRequest }) {
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('products')
                .select(`
          *,
          shops (
            name
          )
        `);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                const formattedProducts = data.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: `${item.price} ETB`,
                    shop: item.shops?.name || 'Unknown Shop',
                    image: item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image',
                    category: item.category
                }));
                setProducts(formattedProducts);
            }
        } catch (e) {
            console.error('Exception fetching products:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.shop.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
        <Card style={styles.productCard} onPress={() => handleAction('view details')}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.shopName} numberOfLines={1}>{item.shop}</Text>
                <Text style={styles.productPrice}>{item.price}</Text>
                <Button
                    mode="contained"
                    compact
                    style={styles.addButton}
                    onPress={() => handleAction('add to cart')}
                >
                    Add
                </Button>
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Adera Shop</Text>
                <TouchableOpacity onPress={() => handleAction('view wishlist')}>
                    <Ionicons name="heart-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Search & Filter */}
            <View style={styles.searchContainer}>
                <TextInput
                    placeholder="Search products, shops..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    left={<TextInput.Icon name="magnify" />}
                    style={styles.searchInput}
                />
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.categoryChipSelected
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextSelected
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Product Grid */}
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>No products found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        height: 45,
    },
    categoriesContainer: {
        backgroundColor: '#fff',
        paddingBottom: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryChipSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    categoryText: {
        color: '#666',
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: '#2196f3',
    },
    listContent: {
        padding: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    shopName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },
    addButton: {
        marginTop: 4,
    },
});
