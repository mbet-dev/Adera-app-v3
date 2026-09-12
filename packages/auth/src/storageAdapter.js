import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage adapter for Supabase that works on both web and native
 * Supabase expects a storage interface with getItem, setItem, removeItem methods
 */
export const createStorageAdapter = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    // Web: Use localStorage
    return {
      getItem: (key) => {
        try {
          return Promise.resolve(window.localStorage.getItem(key));
        } catch (error) {
          console.warn('[storageAdapter] localStorage.getItem error:', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.warn('[storageAdapter] localStorage.setItem error:', error);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.warn('[storageAdapter] localStorage.removeItem error:', error);
          return Promise.resolve();
        }
      },
    };
  } else {
    // Native: Use AsyncStorage
    return {
      getItem: async (key) => {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.warn('[storageAdapter] AsyncStorage.getItem error:', error);
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.warn('[storageAdapter] AsyncStorage.setItem error:', error);
        }
      },
      removeItem: async (key) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.warn('[storageAdapter] AsyncStorage.removeItem error:', error);
        }
      },
    };
  }
};

