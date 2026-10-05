import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook that provides AGGRESSIVE safe area padding
 * Ensures content is NEVER obscured by device UI elements
 * 
 * Returns padding values that include both safe area insets
 * plus additional buffer padding for maximum compatibility
 */
export const useSafeAreaPadding = () => {
  const insets = useSafeAreaInsets();
  
  // Light buffer padding — SafeAreaView already handles the core insets
  // Only add a small buffer to prevent content touching edges
  const bufferPadding = {
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
  };
  
  return {
    paddingTop: insets.top + bufferPadding.top,
    paddingBottom: insets.bottom + bufferPadding.bottom,
    paddingLeft: insets.left + bufferPadding.left,
    paddingRight: insets.right + bufferPadding.right,
  };
};

/**
 * Hook that returns only bottom padding for ScrollView content
 * Use this for ScrollView contentContainerStyle
 */
export const useSafeBottomPadding = () => {
  const insets = useSafeAreaInsets();
  
  // Bottom safe area inset + small buffer for comfortable scrolling
  return insets.bottom + 16;
};

export default useSafeAreaPadding;
