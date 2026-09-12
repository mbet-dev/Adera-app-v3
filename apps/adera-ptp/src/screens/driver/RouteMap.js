import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const RouteMap = ({ navigation }) => {
  const theme = useTheme();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Route Map" />
      
      <View style={styles.content}>
        <Card style={styles.mapPlaceholder}>
          <View style={styles.mapContent}>
            <Ionicons name="map-outline" size={80} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.mapTitle}>
              Interactive Map
            </Text>
            <Text variant="bodyMedium" style={styles.mapDescription}>
              OpenStreetMap integration will be implemented here
            </Text>
          </View>
        </Card>
        
        <Card style={styles.routeInfo}>
          <Text variant="titleMedium" style={styles.routeTitle}>Next Stop</Text>
          <Text variant="bodyLarge">Pickup at Bole Atlas</Text>
          <Text variant="bodyMedium" style={styles.routeDistance}>
            📍 2.3 km away • 8 minutes
          </Text>
        </Card>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  mapPlaceholder: { flex: 1, padding: 40, marginBottom: 16 },
  mapContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapTitle: { fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  mapDescription: { textAlign: 'center', color: '#666' },
  routeInfo: { padding: 20 },
  routeTitle: { fontWeight: '500', marginBottom: 8 },
  routeDistance: { color: '#666', marginTop: 4 },
});

export default RouteMap;
