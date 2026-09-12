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
  
  // Base buffer padding for different platforms
  const bufferPadding = {
    top: Platform.OS === 'ios' ? 10 : 15,
    bottom: Platform.OS === 'ios' ? 25 : 35, // More aggressive on Android
    left: 10,
    right: 10,
  };
  
  return {
    paddingTop: Math.max(insets.top, 20) + bufferPadding.top,
    paddingBottom: Math.max(insets.bottom, 20) + bufferPadding.bottom,
    paddingLeft: Math.max(insets.left, 0) + bufferPadding.left,
    paddingRight: Math.max(insets.right, 0) + bufferPadding.right,
  };
};

/**
 * Hook that returns only bottom padding for ScrollView content
 * Use this for ScrollView contentContainerStyle
 */
export const useSafeBottomPadding = () => {
  const insets = useSafeAreaInsets();
  
  // Minimum 40px bottom padding, plus safe area, plus 20px buffer
  const minBottomPadding = 40;
  const bufferPadding = Platform.OS === 'ios' ? 20 : 30;
  
  return Math.max(insets.bottom + bufferPadding, minBottomPadding);
};

export default useSafeAreaPadding;
