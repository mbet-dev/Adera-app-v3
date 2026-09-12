import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const THEME_KEY = '@adera/preferences/themeMode';
const LANGUAGE_KEY = '@adera/preferences/language';
const BIOMETRIC_KEY = 'adera.preferences.biometricEnabled';

const defaultState = {
  themeMode: 'system',
  language: 'en',
  biometricEnabled: false,
};

const PreferencesContext = createContext(null);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [state, setState] = useState(defaultState);
  const [isReady, setIsReady] = useState(false);
  
  // Detect if we're on web platform
  const isWeb = Platform.OS === 'web';

  const loadPreferences = useCallback(async () => {
    try {
      console.log('[PreferencesProvider] Loading preferences, platform:', Platform.OS, 'isWeb:', isWeb);
      
      let storedTheme = null;
      let storedLanguage = null;

      // On web, use localStorage directly for better reliability
      if (isWeb && typeof localStorage !== 'undefined') {
        try {
          storedTheme = localStorage.getItem(THEME_KEY);
          storedLanguage = localStorage.getItem(LANGUAGE_KEY);
          console.log('[PreferencesProvider] [WEB] Loaded from localStorage - theme:', storedTheme, 'language:', storedLanguage);
        } catch (localStorageError) {
          console.error('[PreferencesProvider] [WEB] localStorage failed:', localStorageError);
        }
      } else {
        // On native, use AsyncStorage
        try {
          [storedTheme, storedLanguage] = await Promise.all([
            AsyncStorage.getItem(THEME_KEY),
            AsyncStorage.getItem(LANGUAGE_KEY),
          ]);
          console.log('[PreferencesProvider] [NATIVE] Loaded from AsyncStorage - theme:', storedTheme, 'language:', storedLanguage);
        } catch (asyncError) {
          console.error('[PreferencesProvider] [NATIVE] AsyncStorage failed:', asyncError);
        }
      }

      let biometricEnabled = false;
      try {
        const secureAvailable = SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
        if (secureAvailable) {
          const storedBiometric = await SecureStore.getItemAsync(BIOMETRIC_KEY);
          biometricEnabled = storedBiometric === 'true';
          console.log('[PreferencesProvider] Biometric enabled:', biometricEnabled);
        }
      } catch (error) {
        // Ignore secure storage errors to keep preferences functional
        console.warn('[PreferencesProvider] Secure storage unavailable:', error.message);
      }

      setState((prev) => ({
        ...prev,
        themeMode: storedTheme || defaultState.themeMode,
        language: storedLanguage || defaultState.language,
        biometricEnabled,
      }));
      console.log('[PreferencesProvider] Preferences loaded successfully');
    } catch (error) {
      console.error('[PreferencesProvider] Error loading preferences:', error);
      // Fallback to defaults when persistence fails
      setState(defaultState);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const setThemeMode = useCallback(async (newMode) => {
    if (newMode === state.themeMode) return; // no-op if no change
    console.log('[PreferencesProvider] Setting theme mode to:', newMode, 'platform:', Platform.OS);
    setState((prev) => ({ ...prev, themeMode: newMode }));
    try {
      // On web, use localStorage directly
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_KEY, newMode);
        console.log('[PreferencesProvider] [WEB] Theme mode saved to localStorage:', newMode);
      } else {
        // On native, use AsyncStorage
        await AsyncStorage.setItem(THEME_KEY, newMode);
        console.log('[PreferencesProvider] [NATIVE] Theme mode saved to AsyncStorage:', newMode);
      }
    } catch (error) {
      console.error('[PreferencesProvider] Failed to save theme mode:', error);
    }
  }, [state.themeMode, isWeb]);

  const setLanguage = useCallback(async (code) => {
    if (code === state.language) return; // no-op if no change
    console.log('[PreferencesProvider] Setting language to:', code, 'platform:', Platform.OS);
    setState((prev) => ({ ...prev, language: code }));
    try {
      // On web, use localStorage directly
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_KEY, code);
        console.log('[PreferencesProvider] [WEB] Language saved to localStorage:', code);
      } else {
        // On native, use AsyncStorage
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
        console.log('[PreferencesProvider] [NATIVE] Language saved to AsyncStorage:', code);
      }
    } catch (error) {
      console.error('[PreferencesProvider] Failed to save language:', error);
    }
  }, [state.language, isWeb]);

  const persistBiometric = useCallback(async (enabled) => {
    setState((prev) => ({ ...prev, biometricEnabled: enabled }));
    try {
      const secureAvailable = SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
      if (!secureAvailable) {
        return;
      }
      if (enabled) {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
      }
    } catch (error) {
      // Ignore secure storage failures
    }
  }, []);

  const enableBiometrics = useCallback(async () => {
    try {
      console.log('[PreferencesProvider] Enabling biometrics, platform:', Platform.OS);
      // Web platform doesn't support biometrics
      if (Platform.OS === 'web') {
        console.log('[PreferencesProvider] Biometrics not supported on web');
        return { success: false, error: 'web_not_supported' };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'hardware_unavailable' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'not_enrolled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'authentication_failed' };
      }

      await persistBiometric(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message || 'unknown_error' };
    }
  }, [persistBiometric]);

  const disableBiometrics = useCallback(async () => {
    await persistBiometric(false);
    return { success: true };
  }, [persistBiometric]);

  const refreshPreferences = useCallback(() => {
    console.log('[PreferencesProvider] Refreshing preferences...');
    loadPreferences();
  }, [loadPreferences]);
  
  const clearPreferences = useCallback(async () => {
    console.log('[PreferencesProvider] Clearing all preferences, platform:', Platform.OS);
    try {
      // Clear state first
      setState(defaultState);
      
      // Clear storage based on platform
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.removeItem(THEME_KEY);
        localStorage.removeItem(LANGUAGE_KEY);
        console.log('[PreferencesProvider] [WEB] Cleared localStorage');
      } else {
        await AsyncStorage.multiRemove([THEME_KEY, LANGUAGE_KEY]);
        console.log('[PreferencesProvider] [NATIVE] Cleared AsyncStorage');
      }
      
      // Clear biometric if available
      try {
        const secureAvailable = SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
        if (secureAvailable) {
          await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
        }
      } catch (e) {
        // Ignore secure storage errors
      }
    } catch (error) {
      console.error('[PreferencesProvider] Error clearing preferences:', error);
    }
  }, [isWeb]);

  const contextValue = useMemo(() => ({
    ...state,
    isReady,
    setThemeMode,
    setLanguage,
    enableBiometrics,
    disableBiometrics,
    refreshPreferences,
    clearPreferences,
  }), [state, isReady, setThemeMode, setLanguage, enableBiometrics, disableBiometrics, refreshPreferences, clearPreferences]);

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};
