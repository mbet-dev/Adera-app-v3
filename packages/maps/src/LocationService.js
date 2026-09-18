import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Cross-platform location service for the Adera app.
 * Handles permission requests, current location, and continuous tracking.
 */

const DEFAULT_REGION = {
  latitude: 9.03,
  longitude: 38.74,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

/**
 * Request location permissions.
 * Returns { status, canAskAgain }.
 */
export async function requestLocationPermission() {
  if (Platform.OS === 'web') {
    // Web uses browser geolocation — no explicit permission API needed
    return { status: 'granted', canAskAgain: true };
  }

  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return { status, canAskAgain };
  } catch (error) {
    console.warn('[LocationService] Permission request failed:', error.message);
    return { status: 'undetermined', canAskAgain: false };
  }
}

/**
 * Get the device's current location.
 * Returns { latitude, longitude } or null on failure.
 */
export async function getCurrentLocation() {
  if (Platform.OS === 'web') {
    return getWebLocation();
  }

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[LocationService] Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.warn('[LocationService] Failed to get location:', error.message);
    return null;
  }
}

/**
 * Reverse geocode coordinates to an address.
 */
export async function reverseGeocode(latitude, longitude) {
  if (Platform.OS === 'web') {
    // Web reverse geocoding via Nominatim
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
      );
      const data = await response.json();
      return {
        street: data.address?.road || '',
        neighborhood: data.address?.neighbourhood || data.address?.suburb || '',
        city: data.address?.city || data.address?.town || '',
        region: data.address?.state || '',
        country: data.address?.country || '',
        formatted: data.display_name || '',
      };
    } catch (error) {
      console.warn('[LocationService] Web reverse geocode failed:', error.message);
      return null;
    }
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length === 0) return null;

    const result = results[0];
    return {
      street: result.street || '',
      neighborhood: result.name || '',
      city: result.city || '',
      region: result.region || '',
      country: result.country || '',
      formatted: [result.name, result.street, result.city, result.region, result.country]
        .filter(Boolean)
        .join(', '),
    };
  } catch (error) {
    console.warn('[LocationService] Reverse geocode failed:', error.message);
    return null;
  }
}

/**
 * Forward geocode an address to coordinates.
 */
export async function forwardGeocode(address) {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length === 0) return null;

    return {
      latitude: results[0].latitude,
      longitude: results[0].longitude,
    };
  } catch (error) {
    console.warn('[LocationService] Forward geocode failed:', error.message);
    return null;
  }
}

/**
 * Calculate distance between two points (Haversine formula).
 * Returns distance in meters.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display.
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Watch position for continuous location updates (native only).
 * Returns a subscription object with a `remove()` method.
 */
export async function watchPosition(callback, options = {}) {
  if (Platform.OS === 'web') {
    // Web fallback: poll every 10 seconds
    const intervalId = setInterval(async () => {
      const location = await getCurrentLocation();
      if (location) callback(location);
    }, options.distanceInterval || 10000);
    return { remove: () => clearInterval(intervalId) };
  }

  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options.accuracy || Location.Accuracy.Balanced,
        distanceInterval: options.distanceInterval || 10,
        timeInterval: options.timeInterval || 5000,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        });
      }
    );
    return subscription;
  } catch (error) {
    console.warn('[LocationService] Watch position failed:', error.message);
    return { remove: () => {} };
  }
}

// --- Internal helpers ---

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function getWebLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.warn('[LocationService] Web geolocation error:', error.message);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export { DEFAULT_REGION };
export default {
  requestLocationPermission,
  getCurrentLocation,
  reverseGeocode,
  forwardGeocode,
  calculateDistance,
  formatDistance,
  watchPosition,
  DEFAULT_REGION,
};
