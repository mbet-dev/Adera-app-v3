import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

const StatusBadge = ({ 
  status, 
  style,
  textStyle,
  size = 'medium',
  variant = 'filled'
}) => {
  const theme = useTheme();

  // Ethiopian parcel status mapping
  const statusConfig = {
    0: { label: 'Created', color: theme.colors.onSurfaceVariant },
    1: { label: 'At Drop-off', color: theme.colors.secondary },
    2: { label: 'In Transit', color: theme.colors.warning }, 
    3: { label: 'At Hub', color: theme.colors.tertiary }, 
    4: { label: 'Dispatched', color: theme.colors.info }, 
    5: { label: 'At Pickup Point', color: theme.colors.primary },
    6: { label: 'Delivered', color: theme.colors.success }, 
  };

  const config = statusConfig[status] || statusConfig[0];
  
  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
  };

  const badgeStyle = [
    styles.badge,
    sizeStyles[size],
    {
      backgroundColor: variant === 'filled' 
        ? config.color 
        : 'transparent',
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: config.color,
    },
    style,
  ];

  const textColor = variant === 'filled' 
    ? theme.colors.onPrimary 
    : config.color;

  return (
    <View style={badgeStyle}>
      <Text 
        style={[
          styles.text,
          { 
            color: textColor,
            fontSize: sizeStyles[size].fontSize,
            fontWeight: '600'
          },
          textStyle
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});

export default StatusBadge;
