import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { PaymentMethod, PaymentStatus } from './types';

const PaymentContext = createContext(null);

/**
 * PaymentProvider wraps the app and provides payment orchestration.
 *
 * It selects the appropriate gateway based on the chosen payment method
 * and handles the initialize → redirect → verify lifecycle.
 */
export const PaymentProvider = ({ children }) => {
  /**
   * Start a payment flow for the given method and details.
   * Returns { checkoutUrl, txRef } for redirect-based gateways,
   * or { confirmed: true } for wallet/COD.
   */
  const initiatePayment = useCallback(async ({ method, amount, orderId, customer, items }) => {
    switch (method) {
      case PaymentMethod.CHAPA: {
        const { initializeChapaTransaction } = require('./ChapaPayment');
        return initializeChapaTransaction({
          amount,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          txRef: orderId,
          meta: { orderId, itemCount: items?.length },
        });
      }

      case PaymentMethod.TELEBIRR: {
        const { initializeTelebirrPayment } = require('./TeleBirrPayment');
        return initializeTelebirrPayment({ amount, orderId, phone: customer.phone });
      }

      case PaymentMethod.ARIFPAY: {
        const { initializeArifPayPayment } = require('./ArifPayPayment');
        return initializeArifPayPayment({ amount, email: customer.email, phone: customer.phone });
      }

      case PaymentMethod.WALLET:
        // Wallet payment is handled server-side after balance check
        return { confirmed: false, requiresBalanceCheck: true };

      case PaymentMethod.COD:
        // COD is confirmed on delivery
        return { confirmed: true, status: PaymentStatus.PENDING };

      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }, []);

  /**
   * Verify a payment after the user returns from the payment gateway.
   */
  const verifyPayment = useCallback(async ({ method, txRef }) => {
    switch (method) {
      case PaymentMethod.CHAPA: {
        const { verifyChapaTransaction } = require('./ChapaPayment');
        return verifyChapaTransaction(txRef);
      }
      case PaymentMethod.TELEBIRR: {
        const { verifyTelebirrPayment } = require('./TelebirrPayment');
        return verifyTelebirrPayment(txRef);
      }
      case PaymentMethod.ARIFPAY: {
        const { verifyArifPayPayment } = require('./ArifPayPayment');
        return verifyArifPayPayment(txRef);
      }
      default:
        return { status: PaymentStatus.COMPLETED };
    }
  }, []);

  const contextValue = useMemo(() => ({
    initiatePayment,
    verifyPayment,
  }), [initiatePayment, verifyPayment]);

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentProvider;
