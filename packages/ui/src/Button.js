import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from './ThemeProvider';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.isDark;

  const sizeStyle = styles[size] || styles.md;
  const sizeTextStyle = styles[`${size}Text`] || styles.mdText;

  const variantConfig = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      borderWidth: 0,
      textColor: theme.colors.onPrimary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
      borderWidth: 0,
      textColor: theme.colors.onSecondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
      textColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: theme.colors.primary,
    },
  };

  const { backgroundColor, borderColor, borderWidth, textColor } =
    variantConfig[variant] || variantConfig.primary;

  const buttonStyles = [
    styles.button,
    sizeStyle,
    {
      backgroundColor,
      borderColor,
      borderWidth,
      opacity: disabled ? 0.5 : 1,
    },
    // Subtle elevation for primary/secondary on dark
    (variant === 'primary' || variant === 'secondary') && isDark
      ? { ...theme.shadows.sm }
      : {},
    style,
  ];

  const textStyles = [
    styles.text,
    sizeTextStyle,
    {
      color: textColor,
      opacity: disabled ? 0.7 : 1,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});

export default Button;
