import React, { useEffect, useMemo } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useTheme } from './ThemeProvider';
import Constants from 'expo-constants';

const AppBar = ({ 
  title, 
  subtitle,
  onBack, 
  actions = [], 
  style,
  elevated = true,
  ...props 
}) => {
  const theme = useTheme();

  const defaultTitle = useMemo(() => {
    const rawName = Constants?.expoConfig?.name || Constants?.manifest?.name || '';
    const lower = String(rawName).toLowerCase();
    if (lower.includes('ptp')) return 'Adera-PTP';
    if (lower.includes('shop')) return 'Adera-Shop';
    return 'Adera-Hybrid-App';
  }, []);

  const resolvedTitle = title ?? (Platform.OS === 'web' ? defaultTitle : undefined);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const tabTitle = resolvedTitle || defaultTitle;
      if (typeof document !== 'undefined' && document.title !== tabTitle) {
        document.title = tabTitle;
      }
    }
  }, [resolvedTitle, defaultTitle]);

  // Use custom implementation for web to avoid SafeAreaProvider issues
  if (Platform.OS === 'web') {
    return (
      <View style={[
        styles.webHeader,
        {
          backgroundColor: theme.colors.primary,
          shadowOpacity: elevated ? 0.2 : 0,
        },
        style
      ]}>
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.onPrimary }]}>
              ←
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
            {resolvedTitle}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
              disabled={action.disabled}
            >
              <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>
                {action.icon}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Use native implementation for mobile
  return (
    <Appbar.Header 
      style={[
        {
          backgroundColor: theme.colors.primary,
          elevation: elevated ? 4 : 0,
        },
        style
      ]}
      {...props}
    >
      {onBack && (
        <Appbar.BackAction 
          onPress={onBack}
          iconColor={theme.colors.onPrimary}
        />
      )}
      
      <Appbar.Content 
        title={resolvedTitle}
        subtitle={subtitle}
        titleStyle={{ color: theme.colors.onPrimary }}
        subtitleStyle={{ color: theme.colors.onPrimary }}
      />
      
      {actions.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
          iconColor={theme.colors.onPrimary}
          disabled={action.disabled}
        />
      ))}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 16,
  },
});

export default AppBar;
