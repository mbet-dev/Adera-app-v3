/**
 * Tracking utilities for Adera parcel lifecycle.
 */

export const PARCEL_STATUS = {
  CREATED: 0,
  DROPOFF: 1,
  IN_TRANSIT_TO_HUB: 2,
  AT_HUB: 3,
  DISPATCHED: 4,
  AT_PICKUP_PARTNER: 5,
  DELIVERED: 6,
};

export const STATUS_META = [
  { key: 'created', label: 'Created', icon: 'package-variant', color: '#9E9E9E' },
  { key: 'dropoff', label: 'At Drop-off', icon: 'storefront', color: '#4CAF50' },
  { key: 'in_transit_to_hub', label: 'In Transit to Hub', icon: 'truck-fast', color: '#FF9800' },
  { key: 'at_hub', label: 'At Hub', icon: 'warehouse', color: '#7C4DFF' },
  { key: 'dispatched', label: 'Dispatched', icon: 'map-marker-path', color: '#2196F3' },
  { key: 'at_pickup_partner', label: 'At Pickup Point', icon: 'map-marker-check', color: '#1565C0' },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle', color: '#2E7D32' },
];

export function statusToLabel(status) {
  return STATUS_META[status]?.label || 'Unknown';
}

export function statusToIcon(status) {
  return STATUS_META[status]?.icon || 'progress-clock';
}

export function statusToColor(status) {
  return STATUS_META[status]?.color || '#9E9E9E';
}

/**
 * Determine which status steps are completed, active, or pending.
 */
export function getStatusSteps(currentStatus) {
  return STATUS_META.map((meta, index) => ({
    ...meta,
    completed: currentStatus >= index,
    active: currentStatus === index,
    pending: currentStatus < index,
  }));
}

/**
 * Check if a parcel is in a terminal state.
 */
export function isParcelDelivered(status) {
  return status === PARCEL_STATUS.DELIVERED;
}

/**
 * Check if a parcel can be cancelled (only in CREATED state).
 */
export function canCancelParcel(status) {
  return status === PARCEL_STATUS.CREATED;
}

/**
 * Human-readable parcel age.
 */
export function getParcelAge(createdAt) {
  if (!createdAt) return '';
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * ETA display string.
 */
export function formatEstimatedDelivery(estimatedDelivery) {
  if (!estimatedDelivery) return 'Not estimated';
  const eta = new Date(estimatedDelivery);
  const now = new Date();
  const diffMs = eta - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return 'Overdue';
  if (hours < 1) return 'Arriving soon';
  if (hours < 24) return `~${hours}h remaining`;
  const days = Math.floor(hours / 24);
  return `~${days} day${days > 1 ? 's' : ''} remaining`;
}

// Default export
const trackingUtils = {
  PARCEL_STATUS,
  STATUS_META,
  statusToLabel,
  statusToIcon,
  statusToColor,
  getStatusSteps,
  isParcelDelivered,
  canCancelParcel,
  getParcelAge,
  formatEstimatedDelivery,
};

export default trackingUtils;
