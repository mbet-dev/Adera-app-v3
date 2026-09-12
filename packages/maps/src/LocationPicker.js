import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import MapView from './MapView';
import { Marker as NativeMarker } from 'react-native-maps';
import { Platform } from 'react-native';

// Web imports
let Marker;
if (Platform.OS === 'web') {
    try {
        const RL = require('react-leaflet');
        Marker = RL.Marker;
    } catch (e) { }
}

const LocationPicker = ({ initialLocation, onLocationSelect }) => {
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);

    const handlePress = (event) => {
        let coordinate;
        if (Platform.OS === 'web') {
            // Leaflet event
            coordinate = {
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            };
        } else {
            // Native event
            coordinate = event.nativeEvent.coordinate;
        }
        setSelectedLocation(coordinate);
        if (onLocationSelect) {
            onLocationSelect(coordinate);
        }
    };

    const region = selectedLocation ? {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    } : {
        latitude: 9.03, // Addis Ababa
        longitude: 38.74,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={region}
                region={region}
                onPress={handlePress}
            >
                {selectedLocation && (
                    Platform.OS === 'web' ? (
                        Marker && <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
                    ) : (
                        <NativeMarker coordinate={selectedLocation} />
                    )
                )}
            </MapView>
            <View style={styles.footer}>
                <Text>Tap on map to select location</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    map: {
        flex: 1,
    },
    footer: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
    },
});

export default LocationPicker;
