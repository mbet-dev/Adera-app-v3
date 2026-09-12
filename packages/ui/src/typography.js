import { Platform } from 'react-native';

export const typography = {
  // Font families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: 'system-ui, -apple-system, sans-serif',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      web: 'system-ui, -apple-system, sans-serif',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Text styles
  styles: {
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 20,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.4,
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.3,
    },
  },
};

export default typography;
