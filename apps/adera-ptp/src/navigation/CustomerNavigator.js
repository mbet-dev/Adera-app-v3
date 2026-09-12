import React, { useState } from 'react';
import { Platform } from 'react-native';
import { AppBottomNavigation } from '@adera/ui';

// Import Customer screens
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import CreateParcel from '../screens/customer/CreateParcel';
import TrackParcel from '../screens/customer/TrackParcel';
import ParcelHistory from '../screens/customer/ParcelHistory';
import Profile from '../screens/customer/Profile';

const CustomerNavigator = () => {
  const routes = [
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'create', title: 'Send', focusedIcon: 'send', unfocusedIcon: 'send-outline' },
    { key: 'track', title: 'Track', focusedIcon: 'map-marker', unfocusedIcon: 'map-marker-outline' },
    { key: 'history', title: 'History', focusedIcon: 'clock-outline', unfocusedIcon: 'clock-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ];

  // Initialize index based on URL hash in web environment (if present)
  const getInitialIndex = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const routeIndex = routes.findIndex(route => route.key === hash);
        if (routeIndex >= 0) {
          return routeIndex;
        }
      }
    }
    return 0;
  };

  const [index, setIndex] = useState(getInitialIndex);

  const renderScene = AppBottomNavigation.SceneMap({
    dashboard: CustomerDashboard,
    create: CreateParcel,
    track: TrackParcel,
    history: ParcelHistory,
    profile: Profile,
  });

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default CustomerNavigator;
