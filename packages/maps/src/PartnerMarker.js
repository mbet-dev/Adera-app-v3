import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from './MapView';

/**
 * PartnerMarker — themed callout marker for partner locations.
 * Uses the lazy Marker from ./MapView so no static react-native-maps import
 * exists anywhere in the maps package.
 */
const PartnerMarker = ({ partner, pinColor, onPress }) => {
  if (!partner?.location) return null;

  return (
    <Marker
      coordinate={partner.location}
      title={partner.name}
      description={partner.address || ''}
      onPress={onPress}
    >
      <View
        style={[
          styles.callout,
          { backgroundColor: '#fff', transform: [{ rotate: '-45deg' }] },
        ]}
      >
        {partner.heroImage && <View style={styles.calloutImagePlaceholder} />}
        <Text style={[styles.calloutTitle, { transform: [{ rotate: '45deg' }] }]}>{partner.name}</Text>
        <Text style={[styles.calloutSubtitle, { transform: [{ rotate: '45deg' }] }]}>{partner.address || 'No address available'}</Text>
        {typeof partner.distance === 'number' && (
          <Text style={[styles.calloutMeta, { transform: [{ rotate: '45deg' }] }]}>
            {partner.distance.toFixed(1)} km away
          </Text>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  callout: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  calloutImagePlaceholder: { height: 60, borderRadius: 8, backgroundColor: '#ECEFF1', marginBottom: 4 },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  calloutSubtitle: { fontSize: 12, color: '#666' },
  calloutMeta: { fontSize: 12, color: '#666' },
});

export default PartnerMarker;
