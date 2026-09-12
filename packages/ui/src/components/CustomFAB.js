import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTheme } from '../ThemeProvider';

const CustomFAB = ({ style, label, ...props }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />
      
      {/* The actual FAB button */}
      <FAB
        {...props}
        label={label}
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
          Platform.select({
            ios: styles.iosFab,
            android: styles.androidFab,
            web: styles.webFab,
          }),
          style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  overlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    height: 60, // Reduced height to be about the height of the FAB
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // 85% transparent (lighter)
    borderTopLeftRadius: 16,
    zIndex: 9,
    margin: 0,
    padding: 0,
  },
  fab: {
    margin: 16,
    elevation: 8,
  },
  iosFab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  androidFab: {
    elevation: 8,
    // Remove default overlay/mask effect
    android_ripple: { color: 'rgba(0,0,0,0.2)' },
  },
  webFab: {
    cursor: 'pointer',
    // Remove default overlay/mask effect
    ':hover': {
      opacity: 0.9,
    },
  },
});

export default CustomFAB;