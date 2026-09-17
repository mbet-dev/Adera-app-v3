/**
 * Payment types for the Adera Hybrid App.
 */

export const PaymentMethod = {
  TELEBIRR: 'telebirr',
  CHAPA: 'chapa',
  ARIFPAY: 'arifpay',
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
  [PaymentMethod.TELEBIRR]: 'TeleBirr',
  [PaymentMethod.CHAPA]: 'Chapa',
  [PaymentMethod.ARIFPAY]: 'ArifPay',
  [PaymentMethod.WALLET]: 'Adera Wallet',
  [PaymentMethod.COD]: 'Cash on Delivery',
};

export const PAYMENT_METHOD_ICONS = {
  [PaymentMethod.TELEBIRR]: 'cellphone',
  [PaymentMethod.CHAPA]: 'credit-card',
  [PaymentMethod.ARIFPAY]: 'credit-card-outline',
  [PaymentMethod.WALLET]: 'wallet',
  [PaymentMethod.COD]: 'cash',
};
