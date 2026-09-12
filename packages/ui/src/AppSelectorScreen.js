import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useTheme } from './ThemeProvider';

const { width, height } = Dimensions.get('window');

const AppSelectorScreen = ({ onAppSelect }) => {
  const theme = useTheme();
  const [selectedApp, setSelectedApp] = useState(null);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const apps = [
    {
      id: 'ptp',
      name: 'Adera-PTP',
      subtitle: 'Logistics & Delivery',
      description: 'Send parcels, track deliveries, and manage logistics with real-time updates and secure QR codes.',
      icon: 'car',
      emoji: '📦',
      features: ['Real-time Tracking', 'QR Code Security', 'Partner Network', 'SMS Notifications'],
      color: theme.colors.primary,
    },
    {
      id: 'shop',
      name: 'Adera-Shop',
      subtitle: 'E-Commerce Marketplace',
      description: 'Discover local products, support Ethiopian businesses, and enjoy seamless shopping experiences.',
      icon: 'storefront',
      emoji: '🛍️',
      features: ['Local Products', 'Partner Stores', 'Secure Payments', 'Home Delivery'],
      color: theme.colors.secondary,
    },
  ];

  const handleAppSelection = (appId) => {
    setSelectedApp(appId);
    
    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedApp) {
      onAppSelect(selectedApp);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🏺</Text>
          </View>
          <Text style={[styles.appName, { color: theme.colors.onBackground }]}>
            Adera
          </Text>
          <Text style={[styles.tagline, { color: theme.colors.onBackground + '80' }]}>
            Choose Your Experience
          </Text>
        </View>

        {/* App Selection Cards */}
        <View style={styles.appContainer}>
          {apps.map((app) => (
            <Animated.View
              key={app.id}
              style={[
                {
                  transform: [{ scale: selectedApp === app.id ? scaleAnim : 1 }],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.appCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedApp === app.id 
                      ? app.color 
                      : theme.colors.outline,
                    borderWidth: selectedApp === app.id ? 3 : 1,
                    shadowColor: selectedApp === app.id ? app.color : theme.colors.shadow,
                  }
                ]}
                onPress={() => handleAppSelection(app.id)}
                activeOpacity={0.8}
              >
                {/* Selection Indicator */}
                {selectedApp === app.id && (
                  <View style={[styles.selectionBadge, { backgroundColor: app.color }]}>
                    <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                  </View>
                )}

                {/* App Icon */}
                <View style={[styles.iconContainer, { backgroundColor: app.color + '20' }]}>
                  <Text style={styles.appEmoji}>{app.emoji}</Text>
                  <Ionicons 
                    name={app.icon} 
                    size={24} 
                    color={app.color} 
                    style={styles.overlayIcon}
                  />
                </View>

                {/* App Details */}
                <View style={styles.appDetails}>
                  <Text style={[styles.appTitle, { color: theme.colors.onSurface }]}>
                    {app.name}
                  </Text>
                  <Text style={[styles.appSubtitle, { color: app.color }]}>
                    {app.subtitle}
                  </Text>
                  <Text style={[styles.appDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {app.description}
                  </Text>

                  {/* Feature List */}
                  <View style={styles.featureList}>
                    {app.features.map((feature, index) => (
                      <View key={feature} style={styles.featureItem}>
                        <View style={[styles.featureBullet, { backgroundColor: app.color }]} />
                        <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button
            title={selectedApp ? `Continue with ${apps.find(app => app.id === selectedApp)?.name}` : 'Select an App'}
            variant={selectedApp ? 'solid' : 'outline'}
            size="lg"
            disabled={!selectedApp}
            onPress={handleContinue}
            style={[
              styles.continueButton,
              !selectedApp && { opacity: 0.5 },
              selectedApp && { backgroundColor: apps.find(app => app.id === selectedApp)?.color }
            ]}
            textStyle={{ 
              color: selectedApp ? theme.colors.white : theme.colors.onSurface,
              fontSize: 18,
              fontWeight: '600'
            }}
          />
          
          <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
            You can access both apps anytime from your profile
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // AGGRESSIVE bottom padding to prevent overlap
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
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
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
  },
  appContainer: {
    paddingHorizontal: 24,
    gap: 20,
  },
  appCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  appEmoji: {
    fontSize: 32,
  },
  overlayIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  appDetails: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  continueButton: {
    marginTop: 32,
    marginBottom: 40, // Increased bottom margin
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AppSelectorScreen;
