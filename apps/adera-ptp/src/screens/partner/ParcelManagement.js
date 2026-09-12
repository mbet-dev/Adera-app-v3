import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';

const ParcelManagement = ({ navigation }) => {
  const theme = useTheme();

  const parcels = [
    { id: '1', tracking_id: 'AD001234', status: 1, sender: 'John Doe', time: '2 hours ago' },
    { id: '2', tracking_id: 'AD001235', status: 5, recipient: 'Mary Smith', time: '1 day ago' },
  ];

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Parcel Management" />
      
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Pending Parcels</Text>
        
        {parcels.map(parcel => (
          <Card key={parcel.id} style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <Text variant="titleMedium">#{parcel.tracking_id}</Text>
              <StatusBadge status={parcel.status} />
            </View>
            <Text variant="bodyMedium" style={styles.parcelInfo}>
              {parcel.sender ? `From: ${parcel.sender}` : `To: ${parcel.recipient}`}
            </Text>
            <Text variant="bodySmall" style={styles.parcelTime}>
              {parcel.time}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  title: { fontWeight: 'bold', marginBottom: 16 },
  parcelCard: { padding: 16, marginBottom: 8 },
  parcelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  parcelInfo: { marginBottom: 4 },
  parcelTime: { color: '#666' },
});

export default ParcelManagement;
