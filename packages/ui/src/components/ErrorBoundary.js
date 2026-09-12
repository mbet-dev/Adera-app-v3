import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use inline fallback to avoid dependency on useTheme in class component
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#BA1A1A" />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
            </Text>
            {this.props.showRetry !== false && (
              <View style={styles.retryButton} onTouchEnd={this.handleRetry}>
                <Text style={styles.retryText}>Try Again</Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFDF6',
    padding: 32,
  },
  card: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C18',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#44483E',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1565C0',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
