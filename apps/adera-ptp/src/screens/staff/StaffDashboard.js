import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons } from '@expo/vector-icons';

const StaffDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [stats] = useState({
    totalParcels: 1247,
    inTransit: 89,
    issues: 3,
    partners: 156
  });

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar 
        title="Staff Dashboard"
        style={{ backgroundColor: theme.colors.primary }}
      />
      
      <ScrollView style={styles.content}>
        <Card style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineSmall" style={[styles.welcome, { color: theme.colors.onPrimary }]}>
            Welcome, {userProfile?.first_name || 'Staff'}!
          </Text>
          <Text variant="bodyMedium" style={[styles.subWelcome, { color: theme.colors.onPrimary }]}>
            System overview and management
          </Text>
        </Card>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard icon="cube-outline" label="Total Parcels" value={stats.totalParcels} color={theme.colors.primary} />
            <StatCard icon="truck" label="In Transit" value={stats.inTransit} color="#FF9800" />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="alert-circle" label="Issues" value={stats.issues} color="#F44336" />
            <StatCard icon="store" label="Partners" value={stats.partners} color="#4CAF50" />
          </View>
        </View>

        <Card style={styles.alertsCard}>
          <Text variant="titleMedium" style={styles.alertsTitle}>System Alerts</Text>
          <Text variant="bodyMedium">• 3 parcels require attention</Text>
          <Text variant="bodyMedium">• 2 delivery delays reported</Text>
          <Text variant="bodyMedium">• 1 payment dispute pending</Text>
        </Card>
      </ScrollView>
    </SafeArea>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card style={styles.statCard}>
    <View style={styles.statContent}>
      <Ionicons name={icon} size={24} color={color} />
      <Text variant="headlineMedium" style={[styles.statValue, { color }]}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  welcomeCard: { padding: 20, marginBottom: 16 },
  welcome: { fontWeight: 'bold', marginBottom: 4 },
  subWelcome: { opacity: 0.9 },
  statsContainer: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16 },
  statContent: { alignItems: 'center' },
  statValue: { fontWeight: 'bold', marginVertical: 4 },
  statLabel: { textAlign: 'center', color: '#666' },
  alertsCard: { padding: 20 },
  alertsTitle: { fontWeight: '500', marginBottom: 12 },
});

export default StaffDashboard;
