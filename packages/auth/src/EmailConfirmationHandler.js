import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';
import { useTheme, Button } from '@adera/ui';

const EmailConfirmationHandler = ({ navigation, route }) => {
  const theme = useTheme();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    let isMounted = true;

    const confirmEmail = async () => {
      await handleEmailConfirmation();
    };

    if (isMounted) {
      confirmEmail();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      // For web platform, check URL hash for tokens or PKCE code
      if (typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        const code = hashParams.get('code') || searchParams.get('code');

        console.log('Email confirmation handler - type:', type, 'has tokens:', !!accessToken);

        if (code) {
          // PKCE code exchange (web)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session (web):', error);
            setStatus('error');
            setMessage('Failed to confirm email. Please try logging in again.');
            setTimeout(() => { window.location.href = '/'; }, 3000);
            return;
          }
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to Adera! 🇪🇹');
          // Clear query/hash to prevent re-processing
          window.history.replaceState(null, null, window.location.pathname);
          setTimeout(() => { window.location.href = '/'; }, 1500);
          return;
        }

        if (type === 'signup' && accessToken) {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage('Failed to confirm email. Please try logging in again.');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              if (navigation) {
                navigation.navigate('Login');
              } else {
                window.location.href = '/';
              }
            }, 3000);
            return;
          }

          console.log('Session set successfully:', data.session?.user?.id);
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to Adera! 🇪🇹');
          
          // Clear the hash from URL to prevent re-processing
          window.history.replaceState(null, null, window.location.pathname);
          
          // Store a flag to indicate confirmation was successful
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('adera_email_confirmed', 'true');
          }
          
          // Redirect to main app after 2 seconds
          setTimeout(() => {
            if (navigation) {
              navigation.navigate('Main');
            } else {
              // Force a full page reload to ensure auth state is picked up
              window.location.href = '/';
            }
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Invalid confirmation link. Please check your email and try again.');
          
          // Redirect to login after 4 seconds
          setTimeout(() => {
            if (navigation) {
              navigation.navigate('Login');
            } else {
              window.location.href = '/';
            }
          }, 4000);
        }
      } else {
        // For native platform, handle deep link parameters (from Expo Linking)
        const params = route?.params || {};
        let accessToken = params.access_token;
        let refreshToken = params.refresh_token;
        const code = params.code;

        // PKCE code exchange (native)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session (native):', error);
            setStatus('error');
            setMessage('Failed to confirm email. Please try logging in again.');
            return;
          }
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to Adera! 🇪🇹');
          setTimeout(() => { navigation.navigate('Main'); }, 1500);
          return;
        }

        // Extra safety: sometimes providers put tokens on the fragment
        if ((!accessToken || !refreshToken) && typeof params?.url === 'string') {
          try {
            const hashIndex = params.url.indexOf('#');
            if (hashIndex !== -1) {
              const fragment = params.url.substring(hashIndex + 1);
              const fragParams = new URLSearchParams(fragment);
              accessToken = accessToken || fragParams.get('access_token');
              refreshToken = refreshToken || fragParams.get('refresh_token');
            }
          } catch {}
        }

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage('Failed to confirm email. Please try again.');
            return;
          }

          console.log('Session set successfully (native):', data.session?.user?.id);
          setStatus('success');
          setMessage('Email confirmed successfully! Welcome to Adera! 🇪🇹');
          
          // Redirect to main app after 2 seconds
          setTimeout(() => {
            navigation.navigate('Main');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Invalid or missing tokens. Re-open the confirmation link from your email.');
        }
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setMessage('Confirming your email...');
    handleEmailConfirmation();
  };

  const handleGoToLogin = () => {
    if (navigation) {
      navigation.navigate('Login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary} 
              style={styles.spinner}
            />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Confirming Email
            </Text>
            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              {message}
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={styles.successEmoji}>✅</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Email Confirmed!
            </Text>
            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              {message}
            </Text>
            <Text style={[styles.subMessage, { color: theme.colors.text.secondary }]}>
              Redirecting you to the app...
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.errorIcon, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={styles.errorEmoji}>❌</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.error }]}>
              Confirmation Failed
            </Text>
            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              {message}
            </Text>
            <View style={styles.actions}>
              <Button
                title="Try Again"
                onPress={handleRetry}
                variant="filled"
                style={styles.button}
              />
              <Button
                title="Go to Login"
                onPress={handleGoToLogin}
                variant="outlined"
                style={styles.button}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  spinner: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  errorEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});

export default EmailConfirmationHandler;
