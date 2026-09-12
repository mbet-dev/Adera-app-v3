import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

const StatusBadge = ({ 
  status,
  label: labelProp,
  style,
  textStyle,
  size = 'medium',
  variant = 'filled',
  tone,
}) => {
  const theme = useTheme();

  // Ethiopian parcel status mapping — using containers for filled for better contrast
  const statusConfig = {
    0: { label: 'Created', bg: theme.colors.surfaceVariant, fg: theme.colors.onSurfaceVariant },
    1: { label: 'At Drop-off', bg: theme.colors.secondaryContainer, fg: theme.colors.onSecondaryContainer },
    2: { label: 'In Transit', bg: theme.colors.warningContainer || '#FFF3D6', fg: theme.isDark ? '#FFD666' : '#8B6914' },
    3: { label: 'At Hub', bg: theme.colors.tertiaryContainer, fg: theme.colors.onTertiaryContainer },
    4: { label: 'Dispatched', bg: theme.colors.infoContainer, fg: theme.colors.onPrimaryContainer },
    5: { label: 'At Pickup Point', bg: theme.colors.primaryContainer, fg: theme.colors.onPrimaryContainer },
    6: { label: 'Delivered', bg: theme.colors.successContainer, fg: theme.colors.onSuccessContainer },
  };

  // Support tone prop for custom colors (used by CustomerDashboard)
  const config = tone
    ? { label: labelProp || '', bg: `${tone}22`, fg: tone }
    : statusConfig[status] || statusConfig[0];

  const displayLabel = labelProp || config.label;
  
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, borderRadius: 8 },
    medium: { paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, borderRadius: 10 },
    large: { paddingHorizontal: 14, paddingVertical: 7, fontSize: 14, borderRadius: 12 },
  };

  const badgeStyle = [
    styles.badge,
    {
      paddingHorizontal: sizeStyles[size].paddingHorizontal,
      paddingVertical: sizeStyles[size].paddingVertical,
      borderRadius: sizeStyles[size].borderRadius,
    },
    {
      backgroundColor: variant === 'filled' ? config.bg : 'transparent',
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: variant === 'outlined' ? config.fg : 'transparent',
    },
    style,
  ];

  return (
    <View style={badgeStyle}>
      <Text 
        style={[
          styles.text,
          { 
            color: config.fg,
            fontSize: sizeStyles[size].fontSize,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});

export default StatusBadge;
