import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@adera/ui';

/**
 * SafeAreaHeader — A consistent header wrapper for all shop screens.
 * Automatically adds top padding for the device's notch/status bar
 * and consistent bottom border styling.
 */
const SafeAreaHeader = ({ children, style, noBorder = false }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top + 12,
          borderBottomColor: noBorder ? 'transparent' : theme.colors.outlineVariant,
          borderBottomWidth: noBorder ? 0 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

export default SafeAreaHeader;
