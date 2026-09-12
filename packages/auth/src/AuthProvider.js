import React, { createContext, useEffect, useMemo } from 'react';
import { useAuthStore } from './authStore';
import { AuthState } from './types';
import { Platform } from 'react-native';
import { WebStabilityWrapper } from './WebStabilityWrapper';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  // Get state and actions from the Zustand store
  const {
    session,
    userProfile,
    authState,
    isInitialized,
    isProfileLoading, // Destructure isProfileLoading
    notifications,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    refreshSession,
    checkEmailConfirmationStatus,
    addNotification,
    dismissNotification,
  } = useAuthStore();

  // Initialize the auth state on component mount
  useEffect(() => {
    const unsubscribe = initialize();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initialize]);

  // Memoize the context value to prevent unnecessary re-renders
  const authContextValue = useMemo(
    () => ({
    session,
    userProfile,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || !isInitialized,
    isProfileLoading, // Use destructured isProfileLoading
    role: userProfile?.role || null,
    notifications,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    refreshSession,
    checkEmailConfirmationStatus,
    addNotification,
    dismissNotification,
    }),
    [
      session,
      userProfile,
      authState,
      isInitialized,
      isProfileLoading, // Add to dependencies
      notifications,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      resendConfirmationEmail,
      refreshSession,
      checkEmailConfirmationStatus,
      addNotification,
      dismissNotification,
    ]
  );

  // Wrap with a stability layer for web
  const Wrapper = Platform.OS === 'web' ? WebStabilityWrapper : React.Fragment;

  return (
    <AuthContext.Provider value={authContextValue}>
      <Wrapper>{children}</Wrapper>
    </AuthContext.Provider>
  );
};

export default AuthProvider;
