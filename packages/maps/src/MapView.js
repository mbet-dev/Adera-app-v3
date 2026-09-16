import React, { useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

/**
 * Cross-platform MapView with LAZY native module resolution.
 *
 * IMPORTANT: `react-native-maps` must never be statically imported here.
 * Expo Go (SDK 54) does not ship its native binary, and a static import
 * crashes the app at bundle-evaluation time with:
 *   Invariant Violation: TurboModuleRegistry.getEnforcing(...):
 *   'RNMapsAirModule' could not be found.
 *
 * - Native: the module is `require`d lazily inside try/catch on first render.
 *   Expo Go → graceful fallback view. Dev/production build → real map.
 * - Web: react-leaflet is required lazily (it also must not break SSR/bundle
 *   evaluation when absent).
 */

// --- Lazy web (Leaflet) loading ---
let webLeaflet; // undefined = not resolved, null = unavailable
const getLeaflet = () => {
  if (Platform.OS !== 'web') return null;
  if (webLeaflet !== undefined) return webLeaflet;
  try {
    webLeaflet = require('react-leaflet');
  } catch (e) {
    webLeaflet = null;
  }
  return webLeaflet;
};

// --- Lazy native (react-native-maps) loading ---
let nativeMaps; // undefined = not resolved, null = unavailable
const getNativeMaps = () => {
  if (Platform.OS === 'web') return null;
  if (nativeMaps !== undefined) return nativeMaps;
  try {
    nativeMaps = require('react-native-maps');
  } catch (e) {
    nativeMaps = null;
  }
  return nativeMaps;
};

const DEFAULT_CENTER = { latitude: 9.03, longitude: 38.74, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

const FallbackView = ({ style, message }) => (
  <View style={[styles.fallback, style]}>
    <Text style={styles.fallbackText}>
      {message || 'Map is unavailable in Expo Go.\nUse a development build for full map support.'}
    </Text>
  </View>
);

const MapView = ({
  region,
  initialRegion,
  onPress,
  onRegionChangeComplete,
  showsUserLocation = false,
  style,
  fallbackMessage,
  children,
  ...rest
}) => {
  const [isWeb] = useState(() => Platform.OS === 'web');
  const [leaflet] = useState(getLeaflet);
  const [nativeMapsResolved] = useState(getNativeMaps);

  const mapRegion = region || initialRegion || DEFAULT_CENTER;

  if (isWeb) {
    const MapContainer = leaflet?.MapContainer;
    const TileLayer = leaflet?.TileLayer;
    if (!MapContainer || !TileLayer) {
      return <FallbackView style={style} message={fallbackMessage} />;
    }
    // Leaflet needs [lat, lng]
    const center = [mapRegion.latitude, mapRegion.longitude];
    const zoom = mapRegion.latitudeDelta
      ? Math.max(2, Math.min(18, Math.round(Math.log2(360 / mapRegion.latitudeDelta)) + 1))
      : 13;
    return (
      <View style={[styles.container, style]}>
        <MapContainer center={center} zoom={zoom} style={styles.leaflet} onClick={onPress}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {children}
        </MapContainer>
      </View>
    );
  }

  const RealMap = nativeMapsResolved?.default;
  if (!RealMap) {
    return <FallbackView style={style} message={fallbackMessage} />;
  }

  return (
    <RealMap
      style={[styles.container, style]}
      region={region}
      initialRegion={mapRegion}
      onPress={onPress}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      {...rest}
    >
      {children}
    </RealMap>
  );
};

// Lazy Marker that works on both platforms.
// - Native: renders react-native-maps Marker (when available).
// - Web: renders a Leaflet Marker when children/position given via `coordinate`.
export const Marker = (props) => {
  const [isWeb] = useState(() => Platform.OS === 'web');
  const [leaflet] = useState(getLeaflet);
  const [nativeMapsResolved] = useState(getNativeMaps);

  if (isWeb) {
    const LeafletMarker = leaflet?.Marker;
    const { coordinate, title, onPress: markerOnPress, ...rest } = props;
    if (!LeafletMarker || !coordinate) return null;
    // react-leaflet Marker needs [lat, lng]; clicks handled via eventListeners
    // are approximated with Popup children when title is provided.
    const Popup = leaflet?.Popup;
    return (
      <LeafletMarker position={[coordinate.latitude, coordinate.longitude]} {...rest}>
        {title && Popup ? <Popup>{title}</Popup> : null}
      </LeafletMarker>
    );
  }

  const RealMarker = nativeMapsResolved?.Marker;
  if (!RealMarker) return null;
  return <RealMarker {...props} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  leaflet: { height: '100%', width: '100%' },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
    padding: 24,
  },
  fallbackText: {
    color: '#607D8B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MapView;
