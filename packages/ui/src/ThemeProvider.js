import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import colors from './colors';
import typography from './typography';

const ThemeContext = createContext();
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Gradient presets for cards and hero sections
const lightGradients = {
  primary: ['#1565C0', '#1E88E5'],
  secondary: ['#2E7D32', '#43A047'],
  wallet: ['#0D47A1', '#1565C0', '#1E88E5'],
  hero: ['#1565C0', '#7B1FA2'],
  warm: ['#BF360C', '#E64A19'],
};

const darkGradients = {
  primary: ['#00478A', '#1565C0'],
  secondary: ['#0B5228', '#2E7D32'],
  wallet: ['#002244', '#00478A', '#1565C0'],
  hero: ['#00478A', '#6A1B9A'],
  warm: ['#8B2500', '#BF360C'],
};

export const ThemeProvider = ({ children, forceLightMode = false, initialMode = 'system', onModeChange }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode, onModeChange]);

  const resolvedMode = forceLightMode ? 'light' : mode;
  const isDark = resolvedMode === 'dark' || (resolvedMode === 'system' && systemScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;
  const gradients = isDark ? darkGradients : lightGradients;

  const theme = useMemo(() => ({
    colors: {
      ...palette,
      white: palette.white,
      black: palette.black,
      text: {
        primary: palette.onSurface,
        secondary: palette.onSurfaceVariant,
        inverse: palette.inverseOnSurface,
        muted: palette.onSurfaceDisabled,
        link: palette.primary,
      },
    },
    typography,
    isDark,
    gradients,
    spacing: {
      '2xs': 2,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
    },
    borderRadius: {
      none: 0,
      sm: 6,
      md: 10,
      lg: 14,
      xl: 20,
      '2xl': 28,
      full: 9999,
    },
    shadows: {
      none: {},
      xs: {
        shadowColor: isDark ? '#000' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 2,
        elevation: 1,
      },
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.5 : 0.16,
        shadowRadius: 12,
        elevation: 8,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.6 : 0.2,
        shadowRadius: 20,
        elevation: 12,
      },
    },
    // Surface elevation helper — returns the right background for an elevation level
    getElevationBackground: (level = 1) => {
      if (isDark) {
        const darkElevations = {
          0: palette.surface,
          1: palette.surfaceContainerLow,
          2: palette.surfaceContainer,
          3: palette.surfaceContainerHigh,
          4: palette.surfaceContainerHighest,
        };
        return darkElevations[level] || darkElevations[1];
      }
      const lightElevations = {
        0: palette.surface,
        1: palette.surfaceContainerLow,
        2: palette.surfaceContainer,
        3: palette.surfaceContainerHigh,
        4: palette.surfaceContainerHighest,
      };
      return lightElevations[level] || lightElevations[1];
    },
    mode: resolvedMode,
  }), [palette, resolvedMode, isDark, gradients]);

  const paperTheme = useMemo(() => ({
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...palette,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      primaryContainer: palette.primaryContainer,
      onPrimaryContainer: palette.onPrimaryContainer,
      secondary: palette.secondary,
      onSecondary: palette.onSecondary,
      secondaryContainer: palette.secondaryContainer,
      onSecondaryContainer: palette.onSecondaryContainer,
      surface: palette.surface,
      onSurface: palette.onSurface,
      background: palette.background,
      onBackground: palette.onBackground,
      error: palette.error,
      onError: palette.onError,
      outline: palette.outline,
      outlineVariant: palette.outlineVariant,
    },
    roundness: theme.borderRadius.md,
  }), [isDark, palette, theme.borderRadius.md]);

  const updateMode = useCallback((nextMode) => {
    setMode(nextMode);
    if (onModeChange) {
      onModeChange(nextMode);
    }
  }, [onModeChange]);

  const contextValue = useMemo(() => ({
    ...theme,
    setThemeMode: updateMode,
  }), [theme, updateMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
