import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, FAB, Chip, Surface, Divider, ProgressBar } from 'react-native-paper';
import { SafeArea, Card, useTheme, StatusBadge } from '@adera/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@adera/auth';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CustomerDashboard = () => {
  const theme = useTheme();
  const { signOut, userProfile } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance] = useState(1250.5);

  const quickActions = useMemo(() => ([
    {
      id: 'send',
      title: 'Send Parcel',
      icon: 'package-variant',
      color: theme.colors.primary,
      bg: theme.colors.primaryContainer,
      action: () => navigation?.navigate?.('create'),
    },
    {
      id: 'track',
      title: 'Track Parcel',
      icon: 'map-marker-path',
      color: theme.colors.secondary,
      bg: theme.colors.secondaryContainer,
      action: () => navigation?.navigate?.('track'),
    },
    {
      id: 'history',
      title: 'History',
      icon: 'history',
      color: theme.colors.tertiary,
      bg: theme.colors.tertiaryContainer,
      action: () => navigation?.navigate?.('history'),
    },
    {
      id: 'wallet',
      title: 'Top Up',
      icon: 'wallet-plus',
      color: '#00BCD4',
      bg: '#E0F7FA',
      action: () => navigation?.navigate?.('wallet'),
    },
    {
      id: 'logout',
      title: 'Sign Out',
      icon: 'logout',
      color: '#E53935',
      bg: '#FFEBEE',
      action: () => signOut(navigation),
    },
  ]), [navigation, signOut, theme.colors]);

  const parcelSummary = useMemo(() => ([
    { id: 'active', label: 'Active', value: '2', tone: '#FF9800', icon: 'progress-clock' },
    { id: 'delivered', label: 'Delivered', value: '12', tone: '#4CAF50', icon: 'check-circle' },
    { id: 'scheduled', label: 'Scheduled', value: '3', tone: '#03A9F4', icon: 'calendar-clock' },
    { id: 'issues', label: 'Issues', value: '0', tone: '#E57373', icon: 'alert-circle' },
  ]), []);

  const recentParcels = useMemo(() => ([
    {
      id: 'ADE20250112-4',
      recipient: 'Beza Tesfaye',
      status: 'In Transit to Hub',
      eta: 'Arrives today 18:40',
      tone: theme.colors.primary,
      steps: ['Created', 'Drop-off', 'Hub in-bound'],
    },
    {
      id: 'ADE20250109-8',
      recipient: 'Samuel Tadesse',
      status: 'Ready for Pickup',
      eta: 'Pickup by 24 Jan',
      tone: '#FFB300',
      steps: ['Created', 'At Pickup Partner'],
    },
  ]), [theme.colors.primary]);

  const curatedServices = useMemo(() => ([
    {
      id: 'telebirr-wallet',
      icon: 'cash-multiple',
      title: 'Wallet & Payments',
      caption: 'Top-up via Telebirr or Chapa instantly',
      tone: '#26A69A',
      action: () => navigation?.navigate?.('wallet'),
    },
    {
      id: 'shop-sync',
      icon: 'storefront-outline',
      title: 'Shop Integrations',
      caption: 'Sync with partner marketplaces for auto-delivery',
      tone: '#7C4DFF',
      action: () => navigation?.navigate?.('services'),
    },
    {
      id: 'support',
      icon: 'headset',
      title: 'Concierge Support',
      caption: '24/7 multilingual chat & callback assistance',
      tone: '#EF5350',
      action: () => navigation?.navigate?.('support'),
    },
  ]), [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setRefreshing(false);
  };

  const welcomeName = userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name ?? ''}`.trim() : 'Adera Explorer';

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text.secondary }]}>Hello, {welcomeName}!</Text>
            <Text style={[styles.greetingSub, { color: theme.colors.text.secondary }]}>Deliveries synced across Addis</Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { borderColor: theme.colors.outline }]} onPress={() => navigation?.navigate?.('profile')}>
            <MaterialCommunityIcons name="account-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>Adera Wallet</Text>
              <Text style={styles.walletSub}>Safe, offline-ready balance</Text>
            </View>
            <MaterialCommunityIcons name="wallet-outline" size={28} color="#FFF" />
          </View>
          <Text style={styles.walletBalance}>{walletBalance.toLocaleString('en-ET', { style: 'currency', currency: 'ETB' })}</Text>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletChip}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#FFF" />
              <Text style={styles.walletChipText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletChip}>
              <MaterialCommunityIcons name="history" size={18} color="#FFF" />
              <Text style={styles.walletChipText}>Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletChip}>
              <MaterialCommunityIcons name="wallet-giftcard" size={18} color="#FFF" />
              <Text style={styles.walletChipText}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Quick Actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                onPress={action.action}
                activeOpacity={0.85}
                style={[styles.quickCard, { backgroundColor: action.bg }]}
              >
                <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
                <Text style={[styles.quickCardTitle, { color: action.color }]}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Parcel Pulse</Text>
          <View style={styles.summaryGrid}>
            {parcelSummary.map(item => (
              <Card key={item.id} style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: `${item.tone}22` }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.tone} />
                </View>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>{item.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Active Parcels</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('track')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentParcels.map(parcel => (
            <Card key={parcel.id} style={styles.parcelCard}>
              <View style={styles.parcelHeader}>
                <View>
                  <Text style={styles.parcelId}>{parcel.id}</Text>
                  <Text style={[styles.parcelRecipient, { color: theme.colors.text.secondary }]}>To {parcel.recipient}</Text>
                </View>
                <StatusBadge tone={parcel.status.includes('Ready') ? 'success' : 'info'} label={parcel.status.toUpperCase()} />
              </View>
              <View style={styles.parcelTimeline}>
                {parcel.steps.map((step, index) => (
                  <View key={step} style={styles.timelineStep}>
                    <View style={[styles.timelineDot, { backgroundColor: parcel.tone }]} />
                    <Text style={[styles.timelineLabel, { color: theme.colors.text.secondary }]}>{step}</Text>
                    {index !== parcel.steps.length - 1 && <View style={[styles.timelineLine, { borderColor: `${parcel.tone}55` }]} />}
                  </View>
                ))}
              </View>
              <View style={styles.parcelFooter}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={parcel.tone} />
                <Text style={[styles.parcelEta, { color: parcel.tone }]}>{parcel.eta}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Explore Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroller}>
            {curatedServices.map(service => (
              <TouchableOpacity key={service.id} style={[styles.serviceChip, { borderColor: `${service.tone}55` }]} onPress={service.action}>
                <MaterialCommunityIcons name={service.icon} size={20} color={service.tone} />
                <View style={styles.serviceMeta}>
                  <Text style={[styles.serviceTitle, { color: theme.colors.text.primary }]}>{service.title}</Text>
                  <Text style={[styles.serviceCaption, { color: theme.colors.text.secondary }]}>{service.caption}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.supportCard} onPress={() => navigation?.navigate?.('support')} activeOpacity={0.85}>
            <View style={styles.supportIconWrap}>
              <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.supportContent}>
              <Text style={[styles.supportTitle, { color: theme.colors.text.primary }]}>Need assistance?</Text>
              <Text style={[styles.supportSubtitle, { color: theme.colors.text.secondary }]}>Chat with Adera concierge or schedule a callback</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120, paddingHorizontal: 20, gap: 24 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  greeting: { fontSize: 16, fontWeight: '600' },
  greetingSub: { fontSize: 13 },
  profileButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  walletCard: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  walletLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  walletSub: { color: '#fff', opacity: 0.7, fontSize: 13 },
  walletBalance: { color: '#fff', fontSize: 34, fontWeight: '700', marginBottom: 16 },
  walletActions: { flexDirection: 'row', gap: 12 },
  walletChip: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14 },
  walletChipText: { color: '#fff', fontWeight: '600' },
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  quickActionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { padding: 18, borderRadius: 18, flexBasis: '47%', gap: 12, elevation: 2 },
  quickCardTitle: { fontWeight: '600', fontSize: 15 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flexBasis: '47%', padding: 16, borderRadius: 16, gap: 10 },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontWeight: '700', fontSize: 22 },
  summaryLabel: { fontSize: 12, letterSpacing: 0.4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontWeight: '600' },
  parcelCard: { padding: 18, borderRadius: 18, gap: 12 },
  parcelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parcelId: { fontWeight: '700', fontSize: 16 },
  parcelRecipient: { fontSize: 13 },
  parcelTimeline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLabel: { fontSize: 12 },
  timelineLine: { borderLeftWidth: 1, height: 16 },
  parcelFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parcelEta: { fontWeight: '600', fontSize: 13 },
  serviceScroller: { gap: 12, paddingVertical: 4 },
  serviceChip: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, minWidth: 240 },
  serviceMeta: { gap: 4, flexShrink: 1 },
  serviceTitle: { fontWeight: '600' },
  serviceCaption: { fontSize: 12 },
  supportCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, gap: 12 },
  supportIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  supportContent: { flex: 1, gap: 4 },
  supportTitle: { fontWeight: '600', fontSize: 16 },
  supportSubtitle: { fontSize: 13 },
});

export default CustomerDashboard;
