/**
 * Chapa Payment Gateway Integration
 *
 * Chapa is an Ethiopian payment aggregator supporting:
 * - TeleBirr mobile money
 * - CBE Birr
 * - Amole
 * - M-Pesa
 * - Bank transfer
 *
 * Flow:
 * 1. Client creates a transaction via Chapa's API
 * 2. Chapa returns a checkout URL
 * 3. User is redirected to the Chapa hosted checkout page
 * 4. On completion, Chapa redirects to callback_url
 * 5. Server verifies the transaction via Chapa's verify endpoint
 */

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

/**
 * Initialize a Chapa transaction.
 * @param {Object} params
 * @param {string} params.amount - Amount in ETB
 * @param {string} params.currency - Currency code (default: ETB)
 * @param {string} params.email - Customer email
 * @param {string} params.firstName - Customer first name
 * @param {string} params.lastName - Customer last name
 * @param {string} params.txRef - Unique transaction reference
 * @param {string} params.callbackUrl - Server callback URL
 * @param {string} params.returnUrl - Client redirect URL after payment
 * @param {Object} params.meta - Additional metadata
 * @returns {Promise<{checkoutUrl: string, txRef: string}>}
 */
export async function initializeChapaTransaction({
  amount,
  currency = 'ETB',
  email,
  firstName,
  lastName,
  txRef,
  callbackUrl,
  returnUrl,
  meta = {},
}) {
  const publicKey = process.env.EXPO_PUBLIC_CHAPA_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('Chapa public key not configured. Set EXPO_PUBLIC_CHAPA_PUBLIC_KEY.');
  }

  const body = {
    amount: String(amount),
    currency,
    email,
    first_name: firstName,
    last_name: lastName,
    tx_ref: txRef || generateTxRef(),
    callback_url: callbackUrl || process.env.EXPO_PUBLIC_CHAPA_CALLBACK_URL,
    return_url: returnUrl,
    customization: {
      title: 'Adera Payment',
      description: 'Payment for Adera services',
    },
    meta,
  };

  const response = await fetch(`${CHAPA_BASE_URL}/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.data?.checkout_url) {
    throw new Error(data.message || 'Failed to initialize Chapa payment');
  }

  return {
    checkoutUrl: data.data.checkout_url,
    txRef: body.tx_ref,
    status: data.status,
  };
}

/**
 * Verify a Chapa transaction after payment.
 * @param {string} txRef - Transaction reference
 * @returns {Promise<Object>} Verification result
 */
export async function verifyChapaTransaction(txRef) {
  const publicKey = process.env.EXPO_PUBLIC_CHAPA_PUBLIC_KEY;

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${publicKey}`,
    },
  });

  const data = await response.json();

  return {
    status: data.status,
    txRef: data.data?.tx_ref,
    amount: data.data?.amount,
    currency: data.data?.currency,
    charge: data.data?.charge,
    paymentMethod: data.data?.method,
    statusMessage: data.data?.status,
  };
}

/**
 * Generate a unique transaction reference.
 */
function generateTxRef() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ADERA-${timestamp}-${random}`;
}

/**
 * Open Chapa checkout in the browser/in-app browser.
 * Uses expo-web-browser for native, window.open for web.
 */
export async function openChapaCheckout(checkoutUrl) {
  const { Platform } = require('react-native');

  if (Platform.OS === 'web') {
    window.open(checkoutUrl, '_blank');
    return { type: 'redirect' };
  }

  // Native: use expo-web-browser
  try {
    const WebBrowser = require('expo-web-browser');
    const result = await WebBrowser.openBrowserAsync(checkoutUrl);
    return { type: 'browser', result };
  } catch (error) {
    throw new Error('Failed to open payment page: ' + error.message);
  }
}

export default {
  initializeTransaction: initializeChapaTransaction,
  verifyTransaction: verifyChapaTransaction,
  openCheckout: openChapaCheckout,
};
