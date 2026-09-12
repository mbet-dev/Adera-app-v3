import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';

const NotificationSnackbar = ({ notification, onDismiss }) => {
  const theme = useTheme();
  const translateY = new Animated.Value(100);

  useEffect(() => {
    // Slide in animation
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      slideOut();
    }, notification.duration);

    return () => {
      clearTimeout(timer);
      translateY.setValue(100); // Reset animation
    };
  }, [notification.id]);

  const slideOut = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(notification.id);
    });
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return theme.colors.successContainer;
      case 'error':
        return theme.colors.errorContainer;
      case 'warning':
        return theme.colors.warningContainer;
      default:
        return theme.colors.infoContainer;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      default:
        return 'information';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
  };

  return (
    <Animated.View
      style={[ 
        styles.container, 
        { backgroundColor: getBackgroundColor(), transform: [{ translateY }] } 
      ]}
    >
      <MaterialCommunityIcons 
        name={getIcon()} 
        size={24} 
        color={getIconColor()} 
        style={styles.icon} 
      />
      <View style={styles.content}>
        <Text style={[styles.message, { color: theme.colors.onSurface }]}>
          {notification.message}
        </Text>
      </View>
      <TouchableOpacity onPress={slideOut} style={styles.dismissButton}>
        <MaterialCommunityIcons 
          name="close" 
          size={20} 
          color={theme.colors.text.secondary} 
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
  },
  dismissButton: {
    padding: 8,
  },
});

export default NotificationSnackbar;
