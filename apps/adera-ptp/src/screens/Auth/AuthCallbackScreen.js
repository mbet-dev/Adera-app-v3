import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@adera/auth';
import { useAuth } from '@adera/auth';
import { useTheme, SafeArea } from '@adera/ui';

const AuthCallbackScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let callbackType = 'unknown';
        let isPasswordReset = false;
        let isEmailVerification = false;

        // Parse URL parameters to determine callback type
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          const type = hashParams.get('type') || searchParams.get('type');
          callbackType = type || 'unknown';
          isPasswordReset = type === 'recovery' || type === 'reset';
          isEmailVerification = type === 'signup' || type === 'email';

          // Clear URL hash/query params after reading
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, window.location.pathname);
          }
        } else {
          // Native platform - check route params if available
          // Note: Native deep links should include type parameter
        }

        // Wait a bit for Supabase to process the URL tokens
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refresh session to ensure tokens are stored
        try {
          await refreshSession();
        } catch (refreshError) {
          console.warn('[AuthCallback] Session refresh error:', refreshError);
          // Continue anyway - session might still be valid
        }

        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();

        if (isPasswordReset) {
          // Password reset callback - user needs to set new password
          setStatus('success');
          setMessage('Password reset link verified! Redirecting to password reset...');
          
          // Navigate to a password reset screen or show password reset form
          // For now, navigate to login with a message
          setTimeout(() => {
            navigation.replace('Login', {
              showPasswordResetMessage: true,
              message: 'Please check your email for password reset instructions, or sign in with your new password.',
            });
          }, 1500);
        } else if (isEmailVerification && session?.user) {
          // Email verification successful
          setStatus('success');
          setMessage('Email verified successfully! 🎉');

          // Show success alert
          if (Platform.OS === 'web') {
            Alert.alert(
              '✅ Email Verified',
              'Your email has been confirmed successfully! You can now sign in.',
              [{ text: 'OK' }]
            );
          }

          setTimeout(() => {
            navigation.replace('Login', {
              emailVerified: true,
              showSuccessMessage: true,
              message: 'Email verified successfully! You can now sign in.',
            });
          }, 2000);
        } else if (isEmailVerification && !session?.user) {
          // Email verification but no session (might need to sign in)
          setStatus('success');
          setMessage('Email verified! Please sign in to continue.');

          setTimeout(() => {
            navigation.replace('Login', {
              emailVerified: true,
              showSuccessMessage: true,
              message: 'Email verified successfully! Please sign in to continue.',
            });
          }, 2000);
        } else {
          // Unknown callback type or general callback
          setStatus('success');
          setMessage('Authentication processed. Redirecting...');

          setTimeout(() => {
            navigation.replace('Login', {
              showSuccessMessage: false,
            });
          }, 1500);
        }
      } catch (e) {
        console.error('[AuthCallback] Error processing callback:', e);
        setStatus('error');
        setMessage('An error occurred. Redirecting to login...');

        // Show error alert
        if (Platform.OS === 'web') {
          Alert.alert(
            '⚠️ Error',
            'Failed to process authentication callback. Please try again.',
            [{ text: 'OK' }]
          );
        }

        setTimeout(() => {
          navigation.replace('Login', {
            emailVerified: false,
            showError: true,
            message: 'Failed to process authentication. Please try again.',
          });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigation, refreshSession]);

  return (
    <SafeArea edges={['top', 'bottom', 'left', 'right']}>      
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          {message}
        </Text>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AuthCallbackScreen;
