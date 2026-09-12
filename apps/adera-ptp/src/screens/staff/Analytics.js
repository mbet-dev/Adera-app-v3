import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';

const Analytics = () => {
  const theme = useTheme();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Analytics" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.metricCard}>
          <Text variant="titleMedium" style={styles.metricTitle}>Daily Performance</Text>
          <Text variant="headlineLarge" style={[styles.metricValue, { color: theme.colors.primary }]}>95.2%</Text>
          <Text variant="bodyMedium">Delivery Success Rate</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text variant="titleMedium" style={styles.summaryTitle}>Weekly Summary</Text>
          <View style={styles.summaryItem}>
            <Text variant="bodyMedium">Parcels Processed</Text>
            <Text variant="bodyMedium">1,247</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodyMedium">Revenue Generated</Text>
            <Text variant="bodyMedium">125,400 ETB</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodyMedium">Customer Satisfaction</Text>
            <Text variant="bodyMedium">4.7/5.0</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  metricCard: { padding: 24, marginBottom: 16, alignItems: 'center' },
  metricTitle: { marginBottom: 12, fontWeight: '500' },
  metricValue: { fontWeight: 'bold', marginBottom: 8 },
  summaryCard: { padding: 20 },
  summaryTitle: { fontWeight: '500', marginBottom: 16 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});

export default Analytics;
