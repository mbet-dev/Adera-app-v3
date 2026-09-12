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

export const ThemeProvider = ({ children, forceLightMode = false, initialMode = 'system', onModeChange }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Listen for external mode changes (from preferences)
  useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode, onModeChange]);

  const resolvedMode = forceLightMode ? 'light' : mode;
  const isDark = resolvedMode === 'dark' || (resolvedMode === 'system' && systemScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;

  const theme = useMemo(() => ({
    colors: {
      ...palette,
      white: palette.white,
      black: palette.black,
      text: {
        primary: palette.onSurface,
        secondary: palette.onSurfaceVariant,
        inverse: palette.inverseOnSurface,
        muted: palette.onSurfaceVariant,
      },
    },
    typography,
    isDark,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      },
    },
    mode: resolvedMode,
  }), [palette, resolvedMode]);

  const paperTheme = useMemo(() => ({
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...palette,
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
