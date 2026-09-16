import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@adera/ui';

/**
 * Native PartnerSelectionMap with LAZY resolution of react-native-maps.
 *
 * Expo Go (SDK 54) does not include the react-native-maps native binary, so
 * this module must never statically import it — otherwise the whole app
 * crashes at bundle-evaluation time with:
 *   TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found.
 *
 * The real module is required lazily inside try/catch on first render. In
 * Expo Go we render a graceful placeholder; in dev/production builds with
 * the native module present, a real interactive map renders.
 */

let nativeMaps; // undefined = not yet resolved, null = unavailable
const getNativeMaps = () => {
  if (nativeMaps !== undefined) return nativeMaps;
  try {
    nativeMaps = require('react-native-maps');
  } catch (e) {
    nativeMaps = null;
  }
  return nativeMaps;
};

const DEFAULT_COORDS = {
  latitude: 8.9806,
  longitude: 38.7578,
};

const PartnerSelectionMap = ({ partners = [], selectedPartner, onSelect, userLocation, height = 320 }) => {
  const theme = useTheme();
  const [maps] = useState(getNativeMaps);
  const RealMap = maps?.default;
  const RealMarker = maps?.Marker;
  const RealCircle = maps?.Circle;
  const RealCallout = maps?.Callout;

  const center = userLocation || partners[0]?.location || DEFAULT_COORDS;
  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
  };

  if (!RealMap) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.fallbackCard}>
          <Text style={styles.fallbackIcon}>📍</Text>
          <Text style={styles.fallbackTitle}>Map preview unavailable</Text>
          <Text style={styles.fallbackText}>
            {partners.length} partner{partners.length === 1 ? '' : 's'} nearby. Maps require a
            development build (not Expo Go).
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <RealMap
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
      >
        {userLocation && RealCircle && (
          <RealCircle
            center={userLocation}
            radius={120}
            fillColor={`${theme.colors.primary}30`}
            strokeColor={theme.colors.primary}
          />
        )}

        {partners
          .filter((partner) => partner.location)
          .map((partner) => (
            <RealMarker
              key={partner.id}
              coordinate={partner.location}
              title={partner.name}
              description={partner.address || ''}
            >
              {RealCallout && (
                <RealCallout tooltip onPress={() => onSelect?.(partner)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{partner.name}</Text>
                    <Text style={styles.calloutSubtitle}>
                      {partner.address || 'No address available'}
                    </Text>
                    {typeof partner.distance === 'number' && (
                      <Text style={styles.calloutMeta}>{partner.distance.toFixed(1)} km away</Text>
                    )}
                  </View>
                </RealCallout>
              )}
            </RealMarker>
          ))}
      </RealMap>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fallbackCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
    padding: 20,
    gap: 6,
  },
  fallbackIcon: { fontSize: 32 },
  fallbackTitle: { fontSize: 15, fontWeight: '700', color: '#455A64' },
  fallbackText: { fontSize: 12, color: '#607D8B', textAlign: 'center' },
  callout: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  calloutSubtitle: { fontSize: 12, color: '#666' },
  calloutMeta: { fontSize: 12, color: '#666' },
});

export default PartnerSelectionMap;
