import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { CustomFAB } from '@adera/ui';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PartnerDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingPickups: 5,
    todayEarnings: 850,
    totalParcels: 127,
    rating: 4.8
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const insights = useMemo(() => ([
    {
      id: 'dwell-time',
      label: 'Average dwell time',
      value: '42m',
      delta: '+8% vs last week',
      icon: 'timer-outline',
      tone: '#7C4DFF',
    },
    {
      id: 'conversion',
      label: 'Scan-to-pickup conversion',
      value: '93%',
      delta: '+3.1%',
      icon: 'trending-up',
      tone: '#26A69A',
    },
    {
      id: 'wallet',
      label: 'Wallet balance',
      value: `${(stats.todayEarnings * 6).toLocaleString('en-ET')} ETB`,
      delta: 'Auto payout in 2d',
      icon: 'wallet-outline',
      tone: '#EF6C00',
    },
  ]), [stats.todayEarnings]);

  const appointments = useMemo(() => ([
    {
      id: 'slot-1',
      title: 'Drop-off wave',
      window: '08:30 - 09:15',
      partner: 'Kazanchis Hub',
      load: '12 parcels',
      status: 'inbound',
    },
    {
      id: 'slot-2',
      title: 'Pickup dispatch',
      window: '12:00 - 12:45',
      partner: 'CMC Junction',
      load: '18 parcels',
      status: 'scheduled',
    },
    {
      id: 'slot-3',
      title: 'Evening reconciliation',
      window: '19:00',
      partner: 'Digital ledger sync',
      load: 'Wallet + COD review',
      status: 'due',
    },
  ]), []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    // Placeholder mocked payload until Supabase integration is wired
    setTimeout(() => {
      setRecentActivity([
        {
          id: '1',
          type: 'pickup',
          tracking_id: 'AD001234',
          time: '10 minutes ago',
          status: 'Parcel picked up from customer'
        },
        {
          id: '2',
          type: 'dropoff',
          tracking_id: 'AD001235',
          time: '1 hour ago',
          status: 'Parcel ready for pickup'
        }
      ]);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    loadDashboardData();
  };

  const openScanner = () => {
    navigation?.navigate?.('scan') || console.log('Open QR scanner');
  };

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar 
        title="Partner Dashboard"
        elevated={false}
        style={{ backgroundColor: theme.colors.primary }}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Welcome Section */}
        <Card style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}>
          <Text 
            variant="headlineSmall" 
            style={[styles.welcome, { color: theme.colors.onPrimary }]}
          >
            Welcome back, {userProfile?.business_name || 'Partner'}!
          </Text>
          <Text 
            variant="bodyMedium" 
            style={[styles.subWelcome, { color: theme.colors.onPrimary }]}
          >
            Ready to serve your community today
          </Text>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="cube-outline"
              label="Pending Pickups"
              value={stats.pendingPickups}
              color="#FF9800"
            />
            <StatCard
              icon="cash"
              label="Today's Earnings"
              value={`${stats.todayEarnings} ETB`}
              color="#4CAF50"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="car-outline"
              label="Total Parcels"
              value={stats.totalParcels}
              color={theme.colors.primary}
            />
            <StatCard
              icon="star"
              label="Rating"
              value={`${stats.rating} ⭐`}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Operational Insights */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Operational Insights
          </Text>
          <View style={styles.insightGrid}>
            {insights.map(item => (
              <Card key={item.id} style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: `${item.tone}22` }]}> 
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.tone} />
                </View>
                <Text variant="labelMedium" style={[styles.insightLabel, { color: theme.colors.text.secondary }]}>
                  {item.label}
                </Text>
                <Text variant="headlineSmall" style={[styles.insightValue, { color: theme.colors.text.primary }]}>
                  {item.value}
                </Text>
                <Text variant="bodySmall" style={[styles.insightDelta, { color: item.tone }]}>
                  {item.delta}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="qr-code"
              title="Scan QR Code"
              description="Process parcel pickup/dropoff"
              onPress={openScanner}
            />
            <QuickActionCard
              icon="cube"
              title="View Parcels"
              description="Manage pending parcels"
              onPress={() => navigation?.navigate?.('parcels')}
            />
          </View>
        </View>

        {/* Scheduled Windows */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Today’s Control Windows
          </Text>
          {appointments.map(slot => (
            <Card key={slot.id} style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.slotTitle}>{slot.title}</Text>
                  <Text variant="bodySmall" style={[styles.slotWindow, { color: theme.colors.text.secondary }]}>{slot.window}</Text>
                </View>
                <StatusBadge
                  tone={slot.status === 'due' ? 'warning' : slot.status === 'inbound' ? 'info' : 'success'}
                  label={slot.status.toUpperCase()}
                />
              </View>
              <View style={styles.slotMeta}>
                <View style={styles.slotMetaItem}>
                  <MaterialCommunityIcons name="storefront-outline" size={18} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.slotMetaText}>{slot.partner}</Text>
                </View>
                <View style={styles.slotMetaItem}>
                  <MaterialCommunityIcons name="cube-scan" size={18} color={theme.colors.secondary} />
                  <Text variant="bodyMedium" style={styles.slotMetaText}>{slot.load}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          {recentActivity.length > 0 ? (
            recentActivity.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={theme.colors.gray[400]}
                />
                <Text 
                  variant="bodyLarge" 
                  style={[styles.emptyText, { color: theme.colors.text.secondary }]}
                >
                  No recent activity
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}
                >
                  Parcel activities will appear here
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

    {/* Floating Action Button */}
    <CustomFAB
      icon="qr-code"
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      onPress={openScanner}
      label="Scan QR"
    />
  </SafeArea>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        <Ionicons name={icon} size={24} color={color} />
        <Text variant="headlineMedium" style={[styles.statValue, { color }]}>
          {value}
        </Text>
        <Text 
          variant="bodySmall" 
          style={[styles.statLabel, { color: theme.colors.text.secondary }]}
        >
          {label}
        </Text>
      </View>
    </Card>
  );
};

const QuickActionCard = ({ icon, title, description, onPress }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionContent}>
        <Ionicons name={icon} size={32} color={theme.colors.primary} />
        <Text variant="titleMedium" style={styles.quickActionTitle}>
          {title}
        </Text>
        <Text 
          variant="bodySmall" 
          style={[styles.quickActionDesc, { color: theme.colors.text.secondary }]}
        >
          {description}
        </Text>
      </View>
    </Card>
  );
};

