import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, useAuthErrors } from '@adera/auth';
import { Button, TextInput, useTheme } from '@adera/ui';

const ForgotPasswordScreen = ({ navigation }) => {
  const theme = useTheme();
  const { resetPassword, isLoading } = useAuth();
  const { getErrorMessage, isNetworkError } = useAuthErrors();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (email.trim().length > 255) {
      newErrors.email = 'Email address is too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Attempt password reset
      await resetPassword(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      const message = getErrorMessage(error);

      if (isNetworkError(error)) {
        // Network-specific error handling
        Alert.alert(
          '🌐 Connection Issue',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: handleResetPassword },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // Display error in UI
        setErrors({ general: message });
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setErrors(prev => ({ ...prev, general: null }));
        }, 5000);
      }
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="email-check-outline"
              size={64}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text.primary }]}>
            Check Your Email
          </Text>
          <Text style={[styles.successMessage, { color: theme.colors.text.secondary }]}>
            We've sent password reset instructions to:
          </Text>
          <Text style={[styles.emailText, { color: theme.colors.primary }]}>
            {email}
          </Text>
          <Text style={[styles.successNote, { color: theme.colors.text.secondary }]}>
            Please check your inbox and follow the instructions to reset your password.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={handleBackToLogin}
            size="lg"
            style={styles.backButton}
          />
          <TouchableOpacity
            onPress={() => setEmailSent(false)}
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, { color: theme.colors.primary }]}>
              Didn't receive the email? Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              No worries! Enter your email and we'll send you reset instructions.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              left={
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
              }
            />

            <Button
              title="Send Reset Instructions"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              style={styles.resetButton}
            />

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backToLoginButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[styles.backToLoginText, { color: theme.colors.primary }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    marginTop: 24,
    marginBottom: 40, // Increased bottom margin
  },
  iconContainer: {
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
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  inputIcon: {
    marginLeft: 12,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 60, // AGGRESSIVE bottom padding to prevent overlap
    alignItems: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  successNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  resendButton: {
    marginTop: 16,
    padding: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
