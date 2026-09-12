import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const FlagEthiopia = ({ width = 60, height = 40, style }) => {
  const circleDiameter = Math.min(width, height) * 0.5;
  const emblemTop = (height - circleDiameter) / 2;
  const emblemLeft = (width - circleDiameter) / 2;
  return (
    <View style={[styles.container, { width, height }, style]} accessibilityRole={Platform.OS === 'web' ? 'img' : undefined} accessibilityLabel="Ethiopian flag">
      {/* Stripes */}
      <View style={[styles.stripe, { backgroundColor: '#078930' }]} />
      <View style={[styles.stripe, { backgroundColor: '#FFC621' }]} />
      <View style={[styles.stripe, { backgroundColor: '#DA121A' }]} />

      {/* Emblem */}
      <View style={[
        styles.emblem,
        {
          width: circleDiameter,
          height: circleDiameter,
          borderRadius: circleDiameter / 2,
          top: emblemTop,
          left: emblemLeft,
        },
      ]}>
        <Text style={styles.star}>★</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 6,
    position: 'relative',
  },
  stripe: {
    flex: 1,
  },
  emblem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F47AF',
  },
  star: {
    color: '#FFDD00',
    fontSize: 18,
    lineHeight: 18,
  },
});

export default FlagEthiopia;
