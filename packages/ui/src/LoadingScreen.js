import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.onPrimary}
        />
        <Text
          variant="bodyLarge"
          style={[styles.message, { color: theme.colors.onPrimary }]}
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
});

export default LoadingScreen;
