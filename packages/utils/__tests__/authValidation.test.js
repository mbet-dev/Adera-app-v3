import {
  normalizeEthiopianPhone,
  isValidEthiopianPhone,
  validateEmail,
  validatePassword,
  getValidationError,
} from '../src/validation/authValidation';

describe('normalizeEthiopianPhone', () => {
  it('normalizes +251 format', () => {
    expect(normalizeEthiopianPhone('+251911234567')).toBe('+251911234567');
  });

  it('normalizes 09XX format', () => {
    expect(normalizeEthiopianPhone('0911234567')).toBe('+251911234567');
  });

  it('normalizes 9XX format (no prefix)', () => {
    expect(normalizeEthiopianPhone('911234567')).toBe('+251911234567');
  });

  it('normalizes 2519XXXXXXX format (no +)', () => {
    expect(normalizeEthiopianPhone('251911234567')).toBe('+251911234567');
  });

  it('returns null for invalid input', () => {
    expect(normalizeEthiopianPhone(null)).toBeNull();
    expect(normalizeEthiopianPhone('')).toBeNull();
    expect(normalizeEthiopianPhone('12345')).toBeNull();
    expect(normalizeEthiopianPhone('+1234567890')).toBeNull();
  });

  it('handles phone numbers with spaces and dashes', () => {
    expect(normalizeEthiopianPhone('+251 911 234 567')).toBe('+251911234567');
    expect(normalizeEthiopianPhone('091-123-4567')).toBe('+251911234567');
  });
});

describe('isValidEthiopianPhone (authValidation)', () => {
  it('returns true for valid phones', () => {
    expect(isValidEthiopianPhone('+251911234567')).toBe(true);
    expect(isValidEthiopianPhone('0911234567')).toBe(true);
    expect(isValidEthiopianPhone('911234567')).toBe(true);
  });

  it('returns false for invalid phones', () => {
    expect(isValidEthiopianPhone(null)).toBe(false);
    expect(isValidEthiopianPhone('')).toBe(false);
    expect(isValidEthiopianPhone('12345')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test@domain.co')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('returns true for valid passwords', () => {
    expect(validatePassword('mypassword')).toBe(true);
    expect(validatePassword('12345678')).toBe(true);
  });

  it('returns false for short passwords', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(null)).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
  });
});

describe('getValidationError', () => {
  it('returns required error for empty email', () => {
    expect(getValidationError('email', '')).toBe('Email is required');
  });

  it('returns format error for invalid email', () => {
    expect(getValidationError('email', 'bad')).toBe('Invalid email format');
  });

  it('returns null for valid email', () => {
    expect(getValidationError('email', 'user@example.com')).toBeNull();
  });

  it('returns format error for invalid phone', () => {
    expect(getValidationError('phone', '12345')).toBe('Invalid Ethiopian phone format');
  });

  it('returns null for valid phone', () => {
    expect(getValidationError('phone', '+251911234567')).toBeNull();
  });

  it('returns null for empty optional phone', () => {
    expect(getValidationError('phone', '')).toBeNull();
  });

  it('returns required error for empty password', () => {
    expect(getValidationError('password', '')).toBe('Password is required');
  });

  it('returns length error for short password', () => {
    expect(getValidationError('password', '123')).toBe('Password must be at least 8 characters');
  });

  it('returns null for unknown field', () => {
    expect(getValidationError('unknown', 'value')).toBeNull();
  });
});
