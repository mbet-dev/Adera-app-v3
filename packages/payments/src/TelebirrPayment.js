/**
 * TeleBirr Payment Gateway Integration
 *
 * TeleBirr is Ethiopia's leading mobile money platform.
 * Full implementation pending — this is a stub that provides
 * the interface contract.
 */

/**
 * Initialize a TeleBirr payment.
 * @param {Object} params
 * @returns {Promise<{paymentUrl: string, orderId: string}>}
 */
export async function initializeTelebirrPayment({ amount, orderId, phone, description }) {
  const appId = process.env.EXPO_PUBLIC_TELEBIRR_APP_ID;

  if (!appId) {
    throw new Error('TeleBirr not configured. Set EXPO_PUBLIC_TELEBIRR_APP_ID.');
  }

  // TODO: Implement actual TeleBirr API integration
  // TeleBirr uses a different flow (H5 or C2B) compared to Chapa
  throw new Error(
    'TeleBirr integration is not yet implemented. Please use Chapa or Cash on Delivery.',
  );
}

/**
 * Verify a TeleBirr transaction.
 */
export async function verifyTelebirrPayment(orderId) {
  throw new Error('TeleBirr verification not yet implemented.');
}

export default {
  initializePayment: initializeTelebirrPayment,
  verifyPayment: verifyTelebirrPayment,
};
