import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeArea, Card, TextInput, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartners } from '../hooks/usePartners';
import PartnerSelectionMap from './PartnerSelectionMap';

const { width } = Dimensions.get('window');

const PartnerSelectionModal = ({
  visible,
  onClose,
  onSelect,
  selectedPartner,
  title = 'Select Partner',
  filterType = null, // 'pickup', 'dropoff', or null for all
  userLocation: initialUserLocation,
}) => {
  const theme = useTheme();
  const {
    partners,
    loading,
    error,
    userLocation: hookUserLocation,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
  } = usePartners();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const userLocation = initialUserLocation || hookUserLocation;

  // Filter partners based on type
  const filteredPartners = partners.filter(partner => {
    if (!filterType) return true;
    if (filterType === 'pickup') return partner.isPickup;
    if (filterType === 'dropoff') return partner.isDropoff;
    return true;
  });

  const handlePartnerSelect = (partner) => {
    onSelect(partner);
    onClose();
  };

  const renderPartnerItem = (partner) => {
    const statusLabel = partner.statusLabel || (partner.isOpen ? 'Open now' : 'Closed');
    const statusColor = partner.isOpen ? theme.colors.success : theme.colors.error;

    return (
      <TouchableOpacity
        key={partner.id}
        style={[
          styles.partnerItem,
          {
            backgroundColor: selectedPartner?.id === partner.id 
              ? theme.colors.primaryContainer 
              : theme.colors.surface,
            borderColor: selectedPartner?.id === partner.id 
              ? theme.colors.primary 
              : theme.colors.outline,
          },
        ]}
        onPress={() => handlePartnerSelect(partner)}
      >
        <View style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceVariant }]}>
          {partner.heroImage ? (
            <Image source={{ uri: partner.heroImage }} style={styles.thumbnailImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons
              name={partner.category === 'Logistics Hub' ? 'package-variant' : 'store'}
              size={28}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={styles.partnerInfo}>
          <View style={styles.partnerHeader}>
            <Text style={[styles.partnerName, { color: theme.colors.text.primary }]}>
              {partner.name}
            </Text>
            {partner.isVerified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color={theme.colors.primary}
              />
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }] }>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          
          <Text style={[styles.partnerAddress, { color: theme.colors.text.secondary }]}>
            {partner.address || 'No address available'}
          </Text>
          
          <View style={styles.partnerMeta}>
            {typeof partner.distance === 'number' && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={14}
                  color={theme.colors.text.secondary}
                />
                <Text style={[styles.metaText, { color: theme.colors.text.secondary }]}>
                  {partner.distance.toFixed(1)} km
                </Text>
              </View>
            )}
            
            {partner.rating > 0 && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color="#FFB300"
                />
                <Text style={[styles.metaText, { color: theme.colors.text.secondary }]}>
                  {partner.rating.toFixed(1)} ({partner.totalReviews})
                </Text>
              </View>
            )}
            
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name={partner.category === 'Logistics Hub' ? 'package-variant' : 'store'}
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.metaText, { color: theme.colors.text.secondary }]}>
                {partner.type}
              </Text>
            </View>
          </View>
        </View>
        
        {selectedPartner?.id === partner.id && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeArea edges={['top']}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <TextInput
              placeholder="Search partners..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon="magnify"
              style={styles.searchInput}
            />
            
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {categories.slice(0, 5).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor: selectedCategory === category
                            ? theme.colors.primaryContainer
                            : theme.colors.surface,
                          borderColor: selectedCategory === category
                            ? theme.colors.primary
                            : theme.colors.outline,
                        },
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          {
                            color: selectedCategory === category
                              ? theme.colors.primary
                              : theme.colors.text.secondary,
                          },
                        ]}
                      >
                        {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.viewToggle, { backgroundColor: theme.colors.surface }]}
                onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              >
                <MaterialCommunityIcons
                  name={viewMode === 'list' ? 'map' : 'view-list'}
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                  Loading partners...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={48}
                  color={theme.colors.error}
                />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => window.location.reload()}
                  style={styles.retryButton}
                />
              </View>
            ) : viewMode === 'map' ? (
              <View style={styles.mapContainer}>
                <PartnerSelectionMap
                  partners={filteredPartners}
                  onSelect={handlePartnerSelect}
                  selectedPartner={selectedPartner}
                  userLocation={userLocation}
                />
                <View style={[styles.mapOverlay, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.partnerCount, { color: theme.colors.text.primary }]}>
                    {filteredPartners.length} partners found
                  </Text>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.partnerList} showsVerticalScrollIndicator={false}>
                {filteredPartners.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="store-off"
                      size={48}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                      No partners found
                    </Text>
                    <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
                      Try adjusting your search or filters
                    </Text>
                  </View>
                ) : (
                  filteredPartners.map(renderPartnerItem)
                )}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          {selectedPartner && (
            <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
              <Button
                title={`Select ${selectedPartner.name}`}
                onPress={() => handlePartnerSelect(selectedPartner)}
                size="lg"
                style={styles.selectButton}
              />
            </View>
          )}
        </View>
      </SafeArea>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  mapContainer: {
    flex: 1,
    padding: 20,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  partnerCount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  partnerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  partnerAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  partnerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectButton: {
    width: '100%',
  },
});

export default PartnerSelectionModal;
