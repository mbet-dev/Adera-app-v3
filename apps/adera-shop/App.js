import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, GatewayScreen, LoadingScreen, ErrorBoundary } from '@adera/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@adera/auth';
import { PreferencesProvider, usePreferences } from '@adera/preferences';
import Constants from 'expo-constants';

// Screens
import MarketDiscoveryScreen from './screens/MarketDiscoveryScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ShoppingCartScreen from './screens/ShoppingCartScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';

const Stack = createNativeStackNavigator();

function ShopNavigator({ onLoginRequest }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="market">
        {(props) => <MarketDiscoveryScreen {...props} onLoginRequest={onLoginRequest} />}
      </Stack.Screen>
      <Stack.Screen name="productDetail" component={ProductDetailScreen} />
      <Stack.Screen name="cart" component={ShoppingCartScreen} />
      <Stack.Screen name="orderHistory" component={OrderHistoryScreen} />
    </Stack.Navigator>
  );
}

function AuthShopNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="market">
        {({ navigation }) => (
          <MarketDiscoveryScreen
            navigation={navigation}
            onLoginRequest={() => {}}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="productDetail" component={ProductDetailScreen} />
      <Stack.Screen name="cart" component={ShoppingCartScreen} />
      <Stack.Screen name="orderHistory" component={OrderHistoryScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    setSelectedApp(appType);
    setShowAppSelector(false);
    if (appType === 'shop') {
      setShowGateway(true);
    } else {
      setShowGateway(true);
    }
  };

  const handleLogin = () => {
    setShowGateway(false);
    setGuestMode(false);
  };

  const handleGuest = () => {
    setShowGateway(false);
    setGuestMode(true);
  };

  const handleBackToSelector = () => {
    setGuestMode(false);
    setShowGateway(false);
    setShowAppSelector(true);
  };

  if (isLoading) {
    return <LoadingScreen message="Initializing Adera Shop…" />;
  }

  // Authenticated users go straight to the shop
  if (isAuthenticated) {
    return <AuthShopNavigator />;
  }

  // Guest mode
  if (guestMode) {
    return (
      <ShopNavigator
        onLoginRequest={() => {
          setGuestMode(false);
          setShowGateway(true);
        }}
      />
    );
  }

  // Onboarding flow
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showAppSelector) {
    return <AppSelectorScreen onAppSelect={handleAppSelect} />;
  }

  if (showGateway) {
    return (
      <GatewayScreen
        onLogin={handleLogin}
        onGuest={handleGuest}
        selectedApp={selectedApp}
      />
    );
  }

  return <LoadingScreen message="Loading…" />;
}

export default function App() {
  const AppWithTheme = () => {
    const { themeMode, isReady } = usePreferences();

    if (!isReady) {
      return <LoadingScreen message="Loading preferences…" />;
    }

    const linking = {
      prefixes: [],
      config: {},
    };

    return (
      <ThemeProvider forceLightMode={false} initialMode={themeMode}>
        <AuthProvider>
          <NavigationContainer linking={linking} theme={DefaultTheme}>
            <ErrorBoundary fallbackMessage="Adera Shop needs to restart.">
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
