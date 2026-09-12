/**
 * useAuthErrors Hook
 * Provides user-friendly error messages for authentication errors
 */

export const useAuthErrors = () => {
  const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';

    const errorCode = error.code || error.message;

    // Supabase auth error codes
    const errorMessages = {
      // Sign in errors
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please verify your email address',
      'user_not_found': 'No account found with this email',
      'invalid_grant': 'Invalid email or password',
      
      // Sign up errors
      'user_already_exists': 'An account with this email already exists',
      'weak_password': 'Password is too weak. Use at least 8 characters',
      'invalid_email': 'Please enter a valid email address',
      
      // OTP errors
      'otp_expired': 'Verification code has expired. Request a new one',
      'otp_disabled': 'SMS verification is not enabled',
      'invalid_phone': 'Please enter a valid phone number',
      
      // Session errors
      'session_expired': 'Your session has expired. Please sign in again',
      'refresh_token_not_found': 'Session expired. Please sign in again',
      
      // Network errors
      'network_error': 'Network error. Please check your connection',
      'timeout': 'Request timed out. Please try again',
      
      // Rate limiting
      'over_request_rate_limit': 'Too many attempts. Please try again later',
      'email_rate_limit_exceeded': 'Too many emails sent. Please try again later',
      
      // Password reset
      'same_password': 'New password must be different from the old one',
      
      // General
      'unauthorized': 'You are not authorized to perform this action',
      'forbidden': 'Access denied',
    };

    // Check for specific error codes
    for (const [code, message] of Object.entries(errorMessages)) {
      if (errorCode.toLowerCase().includes(code.toLowerCase())) {
        return message;
      }
    }

    // Check for common error patterns
    if (errorCode.includes('password')) {
      return 'Password error. Please check your password';
    }
    if (errorCode.includes('email')) {
      return 'Email error. Please check your email address';
    }
    if (errorCode.includes('phone')) {
      return 'Phone number error. Please check your phone number';
    }
    if (errorCode.includes('network') || errorCode.includes('fetch')) {
      return 'Network error. Please check your connection';
    }

    // Return the original error message if no match
    return error.message || 'An error occurred. Please try again';
  };

  const isNetworkError = (error) => {
    if (!error) return false;
    const errorCode = error.code || error.message || '';
    return errorCode.toLowerCase().includes('network') || 
           errorCode.toLowerCase().includes('fetch') ||
           errorCode.toLowerCase().includes('timeout');
  };

  const isAuthError = (error) => {
    if (!error) return false;
    const errorCode = error.code || error.message || '';
    return errorCode.toLowerCase().includes('auth') ||
           errorCode.toLowerCase().includes('credentials') ||
           errorCode.toLowerCase().includes('unauthorized');
  };

  return {
    getErrorMessage,
    isNetworkError,
    isAuthError,
  };
};

export default useAuthErrors;
