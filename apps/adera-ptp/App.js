import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, LoadingScreen, MarketDiscoveryScreen, GatewayScreen, ErrorBoundary } from '@adera/ui';
import { AuthProvider, useAuth } from '@adera/auth';
import { PreferencesProvider, usePreferences } from '@adera/preferences';
import { I18nProvider } from '@adera/localization';
import AppNavigator from './src/navigation/AppNavigator';
import ShopNavigator from './src/navigation/ShopNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AppFlowProvider } from './src/context/AppFlowContext';
import ThemelessLoadingScreen from './src/ThemelessLoadingScreen';
import Constants from 'expo-constants';

function I18nSync({ children }) {
  const { language } = usePreferences();
  // Pass language as controlled prop so I18nProvider stays in sync with PreferencesProvider
  return <I18nProvider language={language || 'en'}>{children}</I18nProvider>;
}

function AppContent() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [showShopGateway, setShowShopGateway] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const { isAuthenticated, isLoading, role } = useAuth();

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    setSelectedApp(appType);
    setGuestMode(false);
    if (appType === 'shop') {
      setShowAppSelector(false);
      // Authenticated users skip the gateway
      if (isAuthenticated) {
        setShowShopGateway(false);
      } else {
        setShowShopGateway(true);
      }
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
    // Stay on selectedApp='shop' so after auth we route to ShopNavigator
  };

  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated) {
      setWasAuthenticated(true);
    }
    if (!isAuthenticated && !isLoading && wasAuthenticated) {
      setHasCompletedOnboarding(false);
      setShowAppSelector(false);
      setSelectedApp(null);
      setGuestMode(false);
      setShowShopGateway(false);
      setWasAuthenticated(false);
      if (typeof window !== 'undefined' && window.location) {
        setTimeout(() => { window.location.reload(); }, 500);
      }
    }
  }, [isAuthenticated, isLoading, wasAuthenticated]);

  useEffect(() => {
    if (typeof document !== 'undefined' && Platform.OS === 'web') {
      const rawName = Constants?.expoConfig?.name || Constants?.manifest?.name || '';
      const lower = String(rawName).toLowerCase();
      if (lower.includes('ptp')) document.title = 'Adera-PTP';
      else if (lower.includes('shop')) document.title = 'Adera-Shop';
      else document.title = 'Adera-Hybrid-App';
    }
  }, [isAuthenticated, isLoading, role, hasCompletedOnboarding, showAppSelector]);

  if (isLoading) {
    return <LoadingScreen message="Initializing Adera..." />;
  }

  if (isAuthenticated) {
    // Show app selector for authenticated users switching apps
    if (showAppSelector) {
      return (
        <AppFlowProvider value={{ openAppSelector }}>
          <AppSelectorScreen onAppSelect={handleAppSelect} />
        </AppFlowProvider>
      );
    }

    if (role === null) {
      return <LoadingScreen message="Loading user profile..." />;
    }
    // Route to the appropriate navigator based on which app was selected
    if (selectedApp === 'shop') {
      return (
        <AppFlowProvider value={{ openAppSelector }}>
          <ErrorBoundary fallbackMessage="The Shop encountered an error. Please restart.">
            <ShopNavigator />
          </ErrorBoundary>
        </AppFlowProvider>
      );
    }
    return (
      <AppFlowProvider value={{ openAppSelector }}>
        <ErrorBoundary fallbackMessage="The app encountered an error. Please restart.">
          <AppNavigator />
        </ErrorBoundary>
      </AppFlowProvider>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showAppSelector) {
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

  return (
    <AppFlowProvider value={{ openAppSelector }}>
      <ErrorBoundary fallbackMessage="Authentication error. Please try again.">
        <AuthNavigator />
      </ErrorBoundary>
    </AppFlowProvider>
  );
}

export default function App() {
  const AppWithTheme = () => {
    const { themeMode, isReady } = usePreferences();

    if (!isReady) {
      return <ThemelessLoadingScreen message="Loading preferences..." />;
    }

    const linking = {
      prefixes: [Linking.createURL('/')],
      config: { screens: { AuthCallback: 'auth/callback' } },
    };

    return (
      <ThemeProvider forceLightMode={false} initialMode={themeMode}>
        <AuthProvider>
          <NavigationContainer linking={linking} theme={DefaultTheme}>
            <ErrorBoundary fallbackMessage="Adera needs to restart.">
              <View style={styles.container}>
                <StatusBar style="auto" />
                <AppContent />
              </View>
            </ErrorBoundary>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    );
  };

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <I18nSync>
          <AppWithTheme />
        </I18nSync>
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
