import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const Card = ({ 
  children, 
  style, 
  elevation = 2,
  padding = 16,
  variant = 'elevated',
  onPress,
  ...props 
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;

  // Use proper surface container colors for dark mode elevation
  const getBackgroundColor = () => {
    if (variant === 'outlined') return 'transparent';
    switch (elevation) {
      case 0: return theme.colors.surface;
      case 1: return theme.colors.surfaceContainerLow;
      case 2: return theme.colors.surfaceContainer;
      case 3:
      case 4:
      case 5: return theme.colors.surfaceContainerHigh;
      default: return theme.colors.surfaceContainer;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: variant === 'outlined'
        ? theme.colors.outlineVariant
        : 'transparent',
      padding: padding,
      // Apply shadow from theme in dark mode
      ...(isDark && variant !== 'outlined' ? theme.shadows.sm : {}),
    },
    style,
  ];

  if (onPress) {
    return (
      <PaperCard
        style={cardStyle}
        elevation={variant === 'outlined' ? 0 : (isDark ? 0 : elevation)}
        onPress={onPress}
        {...props}
      >
        {children}
      </PaperCard>
    );
  }

  return (
    <PaperCard
      style={cardStyle}
      elevation={variant === 'outlined' ? 0 : (isDark ? 0 : elevation)}
      {...props}
    >
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginVertical: 8,
  },
});

export default Card;
