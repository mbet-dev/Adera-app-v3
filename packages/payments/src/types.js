/**
 * Payment types for the Adera Hybrid App.
 *
 * Chapa is the single supported payment gateway (card, bank, and mobile money
 * via Chapa's unified checkout — including TeleBirr funding sources handled by
 * Chapa itself). Wallet and COD are Adera-native settlement methods.
 */

export const PaymentMethod = {
  CHAPA: 'chapa',
  WALLET: 'wallet',
  COD: 'cod',
};

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.CHAPA]: 'Chapa (Card / Mobile Money)',
  [PaymentMethod.WALLET]: 'Adera Wallet',
  [PaymentMethod.COD]: 'Cash on Delivery',
};

export const PAYMENT_METHOD_ICONS = {
  [PaymentMethod.CHAPA]: 'credit-card',
  [PaymentMethod.WALLET]: 'wallet',
  [PaymentMethod.COD]: 'cash',
};
