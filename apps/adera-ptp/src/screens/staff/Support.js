import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea } from '@adera/ui';

const Support = () => {
  const tickets = [
    { id: '1', customer: 'John Doe', issue: 'Lost parcel claim', priority: 'High', time: '2 hours ago' },
    { id: '2', customer: 'Mary Smith', issue: 'Payment not processed', priority: 'Medium', time: '4 hours ago' },
    { id: '3', customer: 'Ahmed Ali', issue: 'Delivery address change', priority: 'Low', time: '1 day ago' },
  ];

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Support Tickets" />
      
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Open Tickets</Text>
        
        {tickets.map(ticket => (
          <Card key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text variant="titleMedium">#{ticket.id}</Text>
              <Text variant="bodySmall" style={[
                styles.priority,
                { color: ticket.priority === 'High' ? '#F44336' : ticket.priority === 'Medium' ? '#FF9800' : '#4CAF50' }
              ]}>
                {ticket.priority}
              </Text>
            </View>
            <Text variant="bodyLarge" style={styles.customer}>{ticket.customer}</Text>
            <Text variant="bodyMedium" style={styles.issue}>{ticket.issue}</Text>
            <Text variant="bodySmall" style={styles.time}>{ticket.time}</Text>
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
  ticketCard: { padding: 16, marginBottom: 8 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priority: { fontWeight: '500' },
  customer: { fontWeight: '500', marginBottom: 4 },
  issue: { marginBottom: 4 },
  time: { color: '#666' },
});

export default Support;
