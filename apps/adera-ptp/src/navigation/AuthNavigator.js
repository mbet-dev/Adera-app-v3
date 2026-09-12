import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, SignUpScreen, ForgotPasswordScreen, AuthCallbackScreen } from '../screens/Auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestNavigator from './GuestNavigator';
import { useAuth } from '@adera/auth';
import { LoadingScreen, useTheme } from '@adera/ui';
import { View, Text, TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();
const PROFILE_LOAD_TIMEOUT = 8000;

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
  const goBackToAuth = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    } else if (typeof window !== 'undefined' && window.location) {
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
  const theme = useTheme();
  const { isLoading, userProfile, authState, refreshSession } = useAuth();
  const [profileTimeout, setProfileTimeout] = useState(false);
  const timeoutRef = useRef();

  useEffect(() => {
    if (authState === 'authenticated' && !userProfile) {
      timeoutRef.current = setTimeout(() => setProfileTimeout(true), PROFILE_LOAD_TIMEOUT);
    } else {
      setProfileTimeout(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [authState, userProfile]);

  if (isLoading && authState !== 'unauthenticated') {
    return <LoadingScreen message="Loading authentication..." />;
  }

  if (authState === 'authenticated' && !userProfile && !profileTimeout) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (profileTimeout) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 32 }}>
        <Text style={{ fontSize: 18, color: theme.colors.error, marginBottom: 16, textAlign: 'center' }}>
          Unable to load your profile. Please check your connection or try again.
        </Text>
        <TouchableOpacity
          onPress={() => { setProfileTimeout(false); refreshSession && refreshSession(); }}
          style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
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
