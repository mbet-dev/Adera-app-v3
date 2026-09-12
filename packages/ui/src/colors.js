// Ethiopian-inspired Material 3 palette for Adera Hybrid App
// Refined for WCAG AA contrast in both light and dark modes

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

// ═══════════════════════════════════════════════════════════════
// LIGHT THEME — Clean, airy, with warm Ethiopian earth tones
// ═══════════════════════════════════════════════════════════════
export const lightColors = {
  // Primary — Professional Blue (PTP / Logistics)
  primary: '#1565C0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6E8FF',
  onPrimaryContainer: '#001B3D',

  // Secondary — Ethiopian Green (Shop / Commerce)
  secondary: '#2E7D32',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#B8F0B8',
  onSecondaryContainer: '#002106',

  // Tertiary — Warm Terracotta (Ethiopian)
  tertiary: '#C2553A',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFDAD2',
  onTertiaryContainer: '#3B0906',

  // Background & Surface
  background: '#FAFDF6',
  onBackground: '#1A1C18',
  surface: '#FAFDF6',
  onSurface: '#1A1C18',
  surfaceVariant: '#E0E4D6',
  onSurfaceVariant: '#44483E',

  // Surface Containers — Subtle elevation layers
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F4F7EF',
  surfaceContainer: '#EEF1E8',
  surfaceContainerHigh: '#E8EBE3',
  surfaceContainerHighest: '#E2E6DD',

  // Outline — Borders & dividers
  outline: '#74796D',
  outlineVariant: '#C4C8B6',

  // Shadows & overlays
  shadow: 'rgba(0,0,0,0.15)',
  scrim: 'rgba(0,0,0,0.35)',

  // Inverse
  inverseSurface: '#2F312C',
  inverseOnSurface: '#F0F2EA',
  inversePrimary: '#A8C8FF',

  // Semantic
  success: '#2E7D32',
  onSuccess: '#FFFFFF',
  successContainer: '#B8F0B8',
  onSuccessContainer: '#002106',
  warning: '#E6A817',
  warningContainer: '#FFF3D6',
  info: '#1565C0',
  infoContainer: '#D6E8FF',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Surface states
  surfaceDisabled: 'rgba(26, 28, 24, 0.12)',
  onSurfaceDisabled: 'rgba(26, 28, 24, 0.38)',
  backdrop: 'rgba(26, 28, 24, 0.4)',

  // Elevation overlay colors for cards
  elevation1: 'rgba(0,0,0,0.03)',
  elevation2: 'rgba(0,0,0,0.05)',
  elevation3: 'rgba(0,0,0,0.07)',

  ...shared,
};

// ═══════════════════════════════════════════════════════════════
// DARK THEME — Rich, warm dark with high contrast text
// ═══════════════════════════════════════════════════════════════
export const darkColors = {
  // Primary — Bright Blue on dark (WCAG AA: 7.1:1 on #181C14)
  primary: '#A8C8FF',
  onPrimary: '#003062',
  primaryContainer: '#00478A',
  onPrimaryContainer: '#D6E8FF',

  // Secondary — Bright Green on dark
  secondary: '#7ED97E',
  onSecondary: '#003912',
  secondaryContainer: '#0B5228',
  onSecondaryContainer: '#B8F0B8',

  // Tertiary — Soft Coral on dark
  tertiary: '#FFB4A4',
  onTertiary: '#5C1710',
  tertiaryContainer: '#7F2D20',
  onTertiaryContainer: '#FFDAD2',

  // Background & Surface — Deep warm dark, NOT pure black
  background: '#121410',
  onBackground: '#E2E6DD',
  surface: '#121410',
  onSurface: '#E2E6DD',
  surfaceVariant: '#44483E',
  onSurfaceVariant: '#C4C8B6',

  // Surface Containers — Visible elevation layers in dark mode
  surfaceContainerLowest: '#0C0E0A',
  surfaceContainerLow: '#1A1D18',
  surfaceContainer: '#1E211A',
  surfaceContainerHigh: '#282C24',
  surfaceContainerHighest: '#33372E',

  // Outline
  outline: '#8E9386',
  outlineVariant: '#44483E',

  // Shadows & overlays
  shadow: 'rgba(0,0,0,0.45)',
  scrim: 'rgba(0,0,0,0.65)',

  // Inverse
  inverseSurface: '#E2E6DD',
  inverseOnSurface: '#1A1C18',
  inversePrimary: '#0060C0',

  // Semantic — Bright on dark backgrounds
  success: '#7ED97E',
  onSuccess: '#003912',
  successContainer: '#0B5228',
  onSuccessContainer: '#B8F0B8',
  warning: '#FFD666',
  warningContainer: '#4D3A00',
  info: '#A8C8FF',
  infoContainer: '#00478A',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  // Surface states
  surfaceDisabled: 'rgba(226, 230, 221, 0.12)',
  onSurfaceDisabled: 'rgba(226, 230, 221, 0.38)',
  backdrop: 'rgba(18, 20, 16, 0.65)',

  // Elevation overlay colors for cards in dark mode
  elevation1: 'rgba(255,255,255,0.03)',
  elevation2: 'rgba(255,255,255,0.05)',
  elevation3: 'rgba(255,255,255,0.07)',

  ...shared,
};

const colors = {
  light: lightColors,
  dark: darkColors,
};

export default colors;
