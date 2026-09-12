import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useTheme } from './ThemeProvider';

const { width, height } = Dimensions.get('window');

const GatewayScreen = ({ onLogin, onGuest, selectedApp = null }) => {
  const theme = useTheme();
  
  const appConfig = {
    ptp: {
      name: 'Adera-PTP',
      emoji: '📦',
      title: 'Access Logistics Platform',
      subtitle: 'Send parcels, track deliveries, and manage logistics with secure QR codes.',
      color: theme.colors.primary,
    },
    shop: {
      name: 'Adera-Shop',
      emoji: '🛍️',
      title: 'Enter Marketplace',
      subtitle: 'Discover local products, support Ethiopian businesses, and shop seamlessly.',
      color: theme.colors.secondary,
    },
  };

  const currentApp = selectedApp ? appConfig[selectedApp] : null;
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View 
        style={[styles.gradient, { backgroundColor: currentApp ? currentApp.color : theme.colors.primary }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={[
              styles.logoContainer,
              currentApp && { backgroundColor: currentApp.color + '30' }
            ]}>
              <Text style={styles.logoEmoji}>
                {currentApp ? currentApp.emoji : '🏺'}
              </Text>
            </View>
            <Text style={[styles.appName, { color: theme.colors.white }]}>
              {currentApp ? currentApp.name : 'Adera'}
            </Text>
            {currentApp && (
              <Text style={[styles.appSubtext, { color: theme.colors.white + '80' }]}>
                {currentApp.title}
              </Text>
            )}
          </View>
          
          {/* Market Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.marketEmoji}>🏪</Text>
            <Text style={styles.marketText}>Addis Ababa Marketplace</Text>
          </View>
          
          {/* Main Content */}
          <View style={styles.content}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.white }]}>
              {currentApp ? `Welcome to ${currentApp.name}` : 'Welcome to Adera'}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.colors.white }]}>
              {currentApp ? currentApp.subtitle : 'Your all-in-one ecosystem for logistics and e-commerce in Addis Ababa.'}
            </Text>
            
            {/* Primary Actions */}
            <View style={styles.primaryActions}>
              <Button
                title="Log In or Sign Up"
                variant="outline"
                size="lg"
                onPress={onLogin}
                style={[styles.primaryButton, { borderColor: theme.colors.white }]}
                textStyle={{ color: theme.colors.white, fontSize: 18 }}
              />
              
              <Button
                title="Continue as Guest"
                variant="ghost"
                size="lg"
                onPress={onGuest}
                style={styles.secondaryButton}
                textStyle={{ color: theme.colors.white, fontSize: 16 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height, // Ensure minimum height for proper layout
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  appSubtext: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  marketEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  marketText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 80, // AGGRESSIVE bottom padding to prevent overlap
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 32,
  },
  primaryActions: {
    marginBottom: 60, // Increased margin for better spacing
  },
  primaryButton: {
    marginBottom: 16,
    borderWidth: 2,
  },
  secondaryButton: {
    opacity: 0.9,
  },
});

export default GatewayScreen;
