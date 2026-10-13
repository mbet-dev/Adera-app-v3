import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeArea, AppBar, Card, Button, TextInput, useTheme } from '@adera/ui';
import { supabase, useAuth } from '@adera/auth';
import { usePayment, openChapaCheckout } from '@adera/payments';

const TOP_UP_PRESETS = [100, 500, 1000, 5000];

const TX_META = {
  credit: { icon: 'arrow-down-circle', color: '#4CAF50', sign: '+' },
  debit: { icon: 'arrow-up-circle', color: '#F44336', sign: '-' },
  refund: { icon: 'rotate-left', color: '#FF9800', sign: '+' },
};

const formatAmount = (amount, sign = '') =>
  `${sign}${Number(amount || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Wallet — balance, top-up via Chapa, and transaction history.
 *
 * Backed by the wallet system (supabase/10-wallet-system-deployment.sql).
 * The wallet tables may not be deployed yet, so every query degrades
 * gracefully: a failed read surfaces a "not available" state instead of
 * crashing the screen.
 */
const Wallet = ({ navigation }) => {
  const theme = useTheme();
  const { user, userProfile } = useAuth();
  const { initiatePayment } = usePayment();

  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [walletAvailable, setWalletAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance, pending_balance, total_spent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        // Table missing or RLS denial — wallet system not deployed yet
        setWalletAvailable(false);
        return;
      }

      setWalletAvailable(true);
      setBalance(Number(wallet?.balance) || 0);
      setPendingBalance(Number(wallet?.pending_balance) || 0);
      setTotalSpent(Number(wallet?.total_spent) || 0);

      if (wallet?.id) {
        const { data: txns, error: txError } = await supabase
          .from('wallet_transactions')
          .select('id, type, amount, balance_before, balance_after, reference_type, description, created_at')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!txError && txns) {
          setTransactions(txns);
        }
      }
    } catch (err) {
      console.error('[Wallet] Fetch error:', err);
      setWalletAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => fetchWallet(), 0);
    return () => clearTimeout(timer);
  }, [fetchWallet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  const handleTopUp = useCallback(
    async (amount) => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value < 10) {
        Alert.alert('Invalid amount', 'Enter a top-up amount of at least 10 ETB.');
        return;
      }
      if (!user?.id) {
        Alert.alert('Sign in required', 'Please sign in to top up your wallet.');
        return;
      }

      setToppingUp(true);
      try {
        const txRef = `ADERA-WALLET-${user.id.slice(0, 8)}-${Date.now()}`;
        const result = await initiatePayment({
          method: 'chapa',
          amount: value,
          orderId: txRef,
          customer: {
            email: user.email || 'customer@adera.app',
            firstName: userProfile?.first_name || 'Adera',
            lastName: userProfile?.last_name || 'Customer',
            phone: user.phone || '',
          },
          items: [{ description: `Wallet top-up of ${value} ETB` }],
          // chapa-verify settles top-ups into the wallet using this meta
          meta: { purpose: 'wallet_topup', amount: value, user_id: user.id },
        });

        if (result?.checkoutUrl) {
          await openChapaCheckout(result.checkoutUrl);
          // Verify + credit the wallet server-side via the chapa-verify function
          navigation?.navigate?.('paymentCallback', {
            tx_ref: result.txRef || txRef,
            paymentMethod: 'chapa',
            purpose: 'wallet_topup',
            amount: value,
          });
        } else {
          Alert.alert('Top-up unavailable', 'The payment gateway did not return a checkout link. Please try again.');
        }
      } catch (error) {
        console.error('[Wallet] Top-up error:', error);
        Alert.alert(
          'Top-up failed',
          error?.message || 'Could not start the top-up payment. Please check your connection and try again.'
        );
      } finally {
        setToppingUp(false);
      }
    },
    [initiatePayment, navigation, user, userProfile]
  );

  const renderBalanceCard = () => (
    <LinearGradient
      colors={theme.gradients.wallet}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.balanceCard}
    >
      <View style={styles.balanceHeader}>
        <View>
          <Text style={styles.balanceLabel}>Adera Wallet</Text>
          <Text style={styles.balanceSub}>Cards & mobile money via Chapa</Text>
        </View>
        <MaterialCommunityIcons name="wallet-outline" size={30} color="#FFFFFF" />
      </View>
      <Text style={styles.balanceValue}>
        {balance.toLocaleString('en-ET', { style: 'currency', currency: 'ETB' })}
      </Text>
      <View style={styles.balanceRow}>
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatLabel}>Pending</Text>
          <Text style={styles.balanceStatValue}>{formatAmount(pendingBalance)}</Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatLabel}>Total spent</Text>
          <Text style={styles.balanceStatValue}>{formatAmount(totalSpent)}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderTopUp = () => (
    <Card style={styles.sectionCard} elevation={1}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Top up</Text>
      <Text style={[styles.sectionCaption, { color: theme.colors.onSurfaceVariant }]}>
        Choose an amount or enter a custom one. Payments are processed securely by Chapa.
      </Text>
      <View style={styles.presetRow}>
        {TOP_UP_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.presetChip, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() => handleTopUp(preset)}
            disabled={toppingUp}
          >
            <Text style={[styles.presetText, { color: theme.colors.onPrimaryContainer }]}>{preset} ETB</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.customRow}>
        <TextInput
          label="Custom amount"
          value={topUpAmount}
          onChangeText={setTopUpAmount}
          keyboardType="numeric"
          leftIcon="cash"
          style={styles.customInput}
        />
        <Button
          title="Top Up"
          onPress={() => handleTopUp(topUpAmount)}
          loading={toppingUp}
          disabled={toppingUp || !topUpAmount}
          style={styles.topUpButton}
        />
      </View>
    </Card>
  );

  const renderTransaction = (txn) => {
    const meta = TX_META[txn.type] || TX_META.credit;
    const isCredit = (TX_META[txn.type]?.sign || '+') === '+';
    return (
      <View key={txn.id} style={[styles.txnRow, { borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={[styles.txnIcon, { backgroundColor: `${meta.color}22` }]}>
          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={styles.txnMeta}>
          <Text style={[styles.txnTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {txn.description || `${txn.type} · ${txn.reference_type || 'wallet'}`}
          </Text>
          <Text style={[styles.txnDate, { color: theme.colors.onSurfaceVariant }]}>
            {formatDateTime(txn.created_at)}
          </Text>
        </View>
        <Text style={[styles.txnAmount, { color: isCredit ? '#4CAF50' : theme.colors.onSurface }]}>
          {formatAmount(txn.amount, meta.sign)}
        </Text>
      </View>
    );
  };

  const renderTransactions = () => (
    <Card style={styles.sectionCard} elevation={1}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Transactions</Text>
        <Text style={[styles.sectionCaption, { color: theme.colors.onSurfaceVariant }]}>
          {transactions.length} recent
        </Text>
      </View>
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="receipt" size={40} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No transactions yet. Top up to see your history here.
          </Text>
        </View>
      ) : (
        transactions.map(renderTransaction)
      )}
    </Card>
  );

  return (
    <SafeArea edges={['top', 'bottom']}>
      <AppBar title="Wallet" onBack={() => navigation?.goBack?.()} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {!walletAvailable && !loading ? (
          <Card style={[styles.sectionCard, styles.unavailableCard]} elevation={1}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.unavailableTitle, { color: theme.colors.onSurface }]}>
              Wallet is coming soon
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              The Adera Wallet hasn't been activated for your account yet. Your parcels can still be paid
              with cash on drop-off or by card via Chapa.
            </Text>
          </Card>
        ) : (
          <>
            {renderBalanceCard()}
            {renderTopUp()}
            {renderTransactions()}
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  balanceCard: { borderRadius: 20, padding: 22, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  balanceLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  balanceSub: { color: '#fff', opacity: 0.7, fontSize: 13, marginTop: 2 },
  balanceValue: { color: '#fff', fontSize: 34, fontWeight: '700', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceStat: { flex: 1 },
  balanceStatLabel: { color: '#fff', opacity: 0.7, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceStatValue: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 4 },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 16, alignSelf: 'stretch', marginVertical: 4 },
  sectionCard: { padding: 18, borderRadius: 18, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCaption: { fontSize: 13 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  presetText: { fontWeight: '600', fontSize: 14 },
  customRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  customInput: { flex: 1 },
  topUpButton: { marginBottom: 4 },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomStyle: 'solid' },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnMeta: { flex: 1, gap: 2 },
  txnTitle: { fontSize: 14, fontWeight: '600' },
  txnDate: { fontSize: 12 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  unavailableCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  unavailableTitle: { fontSize: 18, fontWeight: '700' },
});

export default Wallet;
