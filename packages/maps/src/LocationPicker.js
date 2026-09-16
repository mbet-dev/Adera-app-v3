import React, { useState } from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from './MapView';

/**
 * LocationPicker — cross-platform map-based location selection.
 *
 * Uses the lazy MapView (see MapView.js). On native inside Expo Go the map
 * is unavailable, so we offer a manual coordinate entry fallback instead of
 * crashing. On web, Leaflet click events give lat/lng directly.
 */
const LocationPicker = ({ initialLocation, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [manualLat, setManualLat] = useState(initialLocation ? String(initialLocation.latitude) : '');
  const [manualLng, setManualLng] = useState(initialLocation ? String(initialLocation.longitude) : '');

  const commit = (coordinate) => {
    setSelectedLocation(coordinate);
    if (onLocationSelect) onLocationSelect(coordinate);
  };

  const handleMapPress = (event) => {
    let coordinate;
    if (Platform.OS === 'web') {
      if (event?.latlng) {
        coordinate = { latitude: event.latlng.lat, longitude: event.latlng.lng };
      }
    } else if (event?.nativeEvent?.coordinate) {
      coordinate = event.nativeEvent.coordinate;
    }
    if (coordinate) commit(coordinate);
  };

  const applyManualEntry = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      commit({ latitude: lat, longitude: lng });
    }
  };

  const region = selectedLocation
    ? {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : { latitude: 9.03, longitude: 38.74, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        initialRegion={region}
        onPress={handleMapPress}
        fallbackMessage="Tap-to-select requires a development build.\nEnter coordinates manually below."
      >
        {selectedLocation && <Marker coordinate={selectedLocation} title="Delivery location" />}
      </MapView>

      <View style={styles.manualRow}>
        <Text style={styles.manualLabel}>Lat</Text>
        <TextInputStyled value={manualLat} onChangeText={setManualLat} placeholder="9.03" />
        <Text style={styles.manualLabel}>Lng</Text>
        <TextInputStyled value={manualLng} onChangeText={setManualLng} placeholder="38.74" />
        <TouchableOpacity style={styles.applyBtn} onPress={applyManualEntry}>
          <Text style={styles.applyBtnText}>Set</Text>
        </TouchableOpacity>
      </View>

      {selectedLocation && (
        <Text style={styles.selectedText}>
          Selected: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
};

// Small inline input to avoid a circular dependency on @adera/ui
const TextInputStyled = ({ value, onChangeText, placeholder }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputText}>{value}</Text>
    {/* Hidden real input via editable Text is not possible; use platform input */}
    {Platform.OS === 'web' ? (
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        style={styles.webInput}
      />
    ) : (
      <TextInputNative value={value} onChangeText={onChangeText} placeholder={placeholder} />
    )}
  </View>
);

let TextInputNative;
if (Platform.OS !== 'web') {
  TextInputNative = require('react-native').TextInput;
}

const styles = StyleSheet.create({
  container: { height: 280, borderRadius: 12, overflow: 'hidden', gap: 8 },
  map: { flex: 1 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  manualLabel: { fontSize: 12, color: '#607D8B', fontWeight: '600' },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
  },
  inputText: { fontSize: 13, color: '#263238' },
  webInput: {
    border: 'none',
    outline: 'none',
    fontSize: 13,
    width: '100%',
    background: 'transparent',
  },
  applyBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  selectedText: { fontSize: 12, color: '#455A64', textAlign: 'center' },
});

export default LocationPicker;
