import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';

/**
 * AppSwitcherButton - A shared button for switching between Adera-PTP and Adera-Shop.
 *
 * Props:
 *  - targetApp: 'ptp' | 'shop' — which app to switch to
 *  - onPress: () => void — callback when tapped
 *  - compact: boolean — render as a small icon-only button (default false)
 */
const AppSwitcherButton = ({ targetApp, onPress, compact = false }) => {
  const theme = useTheme();

  const isShop = targetApp === 'shop';
  const label = isShop ? 'Shop' : 'PTP';
  const icon = isShop ? 'storefront' : 'car';
  const description = isShop
    ? 'Switch to Adera-Shop'
    : 'Switch to Adera-PTP';

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactBtn,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
        onPress={onPress}
        accessibilityLabel={description}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={theme.colors.onPrimaryContainer}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
      onPress={onPress}
      accessibilityLabel={description}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.colors.onPrimaryContainer}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.colors.text?.primary || theme.colors.onSurface }]}>
          Switch to {label}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text?.secondary || theme.colors.onSurfaceVariant }]}>
          {isShop
            ? 'Browse products & marketplace'
            : 'Send parcels & track deliveries'}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={theme.colors.text?.secondary || theme.colors.onSurfaceVariant}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  compactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppSwitcherButton;
