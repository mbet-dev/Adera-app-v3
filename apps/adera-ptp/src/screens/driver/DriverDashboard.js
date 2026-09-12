import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { CustomFAB } from '@adera/ui';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const DriverDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();

  const headline = useMemo(() => ({
    name: userProfile?.first_name || 'Driver',
    message: 'You have 3 active deliveries and 2 pickups queued.',
  }), [userProfile?.first_name]);

  const metrics = useMemo(() => ([
    { icon: 'truck', label: 'Active Tasks', value: '3', tone: theme.colors.primary },
    { icon: 'clock-check-outline', label: 'On-Time Rate', value: '96%', tone: '#4CAF50' },
    { icon: 'check-decagram', label: 'Completed Today', value: '8', tone: '#03A9F4' },
    { icon: 'star', label: 'Performance', value: '4.9 ★', tone: '#FFB300' },
  ]), [theme.colors.primary]);

  const quickActions = useMemo(() => ([
    {
      id: 'route',
      icon: 'navigation-variant',
      title: 'Start Route',
      caption: 'Open today’s optimized path',
      action: () => navigation?.navigate?.('map'),
    },
    {
      id: 'scan',
      icon: 'qrcode-scan',
      title: 'Batch Scan',
      caption: 'Multi-scan parcels at pickup hub',
      action: () => navigation?.navigate?.('tasks'),
    },
    {
      id: 'issues',
      icon: 'alert-octagon-outline',
      title: 'Log Issue',
      caption: 'Report damages with photos',
      action: () => navigation?.navigate?.('support'),
    },
  ]), [navigation]);

  const schedule = useMemo(() => ([
    {
      id: 'slot-1',
      window: '08:00 - 09:15',
      label: 'Morning pickup sync',
      location: 'Bole Atlas Depot',
      load: '6 parcels',
      status: 'inbound',
    },
    {
      id: 'slot-2',
      window: '12:00 - 13:30',
      label: 'CBD express handoff',
      location: 'Churchill Partner Hub',
      load: '9 parcels',
      status: 'enroute',
    },
    {
      id: 'slot-3',
      window: '17:45',
      label: 'End-of-day reconciliation',
      location: 'Kazanchis Sorting Centre',
      load: 'Wallet + COD closing',
      status: 'due',
    },
  ]), []);

  const highlights = useMemo(() => ([
    {
      id: 'distance',
      icon: 'map-marker-distance',
      label: 'Distance covered',
      value: '112 km',
      delta: '+12% vs yesterday',
      tone: '#26A69A',
    },
    {
      id: 'time-to-drop',
      icon: 'timer-sand',
      label: 'Avg. drop-off time',
      value: '7m 12s',
      delta: '-42s improvement',
      tone: '#7C4DFF',
    },
    {
      id: 'fuel',
      icon: 'fuel',
      label: 'Fuel spend today',
      value: '1,120 ETB',
      delta: 'Submit receipt',
      tone: '#EF6C00',
    },
  ]), []);

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar
        title="Driver Dashboard"
        style={{ backgroundColor: theme.colors.primary }}
      />

      <ScrollView style={styles.content}>
        <Card style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}
          elevation={5}
        >
          <Text variant="headlineSmall" style={[styles.welcome, { color: theme.colors.onPrimary }]}>
            Selam, {headline.name}!
          </Text>
          <Text variant="bodyMedium" style={[styles.subWelcome, { color: theme.colors.onPrimary }]}>
            {headline.message}
          </Text>
        </Card>

        <View style={styles.metricsGrid}>
          {metrics.map(metric => (
            <Card key={metric.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.tone}22` }]}>
                <MaterialCommunityIcons name={metric.icon} size={22} color={metric.tone} />
              </View>
              <Text variant="headlineSmall" style={styles.metricValue}>{metric.value}</Text>
              <Text variant="bodySmall" style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                {metric.label}
              </Text>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map(action => (
              <Card key={action.id} style={styles.quickActionCard} onPress={action.action}>
                <MaterialCommunityIcons name={action.icon} size={28} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.quickActionTitle}>{action.title}</Text>
                <Text variant="bodySmall" style={[styles.quickActionCaption, { color: theme.colors.text.secondary }]}>
                  {action.caption}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Performance Highlights</Text>
          <View style={styles.highlightGrid}>
            {highlights.map(item => (
              <Card key={item.id} style={styles.highlightCard}>
                <View style={[styles.highlightIcon, { backgroundColor: `${item.tone}22` }]}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={item.tone} />
                </View>
                <Text variant="labelMedium" style={[styles.highlightLabel, { color: theme.colors.text.secondary }]}>
                  {item.label}
                </Text>
                <Text variant="headlineSmall" style={styles.highlightValue}>{item.value}</Text>
                <Text variant="bodySmall" style={[styles.highlightDelta, { color: item.tone }]}>
                  {item.delta}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Today’s Manifest Windows</Text>
          {schedule.map(slot => (
            <Card key={slot.id} style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.slotWindow}>{slot.window}</Text>
                  <Text variant="bodySmall" style={[styles.slotLabel, { color: theme.colors.text.secondary }]}>
                    {slot.label}
                  </Text>
                </View>
                <StatusBadge
                  tone={slot.status === 'due' ? 'warning' : slot.status === 'enroute' ? 'info' : 'success'}
                  label={slot.status.toUpperCase()}
                />
              </View>
              <View style={styles.slotMeta}>
                <View style={styles.slotMetaItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.slotMetaText}>{slot.location}</Text>
                </View>
                <View style={styles.slotMetaItem}>
                  <MaterialCommunityIcons name="cube-scan" size={18} color={theme.colors.secondary} />
                  <Text variant="bodyMedium" style={styles.slotMetaText}>{slot.load}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Live Route Snapshot</Text>
            <StatusBadge tone="info" label="SYNCED" />
          </View>
          <View style={styles.routeSummary}>
            <View style={styles.routeMetric}>
              <MaterialCommunityIcons name="clock-fast" size={22} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.routeMetricText}>ETA to next drop: 16 min</Text>
            </View>
            <View style={styles.routeMetric}>
              <MaterialCommunityIcons name="speedometer" size={22} color="#FF7043" />
              <Text variant="bodyMedium" style={styles.routeMetricText}>Average speed: 42 km/h</Text>
            </View>
            <View style={styles.routeMetric}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#D81B60" />
              <Text variant="bodyMedium" style={styles.routeMetricText}>Traffic advisory: Mild</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <CustomFAB
        icon="map"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation?.navigate?.('map')}
        label="Open Map"
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16, gap: 16 },
  welcomeCard: { padding: 20, borderRadius: 20 },
  welcome: { fontWeight: '700', marginBottom: 6 },
  subWelcome: { opacity: 0.9 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flexBasis: '48%', padding: 16, borderRadius: 16, gap: 8 },
  metricIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontWeight: '700' },
  metricLabel: { textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.4 },
  section: { gap: 12, marginBottom: 12 },
  sectionTitle: { fontWeight: '700' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionCard: { flexBasis: '31%', padding: 16, borderRadius: 16, gap: 8, alignItems: 'flex-start' },
  quickActionTitle: { fontWeight: '600' },
  quickActionCaption: { fontSize: 12 },
  highlightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  highlightCard: { flexBasis: '48%', padding: 16, borderRadius: 16, gap: 6 },
  highlightIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  highlightLabel: { fontWeight: '600', fontSize: 12 },
  highlightValue: { fontWeight: '700' },
  highlightDelta: { fontWeight: '500' },
  slotCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  slotWindow: { fontWeight: '700' },
  slotLabel: { marginTop: 2 },
  slotMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  slotMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotMetaText: { fontWeight: '500' },
  routeCard: { padding: 18, borderRadius: 18, gap: 14 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeSummary: { gap: 12 },
  routeMetric: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeMetricText: { fontWeight: '500' },
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

export default DriverDashboard;
