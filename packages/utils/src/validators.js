/**
 * Validation utilities for the Adera Hybrid App.
 * Complements Yup schemas used in forms with reusable pure-function validators.
 */

import { normalizeEthiopianPhone } from './validation/authValidation';

// ─── Email ──────────────────────────────────────────────────
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Phone ──────────────────────────────────────────────────
export function isValidEthiopianPhone(phone) {
  return normalizeEthiopianPhone(phone) !== null;
}

// ─── Password ───────────────────────────────────────────────
export function validatePasswordStrength(password) {
  if (!password) return { valid: false, score: 0, issues: ['Password is required'] };
  const issues = [];
  let score = 0;

  if (password.length >= 8) score++;
  else issues.push('At least 8 characters');

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) score++;
  else issues.push('At least one uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else issues.push('At least one lowercase letter');

  if (/\d/.test(password)) score++;
  else issues.push('At least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else issues.push('At least one special character');

  return { valid: score >= 3, score, issues };
}

// ─── Tracking ID ────────────────────────────────────────────
export function isValidTrackingIdFormat(trackingId) {
  if (!trackingId || typeof trackingId !== 'string') return false;
  // Accept: ADE-YYYYMMDD-XXXX or ADEYYYYMMDD-XXXX (with or without first dash)
  return /^ADE[-]?\d{8}[-]\w{4,}$/i.test(trackingId.trim());
}

// ─── Parcel ─────────────────────────────────────────────────
export function validateParcelPayload(parcel) {
  const errors = {};

  if (!parcel.recipientName || parcel.recipientName.trim().length < 2) {
    errors.recipientName = 'Recipient name is required';
  }

  if (!isValidEthiopianPhone(parcel.recipientPhone)) {
    errors.recipientPhone = 'Valid Ethiopian phone number required';
  }

  if (!parcel.packageSize) {
    errors.packageSize = 'Package size is required';
  }

  if (!parcel.dropoffPartner) {
    errors.dropoffPartner = 'Drop-off partner is required';
  }

  if (!parcel.pickupPartner) {
    errors.pickupPartner = 'Pick-up partner is required';
  }

  if (!parcel.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Partner / Shop ─────────────────────────────────────────
export function isValidLocation(location) {
  if (!location) return false;
  const { latitude, longitude } = location;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function validateShopPayload(shop) {
  const errors = {};

  if (!shop.name || shop.name.trim().length < 2) {
    errors.name = 'Shop name is required';
  }

  if (!shop.category) {
    errors.category = 'Category is required';
  }

  if (!shop.address || shop.address.trim().length < 5) {
    errors.address = 'Valid address is required';
  }

  if (shop.location && !isValidLocation(shop.location)) {
    errors.location = 'Valid location coordinates required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Default export
const validators = {
  isValidEmail,
  isValidEthiopianPhone,
  validatePasswordStrength,
  isValidTrackingIdFormat,
  validateParcelPayload,
  isValidLocation,
  validateShopPayload,
};

export default validators;
