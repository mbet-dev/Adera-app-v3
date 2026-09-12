import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import Card from './Card';
import StatusBadge from './StatusBadge';

// A helper function to format date strings.
// TODO: Move to a shared utils package if used elsewhere.
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Sub-component for displaying a location row (From/To)
const LocationRow = ({ icon, label, value, iconColor }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.locationRow}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <View style={styles.locationInfo}>
        <Text style={[styles.locationLabel, { color: colors.text.secondary }]}>
          {label}
        </Text>
        <Text style={[styles.locationText, { color: colors.text.primary }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
};

// Sub-component for the divider between From and To
const Divider = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.dividerContainer}>
      <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
      <Ionicons 
        name="arrow-down" 
        size={16} 
        color={colors.onSurfaceVariant} 
        style={[styles.dividerIcon, { backgroundColor: colors.surface }]} 
      />
    </View>
  );
};

// Sub-component for action buttons (Track/Details)
const ActionButton = ({ icon, label, onPress, color, borderColor }) => (
  <TouchableOpacity
    style={[styles.actionButton, { borderColor }]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={16} color={color} />
    <Text style={[styles.actionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const ParcelCard = ({ parcel, onPress, onTrack, style, showActions = true }) => {
  const { colors } = useTheme();

  if (!parcel) {
    return null; // Render nothing if no parcel data is provided
  }

  const {
    tracking_id,
    status,
    created_at,
    pickup_location,
    delivery_location,
    recipient_name,
  } = parcel;

  return (
    <Card style={[styles.card, style]} onPress={() => onPress?.(parcel)}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.trackingInfo}>
          <Text style={[styles.trackingId, { color: colors.primary }]}>
            #{tracking_id}
          </Text>
          <StatusBadge status={status} size="small" />
        </View>
        <Text style={[styles.date, { color: colors.text.secondary }]}>
          {formatDate(created_at)}
        </Text>
      </View>

      {/* Content Section: From/To Locations */}
      <View style={styles.content}>
        <LocationRow
          icon="location-outline"
          label="From"
          value={pickup_location?.name || 'Pickup Location'}
          iconColor={colors.primary}
        />
        <Divider />
        <LocationRow
          icon="flag-outline"
          label="To"
          value={delivery_location?.name || recipient_name}
          iconColor={colors.secondary}
        />
      </View>

      {/* Action Buttons Section */}
      {showActions && (
        <View style={[styles.actions, { borderTopColor: colors.outline }]}>
          <ActionButton
            icon="location"
            label="Track"
            onPress={() => onTrack?.(parcel)}
            color={colors.primary}
            borderColor={colors.primary}
          />
          <ActionButton
            icon="information-circle-outline"
            label="Details"
            onPress={() => onPress?.(parcel)}
            color={colors.text.secondary}
            borderColor={colors.outline}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingId: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  content: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    height: 24,
    justifyContent: 'center',
    marginLeft: 8, // Aligns with the icon center
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    top: -4,
    bottom: -4,
    width: 1,
  },
  dividerIcon: {
    position: 'absolute',
    left: -8, // Center the icon on the line
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ParcelCard;