const ActivityCard = ({ activity }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.activityCard}>
      <View style={styles.activityContent}>
        <View style={styles.activityIcon}>
          <Ionicons 
            name={activity.type === 'pickup' ? 'arrow-up' : 'arrow-down'} 
            size={20} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.activityInfo}>
          <Text variant="bodyLarge" style={styles.activityTrackingId}>
            #{activity.tracking_id}
          </Text>
          <Text variant="bodyMedium" style={styles.activityStatus}>
            {activity.status}
          </Text>
          <Text 
            variant="bodySmall" 
            style={[styles.activityTime, { color: theme.colors.text.secondary }]}
          >
            {activity.time}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 16,
  },
  welcome: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subWelcome: {
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionTitle: {
    marginTop: 8,
    fontWeight: '500',
  },
  quickActionDesc: {
    marginTop: 4,
    textAlign: 'center',
  },
  activityCard: {
    padding: 16,
    marginBottom: 8,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTrackingId: {
    fontWeight: '500',
    marginBottom: 2,
  },
  activityStatus: {
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    flexBasis: '48%',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  insightLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  insightValue: {
    fontWeight: '700',
  },
  insightDelta: {
    fontWeight: '500',
  },
  slotCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotTitle: {
    fontWeight: '700',
  },
  slotWindow: {
    marginTop: 2,
  },
  slotMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  slotMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotMetaText: {
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default PartnerDashboard;
