import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';

const ParcelOversight = () => {
  const problemParcels = [
    { id: '1', tracking_id: 'AD001234', issue: 'Delivery delay', status: 2, customer: 'John Doe' },
    { id: '2', tracking_id: 'AD001235', issue: 'Payment dispute', status: 5, customer: 'Mary Smith' },
    { id: '3', tracking_id: 'AD001236', issue: 'Lost parcel claim', status: 3, customer: 'Ahmed Ali' },
  ];

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Parcel Oversight" />
      
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Parcels Requiring Attention</Text>
        
        {problemParcels.map(parcel => (
          <Card key={parcel.id} style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <Text variant="titleMedium">#{parcel.tracking_id}</Text>
              <StatusBadge status={parcel.status} />
            </View>
            <Text variant="bodyMedium" style={styles.issue}>🚨 {parcel.issue}</Text>
            <Text variant="bodySmall" style={styles.customer}>Customer: {parcel.customer}</Text>
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
  issue: { color: '#F44336', marginBottom: 4 },
  customer: { color: '#666' },
});

export default ParcelOversight;
