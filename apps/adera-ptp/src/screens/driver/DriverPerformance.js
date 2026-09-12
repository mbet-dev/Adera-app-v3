import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DriverPerformance = ({ navigation }) => {
  const theme = useTheme();

  const weeklyStats = useMemo(() => ([
    { label: 'Deliveries Completed', value: 47, target: 50, unit: 'parcels', icon: 'package-variant-closed', color: '#4CAF50' },
    { label: 'On-Time Deliveries', value: 45, target: 47, unit: 'parcels', icon: 'clock-check', color: '#2196F3' },
    { label: 'Distance Covered', value: 312, target: 350, unit: 'km', icon: 'map-marker-distance', color: '#FF9800' },
    { label: 'Customer Ratings', value: 4.8, target: 5.0, unit: '★', icon: 'star', color: '#FFD700' },
  ]), []);

  const achievements = useMemo(() => ([
    { title: 'Perfect Week', description: '5 consecutive days with 100% on-time delivery', unlocked: true, icon: 'trophy', color: '#FFD700' },
    { title: 'Distance Champion', description: 'Covered 300+ km in a week', unlocked: true, icon: 'medal', color: '#C0C0C0' },
    { title: 'Customer Favorite', description: 'Maintained 4.8+ rating for 30 days', unlocked: false, icon: 'heart', color: '#E91E63' },
  ]), []);

  const recentFeedback = useMemo(() => ([
    { customer: 'Abebe M.', rating: 5, comment: 'Very professional and on time!', date: '2 hours ago' },
    { customer: 'Sara T.', rating: 5, comment: 'Handled my parcel with care', date: '1 day ago' },
    { customer: 'Dawit K.', rating: 4, comment: 'Good service, slight delay', date: '2 days ago' },
  ]), []);

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Performance Metrics" />
      
      <ScrollView style={styles.content}>
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineLarge" style={[styles.performanceScore, { color: theme.colors.onPrimary }]}>
            94%
          </Text>
          <Text variant="titleMedium" style={[styles.performanceLabel, { color: theme.colors.onPrimary }]}>
            Overall Performance Score
          </Text>
          <Text variant="bodySmall" style={[styles.performanceSubtext, { color: theme.colors.onPrimary }]}>
            This Week • Target: 95%
          </Text>
        </Card>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Weekly Statistics</Text>
          {weeklyStats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statTitleRow}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}22` }]}>
                    <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text variant="titleMedium" style={styles.statLabel}>{stat.label}</Text>
                    <Text variant="bodySmall" style={[styles.statSubtext, { color: theme.colors.text.secondary }]}>
                      {stat.value} / {stat.target} {stat.unit}
                    </Text>
                  </View>
                </View>
                <Text variant="headlineSmall" style={[styles.statValue, { color: stat.color }]}>
                  {Math.round((stat.value / stat.target) * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={stat.value / stat.target} 
                color={stat.color}
                style={styles.progressBar}
              />
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((achievement, index) => (
            <Card key={index} style={[styles.achievementCard, !achievement.unlocked && styles.lockedCard]}>
              <View style={styles.achievementContent}>
                <View style={[styles.achievementIcon, { backgroundColor: `${achievement.color}22` }]}>
                  <MaterialCommunityIcons 
                    name={achievement.icon} 
                    size={28} 
                    color={achievement.unlocked ? achievement.color : theme.colors.text.disabled} 
                  />
                </View>
                <View style={styles.achievementText}>
                  <Text variant="titleMedium" style={[styles.achievementTitle, !achievement.unlocked && { color: theme.colors.text.disabled }]}>
                    {achievement.title}
                  </Text>
                  <Text variant="bodySmall" style={[styles.achievementDesc, { color: theme.colors.text.secondary }]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <StatusBadge tone="success" label="UNLOCKED" />
                )}
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Customer Feedback</Text>
          {recentFeedback.map((feedback, index) => (
            <Card key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text variant="titleMedium" style={styles.customerName}>{feedback.customer}</Text>
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialCommunityIcons 
                      key={i}
                      name={i < feedback.rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.feedbackComment}>"{feedback.comment}"</Text>
              <Text variant="bodySmall" style={[styles.feedbackDate, { color: theme.colors.text.secondary }]}>
                {feedback.date}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  headerCard: { padding: 24, marginBottom: 16, alignItems: 'center', borderRadius: 20 },
  performanceScore: { fontWeight: '700', marginBottom: 8 },
  performanceLabel: { fontWeight: '600', opacity: 0.95 },
  performanceSubtext: { marginTop: 4, opacity: 0.8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  statCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statInfo: { flex: 1 },
  statLabel: { fontWeight: '600' },
  statSubtext: { marginTop: 2 },
  statValue: { fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4 },
  achievementCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  lockedCard: { opacity: 0.6 },
  achievementContent: { flexDirection: 'row', alignItems: 'center' },
  achievementIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  achievementText: { flex: 1 },
  achievementTitle: { fontWeight: '600', marginBottom: 4 },
  achievementDesc: { fontSize: 12 },
  feedbackCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerName: { fontWeight: '600' },
  ratingRow: { flexDirection: 'row', gap: 2 },
  feedbackComment: { marginBottom: 8, fontStyle: 'italic' },
  feedbackDate: { fontSize: 12 },
});

export default DriverPerformance;
