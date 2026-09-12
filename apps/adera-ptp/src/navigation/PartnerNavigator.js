import React, { useState } from 'react';
import { Platform } from 'react-native';
import { AppBottomNavigation, CustomFAB } from '@adera/ui';

// Import Partner screens
import PartnerDashboard from '../screens/partner/PartnerDashboard';
import ScanQR from '../screens/partner/ScanQR';
import ParcelManagement from '../screens/partner/ParcelManagement';
import Earnings from '../screens/partner/Earnings';
import PartnerProfile from '../screens/partner/PartnerProfile';

const PartnerNavigator = () => {
  const routes = [
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'scan', title: 'Scan QR', focusedIcon: 'qrcode', unfocusedIcon: 'qrcode' },
    { key: 'parcels', title: 'Parcels', focusedIcon: 'package-variant', unfocusedIcon: 'package-variant-closed' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'cash', unfocusedIcon: 'cash-multiple' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account-circle', unfocusedIcon: 'account-circle-outline' },
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
    dashboard: PartnerDashboard,
    scan: ScanQR,
    parcels: ParcelManagement,
    earnings: Earnings,
    profile: PartnerProfile,
  });

  const renderFab = () => {
    if (routes[index].key === 'scan') {
      return (
        <CustomFAB
          icon="qrcode-scan"
          onPress={() => console.log('Scan QR FAB pressed')}
        />
      );
    }
    return null;
  };

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderFab={renderFab}
    />
  );
};

export default PartnerNavigator;
