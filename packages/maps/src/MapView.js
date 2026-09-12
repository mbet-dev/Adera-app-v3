import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
// Native imports
import NativeMapView, { Marker as NativeMarker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

// Web imports - we need to conditionally import these to avoid native crashes
let MapContainer, TileLayer, Marker, Popup;
if (Platform.OS === 'web') {
    try {
        const RL = require('react-leaflet');
        MapContainer = RL.MapContainer;
        TileLayer = RL.TileLayer;
        Marker = RL.Marker;
        Popup = RL.Popup;
        // Leaflet CSS should be imported in the main app entry point or index.html
        // import 'leaflet/dist/leaflet.css';
    } catch (e) {
        console.warn('Failed to load react-leaflet', e);
    }
}

const MapView = ({
    region,
    initialRegion,
    children,
    style,
    onPress,
    onRegionChangeComplete,
    showsUserLocation = false,
    provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT,
    ...props
}) => {
    const mapRegion = region || initialRegion;

    if (Platform.OS === 'web') {
        if (!MapContainer) {
            return (
                <View style={[styles.container, style]}>
                    <Text>Map not supported on web (missing react-leaflet)</Text>
                </View>
            );
        }

        // Leaflet needs [lat, lng]
        const center = mapRegion ? [mapRegion.latitude, mapRegion.longitude] : [9.03, 38.74]; // Default to Addis Ababa
        const zoom = mapRegion ? Math.round(Math.log2(360 / mapRegion.latitudeDelta)) + 1 : 13;

        return (
            <View style={[styles.container, style]}>
                <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} onClick={onPress}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {children}
                </MapContainer>
            </View>
        );
    }

    return (
        <NativeMapView
            style={[styles.container, style]}
            region={region}
            initialRegion={initialRegion}
            onPress={onPress}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={showsUserLocation}
            provider={provider}
            {...props}
        >
            {children}
        </NativeMapView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
});

export default MapView;
