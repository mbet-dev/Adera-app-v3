import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppBottomNavigation } from '@adera/ui';

// Import Customer screens
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import CreateParcel from '../screens/customer/CreateParcel';
import TrackParcel from '../screens/customer/TrackParcel';
import ParcelHistory from '../screens/customer/ParcelHistory';
import Profile from '../screens/customer/Profile';
import Wallet from '../screens/customer/Wallet';
import Services from '../screens/customer/Services';
import Support from '../screens/customer/Support';
import PaymentCallbackScreen from '../screens/PaymentCallbackScreen';

const CustomerStack = createNativeStackNavigator();

const TAB_ROUTES = [
  { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
  { key: 'create', title: 'Send', focusedIcon: 'send', unfocusedIcon: 'send-outline' },
  { key: 'track', title: 'Track', focusedIcon: 'map-marker', unfocusedIcon: 'map-marker-outline' },
  { key: 'history', title: 'History', focusedIcon: 'clock-outline', unfocusedIcon: 'clock-outline' },
  { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
];

const TAB_KEYS = TAB_ROUTES.map((route) => route.key);

const SCENES = {
  dashboard: CustomerDashboard,
  create: CreateParcel,
  track: TrackParcel,
  history: ParcelHistory,
  profile: Profile,
};

// Initialize index based on URL hash in web environment (if present)
const getInitialIndex = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const routeIndex = TAB_ROUTES.findIndex((route) => route.key === hash);
      if (routeIndex >= 0) {
        return routeIndex;
      }
    }
  }
  return 0;
};

/**
 * Bottom tab scenes rendered by react-native-paper's BottomNavigation only
 * receive `route`/`jumpTo` — not a react-navigation `navigation` object. Every
 * `navigation.navigate(...)` call inside those screens was silently ignored.
 * CustomerTabs injects a bridged `navigation` object so screens can:
 *   - navigate('dashboard' | 'create' | 'track' | 'history' | 'profile')
 *       → switch tab (optionally passing params, e.g. { trackingId })
 *   - navigate('wallet' | 'services' | 'support' | 'paymentCallback')
 *       → push a full-screen stack route on top of the tabs
 */
function CustomerTabs({ navigation: stackNavigation, route: stackRoute }) {
  const [index, setIndex] = useState(getInitialIndex);
  // Per-tab params (e.g. track: { trackingId }) so scenes get a react-navigation-shaped route.
  const [tabParams, setTabParams] = useState({});

  // Honor stack-level tab requests (e.g. PaymentCallbackScreen → navigate('customerTabs', { tab: 'track', trackingId }))
  React.useEffect(() => {
    const tab = stackRoute?.params?.tab;
    if (!tab) return;
    const routeIndex = TAB_KEYS.indexOf(tab);
    if (routeIndex >= 0) {
      setIndex(routeIndex);
      if (stackRoute.params.trackingId) {
        setTabParams((prev) => ({ ...prev, track: { trackingId: stackRoute.params.trackingId } }));
      }
    }
  }, [stackRoute?.params?.tab, stackRoute?.params?.trackingId]);

  const handleSceneNavigation = useCallback(
    (screen, params) => {
      if (TAB_KEYS.includes(screen)) {
        if (params) {
          setTabParams((prev) => ({ ...prev, [screen]: params }));
        }
        const routeIndex = TAB_KEYS.indexOf(screen);
        setIndex(routeIndex);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', `#${screen}`);
        }
      } else {
        // wallet / services / support / paymentCallback → stack routes
        stackNavigation.navigate(screen, params);
      }
    },
    [stackNavigation]
  );

  const renderScene = ({ route, jumpTo }) => {
    const Scene = SCENES[route.key];
    if (!Scene) return null;
    return (
      <Scene
        key={route.key}
        navigation={{
          navigate: handleSceneNavigation,
          goBack: () => jumpTo('dashboard'),
        }}
        route={{ key: route.key, params: tabParams[route.key] }}
      />
    );
  };

  return (
    <AppBottomNavigation
      navigationState={{ index, routes: TAB_ROUTES }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
}

const CustomerNavigator = () => {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="customerTabs" component={CustomerTabs} />
      <CustomerStack.Screen
        name="wallet"
        component={Wallet}
        options={{ animation: 'slide_from_right' }}
      />
      <CustomerStack.Screen
        name="services"
        component={Services}
        options={{ animation: 'slide_from_right' }}
      />
      <CustomerStack.Screen
        name="support"
        component={Support}
        options={{ animation: 'slide_from_right' }}
      />
      <CustomerStack.Screen
        name="paymentCallback"
        component={PaymentCallbackScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </CustomerStack.Navigator>
  );
};

export default CustomerNavigator;
