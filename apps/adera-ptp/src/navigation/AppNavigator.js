import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@adera/auth';
import { LoadingScreen, ErrorBoundary } from '@adera/ui';

import CustomerNavigator from './CustomerNavigator';
import PartnerNavigator from './PartnerNavigator';
import DriverNavigator from './DriverNavigator';
import StaffNavigator from './StaffNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading Adera..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting..." />;
  }

  const getNavigatorForRole = () => {
    switch (role) {
      case 'customer':
        return <CustomerNavigator />;
      case 'partner':
        return <PartnerNavigator />;
      case 'driver':
        return <DriverNavigator />;
      case 'staff':
      case 'admin':
        return <StaffNavigator />;
      default:
        return <CustomerNavigator />;
    }
  };

  return (
    <ErrorBoundary fallbackMessage="Navigation error. Please restart the app.">
      {getNavigatorForRole()}
    </ErrorBoundary>
  );
};

export default AppNavigator;
