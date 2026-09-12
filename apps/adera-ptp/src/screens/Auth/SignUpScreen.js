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
import { useAuth, useAuthErrors, UserRole } from '@adera/auth';
import { Button, TextInput, useTheme, SignupSuccessModal } from '@adera/ui';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ROLE_OPTIONS = [
  {
    value: UserRole.CUSTOMER,
    label: 'Customer',
    description: 'Send and receive parcels',
    icon: 'account',
  },
  {
    value: UserRole.PARTNER,
    label: 'Partner',
    description: 'Operate dropoff/pickup points',
    icon: 'store',
  },
  {
    value: UserRole.DRIVER,
    label: 'Driver',
    description: 'Deliver parcels',
    icon: 'car',
  },
];

const SignUpScreen = ({ navigation }) => {
  const theme = useTheme();
  const { signUp, isLoading, notifications, dismissNotification } = useAuth();
  const { getErrorMessage, isNetworkError } = useAuthErrors();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');

  const handleSignUp = async (values) => {
    try {
      // Prepare user data
      const userData = {
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        phone: values.phone.trim(),
        role: values.role,
      };

      // Attempt sign up
      await signUp(
        values.email.trim().toLowerCase(),
        values.password,
        userData
      );

      // Success - show elegant modal
      setSignupEmail(values.email);
      setSignupFirstName(values.firstName);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Sign up error:', error);
      const message = getErrorMessage(error);

      if (isNetworkError(error)) {
        // Network-specific error handling
        Alert.alert(
          '🌐 Connection Issue',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handleSignUp(values) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // Display error in UI
        Alert.alert('Sign Up Failed', message);
      }
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name is too long')
      .matches(/^[a-zA-Z\s\'-]+$/, 'First name contains invalid characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name is too long')
      .matches(/^[a-zA-Z\s\'-]+$/, 'Last name contains invalid characters'),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required')
      .max(255, 'Email address is too long'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^\+?251[79]\d{8}$/, 'Enter valid Ethiopian number (+2519XXXXXXXX or +2517XXXXXXXX)'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long (max 72 characters)')
      .matches(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .matches(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .matches(/(?=.*\d)/, 'Password must contain at least one number'),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password')], 'Passwords do not match'),
    role: Yup.string().required('Please select a role'),
  });

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
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Join Adera and start delivering
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Formik
              initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                role: UserRole.CUSTOMER,
              }}
              validationSchema={validationSchema}
              onSubmit={handleSignUp}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  {/* Role Selection */}
                  <View style={styles.roleSection}>
                    <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                      I want to join as:
                    </Text>
                    <View style={styles.roleOptions}>
                      {ROLE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.roleCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor:
                                values.role === option.value
                                  ? theme.colors.primary
                                  : theme.colors.outline,
                              borderWidth: values.role === option.value ? 2 : 1,
                            },
                          ]}
                          onPress={() => handleChange('role')(option.value)}
                        >
                          <View
                            style={[
                              styles.roleIconContainer,
                              {
                                backgroundColor:
                                  values.role === option.value
                                    ? theme.colors.primaryContainer
                                    : theme.colors.surfaceVariant,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={option.icon}
                              size={24}
                              color={
                                values.role === option.value
                                  ? theme.colors.primary
                                  : theme.colors.text.secondary
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.roleLabel,
                              {
                                color:
                                  values.role === option.value
                                    ? theme.colors.primary
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={[styles.roleDescription, { color: theme.colors.text.secondary }]}>
                            {option.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.role && errors.role && (
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.role}</Text>
                    )}
                  </View>

                  {/* Personal Information */}
                  <View style={styles.row}>
                    <TextInput
                      label="First Name"
                      value={values.firstName}
                      onChangeText={handleChange('firstName')}
                      onBlur={handleBlur('firstName')}
                      error={touched.firstName && errors.firstName}
                      autoCapitalize="words"
                      style={styles.halfInput}
                    />
                    <View style={styles.spacer} />
                    <TextInput
                      label="Last Name"
                      value={values.lastName}
                      onChangeText={handleChange('lastName')}
                      onBlur={handleBlur('lastName')}
                      error={touched.lastName && errors.lastName}
                      autoCapitalize="words"
                      style={styles.halfInput}
                    />
                  </View>

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
                    label="Phone Number"
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    error={touched.phone && errors.phone}
                    helperText="Format: +251911234567"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                  {touched.phone && errors.phone && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.phone}</Text>
                  )}

                  <TextInput
                    label="Password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    error={touched.password && errors.password}
                    helperText="Min. 8 characters with uppercase, lowercase, and number"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    right={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {touched.password && errors.password && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.password}</Text>
                  )}

                  <TextInput
                    label="Confirm Password"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    error={touched.confirmPassword && errors.confirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    right={
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <MaterialCommunityIcons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.confirmPassword}</Text>
                  )}

                  <Button
                    title="Create Account"
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                    size="lg"
                    style={styles.signUpButton}
                  />
                </>
              )}
            </Formik>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <SignupSuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigation.navigate('Login');
          }}
          email={signupEmail}
          firstName={signupFirstName}
        />
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
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  roleSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  eyeIcon: {
    padding: 12,
  },
  signUpButton: {
    marginTop: 8,
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
});

export default SignUpScreen;
