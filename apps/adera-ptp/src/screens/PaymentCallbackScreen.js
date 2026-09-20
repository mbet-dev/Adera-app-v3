import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme, LoadingScreen, Button } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePayment } from '@adera/payments';

/**
 * PaymentCallbackScreen
 *
 * Handles the redirect back from Chapa (or other payment gateways).
 * Reads the tx_ref from the URL query params, verifies the transaction,
 * and shows success/failure to the user.
 */
export default function PaymentCallbackScreen({ navigation, route }) {
  const theme = useTheme();
  const { verifyPayment } = usePayment();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        // Extract tx_ref from route params or URL
        const txRef = route?.params?.tx_ref
          || route?.params?.txRef
          || new URLSearchParams(window?.location?.search || '').get('tx_ref')
          || '';

        if (!txRef) {
          setStatus('failed');
          setDetails({ message: 'No transaction reference found.' });
          return;
        }

        const method = route?.params?.paymentMethod || 'chapa';
        const result = await verifyPayment({ method, txRef });

        if (result?.status === 'success' || result?.status === 'completed') {
          setStatus('success');
          setDetails({
            txRef: result.txRef || txRef,
            amount: result.amount,
            currency: result.currency || 'ETB',
            paymentMethod: result.paymentMethod,
          });
        } else {
          setStatus('failed');
          setDetails({
            message: result?.statusMessage || 'Payment could not be verified.',
            txRef,
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setDetails({ message: error.message || 'Verification failed.' });
      }
    };

    verify();
  }, [route?.params]);

  if (status === 'verifying') {
    return <LoadingScreen message="Verifying your payment..." />;
  }

  if (status === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
          </View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Your payment of {details?.amount} {details?.currency || 'ETB'} has been confirmed.
          </Text>
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Transaction Ref
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {details?.txRef}
              </Text>
            </View>
            {details?.paymentMethod && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  Payment Method
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {details.paymentMethod}
                </Text>
              </View>
            )}
          </View>
          <Button
            title="Back to Dashboard"
            onPress={() => navigation?.navigate?.('Dashboard')}
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title="Track Parcel"
            variant="outline"
            onPress={() => navigation?.navigate?.('track')}
            size="lg"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    );
  }

  // Failed
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
          <MaterialCommunityIcons name="close-circle" size={64} color="#F44336" />
        </View>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Payment Failed
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {details?.message || 'Your payment could not be processed.'}
        </Text>
        {details?.txRef && (
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Transaction Ref
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {details.txRef}
              </Text>
            </View>
          </View>
        )}
        <Button
          title="Try Again"
          onPress={() => navigation?.goBack?.()}
          size="lg"
          style={styles.actionButton}
        />
        <Button
          title="Back to Dashboard"
          variant="outline"
          onPress={() => navigation?.navigate?.('Dashboard')}
          size="lg"
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    width: '100%',
    marginTop: 8,
  },
  secondaryButton: {
    width: '100%',
  },
});
