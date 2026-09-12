import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Earnings = ({ navigation }) => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const earningsData = useMemo(() => ({
    week: { total: 1250, parcelHandling: 850, shopCommission: 400, bonus: 0 },
    month: { total: 5450, parcelHandling: 3850, shopCommission: 1200, bonus: 400 },
    year: { total: 48200, parcelHandling: 32100, shopCommission: 14500, bonus: 1600 },
  }), []);

  const transactions = useMemo(() => ([
    { id: '1', type: 'parcel', tracking_id: 'AD001234', amount: 45, date: '2 hours ago', status: 'completed' },
    { id: '2', type: 'shop', order_id: 'SH002156', amount: 120, date: '5 hours ago', status: 'completed' },
    { id: '3', type: 'parcel', tracking_id: 'AD001235', amount: 35, date: '1 day ago', status: 'completed' },
    { id: '4', type: 'payout', amount: -2450, date: '3 days ago', status: 'processed' },
    { id: '5', type: 'bonus', description: 'Perfect week bonus', amount: 200, date: '1 week ago', status: 'completed' },
  ]), []);

  const currentData = earningsData[selectedPeriod];

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'parcel': return { icon: 'package-variant', color: '#2196F3' };
      case 'shop': return { icon: 'store', color: '#4CAF50' };
      case 'payout': return { icon: 'bank-transfer-out', color: '#FF9800' };
      case 'bonus': return { icon: 'gift', color: '#9C27B0' };
      default: return { icon: 'cash', color: theme.colors.primary };
    }
  };

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Earnings & Payouts" />
      <ScrollView style={styles.content}>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineLarge" style={[styles.totalEarnings, { color: theme.colors.onPrimary }]}>
            {currentData.total.toLocaleString('en-ET')} ETB
          </Text>
          <Text variant="titleMedium" style={[styles.summaryLabel, { color: theme.colors.onPrimary }]}>
            Total This {selectedPeriod === 'week' ? 'Week' : selectedPeriod === 'month' ? 'Month' : 'Year'}
          </Text>
          <View style={styles.periodSelector}>
            <Chip 
              selected={selectedPeriod === 'week'} 
              onPress={() => setSelectedPeriod('week')} 
              style={styles.periodChip}
              textStyle={[styles.chipText, { color: selectedPeriod === 'week' ? theme.colors.primary : theme.colors.onPrimary }]}
            >
              Week
            </Chip>
            <Chip 
              selected={selectedPeriod === 'month'} 
              onPress={() => setSelectedPeriod('month')} 
              style={styles.periodChip}
              textStyle={[styles.chipText, { color: selectedPeriod === 'month' ? theme.colors.primary : theme.colors.onPrimary }]}
            >
              Month
            </Chip>
            <Chip 
              selected={selectedPeriod === 'year'} 
              onPress={() => setSelectedPeriod('year')} 
              style={styles.periodChip}
              textStyle={[styles.chipText, { color: selectedPeriod === 'year' ? theme.colors.primary : theme.colors.onPrimary }]}
            >
              Year
            </Chip>
          </View>
        </Card>

        <Card style={styles.breakdownCard}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.earningItem}>
            <View style={styles.earningLeft}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#2196F3" />
              <Text variant="bodyLarge" style={styles.earningLabel}>Parcel Handling</Text>
            </View>
            <Text variant="titleMedium" style={[styles.earningValue, { color: '#2196F3' }]}>
              {currentData.parcelHandling.toLocaleString('en-ET')} ETB
            </Text>
          </View>
          
          <View style={styles.earningItem}>
            <View style={styles.earningLeft}>
              <MaterialCommunityIcons name="store" size={24} color="#4CAF50" />
              <Text variant="bodyLarge" style={styles.earningLabel}>Shop Commission</Text>
            </View>
            <Text variant="titleMedium" style={[styles.earningValue, { color: '#4CAF50' }]}>
              {currentData.shopCommission.toLocaleString('en-ET')} ETB
            </Text>
          </View>

          {currentData.bonus > 0 && (
            <View style={styles.earningItem}>
              <View style={styles.earningLeft}>
                <MaterialCommunityIcons name="gift" size={24} color="#9C27B0" />
                <Text variant="bodyLarge" style={styles.earningLabel}>Bonuses</Text>
              </View>
              <Text variant="titleMedium" style={[styles.earningValue, { color: '#9C27B0' }]}>
                {currentData.bonus.toLocaleString('en-ET')} ETB
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Next Payout</Text>
            <StatusBadge tone="info" label="SCHEDULED" />
          </View>
          <View style={styles.payoutInfo}>
            <View style={styles.payoutRow}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.payoutText}>Friday, Jan 31, 2025</Text>
            </View>
            <View style={styles.payoutRow}>
              <MaterialCommunityIcons name="bank" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.payoutText}>Commercial Bank - ****1234</Text>
            </View>
            <View style={styles.payoutRow}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={[styles.payoutAmount, { color: theme.colors.primary }]}>
                {currentData.total.toLocaleString('en-ET')} ETB
              </Text>
            </View>
          </View>
          <Button 
            mode="contained" 
            style={styles.payoutButton}
            onPress={() => {}}
          >
            Request Early Payout
          </Button>
        </Card>

        <View style={styles.transactionsSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.map((transaction) => {
            const iconInfo = getTransactionIcon(transaction.type);
            const isNegative = transaction.amount < 0;
            return (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionContent}>
                  <View style={[styles.transactionIcon, { backgroundColor: `${iconInfo.color}22` }]}>
                    <MaterialCommunityIcons name={iconInfo.icon} size={24} color={iconInfo.color} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text variant="titleMedium" style={styles.transactionTitle}>
                      {transaction.type === 'parcel' ? `Parcel #${transaction.tracking_id}` :
                       transaction.type === 'shop' ? `Shop Order #${transaction.order_id}` :
                       transaction.type === 'payout' ? 'Payout to Bank' :
                       transaction.description}
                    </Text>
                    <Text variant="bodySmall" style={[styles.transactionDate, { color: theme.colors.text.secondary }]}>
                      {transaction.date}
                    </Text>
                  </View>
                  <Text 
                    variant="titleMedium" 
                    style={[styles.transactionAmount, { color: isNegative ? '#F44336' : '#4CAF50' }]}
                  >
                    {isNegative ? '-' : '+'}{Math.abs(transaction.amount).toLocaleString('en-ET')} ETB
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  summaryCard: { padding: 24, marginBottom: 16, alignItems: 'center', borderRadius: 20 },
  totalEarnings: { fontWeight: '700', marginBottom: 8 },
  summaryLabel: { fontWeight: '600', opacity: 0.95, marginBottom: 16 },
  periodSelector: { flexDirection: 'row', gap: 8, marginTop: 8 },
  periodChip: { minWidth: 70 },
  chipText: { fontWeight: '600' },
  breakdownCard: { padding: 20, marginBottom: 16, borderRadius: 16 },
  sectionTitle: { fontWeight: '700', marginBottom: 16 },
  earningItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  earningLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  earningLabel: { fontWeight: '500' },
  earningValue: { fontWeight: '700' },
  payoutCard: { padding: 20, marginBottom: 16, borderRadius: 16 },
  payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  payoutInfo: { gap: 12, marginBottom: 16 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutText: { fontWeight: '500' },
  payoutAmount: { fontWeight: '700' },
  payoutButton: { marginTop: 8 },
  transactionsSection: { marginBottom: 20 },
  transactionCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  transactionContent: { flexDirection: 'row', alignItems: 'center' },
  transactionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionTitle: { fontWeight: '600', marginBottom: 4 },
  transactionDate: { fontSize: 12 },
  transactionAmount: { fontWeight: '700' },
});

export default Earnings;
