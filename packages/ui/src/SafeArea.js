import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Platform, View } from 'react-native';
import { useTheme } from './ThemeProvider';

/**
 * SafeArea Component - Smart Safe Area Management
 * 
 * SafeAreaView wrapper that ensures content is not obscured by device UI or bottom navigation.
 * 
 * PROTECTION STRATEGY:
 * 1. SafeAreaView handles top/left/right edges automatically (status bar, notches, rounded corners)
 * 2. For withBottomNav=true: Adds bottom padding to clear the bottom navigation bar
 * 3. For withBottomNav=false: SafeAreaView handles bottom edge normally
 * 
 * CALCULATIONS:
 * - Top: Automatic via SafeAreaView (respects status bar, notch)
 * - Bottom with nav: 64px (nav base) + max(device inset, iOS:20px/Android:16px) + 8px buffer (~80-96px total)
 * - Bottom without nav: Automatic via SafeAreaView
 * - Left/Right: Automatic via SafeAreaView (respects rounded edges)
 * 
 * @param {Object} props
 * @param {Array<'top'|'bottom'|'left'|'right'>} props.edges - Which edges to apply safe area (default: all)
 * @param {boolean} props.aggressive - Use aggressive padding (default: true)
 * @param {boolean} props.withBottomNav - Add extra padding for bottom navigation bar (default: false)
 * @param {Object} props.style - Additional styles
 * @param {React.ReactNode} props.children - Child components
 */
const SafeArea = ({ 
  edges = ['top', 'bottom', 'left', 'right'], 
  aggressive = true,
  withBottomNav = false,
  style, 
  children,
  ...props 
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate manual bottom padding for nav bar
  let manualBottomPadding = 0;
  
  if (withBottomNav && edges.includes('bottom')) {
    // Bottom nav bar base height: 56px (Material 3 standard)
    // Plus device safe area inset + small buffer for clearance
    const NAV_BAR_HEIGHT = 56;
    const deviceBottomInset = insets.bottom || 0;
    const buffer = 4;
    
    // Total: nav bar + device inset + buffer
    manualBottomPadding = NAV_BAR_HEIGHT + deviceBottomInset + buffer;
  }

  // Additional padding for inner container
  const innerPadding = {
    paddingBottom: manualBottomPadding,
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style
      ]}
      edges={edges}
      {...props}
    >
      <View style={[styles.innerContainer, innerPadding]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});

export default SafeArea;
