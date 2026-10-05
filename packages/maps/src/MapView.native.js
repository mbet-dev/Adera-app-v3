import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

/**
 * Native MapView — react-native-maps implementation.
 *
 * Metro resolves this file for native bundles (iOS/Android). The web twin
 * lives in MapView.web.js (react-leaflet). This split keeps the native-only
 * `react-native-maps` module out of the web bundle.
 */

// --- Lazy native (react-native-maps) loading ---
let nativeMaps; // undefined = not resolved, null = unavailable
const getNativeMaps = () => {
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
  const [nativeMapsResolved] = useState(getNativeMaps);
  const mapRegion = region || initialRegion || DEFAULT_CENTER;
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

// Native Marker using react-native-maps.
export const Marker = (props) => {
  const [nativeMapsResolved] = useState(getNativeMaps);
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
