import {
  isValidEmail,
  isValidEthiopianPhone,
  validatePasswordStrength,
  isValidTrackingIdFormat,
  validateParcelPayload,
  isValidLocation,
  validateShopPayload,
} from '../src/validators';

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.co')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });
});

describe('isValidEthiopianPhone', () => {
  it('returns true for valid Ethiopian phones', () => {
    expect(isValidEthiopianPhone('+251911234567')).toBe(true);
    expect(isValidEthiopianPhone('0911234567')).toBe(true);
    expect(isValidEthiopianPhone('911234567')).toBe(true);
  });

  it('returns false for invalid phones', () => {
    expect(isValidEthiopianPhone('')).toBe(false);
    expect(isValidEthiopianPhone(null)).toBe(false);
    expect(isValidEthiopianPhone('12345')).toBe(false);
    expect(isValidEthiopianPhone('+1234567890')).toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('returns valid for strong password', () => {
    const result = validatePasswordStrength('MyP@ssw0rd123');
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.issues).toHaveLength(0);
  });

  it('returns invalid for weak password', () => {
    const result = validatePasswordStrength('abc');
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('returns invalid for empty password', () => {
    const result = validatePasswordStrength('');
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Password is required');
  });

  it('gives higher score for longer passwords', () => {
    const short = validatePasswordStrength('Pass1!');
    const long = validatePasswordStrength('MyLongerP@ssw0rd123!');
    expect(long.score).toBeGreaterThan(short.score);
  });
});

describe('isValidTrackingIdFormat', () => {
  it('returns true for valid tracking IDs', () => {
    expect(isValidTrackingIdFormat('ADE-20251015-ABC1')).toBe(true);
    expect(isValidTrackingIdFormat('ADE20251015-ABC1')).toBe(true);
  });

  it('returns false for invalid tracking IDs', () => {
    expect(isValidTrackingIdFormat('')).toBe(false);
    expect(isValidTrackingIdFormat(null)).toBe(false);
    expect(isValidTrackingIdFormat('TRK-123')).toBe(false);
    expect(isValidTrackingIdFormat('ade-25-abc')).toBe(false);
  });
});

describe('isValidLocation', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidLocation({ latitude: 9.0054, longitude: 38.7636 })).toBe(true);
    expect(isValidLocation({ latitude: 0, longitude: 0 })).toBe(true);
    expect(isValidLocation({ latitude: -90, longitude: -180 })).toBe(true);
    expect(isValidLocation({ latitude: 90, longitude: 180 })).toBe(true);
  });

  it('returns false for invalid coordinates', () => {
    expect(isValidLocation(null)).toBe(false);
    expect(isValidLocation({ latitude: 100, longitude: 0 })).toBe(false);
    expect(isValidLocation({ latitude: 0, longitude: 200 })).toBe(false);
    expect(isValidLocation({})).toBe(false);
  });
});

describe('validateParcelPayload', () => {
  it('returns valid for complete payload', () => {
    const result = validateParcelPayload({
      recipientName: 'John Doe',
      recipientPhone: '+251911234567',
      packageSize: 'small',
      dropoffPartner: { id: 'p1' },
      pickupPartner: { id: 'p2' },
      paymentMethod: 'chapa',
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns errors for missing fields', () => {
    const result = validateParcelPayload({});
    expect(result.valid).toBe(false);
    expect(result.errors.recipientName).toBeDefined();
    expect(result.errors.recipientPhone).toBeDefined();
    expect(result.errors.packageSize).toBeDefined();
    expect(result.errors.dropoffPartner).toBeDefined();
    expect(result.errors.pickupPartner).toBeDefined();
    expect(result.errors.paymentMethod).toBeDefined();
  });
});

describe('validateShopPayload', () => {
  it('returns valid for complete payload', () => {
    const result = validateShopPayload({
      name: 'My Shop',
      category: 'Food',
      address: 'Bole Road, Addis Ababa',
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns errors for missing fields', () => {
    const result = validateShopPayload({});
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.category).toBeDefined();
    expect(result.errors.address).toBeDefined();
  });
});
