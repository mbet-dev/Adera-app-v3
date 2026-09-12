import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@adera/ui';
import OperatingHoursDisplay from './OperatingHoursDisplay';
import defaultStorefront from '../../assets/adaptive-icon.png';
import MapView, { Marker, Callout } from './MapView';
import WebMapView from './WebMapView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Replace with your Supabase public bucket base url if you have one, or leave as null
const SUPABASE_SHOP_PIC_BASEURL = 'https://<YOUR-PROJECT-REF>.supabase.co/storage/v1/object/public/shops/location-pics/';
const isFullUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const getRealImageUrl = (uri) => {
  if (!uri) return null;
  if (isFullUrl(uri)) return uri;
  return SUPABASE_SHOP_PIC_BASEURL ? SUPABASE_SHOP_PIC_BASEURL + encodeURIComponent(uri) : uri;
};

const PartnerDetailModal = ({ visible = false, partner = null, userLocation = null, onClose = () => {} }) => {
  const theme = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageFull, setShowImageFull] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    if (!visible || !partner || !partner.location) return;
    const lat = typeof partner.location.latitude === 'number' ? partner.location.latitude : parseFloat(partner.location.latitude || 0);
    const lon = typeof partner.location.longitude === 'number' ? partner.location.longitude : parseFloat(partner.location.longitude || 0);
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const userLat = typeof userLocation.latitude === 'number' ? userLocation.latitude : parseFloat(userLocation.latitude || lat);
      const userLon = typeof userLocation.longitude === 'number' ? userLocation.longitude : parseFloat(userLocation.longitude || lon);
      const latDelta = Math.max(Math.abs(lat - userLat) * 2.5, 0.005);
      const lonDelta = Math.max(Math.abs(lon - userLon) * 2.5, 0.005);
      setMapRegion({ latitude: (lat + userLat) / 2, longitude: (lon + userLon) / 2, latitudeDelta: latDelta, longitudeDelta: lonDelta });
    } else {
      setMapRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    }
  }, [visible, partner, userLocation]);

  useEffect(() => {
    if (!visible || !partner || !partner.storefrontImage) return;
    const url = getRealImageUrl(partner.storefrontImage);
    if (!url) return setImageError(true);
    setImageLoading(true);
    setImageError(false);
    // quick existence check
    fetch(url, { method: 'HEAD' })
      .then((r) => { if (!r.ok) throw new Error('no image'); setImageLoading(false); })
      .catch(() => { setImageLoading(false); setImageError(true); });
  }, [visible, partner]);

  if (!partner) return null;

  const imageUrl = getRealImageUrl(partner.storefrontImage);
  const hasImage = !!imageUrl && !imageError;
  const isWideScreen = SCREEN_WIDTH > 700;

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)} m away`;
    return `${distance.toFixed(1)} km away`;
  };

  const dynamicOpenBadge = (isOpen) => ({
    backgroundColor: isOpen ? (theme?.colors?.success || '#2e7d32') : (theme?.colors?.error || '#d32f2f'),
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  });

  const getMapUrlWithUserLocation = () => {
    if (!partner || !partner.location) return null;
    const lat = Number(partner.location.latitude || 0);
    const lon = Number(partner.location.longitude || 0);
    if (!lat || !lon) return null;
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
    }
    const uLat = Number(userLocation.latitude);
    const uLon = Number(userLocation.longitude);
    const minLon = Math.min(lon, uLon) - 0.01;
    const minLat = Math.min(lat, uLat) - 0.01;
    const maxLon = Math.max(lon, uLon) + 0.01;
    const maxLat = Math.max(lat, uLat) + 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${lat},${lon}`;
  };

  const openInGoogleMaps = () => {
    try {
      const lat = Number(partner.location.latitude || 0);
      const lon = Number(partner.location.longitude || 0);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank');
      else Linking.openURL(url);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme?.colors?.surface || '#fff' }]}>
          <View style={[styles.header, { backgroundColor: theme?.colors?.primary || '#1976D2' }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: theme?.colors?.onPrimary || '#fff' }]} numberOfLines={1}>{partner.name}</Text>
              <View style={dynamicOpenBadge(partner.isOpen)}>
                <Text style={styles.badgeText}>{partner.isOpen ? 'OPEN NOW' : 'CLOSED'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={theme?.colors?.onPrimary || '#fff'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={isWideScreen ? styles.wideLayout : styles.stackedLayout}>
              <View style={isWideScreen ? styles.wideImageContainer : styles.responsiveImageContainer}>
                {hasImage ? (
                  <TouchableOpacity onPress={() => setShowImageFull(true)} activeOpacity={0.9} style={{ flex: 1 }}>
                    <Image source={{ uri: imageUrl }} style={isWideScreen ? styles.wideDetailHeroImage : styles.detailHeroImage} onLoad={() => setImageLoading(false)} onError={() => setImageError(true)} resizeMode="cover" defaultSource={defaultStorefront} />
                    {imageLoading && (<View style={styles.imageSpinnerOverlay}><ActivityIndicator size="large" color={theme?.colors?.primary || '#1976D2'} /></View>)}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="storefront-outline" size={72} color={theme?.colors?.onSurfaceVariant || '#999'} />
                    <Text style={styles.imagePlaceholderText}>No image available</Text>
                  </View>
                )}

                {showImageFull && (
                  <TouchableOpacity style={styles.lightboxBackdrop} activeOpacity={1} onPress={() => setShowImageFull(false)}>
                    <Image source={{ uri: imageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
                    <TouchableOpacity style={styles.closeLightboxButton} onPress={() => setShowImageFull(false)}>
                      <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.infoCard, { backgroundColor: theme?.colors?.surface || '#fff', flex: isWideScreen ? 1 : 0 }]}> 
                <View style={styles.nameRow}>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.name, { color: theme?.colors?.onSurface || '#111' }]}>{partner.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: theme?.colors?.primaryContainer || '#e3f2fd' }]}>
                      <Text style={[styles.typeText, { color: theme?.colors?.onPrimaryContainer || '#0d47a1' }]}>{partner.type || 'Shop'}</Text>
                    </View>
                  </View>
                </View>

                {typeof partner.distance === 'number' && (
                  <View style={styles.distanceRow}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color={theme?.colors?.primary || '#1976D2'} />
                    <Text style={[styles.distanceText, { color: theme?.colors?.onSurface || '#111' }]}>{formatDistance(partner.distance)}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={theme?.colors?.primary || '#1976D2'} />
                  <Text style={[styles.infoText, { color: theme?.colors?.onSurface || '#111' }]}>{partner.address || 'Address not available'}</Text>
                </View>

                {partner.phone && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="phone" size={18} color={theme?.colors?.primary || '#1976D2'} />
                    <Text style={[styles.infoText, { color: theme?.colors?.onSurface || '#111' }]}>{partner.phone}</Text>
                  </View>
                )}

                {partner.rating > 0 && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="star" size={18} color="#FFC107" />
                    <Text style={[styles.infoText, { color: theme?.colors?.onSurface || '#111' }]}>{partner.rating.toFixed(1)} ({partner.totalReviews || 0} reviews)</Text>
                  </View>
                )}

                {partner.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.description, { color: theme?.colors?.onSurfaceVariant || '#666' }]}>{partner.description}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Map area: Web iframe + overlay; web react-leaflet dynamic; native interactive map dynamic */}
            <View style={styles.mapCard}>
              {Platform.OS === 'web' ? (
                <WebMapView partner={partner} userLocation={userLocation} />
              ) : (
                <MapView
                  style={{ width: '100%', height: 260 }}
                  initialRegion={mapRegion}
                  region={mapRegion}
                >
                  <Marker
                    coordinate={{
                      latitude: Number(partner.location.latitude || 0),
                      longitude: Number(partner.location.longitude || 0),
                    }}
                    pinColor="#007AFF"
                  >
                    <Callout>
                      <View style={{ padding: 6 }}>
                        <Text style={{ fontWeight: '700' }}>{partner.name}</Text>
                      </View>
                    </Callout>
                  </Marker>
                  {userLocation && userLocation.latitude && userLocation.longitude && (
                    <Marker
                      coordinate={{
                        latitude: Number(userLocation.latitude),
                        longitude: Number(userLocation.longitude),
                      }}
                      pinColor="#FF3B30"
                      title="You"
                    />
                  )}
                </MapView>
              )}
            </View>

            <View style={[styles.hoursCard, { backgroundColor: theme?.colors?.surface || '#fff' }]}> 
              <Text style={[styles.sectionTitle, { color: theme?.colors?.onSurface || '#111' }]}>Operating Hours</Text>
              <OperatingHoursDisplay operatingHours={partner.operatingHours} />
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { 
    height: SCREEN_HEIGHT * 0.92, 
    marginTop: SCREEN_HEIGHT * 0.08,
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    overflow: 'hidden' 
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  closeButton: { padding: 6 },
  badgeText: { color: '#fff', fontWeight: '700' },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 32 },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { marginTop: 8, fontSize: 14 },
  infoCard: { padding: 16, marginTop: -8, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 2 },
  nameRow: { marginBottom: 8 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 20, fontWeight: '700', marginRight: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  typeText: { fontSize: 12, fontWeight: '600' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distanceText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  infoText: { fontSize: 14, flex: 1, lineHeight: 20, marginLeft: 8 },
  descriptionContainer: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  description: { fontSize: 14, lineHeight: 20 },
  mapCard: { padding: 12, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  responsiveImageContainer: { width: '100%', height: 200, backgroundColor: '#f0f0f0' },
  detailHeroImage: { width: '100%', height: '100%' },
  imageSpinnerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1 },
  lightboxBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  fullScreenImage: { width: '90%', height: '90%' },
  closeLightboxButton: { position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  gmapsBtn: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  hoursCard: { padding: 16, marginTop: 12 },
  wideLayout: { flexDirection: 'row', padding: 12 },
  stackedLayout: { flexDirection: 'column', padding: 0 },
  wideImageContainer: { width: '40%', height: 300, backgroundColor: '#f0f0f0', borderRadius: 12, overflow: 'hidden' },
  wideDetailHeroImage: { width: '100%', height: '100%' },
});

export default PartnerDetailModal;
