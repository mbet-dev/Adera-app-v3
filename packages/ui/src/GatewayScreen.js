import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
      gradient: theme.gradients.primary,
    },
    shop: {
      name: 'Adera-Shop',
      emoji: '🛍️',
      title: 'Enter Marketplace',
      subtitle: 'Discover local products, support Ethiopian businesses, and shop seamlessly.',
      color: theme.colors.secondary,
      gradient: theme.gradients.secondary,
    },
  };

  const currentApp = selectedApp ? appConfig[selectedApp] : null;
  const bgColor = currentApp ? currentApp.color : theme.colors.primary;
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.gradient, { backgroundColor: bgColor }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>
                {currentApp ? currentApp.emoji : '🏺'}
              </Text>
            </View>
            <Text style={styles.appName}>
              {currentApp ? currentApp.name : 'Adera'}
            </Text>
            {currentApp && (
              <Text style={styles.appSubtext}>
                {currentApp.title}
              </Text>
            )}
          </View>
          
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.marketEmoji}>🏪</Text>
            <Text style={styles.marketText}>Addis Ababa Marketplace</Text>
          </View>
          
          {/* Feature pills */}
          <View style={styles.featureRow}>
            {(currentApp?.ptp
              ? ['Real-time', 'QR Secure', '24/7']
              : ['Local', 'Fast Pay', 'Delivery']
            ).map((feat) => (
              <View key={feat} style={styles.featurePill}>
                <Text style={styles.featurePillText}>{feat}</Text>
              </View>
            ))}
          </View>
          
          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.welcomeTitle}>
              {currentApp ? `Welcome to ${currentApp.name}` : 'Welcome to Adera'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {currentApp ? currentApp.subtitle : 'Your all-in-one ecosystem for logistics and e-commerce in Addis Ababa.'}
            </Text>
            
            {/* Primary Actions */}
            <View style={styles.primaryActions}>
              <Button
                title="Log In or Sign Up"
                variant="outline"
                size="lg"
                onPress={onLogin}
                style={[styles.primaryButton, { borderColor: 'rgba(255,255,255,0.9)' }]}
                textStyle={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}
              />
              
              <TouchableOpacity style={styles.guestButton} onPress={onGuest}>
                <Text style={styles.guestButtonText}>
                  Continue as Guest
                </Text>
              </TouchableOpacity>
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
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  marketEmoji: {
    fontSize: 56,
    marginBottom: 10,
  },
  marketText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  featurePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  featurePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 40,
  },
  primaryActions: {
    marginBottom: 60,
  },
  primaryButton: {
    marginBottom: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  guestButtonText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GatewayScreen;
