import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import WriteReviewModal from './WriteReviewModal';

/**
 * Shows a banner for delivered orders that haven't been reviewed yet.
 * Appears in the order history list between the header and order cards.
 */
const ReviewPromptBanner = ({ navigation }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [pendingReviewOrders, setPendingReviewOrders] = useState([]);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProductId, setReviewProductId] = useState(null);
  const [reviewProductName, setReviewProductName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPendingReviews = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get delivered orders from the last 30 days that have items
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, delivered_at,
          order_items ( id, product_id, product_name )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .gte('delivered_at', thirtyDaysAgo)
        .order('delivered_at', { ascending: false })
        .limit(10);

      if (error || !orders) return;

      // For each order, check if all products already have reviews
      const pendingOrders = [];
      for (const order of orders) {
        if (!order.order_items?.length) continue;

        const productIds = order.order_items.map((oi) => oi.product_id);

        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('product_id')
          .eq('user_id', user.id)
          .in('product_id', productIds);

        const reviewedIds = new Set((existingReviews || []).map((r) => r.product_id));
        const unreviewedItems = order.order_items.filter((oi) => !reviewedIds.has(oi.product_id));

        if (unreviewedItems.length > 0) {
          pendingOrders.push({
            id: order.id,
            orderNumber: order.order_number,
            deliveredAt: order.delivered_at,
            unreviewedItems: unreviewedItems.map((oi) => ({
              productId: oi.product_id,
              productName: oi.product_name,
            })),
          });
        }
      }

      setPendingReviewOrders(pendingOrders);
    } catch (err) {
      console.error('[ReviewPrompt] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  const handleReviewProduct = (productId, productName) => {
    setReviewProductId(productId);
    setReviewProductName(productName);
    setShowOrderPicker(false);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = async () => {
    setShowReviewModal(false);
    setReviewProductId(null);
    // Re-check which orders still need reviews
    await fetchPendingReviews();
  };

  const handleDismiss = () => {
    setPendingReviewOrders([]);
  };

  if (loading || pendingReviewOrders.length === 0) return null;

  return (
    <>
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: isDark ? '#1A237E22' : '#E8EAF6', borderColor: isDark ? '#5C6BC044' : '#C5CAE9' }]}>
        <View style={styles.bannerIconWrap}>
          <MaterialCommunityIcons name="star-circle" size={28} color="#5C6BC0" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: theme.colors.text.primary }]}>Rate your recent purchases</Text>
          <Text style={[styles.bannerSubtitle, { color: theme.colors.text.secondary }]}>
            {pendingReviewOrders.length} recent order{pendingReviewOrders.length !== 1 ? 's' : ''} waiting for your review
          </Text>
        </View>
        <TouchableOpacity style={styles.bannerAction} onPress={() => setShowOrderPicker(true)}>
          <Text style={styles.bannerActionText}>Review</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} style={styles.bannerDismiss}>
          <MaterialCommunityIcons name="close" size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Order Picker Modal */}
      <Modal visible={showOrderPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowOrderPicker(false)}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity onPress={() => setShowOrderPicker(false)} style={styles.pickerHeaderBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.pickerHeaderTitle, { color: theme.colors.text.primary }]}>Review Products</Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            data={pendingReviewOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.pickerList}
            renderItem={({ item: order }) => (
              <View style={[styles.orderGroup, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
                <View style={styles.orderGroupHeader}>
                  <Text style={[styles.orderGroupNumber, { color: theme.colors.text.primary }]}>{order.orderNumber}</Text>
                  <Text style={[styles.orderGroupDate, { color: theme.colors.text.secondary }]}>
                    {new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {order.unreviewedItems.map((item) => (
                  <TouchableOpacity
                    key={item.productId}
                    style={[styles.productReviewBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
                    onPress={() => handleReviewProduct(item.productId, item.productName)}
                  >
                    <View style={[styles.productIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                      <MaterialCommunityIcons name="package-variant" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.productReviewInfo}>
                      <Text style={[styles.productReviewName, { color: theme.colors.text.primary }]} numberOfLines={1}>{item.productName}</Text>
                      <Text style={[styles.productReviewHint, { color: theme.colors.text.secondary }]}>Tap to rate this product</Text>
                    </View>
                    <View style={styles.starsPreview}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons key={s} name="star-outline" size={14} color="#FFB300" />
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Write Review Modal */}
      {showReviewModal && reviewProductId && (
        <WriteReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={async (rating, comment) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return false;
              const { error } = await supabase.from('reviews').upsert(
                { user_id: user.id, product_id: reviewProductId, rating, comment: comment.trim() || null },
                { onConflict: 'user_id,product_id' },
              );
              if (error) throw error;
              handleReviewSubmitted();
              return true;
            } catch (err) {
              console.error('[ReviewPrompt] Submit error:', err);
              return false;
            }
          }}
          existingReview={null}
          submitting={false}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  bannerIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EAF6' },
  bannerContent: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12 },
  bannerAction: { backgroundColor: '#5C6BC0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  bannerActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bannerDismiss: { padding: 4 },
  // Picker modal
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerHeaderBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pickerHeaderTitle: { fontSize: 17, fontWeight: '700' },
  pickerList: { padding: 20, gap: 16 },
  orderGroup: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  orderGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderGroupNumber: { fontSize: 14, fontWeight: '700' },
  orderGroupDate: { fontSize: 12 },
  productReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  productIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productReviewInfo: { flex: 1, gap: 2 },
  productReviewName: { fontSize: 14, fontWeight: '600' },
  productReviewHint: { fontSize: 11 },
  starsPreview: { flexDirection: 'row', gap: 1 },
});

export default ReviewPromptBanner;
