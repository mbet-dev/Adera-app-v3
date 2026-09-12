import React, { useState } from 'react';
import { Platform } from 'react-native';
import { AppBottomNavigation } from '@adera/ui';

// Import Staff screens
import StaffDashboard from '../screens/staff/StaffDashboard';
import ParcelOversight from '../screens/staff/ParcelOversight';
import Analytics from '../screens/staff/Analytics';
import Support from '../screens/staff/Support';
import StaffProfile from '../screens/staff/StaffProfile';

const StaffNavigator = () => {
  const routes = [
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'parcels', title: 'Oversight', focusedIcon: 'eye', unfocusedIcon: 'eye-outline' },
    { key: 'support', title: 'Support', focusedIcon: 'help-circle', unfocusedIcon: 'help-circle-outline' },
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
    dashboard: StaffDashboard,
    parcels: ParcelOversight,
    support: Support,
    profile: StaffProfile,
  });

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default StaffNavigator;
