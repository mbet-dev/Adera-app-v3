import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PartnerSelectionMap = () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>Map preview not available on this platform.</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#777',
    fontSize: 14,
  },
});

export default PartnerSelectionMap;

