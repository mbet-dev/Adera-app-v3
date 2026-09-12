import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { CustomFAB } from '@adera/ui';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TaskList = ({ navigation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const allTasks = [
    { id: '1', type: 'pickup', tracking_id: 'AD001234', location: 'Bole Atlas', address: 'Near Atlas Hotel', time: '10:30 AM', status: 'pending', priority: 'high', parcels: 3, distance: '2.3 km' },
    { id: '2', type: 'delivery', tracking_id: 'AD001235', location: 'Gerji', address: 'Gerji Mebrat Hail', time: '11:00 AM', status: 'in_progress', priority: 'normal', parcels: 1, distance: '4.1 km' },
    { id: '3', type: 'pickup', tracking_id: 'AD001236', location: 'Piazza', address: 'Churchill Avenue', time: '2:00 PM', status: 'pending', priority: 'normal', parcels: 5, distance: '6.8 km' },
    { id: '4', type: 'delivery', tracking_id: 'AD001237', location: 'CMC', address: 'CMC Road, House 123', time: '3:15 PM', status: 'pending', priority: 'low', parcels: 2, distance: '8.2 km' },
    { id: '5', type: 'pickup', tracking_id: 'AD001238', location: 'Kazanchis', address: 'Kazanchis Sorting Hub', time: '5:00 PM', status: 'completed', priority: 'high', parcels: 12, distance: '3.5 km' },
  ];

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesSearch = task.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || task.type === filterType;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  const taskCounts = useMemo(() => ({
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
  }), []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      default: return theme.colors.text.secondary;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return { icon: 'alert-circle', color: '#F44336' };
      case 'normal': return { icon: 'information', color: '#2196F3' };
      case 'low': return { icon: 'minus-circle', color: '#9E9E9E' };
      default: return { icon: 'information', color: theme.colors.text.secondary };
    }
  };

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Task Management" />
      
      <ScrollView style={styles.content}>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{taskCounts.total}</Text>
              <Text variant="bodySmall" style={[styles.summaryLabel, { color: theme.colors.onPrimary }]}>Total Tasks</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{taskCounts.pending}</Text>
              <Text variant="bodySmall" style={[styles.summaryLabel, { color: theme.colors.onPrimary }]}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: theme.colors.onPrimary }]}>{taskCounts.completed}</Text>
              <Text variant="bodySmall" style={[styles.summaryLabel, { color: theme.colors.onPrimary }]}>Completed</Text>
            </View>
          </View>
        </Card>

        <Searchbar
          placeholder="Search by tracking ID or location"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterRow}>
          <Text variant="labelLarge" style={styles.filterLabel}>Type:</Text>
          <View style={styles.chipGroup}>
            <Chip selected={filterType === 'all'} onPress={() => setFilterType('all')} style={styles.chip}>All</Chip>
            <Chip selected={filterType === 'pickup'} onPress={() => setFilterType('pickup')} style={styles.chip}>Pickup</Chip>
            <Chip selected={filterType === 'delivery'} onPress={() => setFilterType('delivery')} style={styles.chip}>Delivery</Chip>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text variant="labelLarge" style={styles.filterLabel}>Status:</Text>
          <View style={styles.chipGroup}>
            <Chip selected={filterStatus === 'all'} onPress={() => setFilterStatus('all')} style={styles.chip}>All</Chip>
            <Chip selected={filterStatus === 'pending'} onPress={() => setFilterStatus('pending')} style={styles.chip}>Pending</Chip>
            <Chip selected={filterStatus === 'in_progress'} onPress={() => setFilterStatus('in_progress')} style={styles.chip}>Active</Chip>
          </View>
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {filteredTasks.length} Task{filteredTasks.length !== 1 ? 's' : ''} Found
        </Text>
        
        {filteredTasks.map(task => {
          const priorityInfo = getPriorityIcon(task.priority);
          return (
            <Card key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  <MaterialCommunityIcons 
                    name={task.type === 'pickup' ? 'package-variant' : 'home-map-marker'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <View style={styles.taskTitleInfo}>
                    <Text variant="titleMedium" style={styles.taskTitle}>
                      {task.type === 'pickup' ? 'Pickup' : 'Delivery'}
                    </Text>
                    <Text variant="bodySmall" style={[styles.taskId, { color: theme.colors.text.secondary }]}>#{task.tracking_id}</Text>
                  </View>
                </View>
                <View style={styles.taskMeta}>
                  <MaterialCommunityIcons name={priorityInfo.icon} size={20} color={priorityInfo.color} />
                </View>
              </View>

              <View style={styles.taskDetails}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
                  <View style={styles.detailText}>
                    <Text variant="bodyMedium" style={styles.locationName}>{task.location}</Text>
                    <Text variant="bodySmall" style={[styles.address, { color: theme.colors.text.secondary }]}>{task.address}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.secondary} />
                  <Text variant="bodyMedium" style={styles.detailValue}>{task.time}</Text>
                  <MaterialCommunityIcons name="map-marker-distance" size={18} color={theme.colors.secondary} style={styles.detailIcon} />
                  <Text variant="bodyMedium" style={styles.detailValue}>{task.distance}</Text>
                  <MaterialCommunityIcons name="cube-outline" size={18} color={theme.colors.secondary} style={styles.detailIcon} />
                  <Text variant="bodyMedium" style={styles.detailValue}>{task.parcels} parcel{task.parcels > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.taskFooter}>
                <StatusBadge 
                  tone={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'}
                  label={task.status.replace('_', ' ').toUpperCase()}
                />
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}22` }]}>
                    <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${theme.colors.secondary}22` }]}>
                    <MaterialCommunityIcons name="navigation" size={20} color={theme.colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        {filteredTasks.length === 0 && (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color={theme.colors.text.disabled} />
            <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No tasks found</Text>
            <Text variant="bodySmall" style={[styles.emptySubtext, { color: theme.colors.text.disabled }]}>Try adjusting your filters</Text>
          </Card>
        )}
      </ScrollView>

      <CustomFAB
        icon="qrcode-scan"
        label="Batch Scan"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  summaryCard: { padding: 20, marginBottom: 16, borderRadius: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontWeight: '700', marginBottom: 4 },
  summaryLabel: { fontSize: 12, opacity: 0.9 },
  searchBar: { marginBottom: 16, borderRadius: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontWeight: '600', marginRight: 12, minWidth: 60 },
  chipGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  chip: { marginRight: 0 },
  sectionTitle: { fontWeight: '700', marginBottom: 12, marginTop: 8 },
  taskCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  taskTitleInfo: { marginLeft: 12, flex: 1 },
  taskTitle: { fontWeight: '600' },
  taskId: { marginTop: 2 },
  taskMeta: { flexDirection: 'row', gap: 8 },
  taskDetails: { gap: 10, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { flex: 1 },
  locationName: { fontWeight: '500' },
  address: { marginTop: 2 },
  detailValue: { fontWeight: '500' },
  detailIcon: { marginLeft: 12 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 40, alignItems: 'center', borderRadius: 16, marginTop: 20 },
  emptyText: { marginTop: 16, fontWeight: '600' },
  emptySubtext: { marginTop: 4 },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default TaskList;
