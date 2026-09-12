import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@adera/auth';
import { LoadingScreen } from '@adera/ui';

// Import screens based on user role
import CustomerNavigator from './CustomerNavigator';
import PartnerNavigator from './PartnerNavigator';
import DriverNavigator from './DriverNavigator';
import StaffNavigator from './StaffNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  // Aggressive runtime logging for state
  React.useEffect(() => {
    console.log('[AppNavigator][STATE]', { isAuthenticated, isLoading, role });
  }, [isAuthenticated, isLoading, role]);

  if (isLoading) {
    console.log('[AppNavigator][STATE] Still loading...');
    return <LoadingScreen message="Loading Adera..." />;
  }

  if (!isAuthenticated) {
    console.log('[AppNavigator][STATE] Not authenticated, redirecting to onboarding');
    // This will be handled by App.js navigation logic
    return <LoadingScreen message="Redirecting..." />;
  }

  // Route based on user role
  const getNavigatorForRole = () => {
    console.log('[AppNavigator][STATE] Routing for role:', role);
    switch (role) {
      case 'customer':
        console.log('[AppNavigator][STATE] Rendering CustomerNavigator');
        return <CustomerNavigator />;
      case 'partner':
        console.log('[AppNavigator][STATE] Rendering PartnerNavigator');
        return <PartnerNavigator />;
      case 'driver':
        console.log('[AppNavigator][STATE] Rendering DriverNavigator');
        return <DriverNavigator />;
      case 'staff':
      case 'admin':
        console.log('[AppNavigator][STATE] Rendering StaffNavigator');
        return <StaffNavigator />;
      default:
        console.log('[AppNavigator][STATE] No role matched, using CustomerNavigator as fallback');
        return <CustomerNavigator />; // Default fallback
    }
  };

  const navigator = getNavigatorForRole();
  console.log('[AppNavigator][STATE] Returning navigator:', navigator);
  return navigator;
};

export default AppNavigator;
