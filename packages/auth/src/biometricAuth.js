import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Biometric credential storage for native fingerprint/face-ID login.
 *
 * Credentials are only ever written to the platform keystore
 * (iOS Keychain / Android Keystore) via expo-secure-store, and are only
 * read back after LocalAuthentication.authenticateAsync() succeeds.
 * On web this module is a no-op.
 */

const CREDENTIALS_KEY = 'adera.biometric.credentials';
const isNative = Platform.OS !== 'web';

const isSecureStoreAvailable = async () => {
  try {
    return SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
  } catch {
    return false;
  }
};

/** Persist email/password after a successful password login so biometric login can reuse them. */
export const saveBiometricCredentials = async (email, password) => {
  if (!isNative || !email || !password) return false;
  if (!(await isSecureStoreAvailable())) return false;
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, password }));
    return true;
  } catch (error) {
    console.warn('[BiometricAuth] Failed to save credentials:', error?.message);
    return false;
  }
};

/** Read stored credentials. Callers MUST gate this behind a successful biometric prompt. */
export const loadBiometricCredentials = async () => {
  if (!isNative) return null;
  if (!(await isSecureStoreAvailable())) return null;
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch (error) {
    console.warn('[BiometricAuth] Failed to load credentials:', error?.message);
    return null;
  }
};

/** Remove stored credentials (used when the user disables biometric login). */
export const clearBiometricCredentials = async () => {
  if (!isNative) return;
  if (!(await isSecureStoreAvailable())) return;
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch {
    // Ignore — nothing sensitive is left behind if this fails silently
  }
};

export default {
  saveBiometricCredentials,
  loadBiometricCredentials,
  clearBiometricCredentials,
};
