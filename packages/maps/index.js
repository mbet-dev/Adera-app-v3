/**
 * Platform-split MapView: Metro resolves MapView.web.js on web (react-leaflet)
 * and MapView.native.js on native (react-native-maps). Keeping the native
 * module out of the web bundle requires this file-extension split — a lazy
 * require() in one shared file is not sufficient.
 */
export { default as MapView, Marker } from './src/MapView';
export { default as LocationPicker } from './src/LocationPicker';
export { default as PartnerMarker } from './src/PartnerMarker';
export { default as useLocation } from './src/useLocation';
export {
  requestLocationPermission,
  getCurrentLocation,
  reverseGeocode,
  forwardGeocode,
  calculateDistance,
  formatDistance,
  watchPosition,
  parsePoint,
  DEFAULT_REGION,
} from './src/LocationService';
