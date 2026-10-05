/**
 * Shared formatting utilities for the Adera Hybrid App.
 */

// ─── Currency ───────────────────────────────────────────────
export function formatETB(amount, options = {}) {
  const { decimals = 2, showSymbol = true } = options;
  const num = Number(amount);
  if (isNaN(num)) return showSymbol ? 'ETB 0.00' : '0.00';
  const formatted = num.toLocaleString('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `ETB ${formatted}` : formatted;
}

// ─── Dates ──────────────────────────────────────────────────
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const { format = 'medium', includeTime = false } = options;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const dateOpts = {};
  switch (format) {
    case 'short':
      dateOpts.day = '2-digit';
      dateOpts.month = 'short';
      break;
    case 'medium':
      dateOpts.day = '2-digit';
      dateOpts.month = 'short';
      dateOpts.year = 'numeric';
      break;
    case 'long':
      dateOpts.day = 'numeric';
      dateOpts.month = 'long';
      dateOpts.year = 'numeric';
      break;
    default:
      dateOpts.day = '2-digit';
      dateOpts.month = 'short';
      dateOpts.year = 'numeric';
  }

  if (includeTime) {
    dateOpts.hour = '2-digit';
    dateOpts.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', dateOpts);
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Phone ──────────────────────────────────────────────────
export function formatEthiopianPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  // +251 9XX XXX XXX
  if (digits.length === 12 && digits.startsWith('251')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

// ─── Address ────────────────────────────────────────────────
export function truncateAddress(address, maxLength = 40) {
  if (!address) return '';
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength - 3) + '...';
}

// ─── Tracking ───────────────────────────────────────────────
export function formatTrackingId(trackingId) {
  if (!trackingId) return '';
  return trackingId.toUpperCase();
}

// ─── Numbers ────────────────────────────────────────────────
export function formatDistance(km) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

export function formatWeight(kg) {
  if (kg === null || kg === undefined) return '';
  return `${kg} kg`;
}

// Default export as a namespace
const formatters = {
  formatETB,
  formatDate,
  formatRelativeTime,
  formatTime,
  formatEthiopianPhone,
  truncateAddress,
  formatTrackingId,
  formatDistance,
  formatWeight,
};

export default formatters;
