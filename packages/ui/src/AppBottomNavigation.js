import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View, Dimensions } from 'react-native';
import { BottomNavigation as RNPBottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 600,
  tablet: 960,
  desktop: 1280,
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get responsive config based on window width
const getResponsiveConfig = (width) => {
  if (width < BREAKPOINTS.mobile) {
    return {
      barHeight: 56,
      iconSize: 24,
      labelVisible: true,
      compact: true,
    };
  } else if (width < BREAKPOINTS.tablet) {
    return {
      barHeight: 64,
      iconSize: 28,
      labelVisible: true,
      compact: false,
    };
  } else {
    return {
      barHeight: 72,
      iconSize: 32,
      labelVisible: true,
      compact: false,
    };
  }
};

const AppBottomNavigation = ({ navigationState, onIndexChange, renderScene, renderFab, ...props }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Window dimensions state for responsive behavior
  const [windowDimensions, setWindowDimensions] = useState(() => {
    if (Platform.OS === 'web') {
      return {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      };
    }
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Refs to prevent unnecessary re-renders and track mounted state
  const mountedRef = useRef(true);
  const resizeTimeoutRef = useRef(null);
  const handlersRef = useRef({});
  const containerRef = useRef(null);

  // Responsive config
  const responsiveConfig = getResponsiveConfig(windowDimensions.width);

  // Stable sync function that doesn't cause re-renders
  const syncFromHash = useCallback(() => {
    if (Platform.OS !== 'web' || !mountedRef.current) return;
    
    try {
      const hash = window.location.hash;
      const matchingRoute = navigationState.routes.findIndex(
        route => `#${route.key}` === hash
      );
      if (matchingRoute >= 0 && matchingRoute !== navigationState.index) {
        onIndexChange(matchingRoute);
      }
    } catch (error) {
      console.warn('[AppBottomNavigation] Error syncing from hash:', error);
    }
  }, [navigationState.routes, navigationState.index, onIndexChange]);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (Platform.OS !== 'web' || !mountedRef.current) return;
    
    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce resize to avoid excessive updates
    resizeTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      
      // Only update if dimensions actually changed significantly (more than 50px)
      const widthDiff = Math.abs(newDimensions.width - windowDimensions.width);
      const heightDiff = Math.abs(newDimensions.height - windowDimensions.height);
      
      if (widthDiff > 50 || heightDiff > 50) {
        setWindowDimensions(newDimensions);
      }
    }, 150); // 150ms debounce
  }, [windowDimensions]);

  // Handle web URL updates
  const updateWebUrl = useCallback((index) => {
    if (Platform.OS !== 'web' || !mountedRef.current) return;
    
    try {
      const route = navigationState.routes[index];
      if (route) {
        const newHash = `#${route.key}`;
        if (window.location.hash !== newHash) {
          // Use replaceState to avoid cluttering history
          window.history.replaceState(null, '', newHash);
        }
      }
    } catch (error) {
      console.warn('[AppBottomNavigation] Error updating URL:', error);
    }
  }, [navigationState.routes]);

  // Enhanced index change handler
  const handleIndexChange = useCallback((newIndex) => {
    if (!mountedRef.current) return;
    
    updateWebUrl(newIndex);
    onIndexChange(newIndex);
  }, [updateWebUrl, onIndexChange]);

  // Web-specific event listeners setup (single consolidated effect)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Initialize URL on mount
    const hash = window.location.hash;
    if (!hash) {
      updateWebUrl(navigationState.index);
    } else {
      syncFromHash();
    }

    // Store handlers for cleanup
    const handlers = {
      popstate: syncFromHash,
      hashchange: syncFromHash,
      resize: handleResize,
      focus: syncFromHash,
      orientationchange: handleResize,
    };

    handlersRef.current = handlers;

    // Add event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    // Note: MutationObserver removed - using event-based approach instead
    // This prevents performance issues from watching DOM changes

    // Handle window dimensions changes (for responsive behavior)
    const dimensions = Dimensions.get('window');
    setWindowDimensions({
      width: dimensions.width,
      height: dimensions.height,
    });

    // Cleanup function
    return () => {
      // Clear timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Remove event listeners
      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });

      // Cleanup complete
    };
  }, []); // Empty deps - only run on mount/unmount

  // Update URL when navigation state changes (but not on every render)
  useEffect(() => {
    if (Platform.OS === 'web' && mountedRef.current) {
      updateWebUrl(navigationState.index);
    }
  }, [navigationState.index, updateWebUrl]);

  // Mark as unmounted on cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Inject web-specific styles for pointer events and touch handling
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const styleId = 'adera-bottom-nav-styles';
    // Remove existing style if present (for hot reload)
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Ensure bottom navigation container is always interactive */
      .adera-bottom-nav-container,
      [data-testid="bottom-navigation-container"] {
        pointer-events: auto !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      /* Ensure all child elements are clickable */
      .adera-bottom-nav-container *,
      [data-testid="bottom-navigation-container"] * {
        pointer-events: auto !important;
        touch-action: manipulation !important;
      }

      /* Prevent overlapping elements from blocking clicks */
      .adera-bottom-nav-container button,
      .adera-bottom-nav-container [role="button"],
      .adera-bottom-nav-container [role="tab"],
      [data-testid="bottom-navigation-container"] button,
      [data-testid="bottom-navigation-container"] [role="button"],
      [data-testid="bottom-navigation-container"] [role="tab"] {
        pointer-events: auto !important;
        touch-action: manipulation !important;
        cursor: pointer !important;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
      }

      /* Responsive heights */
      @media (max-width: ${BREAKPOINTS.mobile - 1}px) {
        .adera-bottom-nav-container > div,
        [data-testid="bottom-navigation-container"] > div {
          height: 56px !important;
          min-height: 56px !important;
        }
      }

      @media (min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px) {
        .adera-bottom-nav-container > div,
        [data-testid="bottom-navigation-container"] > div {
          height: 64px !important;
          min-height: 64px !important;
        }
      }

      @media (min-width: ${BREAKPOINTS.tablet}px) {
        .adera-bottom-nav-container > div,
        [data-testid="bottom-navigation-container"] > div {
          height: 72px !important;
          min-height: 72px !important;
        }
        /* Center navigation on large screens */
        .adera-bottom-nav-container > div[style*="position: fixed"],
        [data-testid="bottom-navigation-container"] > div[style*="position: fixed"] {
          max-width: ${BREAKPOINTS.desktop}px;
          left: 50% !important;
          transform: translateX(-50%) translateZ(0) !important;
          right: auto !important;
        }
      }

      /* Prevent resize flickering and improve performance */
      .adera-bottom-nav-container,
      [data-testid="bottom-navigation-container"] {
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* Ensure fixed positioning works correctly on all browsers */
      .adera-bottom-nav-container > div[style*="position: fixed"],
      [data-testid="bottom-navigation-container"] > div[style*="position: fixed"] {
        position: fixed !important;
        z-index: 1000 !important;
        width: 100% !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }

      /* Prevent text selection during navigation */
      .adera-bottom-nav-container *,
      [data-testid="bottom-navigation-container"] * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Ensure buttons and interactive elements are always accessible */
      .adera-bottom-nav-container button:disabled,
      [data-testid="bottom-navigation-container"] button:disabled {
        pointer-events: none;
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove && styleToRemove.parentNode) {
        styleToRemove.parentNode.removeChild(styleToRemove);
      }
    };
  }, []);

  // Calculate bottom margin for scene container based on responsive config
  const sceneBottomMargin = Platform.OS === 'web' 
    ? responsiveConfig.barHeight + (insets.bottom || 0)
    : 0;

  // Add class name to container for CSS targeting (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // Use a timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Find the actual DOM node
          const testId = 'bottom-navigation-container';
          const elements = document.querySelectorAll(`[data-testid="${testId}"]`);
          elements.forEach(el => {
            el.classList.add('adera-bottom-nav-container');
          });
        } catch (error) {
          // Silently fail if DOM manipulation isn't possible
          console.debug('[AppBottomNavigation] Could not add class to container');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View 
      ref={containerRef}
      style={styles.container}
      testID="bottom-navigation-container"
    >
      <RNPBottomNavigation
        navigationState={navigationState}
        onIndexChange={handleIndexChange}
        renderScene={renderScene}
        safeAreaInsets={{
          bottom: insets.bottom,
          top: insets.top,
          left: insets.left,
          right: insets.right,
        }}
        barStyle={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            height: Platform.OS === 'web' ? responsiveConfig.barHeight : undefined,
          },
          Platform.OS === 'web' && styles.barWeb,
        ]}
        sceneContainerStyle={[
          {
            backgroundColor: theme.colors.background,
            marginBottom: sceneBottomMargin,
          },
        ]}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        labeled={!responsiveConfig.compact || windowDimensions.width >= BREAKPOINTS.mobile}
        {...props}
      />
      {renderFab && (
        <View 
          style={[
            styles.fabContainer,
            {
              bottom: responsiveConfig.barHeight + 16,
            },
          ]}
        >
          {renderFab()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bar: {
    borderTopWidth: 1,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    width: '100%',
    bottom: 0,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      left: 0,
      right: 0,
    }),
  },
  barWeb: {
    // Web-specific styles injected via CSS in useEffect
    // These are fallbacks
    pointerEvents: 'auto',
    touchAction: 'manipulation',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 1001,
    ...(Platform.OS === 'web' && {
      position: 'fixed',
    }),
  },
});

AppBottomNavigation.SceneMap = RNPBottomNavigation.SceneMap;

export default AppBottomNavigation;