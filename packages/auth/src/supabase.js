import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { createStorageAdapter } from './storageAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[auth] Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

// Create platform-specific storage adapter
// Legacy token migration: copy existing custom keys to the new default key if present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyToken = localStorage.getItem('adera-auth-token') || localStorage.getItem('@supabase.auth.token');
    if (legacyToken && !localStorage.getItem('supabase.auth.token')) {
      localStorage.setItem('supabase.auth.token', legacyToken);
      console.log('[auth] Migrated legacy auth token to default key');
    }
  } catch (e) {
    console.warn('[auth] Legacy auth token migration failed:', e);
  }
}
// END migration snippet
// Create platform-specific storage adapter
const storageAdapter = createStorageAdapter();

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce',
    // Enhanced session management settings
    // More tolerant session settings
    debug: process.env.NODE_ENV === 'development',
  },
  // Global settings for better session management
  global: {
    headers: {
      'x-client-info': 'adera-hybrid-app',
    },
  },
});

export default supabase;
