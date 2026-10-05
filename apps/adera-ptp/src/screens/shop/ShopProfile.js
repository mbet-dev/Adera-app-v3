import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeArea, Card, Button, useTheme, AppSwitcherButton } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@adera/auth';
import { supabase } from '@adera/auth/src/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppFlow } from '../../context/AppFlowContext';

const ShopProfile = ({ navigation }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const { user, userProfile, signOut } = useAuth();
  const { openAppSelector } = useAppFlow();
  const [refreshing, setRefreshing] = useState(false);
  const [orderStats, setOrderStats] = useState({ total: 0, delivered: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchProfileData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Fetch order stats
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', currentUser.id);

      const { count: deliveredOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', currentUser.id)
        .eq('status', 'delivered');

      const { data: totalData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('customer_id', currentUser.id)
        .eq('status', 'delivered');

      const totalSpent = (totalData || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      setOrderStats({
        total: totalOrders || 0,
        delivered: deliveredOrders || 0,
        totalSpent,
      });

      // Recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at')
        .eq('customer_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentOrders(recent || []);
    } catch (err) {
      console.error('[ShopProfile] Error:', err);
    }
  }, []);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => {
        AsyncStorage.clear().catch(() => {});
        if (signOut) signOut(navigation);
      }},
    ]);
  };

  const menuItems = [
    { icon: 'shopping', label: 'My Orders', subtitle: `${orderStats.total} orders placed`, action: () => navigation?.navigate?.('orderHistory') },
    { icon: 'map-marker', label: 'Saved Addresses', subtitle: 'Manage delivery addresses', action: () => Alert.alert('Coming Soon', 'Address management will be available here.') },
    { icon: 'credit-card', label: 'Payment Methods', subtitle: 'Manage payment options', action: () => Alert.alert('Coming Soon', 'Payment management will be available here.') },
    { icon: 'bell', label: 'Notifications', subtitle: 'Manage notification preferences', action: () => Alert.alert('Coming Soon', 'Notification settings will be available here.') },
    { icon: 'language', label: 'Language', subtitle: 'English', action: () => Alert.alert('Coming Soon', 'Language switching will be available here.') },
    { icon: 'theme-light-dark', label: 'Appearance', subtitle: isDark ? 'Dark mode' : 'Light mode', action: () => Alert.alert('Coming Soon', 'Theme switching will be available here.') },
    { icon: 'shield-check', label: 'Privacy & Security', subtitle: 'Manage your data', action: () => Alert.alert('Coming Soon', 'Privacy settings will be available here.') },
    { icon: 'help-circle', label: 'Help & Support', subtitle: 'Get assistance', action: () => Alert.alert('Support', 'Chat with Adera concierge coming soon.') },
  ];

  return (
    <SafeArea edges={['top', 'bottom']} withBottomNav={true}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              {userProfile?.avatar_url ? (
                <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {(userProfile?.full_name || userProfile?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                {userProfile?.full_name || 'Adera Shopper'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
                {userProfile?.email || user?.email || ''}
              </Text>
              {userProfile?.phone && (
                <Text style={[styles.profilePhone, { color: theme.colors.text.secondary }]}>
                  {userProfile.phone}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Order Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Orders', value: orderStats.total, icon: 'shopping', color: theme.colors.primary },
            { label: 'Delivered', value: orderStats.delivered, icon: 'check-circle', color: '#4CAF50' },
            { label: 'Spent', value: `${orderStats.totalSpent.toFixed(0)}`, icon: 'cash', color: '#FF9800', suffix: 'ETB' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? `${stat.color}22` : `${stat.color}15` }]}>
                <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                {stat.value}{stat.suffix ? ` ${stat.suffix}` : ''}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* App Switcher */}
        <AppSwitcherButton
          targetApp="ptp"
          onPress={openAppSelector}
        />

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderBottomColor: theme.colors.outlineVariant }]}
              onPress={item.action}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                <MaterialCommunityIcons name={item.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: theme.colors.text.primary }]}>{item.label}</Text>
                <Text style={[styles.menuSubtitle, { color: theme.colors.text.secondary }]}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: theme.colors.error }]} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />
          <Text style={[styles.signOutText, { color: theme.colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.colors.text.secondary }]}>Adera Shop v1.0.0</Text>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 16, gap: 20 },
  profileCard: { padding: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '700' },
  profileEmail: { fontSize: 14 },
  profilePhone: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  menuSection: { gap: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 8,
  },
  signOutText: { fontSize: 16, fontWeight: '700' },
  version: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});

export default ShopProfile;
