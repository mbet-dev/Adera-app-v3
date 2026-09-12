import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';
import useCartStore from '../store/cartStore';
import AddressPicker from '../components/AddressPicker';

const DELIVERY_FEE = 150;

const ShoppingCartScreen = ({ navigation }) => {
  const theme = useTheme();
  const isDark = theme.isDark;

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);

  const [placing, setPlacing] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  const subtotal = useMemo(() => getTotalAmount(), [items, getTotalAmount]);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  const handleAddressSelect = (addr) => {
    setDeliveryAddress(addr);
  };

  const handlePlaceOrder = useCallback(async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first.');
      return;
    }

    if (!deliveryAddress) {
      setShowAddressPicker(true);
      return;
    }

    try {
      setPlacing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to place an order.');
        return;
      }

      // Group items by shop
      const shopGroups = {};
      items.forEach((item) => {
        if (!shopGroups[item.shopId]) shopGroups[item.shopId] = [];
        shopGroups[item.shopId].push(item);
      });

      const shopIds = Object.keys(shopGroups);
      let ordersCreated = 0;

      for (const shopId of shopIds) {
        const shopItems = shopGroups[shopId];
        const shopSubtotal = shopItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Build delivery location point
        let locationPoint = 'POINT(38.7578 8.9806)';
        if (deliveryAddress.longitude && deliveryAddress.latitude) {
          locationPoint = `POINT(${deliveryAddress.longitude} ${deliveryAddress.latitude})`;
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            customer_id: user.id,
            shop_id: shopId,
            delivery_address: deliveryAddress.fullAddress || 'Delivery address',
            delivery_location: locationPoint,
            delivery_phone: deliveryAddress.phone || null,
            delivery_notes: deliveryAddress.notes || null,
            subtotal: shopSubtotal,
            delivery_fee: DELIVERY_FEE / shopIds.length,
            total_amount: shopSubtotal + DELIVERY_FEE / shopIds.length,
            payment_method: 'cod',
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = shopItems.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
          item_total: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        ordersCreated++;
      }

      clearCart();
      Alert.alert(
        'Order Placed!',
        `${ordersCreated} order${ordersCreated > 1 ? 's' : ''} placed successfully.\n\nDelivering to: ${deliveryAddress.label}`,
        [{ text: 'View Orders', onPress: () => navigation?.navigate?.('orderHistory') }],
      );
    } catch (err) {
      console.error('[Cart] Order error:', err);
      Alert.alert('Order Failed', 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [items, clearCart, navigation, deliveryAddress]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cart-outline" size={80} color={theme.colors.text.secondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Your cart is empty</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Browse the marketplace and add items you like.</Text>
      <TouchableOpacity style={[styles.browseBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation?.goBack?.()}>
        <Text style={styles.browseBtnText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = (item) => (
    <View key={item.id} style={[styles.cartItem, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Image source={{ uri: item.image || 'https://placehold.co/100x100/cccccc/ffffff?text=No+Image' }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: theme.colors.text.primary }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemShop, { color: theme.colors.text.secondary }]}>{item.shopName}</Text>
        <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>{Number(item.price).toFixed(2)} ETB</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="minus" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.colors.text.primary }]}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={[styles.qtyBtn, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
            <MaterialCommunityIcons name="delete-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.lineTotal, { color: theme.colors.text.primary }]}>{(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Shopping Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])}>
            <Text style={{ color: '#F44336', fontWeight: '600', fontSize: 14 }}>Clear</Text>
          </TouchableOpacity>
        )}
        {items.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.itemCount, { color: theme.colors.text.secondary }]}>
              {items.reduce((s, i) => s + i.quantity, 0)} items in cart
            </Text>
            {items.map(renderCartItem)}

            {/* Delivery Address Section */}
            <View style={[styles.addressSection, { borderTopColor: theme.colors.outlineVariant }]}>
              <View style={styles.addressHeader}>
                <View style={styles.addressHeaderLeft}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
                  <Text style={[styles.addressTitle, { color: theme.colors.text.primary }]}>Delivery Address</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddressPicker(true)}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>
                    {deliveryAddress ? 'Change' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>
              {deliveryAddress ? (
                <View style={[styles.selectedAddress, { backgroundColor: theme.colors.primaryContainer }]}>
                  <View style={[styles.addrIcon, { backgroundColor: theme.colors.primary }]}>
                    <MaterialCommunityIcons
                      name={deliveryAddress.label === 'Work' ? 'briefcase' : deliveryAddress.label === 'Other' ? 'map-marker' : 'home'}
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.addrInfo}>
                    <Text style={[styles.addrLabel, { color: theme.colors.primary }]}>{deliveryAddress.label}</Text>
                    <Text style={[styles.addrFull, { color: theme.colors.text.primary }]} numberOfLines={2}>
                      {deliveryAddress.fullAddress}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addAddressBtn, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant, borderWidth: 2, borderStyle: 'dashed' }]}
                  onPress={() => setShowAddressPicker(true)}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={24} color={theme.colors.primary} />
                  <Text style={[styles.addAddressText, { color: theme.colors.primary }]}>Add delivery address</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Order Summary Footer */}
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{subtotal.toFixed(2)} ETB</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{DELIVERY_FEE.toFixed(2)} ETB</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{total.toFixed(2)} ETB</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: theme.colors.primary, opacity: placing ? 0.6 : 1 }]}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutBtnText}>
                  {deliveryAddress ? `Place Order · ${total.toFixed(2)} ETB` : 'Select Address & Order'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Address Picker Modal */}
      <AddressPicker
        visible={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        onSelect={handleAddressSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 280 },
  itemCount: { fontSize: 13, marginBottom: 16 },
  cartItem: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  itemDetails: { flex: 1, gap: 4 },
  itemName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  itemShop: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto' },
  lineTotal: { fontSize: 16, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  // Address section
  addressSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addressHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressTitle: { fontSize: 16, fontWeight: '700' },
  selectedAddress: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, alignItems: 'center' },
  addrIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addrInfo: { flex: 1, gap: 2 },
  addrLabel: { fontSize: 13, fontWeight: '700' },
  addrFull: { fontSize: 13, lineHeight: 18 },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderRadius: 14 },
  addAddressText: { fontSize: 14, fontWeight: '700' },
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, borderTopWidth: 1, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800' },
  checkoutBtn: { marginTop: 12, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  browseBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ShoppingCartScreen;
