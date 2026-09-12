import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, GatewayScreen, LoadingScreen, MarketDiscoveryScreen } from '@adera/ui';

import { SafeAreaProvider } from 'react-native-safe-area-context';

// Main App Component
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    setSelectedApp(appType);
    setShowAppSelector(false);
    // For Shop app, only proceed if they selected Shop
    if (appType === 'shop') {
      setShowGateway(true);
    } else {
      // If they selected PTP, redirect them to the PTP app
      // For now, we'll show a message or redirect logic
      setShowGateway(true);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowGateway(false);
    // TODO: Navigate to authenticated app
  };

  const handleGuest = () => {
    setShowGateway(false);
    setGuestMode(true);
  };

  const handleBackToAuth = () => {
    setGuestMode(false);
    setShowGateway(true);
  };

  const handleBackToSelector = () => {
    setGuestMode(false);
    setShowGateway(false);
    setShowAppSelector(true);
  };

  // If authenticated, show main app
  if (isAuthenticated) {
    return (
      <View style={styles.mainContent}>
        {/* TODO: Implement Shop app navigation */}
      </View>
    );
  }

  // Show onboarding flow for new users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show app selector screen
  if (showAppSelector) {
    return <AppSelectorScreen onAppSelect={handleAppSelect} />;
  }

  // Show gateway/auth screen
  if (showGateway) {
    return (
      <GatewayScreen
        onLogin={handleLogin}
        onGuest={handleGuest}
        selectedApp={selectedApp}
      />
    );
  }

  // Show guest mode for browsing
  if (guestMode) {
    return (
      <View style={styles.mainContent}>
        <MarketDiscoveryScreen
          onLoginRequest={handleBackToAuth}
          onBackToSelector={handleBackToSelector}
        />
      </View>
    );
  }

  // Fallback
  return <LoadingScreen message="Loading..." />;
}

// Root App with Providers
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={styles.container}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <AppContent />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
