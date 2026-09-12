import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Snackbar } from 'react-native-paper';
import { useAuth, useAuthErrors } from '@adera/auth';
import { Button, TextInput, useTheme } from '@adera/ui';
import { Platform } from 'react-native';
import { usePreferences } from '@adera/preferences';
import { useRoute } from '@react-navigation/native';

console.log('Platform.OS:', Platform.OS);

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const route = useRoute();
  const { signIn, isLoading, resendConfirmationEmail, checkEmailConfirmationStatus, refreshSession } = useAuth();
  const { getErrorMessage, isNetworkError } = useAuthErrors();
  const { biometricEnabled } = usePreferences();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResendLink, setShowResendLink] = useState(false);
  const [showRefreshLink, setShowRefreshLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      console.log('[LoginScreen] Checking biometric compatibility');
      if (typeof Platform === 'undefined' || typeof Platform.OS === 'undefined') {
        console.log('[LoginScreen] Platform or Platform.OS is undefined.');
        setBiometricAvailable(false);
        return;
      }
      console.log('[LoginScreen] Platform is:', Platform.OS);

      if (Platform?.OS !== 'web') {
        if (!biometricEnabled) {
          setBiometricAvailable(false);
          return;
        }

        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          setBiometricAvailable(hasHardware && isEnrolled);

          console.log('[LoginScreen] Biometric check:', {
            hasHardware,
            isEnrolled,
            available: hasHardware && isEnrolled,
            platform: Platform.OS
          });
        } catch (error) {
          console.error('[LoginScreen] Biometric check error:', error);
          setBiometricAvailable(false);
        }
      } else {
        setBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, [biometricEnabled]);

  // Check for verification success or error messages from route params (callback screen)
  useEffect(() => {
    const params = route.params;
    
    if (params?.showSuccessMessage && params?.emailVerified) {
      const message = params?.message || 'Email verified successfully! You can now sign in.';
      setSuccessMessage(message);
      setShowVerificationSuccess(true);
      
      // Show alert for better visibility
      Alert.alert(
        '✅ Email Verified',
        message,
        [{ text: 'OK', onPress: () => {
          setShowVerificationSuccess(false);
          // Clear params to prevent showing again
          navigation.setParams({ 
            showSuccessMessage: false, 
            emailVerified: false, 
            message: undefined 
          });
        }}]
      );
    } else if (params?.showPasswordResetMessage) {
      const message = params?.message || 'Password reset email sent! Please check your inbox.';
      setSuccessMessage(message);
      
      Alert.alert(
        '✅ Password Reset',
        message,
        [{ text: 'OK', onPress: () => {
          // Clear params
          navigation.setParams({ 
            showPasswordResetMessage: false, 
            message: undefined 
          });
          setSuccessMessage('');
        }}]
      );
    } else if (params?.showError) {
      const message = params?.message || 'An error occurred. Please try again.';
      setErrorMessage(message);
      
      Alert.alert(
        '⚠️ Error',
        message,
        [{ text: 'OK', onPress: () => {
          // Clear params
          navigation.setParams({ 
            showError: false, 
            message: undefined 
          });
          setErrorMessage('');
        }}]
      );
    }
  }, [route.params, navigation]);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required')
      .max(255, 'Email address is too long'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password is too long (max 72 characters)'),
  });

  const handleLogin = async (email, password) => {
    // Clear previous errors
    setErrorMessage('');
    setShowResendLink(false);
    setShowRefreshLink(false);

    try {
      // Attempt sign in
      await signIn(email.trim().toLowerCase(), password);
      // Navigation is handled by auth state change in AuthProvider
    } catch (error) {
      console.error('Login error:', error);
      const message = getErrorMessage(error);

      if (isNetworkError(error)) {
        // Network-specific error handling
        Alert.alert(
          '🌐 Connection Issue',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handleLogin(email, password) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else if (error.message === 'EMAIL_NOT_CONFIRMED') {
        // Handle email not confirmed error
        setErrorMessage('Please check your email and click the confirmation link before signing in.');
        setShowResendLink(true);
        setShowRefreshLink(true);
      } else {
        // Display error in UI
        setErrorMessage(message || 'Login failed. Please try again.');
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleResendConfirmation = async () => {
    try {
      await resendConfirmationEmail(email.trim().toLowerCase());
      Alert.alert(
        '📧 Email Sent',
        'A new confirmation email has been sent. Please check your inbox and click the link to confirm your email address.',
        [{ text: 'OK' }]
      );
      setShowResendLink(false);
    } catch (error) {
      console.error('Resend confirmation error:', error);
      Alert.alert(
        '❌ Error',
        'Failed to resend confirmation email. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = await checkEmailConfirmationStatus();
      
      if (status.confirmed) {
        setErrorMessage('Email confirmed! Logging you in...');
        await handleLogin();
      } else {
        Alert.alert(
          'ℹ️ Not Confirmed Yet',
          'Your email is still not confirmed. Please check your inbox and click the confirmation link.'
        );
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      Alert.alert('❌ Error', `Failed to refresh session: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBiometricLogin = async () => {
    console.log('[LoginScreen] handleBiometricLogin called');
    console.log('[LoginScreen] Platform.OS in handleBiometricLogin:', Platform.OS);
    try {
      // Check if biometrics are available first
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'Biometric authentication is not available on this device or platform. Please use email/password to sign in.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometrics',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      console.log('[LoginScreen] Biometric authentication result:', result);

      if (result.success) {
        // TODO: Implement secure storage and retrieval of credentials for biometric login
        Alert.alert(
          'Feature Not Implemented',
          'Biometric login is not yet fully implemented. Please use email and password to log in.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('Biometric authentication cancelled or failed:', result.error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Biometric Error',
        'Biometric authentication failed. Please use email/password to sign in.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons
                name="cube"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Sign in to continue to Adera
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Success message banner */}
            {successMessage && (
              <View style={[styles.successBanner, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.successBannerText, { color: theme.colors.primary }]}>
                  {successMessage}
                </Text>
              </View>
            )}

            {/* Existing error banner */}
            {errorMessage && (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <View style={styles.errorContent}>
                  <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
                    {errorMessage}
                  </Text>
                  {(showResendLink || showRefreshLink) && (
                    <View style={styles.errorActions}>
                      {showRefreshLink && (
                        <TouchableOpacity 
                          onPress={handleRefreshSession} 
                          disabled={isRefreshing}
                          style={[styles.errorActionButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        >
                          <Text style={[styles.errorActionText, { color: theme.colors.primary }]}>
                            {isRefreshing ? 'Refreshing...' : '🔄 Refresh Session'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {showResendLink && (
                        <TouchableOpacity 
                          onPress={handleResendConfirmation}
                          style={[styles.errorActionButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        >
                          <Text style={[styles.errorActionText, { color: theme.colors.primary }]}>
                            📧 Resend Email
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={(values) => handleLogin(values.email, values.password)}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <TextInput
                    label="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    error={touched.email && errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                  {touched.email && errors.email && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.email}</Text>
                  )}
                  <TextInput
                    label="Password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    error={touched.password && errors.password}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                  />
                  {touched.password && errors.password && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.password}</Text>
                  )}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPassword}
                  >
                    <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                  <Button
                    title="Sign In"
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                    size="lg"
                    style={styles.signInButton}
                  />
                </>
              )}
            </Formik>

            {biometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                style={[styles.biometricButton, { borderColor: theme.colors.outline }]}
                disabled={isLoading}
              >
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={[styles.biometricButtonText, { color: theme.colors.primary }]}>
                  Sign in with biometrics
                </Text>
              </TouchableOpacity>
            )}
            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.secondary }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
            </View>
            {/* Guest Mode */}
            <Button
              title="Continue as Guest"
              onPress={() => navigation.navigate('Guest')}
              variant="outline"
              size="lg"
              style={styles.guestButton}
            />
          </View>
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              Don't have an account? 
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Snackbar
          visible={showVerificationSuccess}
          onDismiss={() => setShowVerificationSuccess(false)}
          duration={6000}
          style={{ marginBottom: Platform.OS === 'web' ? 20 : 0 }}
          action={{
            label: 'Dismiss',
            onPress: () => setShowVerificationSuccess(false),
          }}
        >
          🎉 Email verified successfully! Your account is now active. Please sign in to continue.
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 60, // AGGRESSIVE bottom padding to prevent overlap
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorContent: {
    flex: 1,
    marginLeft: 8,
  },
  errorBannerText: {
    fontSize: 14,
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  errorActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputIcon: {
    marginLeft: 12,
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    marginBottom: 24,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 20, // Extra padding for footer
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: { // Added error text style
    fontSize: 12,
    marginTop: 4,
  },
});

export default LoginScreen;
