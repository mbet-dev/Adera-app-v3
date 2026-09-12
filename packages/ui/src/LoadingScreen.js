import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.borderRadius.xl }]}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
        <Text
          variant="bodyLarge"
          style={[styles.message, { color: theme.colors.text.secondary }]}
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
