import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationSnackbar from './NotificationSnackbar';

// This component renders all active notifications
const NotificationContainer = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {notifications.map(notification => (
        <NotificationSnackbar
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default NotificationContainer;
