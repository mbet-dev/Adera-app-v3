import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@adera/ui';

/**
 * OperatingHoursDisplay Component
 * Displays operating hours in a color-coded, readable format
 * Shows current day's status and all hours in an organized way
 */
const OperatingHoursDisplay = ({ operatingHours = {}, style }) => {
  const theme = useTheme();

  // Only use valid weekday values
  let todayLocale = undefined;
  let todayDayKey = undefined;
  try {
    // Get current weekday (in English, e.g., 'Monday')
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., 'Mon'
    // Map from 3-letter to key
    const weekMap = {
      Sun: 'sunday', Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday',
      Thu: 'thursday', Fri: 'friday', Sat: 'saturday',
    };
    todayDayKey = weekMap[weekday] || 'monday';
  } catch {
    todayDayKey = 'monday';
  }

  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Day names mapping
  const dayNames = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
    friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
  };

  // Parse time string (e.g., '09:00-18:00') to minutes
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'closed') return null;
    const [start, end] = timeStr.split('-');
    if (!start || !end) return null;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return {
      start: startHour * 60 + startMin,
      end: endHour * 60 + endMin,
    };
  };

  // Check if currently open
  const isCurrentlyOpen = () => {
    const todayHours = operatingHours[todayDayKey];
    if (!todayHours || todayHours === 'closed') return false;
    const hours = parseTime(todayHours);
    if (!hours) return false;
    return currentTimeMinutes >= hours.start && currentTimeMinutes <= hours.end;
  };

  // Get status color
  const getStatusColor = () => {
    if (isCurrentlyOpen()) {
      return theme.colors.success || '#4CAF50';
    }
    return theme.colors.error || '#F44336';
  };

  // Get status text
  const getStatusText = () => {
    if (isCurrentlyOpen()) {
      const todayHours = operatingHours[todayDayKey];
      const hours = parseTime(todayHours);
      if (hours) {
        const closeTime = new Date();
        closeTime.setHours(Math.floor(hours.end / 60));
        closeTime.setMinutes(hours.end % 60);
        const closeTimeStr = closeTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        return `Open until ${closeTimeStr}`;
      }
      return 'Open';
    }
    return 'Closed';
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'closed') return 'Closed';
    
    try {
      const [start, end] = timeStr.split('-');
      if (!start || !end) return timeStr;
      
      const formatSingleTime = (time) => {
        const [hour, minute] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minute);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      };
      
      return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
    } catch {
      return timeStr;
    }
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();
  const isOpen = isCurrentlyOpen();

  return (
    <View style={[styles.container, style]}>
      {/* Current Status */}
      <View style={[styles.statusBar, { backgroundColor: statusColor + '15' }]}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* Operating Hours List */}
      <View style={styles.hoursContainer}>
        {Object.keys(dayNames).map((dayKey) => {
          const hours = operatingHours[dayKey] || 'closed';
          const isToday = dayKey === todayDayKey;
          const isDayOpen = hours !== 'closed' && parseTime(hours) !== null;
          
          return (
            <View
              key={dayKey}
              style={[
                styles.hourRow,
                isToday && { backgroundColor: theme.colors.primaryContainer + '30' },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: theme.colors.onSurface },
                  isToday && { fontWeight: 'bold', color: theme.colors.primary },
                ]}
              >
                {dayNames[dayKey]}
                {isToday && ' (Today)'}
              </Text>
              <View style={styles.hourRight}>
                {isDayOpen ? (
                  <View style={styles.openIndicator}>
                    <View style={[styles.openDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={[styles.hourText, { color: theme.colors.onSurface }]}>
                      {formatTime(hours)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.closedIndicator}>
                    <View style={[styles.closedDot, { backgroundColor: '#9E9E9E' }]} />
                    <Text style={[styles.hourText, { color: theme.colors.onSurfaceVariant }]}>
                      Closed
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hoursContainer: {
    gap: 8,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dayText: {
    fontSize: 14,
    flex: 1,
  },
  hourRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  closedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  hourText: {
    fontSize: 14,
  },
});

export default OperatingHoursDisplay;

