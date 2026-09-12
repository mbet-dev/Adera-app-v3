// Ethiopian-inspired Material 3 palette for Adera Hybrid App

const sharedNeutrals = {
  50: '#F4F6EE',
  100: '#E9EEDC',
  200: '#D5DFC2',
  300: '#C4D1AB',
  400: '#AEBF90',
  500: '#96A678',
  600: '#7C8D61',
  700: '#65724C',
  800: '#4C5736',
  900: '#344026',
};

const shared = {
  white: '#FFFFFF',
  black: '#000000',
  neutral: sharedNeutrals,
  gray: sharedNeutrals,
};

export const lightColors = {
  primary: '#1565C0', // PTP - Professional Blue
  onPrimary: '#FFFFFF',
  primaryContainer: '#BBDEFB',
  onPrimaryContainer: '#001B3D',
  secondary: '#2E7D32', // Shop - Ethiopian Green
  onSecondary: '#FFFFFF',
  secondaryContainer: '#A5D6A7',
  onSecondaryContainer: '#00210E',
  tertiary: '#C62828',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFCDD2',
  onTertiaryContainer: '#410006',
  background: '#FFFFFF',
  onBackground: '#1C1B1F',
  surface: '#FFFFFF',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E0E4D6',
  onSurfaceVariant: '#45483B',
  surfaceContainerLow: '#F1F4EA',
  surfaceContainer: '#EBEFE2',
  surfaceContainerHigh: '#E3E7DA',
  surfaceContainerHighest: '#DADFD1',
  outline: '#75796C',
  outlineVariant: '#C4C8B6',
  shadow: 'rgba(0,0,0,0.2)',
  scrim: 'rgba(0,0,0,0.4)',
  inverseSurface: '#303428',
  inverseOnSurface: '#EFF1E6',
  inversePrimary: '#7FDB94',
  success: '#388E3C',
  onSuccess: '#FFFFFF',
  warning: '#F9A825',
  info: '#1E88E5',
  error: '#B3261E',
  onError: '#FFFFFF',
  surfaceDisabled: 'rgba(24, 29, 22, 0.12)',
  onSurfaceDisabled: 'rgba(24, 29, 22, 0.38)',
  backdrop: 'rgba(29, 53, 37, 0.4)',
  ...shared,
};

export const darkColors = {
  primary: '#90CAF9', // PTP - Light Blue for dark theme
  onPrimary: '#001B3D',
  primaryContainer: '#003D82',
  onPrimaryContainer: '#D0E4FF',
  secondary: '#7FDB94', // Shop - Light Green for dark theme
  onSecondary: '#003919',
  secondaryContainer: '#0B5228',
  onSecondaryContainer: '#A5D6A7',
  tertiary: '#FF8A80',
  onTertiary: '#5C0009',
  tertiaryContainer: '#7F0D19',
  onTertiaryContainer: '#FFDADB',
  background: '#10140E',
  onBackground: '#E3E7DA',
  surface: '#10140E',
  onSurface: '#E3E7DA',
  surfaceVariant: '#45483B',
  onSurfaceVariant: '#C4C8B6',
  surfaceContainerLow: '#1B2019',
  surfaceContainer: '#1F241C',
  surfaceContainerHigh: '#222820',
  surfaceContainerHighest: '#262C23',
  outline: '#8A8D7F',
  outlineVariant: '#45483B',
  shadow: 'rgba(0,0,0,0.4)',
  scrim: 'rgba(0,0,0,0.6)',
  inverseSurface: '#E3E7DA',
  inverseOnSurface: '#10140E',
  inversePrimary: '#2E7D32',
  success: '#81C784',
  onSuccess: '#003911',
  warning: '#FFB300',
  info: '#64B5F6',
  error: '#F2B8B5',
  onError: '#601410',
  surfaceDisabled: 'rgba(227, 231, 218, 0.12)',
  onSurfaceDisabled: 'rgba(227, 231, 218, 0.38)',
  backdrop: 'rgba(14, 24, 12, 0.6)',
  ...shared,
};

const colors = {
  light: lightColors,
  dark: darkColors,
};

export default colors;
