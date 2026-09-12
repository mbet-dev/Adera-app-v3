import React, { useState } from 'react';
import { Platform } from 'react-native';
import { AppBottomNavigation, CustomFAB } from '@adera/ui';

// Import Driver screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import RouteMap from '../screens/driver/RouteMap';
import TaskList from '../screens/driver/TaskList';
import DriverPerformance from '../screens/driver/DriverPerformance';
import DriverProfile from '../screens/driver/DriverProfile';

const DriverNavigator = () => {
  const routes = [
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'tasks', title: 'Tasks', focusedIcon: 'format-list-bulleted', unfocusedIcon: 'format-list-bulleted' },
    { key: 'performance', title: 'Performance', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
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
    dashboard: DriverDashboard,
    tasks: TaskList,
    performance: DriverPerformance,
    profile: DriverProfile,
  });

  const renderFab = () => {
    if (routes[index].key === 'tasks') {
      return (
        <CustomFAB
          icon="plus"
          onPress={() => console.log('Add new task FAB pressed')}
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

export default DriverNavigator;
