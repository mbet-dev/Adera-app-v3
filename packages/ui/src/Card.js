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

  const cardStyle = [
    styles.card,
    {
      backgroundColor: variant === 'outlined' 
        ? 'transparent' 
        : theme.colors.surface,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: variant === 'outlined' 
        ? theme.colors.gray[300] 
        : 'transparent',
      padding: padding,
    },
    style,
  ];

  if (onPress) {
    return (
      <PaperCard
        style={cardStyle}
        elevation={variant === 'outlined' ? 0 : elevation}
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
      elevation={variant === 'outlined' ? 0 : elevation}
      {...props}
    >
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
  },
});

export default Card;
