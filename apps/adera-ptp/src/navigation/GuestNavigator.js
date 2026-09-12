import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@adera/ui';
import { useTheme } from '@adera/ui';
import { useAppFlow } from '../context/AppFlowContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePartners } from '../hooks/usePartners';
import PartnerDetailModal from '../components/PartnerDetailModal';
import PartnerSelectionMap from '../components/PartnerSelectionMap';

const GuestNavigator = ({ onBackToAuth }) => {
  const theme = useTheme();
  const { openAppSelector } = useAppFlow();
  const {
    partners,
    loading,
    error,
    userLocation,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    refresh,
  } = usePartners();

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  // Refresh partners
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Open partner detail modal
  const handlePartnerPress = (partner) => {
    setSelectedPartner(partner);
    setIsModalVisible(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedPartner(null);
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return null;
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  // Category filter options (hubs excluded for security)
  const categoryFilters = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'pickup', label: 'Pickup Points', icon: 'map-marker' },
    { key: 'dropoff', label: 'Dropoff Points', icon: 'map-marker-check' },
    { key: 'shop', label: 'Shops', icon: 'storefront' },
  ];

  // Sort options
  const sortOptions = [
    { key: 'distance', label: 'Distance', icon: 'map-marker-distance' },
    { key: 'name', label: 'Name', icon: 'alphabetical' },
    { key: 'rating', label: 'Rating', icon: 'star' },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={openAppSelector}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
          Browse as Guest
        </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onPrimary + 'CC' }]}>
            Adera-PTP Partner Locations
          </Text>
        </View>
        <View style={styles.headerRight} />
        </View>

      {/* Search and Filter Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search partners, locations..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                  <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showFilters ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialCommunityIcons
            name="filter"
            size={20}
            color={showFilters ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <MaterialCommunityIcons
            name={viewMode === 'list' ? 'map' : 'view-list'}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: theme.colors.surface }]}>
          {/* Category Filters */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.colors.onSurface }]}>
              Category
            </Text>
            <View style={styles.filterChips}>
              {categoryFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedCategory === filter.key
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => setSelectedCategory(filter.key)}
                >
                  <MaterialCommunityIcons
                    name={filter.icon}
                    size={16}
                    color={
                      selectedCategory === filter.key
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          selectedCategory === filter.key
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.colors.onSurface }]}>
              Sort By
            </Text>
            <View style={styles.filterChips}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        sortBy === option.key
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={16}
                    color={
                      sortBy === option.key
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          sortBy === option.key
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading partner locations...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color={theme.colors.onErrorContainer}
            />
            <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {error}
            </Text>
            <Button
              title="Retry"
              onPress={refresh}
              style={styles.retryButton}
              variant="primary"
            />
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && partners.length === 0 && (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="store-off-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No partners found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery ? 'Try adjusting your search' : 'Check back later'}
            </Text>
          </View>
        )}

        {/* Content */}
        {!loading && !error && partners.length > 0 && (
          viewMode === 'map' ? (
            <View style={styles.mapContainer}>
              <PartnerSelectionMap
                partners={partners}
                onSelect={handlePartnerPress}
                selectedPartner={selectedPartner}
                userLocation={userLocation}
              />
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: theme.colors.onSurface }]}>
                  {partners.length} {partners.length === 1 ? 'partner' : 'partners'} found
                </Text>
              </View>
              {partners.map((partner) => (
                <Card
                  key={partner.id}
                  style={styles.partnerCard}
                  onPress={() => handlePartnerPress(partner)}
                  elevation={2}
                >
                  <View style={styles.partnerCardContent}>
                    {/* Partner Icon/Image */}
                    <View style={[styles.partnerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                      {partner.storefrontImage ? (
                        <Image
                          source={{ uri: partner.storefrontImage }}
                          style={styles.partnerLogo}
                          resizeMode="cover"
                        />
                      ) : partner.logoUrl ? (
                        <Image
                          source={{ uri: partner.logoUrl }}
                          style={styles.partnerLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={partner.isHub ? 'warehouse' : partner.type === 'Shop Partner' ? 'storefront' : 'map-marker'}
                          size={32}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>

                    {/* Partner Info */}
                    <View style={styles.partnerInfo}>
                      <View style={styles.partnerHeader}>
                        <Text style={[styles.partnerName, { color: theme.colors.onSurface }]}>
                          {partner.name}
                        </Text>
                        {partner.isVerified && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={16}
                            color={theme.colors.primary}
                            style={styles.verifiedIcon}
                          />
                        )}
                      </View>
                      <Text style={[styles.partnerAddress, { color: theme.colors.onSurfaceVariant }]}>
                        {partner.address}
                      </Text>
                      <View style={styles.partnerMeta}>
                        <View style={[styles.typeBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                          <Text style={[styles.typeText, { color: theme.colors.onSurface }]}>
                            {partner.type}
                          </Text>
                        </View>
                        {partner.distance !== null && (
                          <View style={styles.distanceBadge}>
                            <MaterialCommunityIcons
                              name="map-marker-distance"
                              size={14}
                              color={theme.colors.primary}
                            />
                            <Text style={[styles.distanceText, { color: theme.colors.primary }]}>
                              {formatDistance(partner.distance)}
                            </Text>
                          </View>
                        )}
                        {partner.rating > 0 && (
                          <View style={styles.ratingBadge}>
                            <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                            <Text style={[styles.ratingText, { color: theme.colors.onSurface }]}>
                              {partner.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                </Card>
              ))}
            </>
          )
        )}

        {/* Auth Prompt */}
        {!loading && !error && (
        <Card style={[styles.authPrompt, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="key"
              size={32}
              color={theme.colors.onPrimaryContainer}
              style={styles.promptIcon}
            />
          <Text style={[styles.promptText, { color: theme.colors.onPrimaryContainer }]}>
            To send parcels and access all features, please create an account or log in.
          </Text>
          <Button
            title="Create Account / Log In"
            onPress={onBackToAuth}
            style={styles.authButton}
            variant="primary"
          />
        </Card>
        )}
      </ScrollView>

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        visible={isModalVisible}
        partner={selectedPartner}
        userLocation={userLocation}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPanel: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  partnerCard: {
    marginBottom: 12,
  },
  partnerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  partnerLogo: {
    width: '100%',
    height: '100%',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  partnerAddress: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  authPrompt: {
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  promptIcon: {
    marginBottom: 12,
  },
  promptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  authButton: {
    minWidth: 200,
  },
  mapContainer: {
    flex: 1,
    height: 500, 
  },
});

export default GuestNavigator;
