import React, { useMemo } from 'react';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@adera/ui';

const DEFAULT_COORDS = {
  latitude: 8.9806,
  longitude: 38.7578,
};

const PartnerSelectionMap = ({ partners = [], selectedPartner, onSelect, userLocation }) => {
  const theme = useTheme();

  const initialRegion = useMemo(() => {
    const center = userLocation || partners[0]?.location || DEFAULT_COORDS;
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    };
  }, [partners, userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        customMapStyle={[]}
      >
        {userLocation && (
          <Circle
            center={userLocation}
            radius={120}
            fillColor={`${theme.colors.primary}30`}
            strokeColor={theme.colors.primary}
          />
        )}

        {partners
          .filter((partner) => partner.location)
          .map((partner) => (
            <Marker
              key={partner.id}
              coordinate={partner.location}
              title={partner.name}
              description={partner.address || ''}
              pinColor={
                selectedPartner?.id === partner.id
                  ? theme.colors.primary
                  : theme.colors.secondary
              }
            >
              <Callout tooltip onPress={() => onSelect?.(partner)}>
                <View style={[styles.callout, { backgroundColor: theme.colors.surface }]}> 
                  {partner.heroImage && (
                    <Image source={{ uri: partner.heroImage }} style={styles.calloutImage} resizeMode="cover" />
                  )}
                  <Text style={[styles.calloutTitle, { color: theme.colors.onSurface }]}> {partner.name} </Text>
                  <Text style={[styles.calloutSubtitle, { color: theme.colors.onSurfaceVariant }]}> {partner.address || 'No address available'} </Text>
                  {typeof partner.distance === 'number' && (
                    <Text style={[styles.calloutMeta, { color: theme.colors.onSurfaceVariant }]}> {partner.distance.toFixed(1)} km away </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.calloutButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onSelect?.(partner)}
                  >
                    <Text style={[styles.calloutButtonText, { color: theme.colors.onPrimary }]}>Select Partner</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  callout: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    gap: 6,
  },
  calloutImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  calloutSubtitle: {
    fontSize: 12,
  },
  calloutMeta: {
    fontSize: 12,
  },
  calloutButton: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PartnerSelectionMap;

