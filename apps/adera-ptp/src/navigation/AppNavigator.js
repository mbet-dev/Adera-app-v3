import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@adera/auth';
import { LoadingScreen, ErrorBoundary } from '@adera/ui';

import CustomerNavigator from './CustomerNavigator';
import PartnerNavigator from './PartnerNavigator';
import DriverNavigator from './DriverNavigator';
import StaffNavigator from './StaffNavigator';
import PaymentCallbackScreen from '../screens/PaymentCallbackScreen';

const Stack = createNativeStackNavigator();

const RoleNavigator = () => {
  const { role } = useAuth();
  switch (role) {
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

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading Adera..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting..." />;
  }

  return (
    <ErrorBoundary fallbackMessage="Navigation error. Please restart the app.">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={RoleNavigator} />
        <Stack.Screen
          name="paymentCallback"
          component={PaymentCallbackScreen}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

export default AppNavigator;
