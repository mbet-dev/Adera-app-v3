import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BottomNavigation as RNPBottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';

const BottomNavigation = ({ navigationState, onIndexChange, renderScene, style, ...props }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // ULTRA AGGRESSIVE: Force LARGE bottom padding to ensure navigation is ALWAYS visible
  // Use device inset + HUGE buffer to guarantee visibility above device controls
  const deviceBottomInset = insets.bottom || 0;
  const minimumPadding = Platform.OS === 'ios' ? 40 : 32; // Large minimum
  const aggressivePadding = Math.max(deviceBottomInset, minimumPadding); // Add 20px extra buffer
  
  // Total bottom space = device inset + aggressive padding
  const totalBottomPadding = deviceBottomInset + aggressivePadding;

  return (
    <View style={[styles.wrapper, { paddingBottom: totalBottomPadding }]}>
      <RNPBottomNavigation
        navigationState={navigationState}
        onIndexChange={onIndexChange}
        renderScene={renderScene}
        safeAreaInsets={{ bottom: deviceBottomInset, top: 0, left: 0, right: 0 }}
        barStyle={[
          {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
            elevation: 8,
            height: 64, // Fixed height for nav bar itself
          },
          style,
        ]}
        sceneContainerStyle={[styles.sceneContainer, { backgroundColor: theme.colors.background }]}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        sceneAnimationEnabled={false}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sceneContainer: {
    flex: 1,
  },
});

// Add SceneMap functionality - AGGRESSIVE: Wrap in View to prevent Fragment prop warnings
BottomNavigation.SceneMap = (scenes) => {
  return ({ route }) => {
    const Scene = scenes[route.key];
    // Wrap in View to prevent RNP from passing invalid props to potential Fragments
    return Scene ? (
      <View style={{ flex: 1 }}>
        <Scene />
      </View>
    ) : null;
  };
};

export default BottomNavigation;
