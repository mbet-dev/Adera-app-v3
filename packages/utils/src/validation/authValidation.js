/**
 * Phone normalization & validation utilities
 * Supports Ethiopian formats:
 *  - +2519XXXXXXXX
 *  - 09XXXXXXXX
 *  - 9XXXXXXXX
 */
export function normalizeEthiopianPhone(input) {
  if (!input) return null;
  const s = input.trim();
  // remove spaces, dashes, parentheses
  const digits = s.replace(/[^\d+]/g, '');
  // starts with +251
  if (digits.startsWith('+251') && digits.length === 13) return digits;
  // starts with 2519xxxxxxxx (no +)
  if (digits.startsWith('251') && digits.length === 12) return '+' + digits;
  // starts with 09xxxxxxxx
  if (digits.startsWith('09') && digits.length === 10) return '+251' + digits.slice(1);
  // starts with 9xxxxxxxx (9 + 8 digits)
  if (/^9\d{8}$/.test(digits)) return '+251' + digits;
  return null;
}

export function isValidEthiopianPhone(input) {
  return normalizeEthiopianPhone(input) !== null;
}

export function validateEmail(email) {
  if (!email) return false;
  // simple but robust email regex that handles most valid formats
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (!password) return false;
  return password.length >= 8; // minimum constraint
}

export function getValidationError(field, value) {
  switch (field) {
    case 'email':
      if (!value) return 'Email is required';
      if (!validateEmail(value)) return 'Invalid email format';
      return null;
    case 'phone':
      if (!value) return null; // optional
      if (!isValidEthiopianPhone(value)) return 'Invalid Ethiopian phone format';
      return null;
    case 'password':
      if (!value) return 'Password is required';
      if (!validatePassword(value)) return 'Password must be at least 8 characters';
      return null;
    default:
      return null;
  }
}