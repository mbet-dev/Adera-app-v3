

import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, SignUpScreen, ForgotPasswordScreen, AuthCallbackScreen } from '../screens/Auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestNavigator from './GuestNavigator';
import { useAuth } from '@adera/auth';
import { LoadingScreen } from '@adera/ui';
import { View, Text, Button } from 'react-native';

const Stack = createNativeStackNavigator();

const PROFILE_LOAD_TIMEOUT = 8000; // 8 seconds

const LoginScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <LoginScreen {...props} />
  </SafeAreaView>
);

const SignUpScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <SignUpScreen {...props} />
  </SafeAreaView>
);

const ForgotPasswordScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <ForgotPasswordScreen {...props} />
  </SafeAreaView>
);


const GuestNavigatorWrapper = (props) => {
  const { navigation } = props;
  // Provide a fallback if navigation is not passed (web)
  const goBackToAuth = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    } else if (window && window.location) {
      // For web fallback, reload or redirect to root
      window.location.href = '/';
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GuestNavigator {...props} onBackToAuth={goBackToAuth} />
    </SafeAreaView>
  );
};

const AuthNavigator = () => {
  const { isLoading, userProfile, authState, refreshSession } = useAuth();
  // Aggressive runtime logging for state
  useEffect(() => {
    console.log('[AuthNavigator][STATE]', { isLoading, userProfile, authState });
  }, [isLoading, userProfile, authState]);
  const [profileTimeout, setProfileTimeout] = useState(false);
  const timeoutRef = useRef();

  // Aggressively handle profile loading stuck state
  useEffect(() => {
    if (authState === 'authenticated' && !userProfile) {
      timeoutRef.current = setTimeout(() => {
        setProfileTimeout(true);
      }, PROFILE_LOAD_TIMEOUT);
    } else {
      setProfileTimeout(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [authState, userProfile]);

  if (isLoading && authState !== 'unauthenticated') {
    console.log('[AuthNavigator][STATE] Loading authentication...');
    return <LoadingScreen message="Loading authentication..." />;
  }

  if (authState === 'authenticated' && !userProfile && !profileTimeout) {
    console.log('[AuthNavigator][STATE] Authenticated but no userProfile, waiting...');
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (profileTimeout) {
    console.log('[AuthNavigator][STATE] Profile load timeout, showing retry UI');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#d32f2f', marginBottom: 16, textAlign: 'center' }}>
          Unable to load your profile. Please check your connection or try again.
        </Text>
        <Button title="Retry" onPress={() => {
          setProfileTimeout(false);
          refreshSession && refreshSession();
        }} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        animation: 'fade',
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreenWrapper} />
      <Stack.Screen name="SignUp" component={SignUpScreenWrapper} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreenWrapper} />
      <Stack.Screen name="Guest" component={GuestNavigatorWrapper} />
      <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
