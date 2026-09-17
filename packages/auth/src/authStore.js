import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { AuthState } from './types';
import { Platform } from 'react-native';

const PROFILE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Expo SecureStore wrapper for zustand persistence
const setItem = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItem = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

const zustandStorage = {
  setItem,
  getItem,
  removeItem: deleteItem,
};

const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Core state
      session: null,
      userProfile: null,
      authState: AuthState.LOADING,
      isInitialized: false,
      isProfileLoading: false, // New state for profile loading
      profileFetchTimestamp: 0, // Timestamp of the last successful profile fetch
      notifications: [],
      error: null,

      // Actions
      initialize: async () => {
        if (get().isInitialized) {
          console.log('[AuthStore] Already initialized.');
          return;
        }

        console.log('[AuthStore] Initializing auth...');
        set({ authState: AuthState.LOADING });

        // Listen for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`[AuthStore] onAuthStateChange event: ${event}`);
          get().handleAuthStateChange(session);
        });

        // Check initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthStore] Error getting initial session:', error);
        }
        // The onAuthStateChange listener will handle the session and profile fetching.
        // We just need to ensure the initial state is set correctly if no session is found.
        // The initial session check is now handled by the onAuthStateChange callback.
        // We only set isInitialized here.
        set({ isInitialized: true });
        
        // Return unsubscribe function for cleanup
        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      },

      handleAuthStateChange: async (session) => {
        const currentProfile = get().userProfile;
        const isProfileLoading = get().isProfileLoading;
        const profileFetchTimestamp = get().profileFetchTimestamp;
        const now = Date.now();

        if (session?.user) {
          // User is authenticated
          // Determine if a profile fetch is needed
          // 1. No current profile
          // 2. Profile ID doesn't match session user ID (new user or session change)
          // 3. Profile data is stale (older than PROFILE_REFRESH_INTERVAL)
          const needsProfileFetch =
            !currentProfile ||
            currentProfile.id !== session.user.id ||
            (now - profileFetchTimestamp > PROFILE_REFRESH_INTERVAL);

          set({ session, authState: AuthState.AUTHENTICATED, error: null });

          if (needsProfileFetch && !isProfileLoading) {
            await get().fetchUserProfile(session.user.id);
          }
        } else {
          // User is not authenticated
          set({
            session: null,
            userProfile: null,
            authState: AuthState.UNAUTHENTICATED,
            profileFetchTimestamp: 0, // Reset timestamp on sign out
          });
        }
      },

      fetchUserProfile: async (userId) => {
        if (get().isProfileLoading) {
          console.log('[AuthStore] Profile already loading, skipping fetch.');
          return;
        }
        set({ isProfileLoading: true });
        console.log(`[AuthStore] Fetching profile for user: ${userId}`);
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('[AuthStore] User profile not found for id:', userId);
              const minimalProfile = { id: userId, role: 'customer', email: get().session?.user?.email };
              set({ userProfile: minimalProfile });
            } else {
              throw error;
            }
          } else {
            console.log('[AuthStore] User profile fetched successfully.');
            set({ userProfile: profile, profileFetchTimestamp: Date.now() });
          }
        } catch (error) {
          console.error('[AuthStore] Error fetching user profile:', error);
          set({ error: 'Failed to fetch user profile.' });
          const minimalProfile = { id: userId, role: 'customer', email: get().session?.user?.email };
          set({ userProfile: minimalProfile });
        } finally {
          set({ isProfileLoading: false });
        }
      },

      signIn: async (email, password) => {
        set({ authState: AuthState.LOADING, error: null });
        try {
          // First, try to refresh any existing session
          try {
            await supabase.auth.refreshSession();
          } catch (refreshError) {
            console.log('[AuthStore] Session refresh before sign in:', refreshError?.message);
          }

          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            console.error('[AuthStore] Sign in error:', error.message);
            set({ error: error.message, authState: AuthState.UNAUTHENTICATED });
            
            // Check for email not confirmed error
            if (error.message?.toLowerCase().includes('email_not_confirmed') || 
                error.message?.toLowerCase().includes('email not confirmed')) {
              get().addNotification(
                '⚠️ Please confirm your email address before signing in. Check your inbox for the confirmation link.',
                NOTIFICATION_TYPES.WARNING
              );
            } else {
              get().addNotification(
                `Sign in failed: ${error.message}`,
                NOTIFICATION_TYPES.ERROR
              );
            }
            throw error;
          }
          
          // Success - update last_login_at and let onAuthStateChange handle the rest
          try {
            await supabase
              .from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', data.user.id);
          } catch (e) {
            console.warn('[AuthStore] Failed to update last_login_at:', e.message);
          }
          get().addNotification('✅ Signed in successfully!', NOTIFICATION_TYPES.SUCCESS);
          return { success: true, data };
        } catch (error) {
          set({ authState: AuthState.UNAUTHENTICATED });
          throw error;
        }
      },

      signUp: async (email, password, userData) => {
        set({ authState: AuthState.LOADING, error: null });
        try {
          // Get redirect URL for email confirmation
          const getRedirectUrl = () => {
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
              return `${window.location.origin}/auth/callback`;
            }
            return 'com.adera.ptp://auth/callback';
          };

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { 
              data: userData,
              emailRedirectTo: getRedirectUrl(),
            },
          });
          
          if (error) {
            console.error('[AuthStore] Sign up error:', error.message);
            set({ error: error.message, authState: AuthState.UNAUTHENTICATED });
            get().addNotification(
              `Registration failed: ${error.message}`,
              NOTIFICATION_TYPES.ERROR
            );
            throw error;
          }
          
          // Success - show success notification
          get().addNotification(
            '✅ Registration successful! Please check your email to confirm your account.',
            NOTIFICATION_TYPES.SUCCESS
          );
          
          // onAuthStateChange will handle the rest, or user needs to confirm email
          set({ authState: AuthState.UNAUTHENTICATED, error: null });
          return { success: true, data };
        } catch (error) {
          set({ authState: AuthState.UNAUTHENTICATED });
          throw error;
        }
      },

      signOut: async () => {
        set({ authState: AuthState.LOADING, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('[AuthStore] Sign out error:', error.message);
            set({ error: error.message });
            get().addNotification(
              `Sign out failed: ${error.message}`,
              NOTIFICATION_TYPES.ERROR
            );
            // Still force clear the session on the client side
            set({ session: null, userProfile: null, authState: AuthState.UNAUTHENTICATED });
            return { success: false, error: error.message };
          }
          
          // Success - onAuthStateChange will clear the state
          get().addNotification('Signed out successfully', NOTIFICATION_TYPES.SUCCESS);
          return { success: true };
        } catch (error) {
          console.error('[AuthStore] Sign out exception:', error);
          // Force clear on error
          set({ session: null, userProfile: null, authState: AuthState.UNAUTHENTICATED });
          return { success: false, error: error.message || 'Sign out failed' };
        }
      },

      resetPassword: async (email) => {
        set({ error: null });
        try {
          // Get redirect URL for password reset
          const getRedirectUrl = () => {
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
              return `${window.location.origin}/auth/callback?type=recovery`;
            }
            return 'com.adera.ptp://auth/callback?type=recovery';
          };

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl(),
          });
          
          if (error) {
            console.error('[AuthStore] Reset password error:', error.message);
            set({ error: error.message });
            get().addNotification(
              `Password reset failed: ${error.message}`,
              NOTIFICATION_TYPES.ERROR
            );
            throw error;
          }
          
          // Success
          get().addNotification(
            '✅ Password reset email sent! Please check your inbox.',
            NOTIFICATION_TYPES.SUCCESS
          );
          return { success: true };
        } catch (error) {
          throw error;
        }
      },

      resendConfirmationEmail: async (email) => {
        set({ error: null });
        try {
          // Get redirect URL for email confirmation
          const getRedirectUrl = () => {
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
              return `${window.location.origin}/auth/callback`;
            }
            return 'com.adera.ptp://auth/callback';
          };

          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: getRedirectUrl(),
            },
          });
          
          if (error) {
            console.error('[AuthStore] Resend confirmation error:', error.message);
            set({ error: error.message });
            get().addNotification(
              `Failed to resend confirmation email: ${error.message}`,
              NOTIFICATION_TYPES.ERROR
            );
            throw error;
          }
          
          // Success
          get().addNotification(
            '✅ Confirmation email sent! Please check your inbox.',
            NOTIFICATION_TYPES.SUCCESS
          );
          return { success: true };
        } catch (error) {
          throw error;
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AuthStore] Refresh session error:', error.message);
            throw error;
          }
          // onAuthStateChange will handle the session update
          return { success: true, data };
        } catch (error) {
          console.error('[AuthStore] Refresh session exception:', error);
          throw error;
        }
      },

      checkEmailConfirmationStatus: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            return {
              isConfirmed: !!session.user.email_confirmed_at,
              email: session.user.email,
            };
          }
          return { isConfirmed: false, email: null };
        } catch (error) {
          console.error('[AuthStore] Check confirmation status error:', error);
          return { isConfirmed: false, email: null };
        }
      },

      // Notification helpers
      addNotification: (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
        const id = `${Date.now()}-${Math.random()}`;
        const notification = { id, message, type, timestamp: Date.now() };
        set((state) => ({ 
          notifications: [...state.notifications, notification].slice(-10) // Keep last 10 notifications
        }));
        if (duration > 0) {
          setTimeout(() => get().dismissNotification(id), duration);
        }
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'adera-auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        // Persist only the session and userProfile. authState should not be persisted.
        session: state.session,
        userProfile: state.userProfile,
        profileFetchTimestamp: state.profileFetchTimestamp, // Persist timestamp to prevent immediate refetch on app restart
      }),
      version: 5, // v5: consolidated users table, last_login_at tracking
    }
  )
);
