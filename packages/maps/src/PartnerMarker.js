import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Marker as NativeMarker, Callout } from 'react-native-maps';

// Web imports
let Marker, Popup;
if (Platform.OS === 'web') {
    try {
        const RL = require('react-leaflet');
        Marker = RL.Marker;
        Popup = RL.Popup;
    } catch (e) { }
}

const PartnerMarker = ({ coordinate, title, description, onPress, children }) => {
    if (Platform.OS === 'web') {
        if (!Marker) return null;
        return (
            <Marker position={[coordinate.latitude, coordinate.longitude]}>
                <Popup>
                    <View>
                        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
                        <Text>{description}</Text>
                        {children}
                    </View>
                </Popup>
            </Marker>
        );
    }

    return (
        <NativeMarker coordinate={coordinate} onPress={onPress}>
            <Callout>
                <View style={styles.callout}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                    {children}
                </View>
            </Callout>
        </NativeMarker>
    );
};

const styles = StyleSheet.create({
    callout: {
        width: 150,
        padding: 5,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
    },
});

export default PartnerMarker;
