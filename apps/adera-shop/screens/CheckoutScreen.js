import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, useTheme, LoadingScreen } from '@adera/ui';
import { LocationPicker } from '@adera/maps';
import { supabase } from '@adera/auth/src/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen({ cartItems = [], totalAmount = 0, onCheckoutComplete, onCancel }) {
    const theme = useTheme();
    const isDark = theme.isDark;
    const [loading, setLoading] = useState(false);

    const [deliveryMethod, setDeliveryMethod] = useState('standard');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [deliveryAddress, setDeliveryAddress] = useState('');

    const DELIVERY_FEE_STANDARD = 150;
    const DELIVERY_FEE_PTP = 250;

    const currentDeliveryFee = deliveryMethod === 'ptp' ? DELIVERY_FEE_PTP : DELIVERY_FEE_STANDARD;
    const finalTotal = totalAmount + currentDeliveryFee;

    const handlePlaceOrder = async () => {
        if (!recipientName || !recipientPhone || !deliveryLocation) {
            Alert.alert('Missing Information', 'Please fill in all recipient details and select a location.');
            return;
        }
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in to place an order.');
                return;
            }
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: user.id,
                    shop_id: cartItems[0]?.shop_id,
                    delivery_address: deliveryAddress || 'Selected Location',
                    delivery_location: `POINT(${deliveryLocation.longitude} ${deliveryLocation.latitude})`,
                    delivery_phone: recipientPhone,
                    subtotal: totalAmount,
                    delivery_fee: currentDeliveryFee,
                    total_amount: finalTotal,
                    payment_method: 'cod',
                    status: 'pending',
                    auto_create_parcel: deliveryMethod === 'ptp',
                })
                .select()
                .single();
            if (orderError) throw orderError;

            if (deliveryMethod === 'ptp') {
                const { error: parcelError } = await supabase
                    .from('parcels')
                    .insert({
                        tracking_id: `TRK-${Date.now()}`,
                        sender_id: user.id,
                        recipient_name: recipientName,
                        recipient_phone: recipientPhone,
                        pickup_location: `POINT(${deliveryLocation.longitude} ${deliveryLocation.latitude})`,
                        pickup_address: 'Shop Location',
                        delivery_location: `POINT(${deliveryLocation.longitude} ${deliveryLocation.latitude})`,
                        delivery_address: deliveryAddress || 'Home',
                        delivery_fee: currentDeliveryFee,
                        total_amount: finalTotal,
                        payment_method: 'cod',
                        status: 0,
                    });
                if (parcelError) throw parcelError;
            }
            Alert.alert('Success', 'Order placed successfully!', [{ text: 'OK', onPress: onCheckoutComplete }]);
        } catch (error) {
            console.error('Checkout Error:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen message="Processing Order..." />;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>Checkout</Text>

                {/* Delivery Method */}
                <Card style={styles.section} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Delivery Method</Text>
                    <View style={styles.row}>
                        <Text style={{ color: theme.colors.onSurface }}>Standard Delivery</Text>
                        <Switch
                            value={deliveryMethod === 'ptp'}
                            onValueChange={(val) => setDeliveryMethod(val ? 'ptp' : 'standard')}
                            trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
                            thumbColor={theme.colors.white}
                        />
                        <Text style={{ color: theme.colors.onSurface }}>Adera-PTP (Express)</Text>
                    </View>
                    {deliveryMethod === 'ptp' && (
                        <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
                            Powered by Adera Peer-to-Peer Logistics. Fast and trackable.
                        </Text>
                    )}
                </Card>

                {/* Recipient Details */}
                <Card style={styles.section} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recipient Details</Text>
                    <TextInput label="Full Name" value={recipientName} onChangeText={setRecipientName} style={styles.input} />
                    <TextInput label="Phone Number" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" style={styles.input} />
                </Card>

                {/* Location */}
                <Card style={styles.section} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Delivery Location</Text>
                    <View style={[styles.mapContainer, { borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surfaceContainer }]}>
                        <LocationPicker
                            onLocationSelect={(loc) => { setDeliveryLocation(loc); setDeliveryAddress('Pinned Location'); }}
                            initialRegion={{ latitude: 9.005401, longitude: 38.763611, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
                        />
                    </View>
                    {deliveryLocation && (
                        <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>
                            Selected: {deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)}
                        </Text>
                    )}
                </Card>

                {/* Order Summary */}
                <Card style={styles.section} elevation={1}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.colors.onSurface }}>Subtotal</Text>
                        <Text style={{ color: theme.colors.onSurface }}>{totalAmount.toFixed(2)} ETB</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.colors.onSurface }}>Delivery Fee</Text>
                        <Text style={{ color: theme.colors.onSurface }}>{currentDeliveryFee.toFixed(2)} ETB</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, paddingTop: 10 }]}>
                        <Text style={[styles.totalText, { color: theme.colors.onSurface }]}>Total</Text>
                        <Text style={[styles.totalText, { color: theme.colors.primary }]}>{finalTotal.toFixed(2)} ETB</Text>
                    </View>
                </Card>

                <Button title="Place Order" onPress={handlePlaceOrder} style={styles.submitButton} size="lg" />
                <Button title="Cancel" variant="ghost" onPress={onCancel} style={styles.cancelButton} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
    section: { marginBottom: 16, padding: 16, borderRadius: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    hint: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    input: { marginBottom: 12 },
    mapContainer: { height: 200, overflow: 'hidden', marginBottom: 8 },
    locationText: { fontSize: 12, marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalText: { fontWeight: 'bold', fontSize: 18 },
    submitButton: { marginTop: 20 },
    cancelButton: { marginTop: 8, marginBottom: 32 },
});
