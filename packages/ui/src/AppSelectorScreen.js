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
  const isDark = theme.isDark;
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
      colorContainer: theme.colors.primaryContainer,
      colorOnContainer: theme.colors.onPrimaryContainer,
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
      colorContainer: theme.colors.secondaryContainer,
      colorOnContainer: theme.colors.onSecondaryContainer,
    },
  ];

  const handleAppSelection = (appId) => {
    setSelectedApp(appId);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
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
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            <Text style={styles.logoEmoji}>🏺</Text>
          </View>
          <Text style={[styles.appName, { color: theme.colors.onBackground }]}>
            Adera
          </Text>
          <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
            Choose Your Experience
          </Text>
        </View>

        {/* App Selection Cards */}
        <View style={styles.appContainer}>
          {apps.map((app) => (
            <Animated.View
              key={app.id}
              style={[{ transform: [{ scale: selectedApp === app.id ? scaleAnim : 1 }] }]}
            >
              <TouchableOpacity
                style={[
                  styles.appCard,
                  {
                    backgroundColor: selectedApp === app.id ? app.colorContainer : theme.colors.surface,
                    borderColor: selectedApp === app.id ? app.color : theme.colors.outlineVariant,
                    borderWidth: selectedApp === app.id ? 2 : 1,
                    ...(isDark ? theme.shadows.sm : theme.shadows.md),
                  },
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
                <View style={[styles.iconContainer, { backgroundColor: app.colorContainer }]}>
                  <Text style={styles.appEmoji}>{app.emoji}</Text>
                  <Ionicons 
                    name={app.icon} 
                    size={22} 
                    color={app.colorOnContainer}
                    style={[styles.overlayIcon, { backgroundColor: theme.colors.surface }]}
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
                    {app.features.map((feature) => (
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
            variant="primary"
            size="lg"
            disabled={!selectedApp}
            onPress={handleContinue}
            style={[
              styles.continueButton,
              !selectedApp && { opacity: 0.5 },
              selectedApp && { backgroundColor: apps.find(app => app.id === selectedApp)?.color },
            ]}
            textStyle={{ 
              color: selectedApp ? theme.colors.white : theme.colors.onSurface,
              fontSize: 17,
              fontWeight: '600',
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
    paddingBottom: 80,
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
    borderRadius: 18,
    padding: 20,
    position: 'relative',
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
    bottom: 4,
    right: 4,
    borderRadius: 12,
    padding: 4,
  },
  appDetails: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
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
    gap: 10,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  continueButton: {
    marginTop: 32,
    marginBottom: 40,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AppSelectorScreen;
