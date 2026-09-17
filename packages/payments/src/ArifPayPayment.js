/**
 * ArifPay Payment Gateway Integration
 *
 * ArifPay is an Ethiopian payment gateway.
 * Full implementation pending — this is a stub that provides
 * the interface contract.
 */

/**
 * Initialize an ArifPay payment.
 * @param {Object} params
 * @returns {Promise<{checkoutUrl: string, transactionId: string}>}
 */
export async function initializeArifPayPayment({ amount, currency = 'ETB', email, phone, description }) {
  const apiKey = process.env.EXPO_PUBLIC_ARIFPAY_API_KEY;

  if (!apiKey) {
    throw new Error('ArifPay not configured. Set EXPO_PUBLIC_ARIFPAY_API_KEY.');
  }

  // TODO: Implement actual ArifPay API integration
  throw new Error(
    'ArifPay integration is not yet implemented. Please use Chapa or Cash on Delivery.',
  );
}

/**
 * Verify an ArifPay transaction.
 */
export async function verifyArifPayPayment(transactionId) {
  throw new Error('ArifPay verification not yet implemented.');
}

export default {
  initializePayment: initializeArifPayPayment,
  verifyPayment: verifyArifPayPayment,
};
