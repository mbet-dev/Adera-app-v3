import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ParcelRouteMap = () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>Route map preview is not available on this platform.</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});

export default ParcelRouteMap;
