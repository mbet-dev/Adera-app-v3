import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, LoadingScreen, MarketDiscoveryScreen, GatewayScreen } from '@adera/ui';
import { AuthProvider, useAuth } from '@adera/auth';
import { PreferencesProvider, usePreferences } from '@adera/preferences';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AppFlowProvider } from './src/context/AppFlowContext';
import ThemelessLoadingScreen from './src/ThemelessLoadingScreen';
import Constants from 'expo-constants';

// Main App Component
function AppContent() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [showShopGateway, setShowShopGateway] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const { isAuthenticated, isLoading, role } = useAuth();

  console.log('[AppContent][STATE] Render:', { isAuthenticated, isLoading, role, wasAuthenticated });

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    setSelectedApp(appType);
    setGuestMode(false);
    if (appType === 'shop') {
      setShowAppSelector(false);
      setShowShopGateway(true);
    } else {
      setShowAppSelector(false);
      setShowShopGateway(false);
    }
  };

  const openAppSelector = () => {
    setHasCompletedOnboarding(true);
    setShowAppSelector(true);
    setSelectedApp(null);
    setGuestMode(false);
    setShowShopGateway(false);
  };

  const handleShopGuestMode = () => {
    setShowShopGateway(false);
    setGuestMode(true);
  };

  const handleShopLoginRequest = () => {
    setGuestMode(false);
    setShowShopGateway(false);
    setShowAppSelector(false);
  };


  useEffect(() => {
    console.log('[AppContent][STATE] Auth state changed:', { isAuthenticated, isLoading, wasAuthenticated });
    // Track when user becomes authenticated
    if (isAuthenticated && !wasAuthenticated) {
      console.log('[AppContent][STATE] User authenticated, setting wasAuthenticated flag');
      setWasAuthenticated(true);
    }
    // Only reset and reload if user was previously authenticated and is now signed out
    if (!isAuthenticated && !isLoading && wasAuthenticated) {
      console.log('[AppContent][STATE] User signed out (was authenticated), resetting onboarding state');
      setHasCompletedOnboarding(false);
      setShowAppSelector(false);
      setSelectedApp(null);
      setGuestMode(false);
      setShowShopGateway(false);
      setWasAuthenticated(false);
      // On web, force a reload to clear any cached state ONLY after actual sign out
      if (typeof window !== 'undefined' && window.location) {
        console.log('[AppContent][STATE][WEB] Forcing page reload after sign out');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, [isAuthenticated, isLoading, wasAuthenticated]);

  // Helper for correct web title
  const getWebTitle = () => {
    const rawName = Constants?.expoConfig?.name || Constants?.manifest?.name || '';
    const lower = String(rawName).toLowerCase();
    if (lower.includes('ptp')) return 'Adera-PTP';
    if (lower.includes('shop')) return 'Adera-Shop';
    return 'Adera-Hybrid-App';
  };

  useEffect(() => {
    if (typeof document !== 'undefined' && Platform.OS === 'web') {
      document.title = getWebTitle();
    }
  }, [isAuthenticated, isLoading, role, hasCompletedOnboarding, showAppSelector]);

  // Show loading while auth is initializing
  if (isLoading) {
    console.log('[AppContent][STATE] Showing loading screen');
    return <LoadingScreen message="Initializing Adera..." />;
  }

  // If authenticated, show main app only if role is determined
  if (isAuthenticated) {
    if (role === null) {
      // Role not yet determined, keep showing loading to prevent flicker
      console.log('[AppContent][STATE] Authenticated but role not yet determined, waiting...');
      return <LoadingScreen message="Loading user profile..." />;
    }
    console.log('[AppContent][STATE] Authenticated, rendering AppNavigator with role:', role);
    return <AppNavigator />;
  }

  if (!hasCompletedOnboarding) {
    console.log('[AppContent][STATE] Showing onboarding screen');
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showAppSelector) {
    console.log('[AppContent][STATE] Showing app selector screen');
    return <AppSelectorScreen onAppSelect={handleAppSelect} />;
  }

  if (selectedApp === 'shop' && showShopGateway) {
    return (
      <GatewayScreen
        selectedApp="shop"
        onLogin={handleShopLoginRequest}
        onGuest={handleShopGuestMode}
      />
    );
  }

  if (guestMode && selectedApp === 'shop') {
    return (
      <MarketDiscoveryScreen
        onLoginRequest={handleShopLoginRequest}
        onBackToSelector={openAppSelector}
      />
    );
  }

  // Show authentication navigator
  console.log('[AppContent][STATE] Showing AuthNavigator');
  return (
    <AppFlowProvider value={{ openAppSelector }}>
      <AuthNavigator />
    </AppFlowProvider>
  );
}

// Root App with Providers
export default function App() {
  const AppWithTheme = () => {
    const { themeMode, isReady } = usePreferences();

    if (!isReady) {
      return <ThemelessLoadingScreen message="Loading preferences..." />;
    }

    return (
      <ThemeProvider forceLightMode={false} initialMode={themeMode}>
        <AuthProvider>
          <NavigationContainer linking={linking} theme={DefaultTheme}>
            <View style={styles.container}>
              <StatusBar style="auto" />
              <AppContent />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    );
  };

  const linking = {
    prefixes: [Linking.createURL('/')],
    config: { screens: { AuthCallback: 'auth/callback' } },
  };
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppWithTheme />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
