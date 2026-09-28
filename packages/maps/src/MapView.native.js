import React, { useEffect, useState } from 'react';
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

/**
 * Leaflet's stylesheet is mandatory — without it tiles render misaligned and
 * markers land at the wrong position (or not at all). Injected once as a
 * singleton <link id="leaflet-css-adera"> from the bundled leaflet package.
 */
let cssInjected = false;
const ensureLeafletCss = () => {
  if (Platform.OS !== 'web' || cssInjected || typeof document === 'undefined') return;
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
 * Bundled Leaflet loses its default marker-image URLs (they are resolved
 * relative to the CSS/JS location, which breaks under webpack), so pins
 * silently disappear. This branded divIcon is the guaranteed-visible default.
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
    ensureLeafletCss();
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
// - Web: renders a Leaflet Marker; when no custom icon is given, a branded
//   divIcon is substituted because bundled Leaflet's default icon URLs break.
export const Marker = (props) => {
  const [isWeb] = useState(() => Platform.OS === 'web');
  const [leaflet] = useState(getLeaflet);
  const [nativeMapsResolved] = useState(getNativeMaps);

  useEffect(() => {
    ensureLeafletCss();
  }, []);

  if (isWeb) {
    const LeafletMarker = leaflet?.Marker;
    const { coordinate, title, description, onPress: markerOnPress, ...rest } = props;
    if (!LeafletMarker || !coordinate) return null;
    // Ensure an icon always exists so pins are never invisible on web.
    let icon = rest.icon;
    if (!icon) {
      try {
        const Lmod = require('leaflet');
        icon = buildDefaultPin(Lmod, rest.pinColor || '#0F766E');
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
