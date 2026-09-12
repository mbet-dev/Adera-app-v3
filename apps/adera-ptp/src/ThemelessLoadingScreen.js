import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function ThemelessLoadingScreen({ message }) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'
    }}>
      <ActivityIndicator size="large" color="#333" />
      {message && <Text style={{ color: '#333', marginTop: 16 }}>{message}</Text>}
    </View>
  );
}
