import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeArea, AppBar, Card, useTheme } from '@adera/ui';
import { useAppFlow } from '../../context/AppFlowContext';

/**
 * Services — curated catalogue of Adera services for customers.
 *
 * Every entry either navigates to a real screen or performs a real in-app
 * action (switching to the Shop app). Nothing here is a dead end: entries
 * that depend on future backend work are explicitly labelled "Coming soon".
 */
const Services = ({ navigation }) => {
  const theme = useTheme();
  const { openAppSelector } = useAppFlow();

  const services = [
    {
      id: 'wallet',
      icon: 'cash-multiple',
      title: 'Wallet & Payments',
      caption: 'Top up instantly via Chapa — cards & mobile money',
      tone: '#26A69A',
      status: 'Available',
      action: () => navigation?.navigate?.('wallet'),
    },
    {
      id: 'shop',
      icon: 'storefront-outline',
      title: 'Adera Shop',
      caption: 'Browse partner marketplaces with auto-delivery to your door',
      tone: '#7C4DFF',
      status: 'Available',
      action: openAppSelector,
    },
    {
      id: 'support',
      icon: 'headset',
      title: 'Concierge Support',
      caption: '24/7 multilingual chat & callback assistance',
      tone: '#EF5350',
      status: 'Available',
      action: () => navigation?.navigate?.('support'),
    },
    {
      id: 'track',
      icon: 'map-marker-path',
      title: 'Live Parcel Tracking',
      caption: 'Real-time status with push updates on every milestone',
      tone: '#03A9F4',
      status: 'Available',
      action: () => navigation?.navigate?.('track'),
    },
    {
      id: 'insurance',
      icon: 'shield-check-outline',
      title: 'Parcel Insurance',
      caption: 'Cover fragile & high-value parcels against damage or loss',
      tone: '#FF9800',
      status: 'Coming soon',
      action: () =>
        Alert.alert(
          'Parcel Insurance',
          'Full shipment coverage is coming soon. In the meantime, mark fragile parcels at checkout for extra-handling care.'
        ),
    },
    {
      id: 'business',
      icon: 'briefcase-outline',
      title: 'Business Accounts',
      caption: 'Volume pricing, invoicing and API access for companies',
      tone: '#546E7A',
      status: 'Coming soon',
      action: () =>
        Alert.alert(
          'Business Accounts',
          'Volume pricing and invoicing for businesses are on the way. Chat with concierge support to be early-access notified.'
        ),
    },
  ];

  const renderService = useCallback(
    (service) => {
      const isSoon = service.status === 'Coming soon';
      return (
        <TouchableOpacity
          key={service.id}
          activeOpacity={0.85}
          onPress={service.action}
          style={styles.cardTouch}
        >
          <Card style={styles.serviceCard} elevation={1}>
            <View style={[styles.serviceIcon, { backgroundColor: `${service.tone}22` }]}>
              <MaterialCommunityIcons name={service.icon} size={26} color={service.tone} />
            </View>
            <View style={styles.serviceMeta}>
              <View style={styles.serviceTitleRow}>
                <Text style={[styles.serviceTitle, { color: theme.colors.onSurface }]}>{service.title}</Text>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: isSoon ? theme.colors.surfaceVariant : '#E8F5E9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isSoon ? theme.colors.onSurfaceVariant : '#2E7D32' },
                    ]}
                  >
                    {service.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.serviceCaption, { color: theme.colors.onSurfaceVariant }]}>
                {service.caption}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </Card>
        </TouchableOpacity>
      );
    },
    [theme.colors]
  );

  return (
    <SafeArea edges={['top', 'bottom']}>
      <AppBar title="Services" onBack={() => navigation?.goBack?.()} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="grid" size={26} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>Explore Adera</Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Everything you can do with your account, all in one place
            </Text>
          </View>
        </View>

        {services.map(renderService)}

        <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
          More services are added regularly — check back soon.
        </Text>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700' },
  heroSubtitle: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  cardTouch: { borderRadius: 18 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18 },
  serviceIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  serviceMeta: { flex: 1, gap: 4 },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceTitle: { fontSize: 15, fontWeight: '700' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  serviceCaption: { fontSize: 13, lineHeight: 18 },
  footer: { fontSize: 13, textAlign: 'center', marginTop: 12 },
});

export default Services;
