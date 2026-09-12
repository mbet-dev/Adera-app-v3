import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Platform } from 'react-native';

export const ProfileLoadTimeoutScreen = ({ onRetry, onSignIn }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.title}>Taking longer than expected</Text>
        <Text style={styles.message}>
          We couldn't load your profile in time. This might be due to a slow connection.
        </Text>

        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.retryButton]} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.signInButton]} onPress={onSignIn}>
            <Text style={styles.signInButtonText}>Sign In Again</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  signInButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileLoadTimeoutScreen;
