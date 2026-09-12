import './src/CompatLayer';

export { default as ThemeProvider, useTheme } from './src/ThemeProvider';
export { default as Button } from './src/Button';
export { default as TextInput } from './src/TextInput';
export { default as SafeArea } from './src/SafeArea';
export { useSafeAreaPadding, useSafeBottomPadding } from './src/useSafeAreaPadding';
export { default as OnboardingScreen } from './src/OnboardingScreen';
export { default as AppSelectorScreen } from './src/AppSelectorScreen';
export { default as GatewayScreen } from './src/GatewayScreen';
export { default as LoadingScreen } from './src/LoadingScreen';
export { default as Card } from './src/Card';
export { default as AppBar } from './src/AppBar';
export { default as BottomNavigation } from './src/BottomNavigation';
export { default as AppBottomNavigation } from './src/AppBottomNavigation';
export { default as StatusBadge } from './src/StatusBadge';
export { default as ParcelCard } from './src/ParcelCard';
export { default as colors } from './src/colors';
export { default as typography } from './src/typography';

// Export notification components from components subdirectory
export * from './src/components/NotificationSnackbar';
export * from './src/components/NotificationContainer';
export { useProfileSettings } from './src/hooks/useProfileSettings';
export { default as CustomFAB } from './src/components/CustomFAB';
export { default as SignupSuccessModal } from './src/components/SignupSuccessModal';
export { default as ErrorBoundary } from './src/components/ErrorBoundary';

// ProfileScreen export moved to end to avoid require cycle
export { default as ProfileScreen } from './src/ProfileScreen';
export { default as MarketDiscoveryScreen } from './src/screens/MarketDiscoveryScreen';
