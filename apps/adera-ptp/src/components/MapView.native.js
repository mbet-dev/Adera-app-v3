import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Native MapView with LAZY resolution of react-native-maps.
 *
 * IMPORTANT: This module must never statically import `react-native-maps`.
 * Expo Go (SDK 54) does not ship the react-native-maps native binary, so a
 * static import crashes the whole app at bundle-evaluation time with:
 *
 *   Invariant Violation: TurboModuleRegistry.getEnforcing(...):
 *   'RNMapsAirModule' could not be found.
 *
 * Instead, the module is `require`d lazily inside a try/catch on first
 * render of an actual map component. In Expo Go the require throws and we
 * render a graceful fallback; in dev/production builds with the native
 * module present, a real map renders with the standard react-native-maps
 * children API (Marker, Callout, Polyline, Circle).
 */

let nativeMaps; // undefined = not yet resolved, null = unavailable
const getNativeMaps = () => {
  if (nativeMaps !== undefined) return nativeMaps;
  try {
    // Cached by Metro's require after first success.
    nativeMaps = require('react-native-maps');
  } catch (e) {
    nativeMaps = null;
  }
  return nativeMaps;
};

const createLazyChild = (name) => {
  const Component = React.forwardRef((props, ref) => {
    const [maps] = useState(getNativeMaps);
    const Real = maps?.[name];
    if (!Real) return null;
    return <Real {...props} ref={ref} />;
  });
  Component.displayName = `Lazy${name}`;
  return Component;
};

export const Marker = createLazyChild('Marker');
export const Callout = createLazyChild('Callout');
export const Polyline = createLazyChild('Polyline');
export const Circle = createLazyChild('Circle');

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = undefined;

const MapViewNative = ({ style, fallbackMessage, children, ...rest }) => {
  const [maps] = useState(getNativeMaps);
  const RealMap = maps?.default;

  if (!RealMap) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          {fallbackMessage ||
            'Map is unavailable in Expo Go.\nUse a development build for full map support.'}
        </Text>
      </View>
    );
  }

  return (
    <RealMap style={[styles.map, style]} {...rest}>
      {children}
    </RealMap>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
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

export default MapViewNative;
