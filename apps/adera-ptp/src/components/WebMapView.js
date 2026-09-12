import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

const WebMapView = ({ partner, userLocation }) => {
  const getMapUrlWithUserLocation = () => {
    if (!partner || !partner.location) return null;
    const lat = Number(partner.location.latitude || 0);
    const lon = Number(partner.location.longitude || 0);
    if (!lat || !lon) return null;
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
    }
    const uLat = Number(userLocation.latitude);
    const uLon = Number(userLocation.longitude);
    const minLon = Math.min(lon, uLon) - 0.01;
    const minLat = Math.min(lat, uLat) - 0.01;
    const maxLon = Math.max(lon, uLon) + 0.01;
    const maxLat = Math.max(lat, uLat) + 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${lat},${lon}`;
  };

  const openInGoogleMaps = () => {
    try {
      const lat = Number(partner.location.latitude || 0);
      const lon = Number(partner.location.longitude || 0);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      if (typeof window !== 'undefined') window.open(url, '_blank');
      else Linking.openURL(url);
    } catch (e) {
      // ignore
    }
  };

  const mapUrl = getMapUrlWithUserLocation();

  if (!mapUrl) {
    return (
      <View style={styles.mapUnavailableContainer}>
        <Text style={styles.mapUnavailableText}>Map unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <iframe
        src={mapUrl}
        title={`Map for ${partner.name}`}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 'none' }}
      />
      <View style={styles.overlay}>
        <View style={styles.partnerLabel}>
          <Text style={styles.partnerLabelText}>{partner.name}</Text>
        </View>
        {userLocation && userLocation.latitude && userLocation.longitude && (
          <View style={styles.userLabel}>
            <Text style={styles.userLabelText}>You</Text>
          </View>
        )}
        <View style={styles.gmapsButtonContainer}>
          <TouchableOpacity onPress={openInGoogleMaps} style={styles.gmapsButton}>
            <Text style={styles.gmapsButtonText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  partnerLabel: {
    position: 'absolute',
    left: '60%',
    top: '18%',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  partnerLabelText: {
    fontWeight: '700',
  },
  userLabel: {
    position: 'absolute',
    left: '45%',
    top: '70%',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userLabelText: {
    color: '#fff',
    fontWeight: '700',
  },
  gmapsButtonContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    pointerEvents: 'auto',
  },
  gmapsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gmapsButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  mapUnavailableContainer: {
    width: '100%',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  mapUnavailableText: {
    color: '#666',
  },
});

export default WebMapView;
