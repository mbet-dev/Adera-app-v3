import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import useCartStore from '../store/cartStore';
import useReviews from '../hooks/useReviews';
import useOfflineCache from '../hooks/useOfflineCache';
import WriteReviewModal from '../components/WriteReviewModal';

const { width } = Dimensions.get('window');

const StarRating = ({ rating, size = 16, color = '#FFB300' }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <MaterialCommunityIcons key={s} name={s <= rating ? 'star' : 'star-outline'} size={size} color={color} />
    ))}
  </View>
);

const ProductDetailScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const { productId, productName } = route?.params || {};

  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const inCartCount = cartItems.find((i) => i.id === productId)?.quantity || 0;
  const { fetchProductWithCache } = useOfflineCache();

  const { reviews, summary: reviewSummary, userReview, submitting: reviewSubmitting, submitReview } = useReviews(productId);

  const fetchProduct = useCallback(async () => {
    if (!productId) { setLoading(false); return; }
    try {
      const { data, isFromCache } = await fetchProductWithCache(productId, async (id) => {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            shops (
              id, name, description, category, logo_url, address, phone,
              average_rating, total_reviews, is_verified
            )
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      });
      if (data) {
        setProduct(data);
        setShop(data?.shops || null);
      } else {
        Alert.alert('Error', 'Failed to load product details.');
      }
    } catch (err) {
      console.error('[ProductDetail] Error:', err);
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }, [productId, fetchProductWithCache]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id, name: product.name, price: product.price,
      images: product.images, shop_id: product.shop_id,
      shop_name: shop?.name, stock_quantity: product.stock_quantity,
    }, quantity);
    Alert.alert('Added to Cart', `${quantity}× ${product.name} added to your cart.`);
  };

  const handleBuyNow = () => { handleAddToCart(); navigation?.navigate?.('cart'); };

  const handleShare = async () => {
    if (!product) return;
    try { await Share.share({ message: `Check out "${product.name}" on Adera Shop for ${Number(product.price).toFixed(2)} ETB`, title: product.name }); } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.text.secondary }}>Loading product…</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="package-variant" size={48} color={theme.colors.text.secondary} />
        <Text style={{ marginTop: 12, color: theme.colors.text.primary, fontWeight: '600' }}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length ? product.images : ['https://placehold.co/600x400/cccccc/ffffff?text=No+Image'];
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: images[selectedImageIndex] }} style={[styles.mainImage, { backgroundColor: theme.colors.surfaceVariant }]} resizeMode="cover" />
          {images.length > 1 && (
            <View style={styles.thumbnailRow}>
              {images.slice(0, 5).map((uri, idx) => (
                <TouchableOpacity key={idx} onPress={() => setSelectedImageIndex(idx)}>
                  <Image source={{ uri }} style={[styles.thumbnail, { borderColor: selectedImageIndex === idx ? theme.colors.primary : theme.colors.outlineVariant, opacity: selectedImageIndex === idx ? 1 : 0.6 }]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price & Title */}
        <View style={styles.infoSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.primary }]}>{Number(product.price).toFixed(2)} ETB</Text>
            {hasDiscount && (
              <>
                <Text style={[styles.originalPrice, { color: theme.colors.text.secondary }]}>{Number(product.original_price).toFixed(2)} ETB</Text>
                <View style={[styles.discountBadge, { backgroundColor: isDark ? '#FF525233' : '#FFEBEE' }]}>
                  <Text style={[styles.discountText, { color: '#F44336' }]}>-{discountPercent}%</Text>
                </View>
              </>
            )}
          </View>
          <Text style={[styles.productName, { color: theme.colors.text.primary }]}>{product.name}</Text>
          {product.category && <Text style={[styles.category, { color: theme.colors.text.secondary }]}>{product.category}</Text>}

          {/* Product Rating Summary */}
          {reviewSummary.total > 0 && (
            <View style={styles.ratingSummary}>
              <MaterialCommunityIcons name="star" size={18} color="#FFB300" />
              <Text style={[styles.ratingValue, { color: theme.colors.text.primary }]}>{reviewSummary.average}</Text>
              <Text style={[styles.ratingCount, { color: theme.colors.text.secondary }]}>({reviewSummary.total} reviews)</Text>
            </View>
          )}

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <MaterialCommunityIcons name={product.stock_quantity > 0 ? 'check-circle' : 'close-circle'} size={16} color={product.stock_quantity > 0 ? '#4CAF50' : '#F44336'} />
            <Text style={{ color: product.stock_quantity > 0 ? '#4CAF50' : '#F44336', fontSize: 13, fontWeight: '600' }}>
              {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Description</Text>
              <Text style={[styles.description, { color: theme.colors.text.secondary }]}>{product.description}</Text>
            </View>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Shop Info */}
        {shop && (
          <TouchableOpacity
            style={[styles.shopCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}
            onPress={() => Alert.alert('Shop', 'Shop detail page coming soon')}
          >
            <View style={styles.shopHeader}>
              {shop.logo_url ? (
                <Image source={{ uri: shop.logo_url }} style={styles.shopLogo} />
              ) : (
                <View style={[styles.shopLogo, styles.shopLogoPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="storefront" size={24} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.shopMeta}>
                <View style={styles.shopNameRow}>
                  <Text style={[styles.shopName, { color: theme.colors.text.primary }]}>{shop.name}</Text>
                  {shop.is_verified && <MaterialCommunityIcons name="check-decagram" size={16} color={theme.colors.primary} />}
                </View>
                <Text style={[styles.shopCategory, { color: theme.colors.text.secondary }]}>{shop.category}</Text>
                {shop.average_rating > 0 && (
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#FFB300" />
                    <Text style={[styles.ratingText, { color: theme.colors.text.secondary }]}>
                      {Number(shop.average_rating).toFixed(1)} ({shop.total_reviews} reviews)
                    </Text>
                  </View>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
            </View>
            {shop.address && (
              <View style={styles.shopAddressRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={[styles.shopAddress, { color: theme.colors.text.secondary }]} numberOfLines={1}>{shop.address}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Customer Reviews</Text>
            <TouchableOpacity
              style={[styles.writeReviewBtn, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => setShowReviewModal(true)}
            >
              <MaterialCommunityIcons name={userReview ? 'pencil' : 'plus'} size={16} color={theme.colors.primary} />
              <Text style={[styles.writeReviewText, { color: theme.colors.primary }]}>
                {userReview ? 'Edit Review' : 'Write Review'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating Distribution */}
          {reviewSummary.total > 0 && (
            <View style={[styles.distributionCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
              <View style={styles.distLeft}>
                <Text style={[styles.distBigNumber, { color: theme.colors.text.primary }]}>{reviewSummary.average}</Text>
                <StarRating rating={Math.round(reviewSummary.average)} size={18} />
                <Text style={[styles.distTotal, { color: theme.colors.text.secondary }]}>{reviewSummary.total} reviews</Text>
              </View>
              <View style={styles.distBars}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewSummary.distribution[star - 1];
                  const pct = reviewSummary.total > 0 ? (count / reviewSummary.total) * 100 : 0;
                  return (
                    <View key={star} style={styles.distBarRow}>
                      <Text style={[styles.distBarLabel, { color: theme.colors.text.secondary }]}>{star}</Text>
                      <MaterialCommunityIcons name="star" size={12} color="#FFB300" />
                      <View style={[styles.distBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: '#FFB300' }]} />
                      </View>
                      <Text style={[styles.distBarCount, { color: theme.colors.text.secondary }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Individual Reviews */}
          {reviews.length === 0 && !loading ? (
            <View style={[styles.noReviews, { backgroundColor: theme.colors.surfaceContainer }]}>
              <MaterialCommunityIcons name="comment-outline" size={36} color={theme.colors.text.secondary} />
              <Text style={[styles.noReviewsText, { color: theme.colors.text.secondary }]}>No reviews yet. Be the first!</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { borderBottomColor: theme.colors.outlineVariant }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.reviewAvatarText, { color: theme.colors.primary }]}>
                      {review.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={[styles.reviewName, { color: theme.colors.text.primary }]}>{review.userName}</Text>
                    <Text style={[styles.reviewDate, { color: theme.colors.text.secondary }]}>
                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <StarRating rating={review.rating} size={14} />
                {review.comment && (
                  <Text style={[styles.reviewComment, { color: theme.colors.text.secondary }]}>{review.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="minus" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.colors.text.primary }]}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={[styles.qtyBtn, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={[styles.cartBtn, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} onPress={handleAddToCart}>
            <MaterialCommunityIcons name="cart-plus" size={20} color={theme.colors.text.primary} />
            {inCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{inCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: theme.colors.primary, opacity: product.stock_quantity > 0 ? 1 : 0.5 }]}
            onPress={handleBuyNow}
            disabled={product.stock_quantity <= 0}
          >
            <Text style={styles.buyBtnText}>Buy Now · {(Number(product.price) * quantity).toFixed(2)} ETB</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={submitReview}
        existingReview={userReview}
        submitting={reviewSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  scrollContent: { paddingBottom: 120 },
  imageContainer: { backgroundColor: '#fff' },
  mainImage: { width: '100%', height: width * 0.8 },
  thumbnailRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  thumbnail: { width: 56, height: 56, borderRadius: 10, borderWidth: 2 },
  infoSection: { paddingHorizontal: 20, gap: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  price: { fontSize: 28, fontWeight: '800' },
  originalPrice: { fontSize: 16, textDecorationLine: 'line-through' },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  discountText: { fontSize: 13, fontWeight: '700' },
  productName: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  category: { fontSize: 14, marginTop: 2 },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  ratingValue: { fontSize: 15, fontWeight: '700' },
  ratingCount: { fontSize: 13 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  descSection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '500' },
  shopCard: { marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  shopHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopLogo: { width: 48, height: 48, borderRadius: 12 },
  shopLogoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  shopMeta: { flex: 1, gap: 2 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { fontSize: 15, fontWeight: '700' },
  shopCategory: { fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12 },
  shopAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  shopAddress: { fontSize: 12, flex: 1 },
  // Reviews
  reviewsSection: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  writeReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  writeReviewText: { fontSize: 13, fontWeight: '700' },
  distributionCard: { flexDirection: 'row', padding: 16, borderRadius: 14, borderWidth: 1, gap: 20 },
  distLeft: { alignItems: 'center', gap: 4, minWidth: 80 },
  distBigNumber: { fontSize: 36, fontWeight: '800' },
  distTotal: { fontSize: 12 },
  distBars: { flex: 1, gap: 6, justifyContent: 'center' },
  distBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distBarLabel: { fontSize: 12, width: 12, textAlign: 'right' },
  distBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 4 },
  distBarCount: { fontSize: 11, width: 20 },
  noReviews: { alignItems: 'center', padding: 32, borderRadius: 14, gap: 8 },
  noReviewsText: { fontSize: 14 },
  reviewCard: { paddingVertical: 14, borderBottomWidth: 1, gap: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 16, fontWeight: '700' },
  reviewMeta: { flex: 1 },
  reviewName: { fontSize: 14, fontWeight: '700' },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: 14, lineHeight: 20 },
  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 34, borderTopWidth: 1, gap: 16 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  bottomActions: { flex: 1, flexDirection: 'row', gap: 10 },
  cartBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F44336', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  buyBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ProductDetailScreen;
