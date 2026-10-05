import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

/**
 * Web MapView — react-leaflet implementation.
 *
 * Metro resolves this file for web bundles; the native twin lives in
 * MapView.native.js (react-native-maps). This split keeps the native-only
 * `react-native-maps` module out of the web bundle — a lazy require() in a
 * shared file is NOT enough, Metro still statically bundles it and the web
 * export fails with:
 *   Importing native-only module
 *   "react-native/Libraries/Utilities/codegenNativeCommands" on web
 *
 * Leaflet's stylesheet is injected once (singleton <link>) — without it,
 * tiles render misaligned and markers land at the wrong position or vanish.
 */

let webLeaflet; // undefined = not resolved, null = unavailable
const getLeaflet = () => {
  if (webLeaflet !== undefined) return webLeaflet;
  try {
    webLeaflet = require('react-leaflet');
  } catch (e) {
    webLeaflet = null;
  }
  return webLeaflet;
};

let cssInjected = false;
const ensureLeafletCss = () => {
  if (cssInjected || typeof document === 'undefined') return;
  try {
    if (!document.getElementById('leaflet-css-adera')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-adera';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    cssInjected = true;
  } catch (e) {
    // no-op outside browser
  }
};

/**
 * Bundled Leaflet loses its default marker-image URLs (resolved relative to
 * the CSS/JS location, which breaks under bundlers), so pins silently
 * disappear. This branded divIcon is the guaranteed-visible default.
 */
const buildDefaultPin = (L, color = '#0F766E', size = 30) =>
  L.divIcon({
    className: 'adera-default-pin',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
  });

const DEFAULT_CENTER = { latitude: 9.03, longitude: 38.74, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

const FallbackView = ({ style, message }) => (
  <View style={[styles.fallback, style]}>
    <Text style={styles.fallbackText}>
      {message || 'Map is unavailable on web.'}
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
  const [leaflet] = useState(getLeaflet);

  useEffect(() => {
    ensureLeafletCss();
  }, []);

  const mapRegion = region || initialRegion || DEFAULT_CENTER;
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
};

/**
 * Web Marker with a guaranteed-visible branded pin. `pinColor` tints the
 * default pin; a custom `icon` (L.divIcon) always wins.
 */
export const Marker = (props) => {
  const [leaflet] = useState(getLeaflet);

  useEffect(() => {
    ensureLeafletCss();
  }, []);

  const LeafletMarker = leaflet?.Marker;
  const { coordinate, title, description, pinColor, onPress: markerOnPress, ...rest } = props;
  if (!LeafletMarker || !coordinate) return null;

  let icon = rest.icon;
  if (!icon) {
    try {
      const L = require('leaflet');
      icon = buildDefaultPin(L, pinColor || '#0F766E');
    } catch (e) {
      icon = undefined;
    }
  }

  const Popup = leaflet?.Popup;
  const popupContent = title || description;

  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      {...rest}
      icon={icon}
    >
      {popupContent && Popup ? <Popup>{popupContent}</Popup> : null}
    </LeafletMarker>
  );
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
