import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator
          animating={true}
          size="large"
          color="#1565C0"
        />
        <Text
          variant="bodyLarge"
          style={styles.message}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});

export default LoadingScreen;
