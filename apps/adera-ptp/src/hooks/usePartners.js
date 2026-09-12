import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@adera/auth';
import { getOperatingStatus } from '../utils/operatingHours';
import { getPartnerMediaUrl } from '../utils/media';

// Conditionally use expo-location (not available on web)
// We'll require it dynamically only when needed on native platforms

/**
 * Custom hook to fetch and manage partner locations
 * Supports filtering, searching, and distance calculation
 */
export const usePartners = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'name', 'rating'

  // Fetch user's current location (non-blocking with timeout)
  const fetchUserLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.warn('[usePartners] Location error on web:', error);
              resolve(null);
            },
            { timeout: 5000, maximumAge: 60000 }
          );
        } else {
          resolve(null);
        }
      });
    }

    // Dynamically require expo-location only on native platforms
    let LocationModule;
    try {
      LocationModule = require('expo-location');
    } catch (requireError) {
      console.warn('[usePartners] expo-location not available:', requireError);
      return null;
    }

    try {
      // Check permissions first with timeout (2 seconds max)
      const permissionPromise = LocationModule.requestForegroundPermissionsAsync();
      const permissionTimeout = new Promise((resolve) => 
        setTimeout(() => {
          console.warn('[usePartners] Location permission request timeout');
          resolve({ status: 'denied' });
        }, 2000)
      );
      
      const { status } = await Promise.race([permissionPromise, permissionTimeout]);
      
      if (status !== 'granted') {
        console.warn('[usePartners] Location permission not granted');
        return null;
      }

      // Get location with timeout (5 seconds max)
      const locationPromise = LocationModule.getCurrentPositionAsync({
        accuracy: LocationModule.Accuracy.Balanced,
      });
      
      const locationTimeout = new Promise((resolve) => 
        setTimeout(() => {
          console.warn('[usePartners] Location fetch timeout');
          resolve(null);
        }, 5000)
      );
      
      const result = await Promise.race([locationPromise, locationTimeout]);
      
      if (!result || !result.coords) return null;
      
      return {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      };
    } catch (err) {
      console.warn('[usePartners] Error fetching location (non-critical):', err.message || err);
      return null;
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
      return null;
    }
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  // Fetch partners from Supabase
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shops IMMEDIATELY (don't wait for location)
      // Location will be fetched in parallel and applied later
      const shopsPromise = supabase
        .from('shops')
        .select(`
          id,
          name,
          description,
          category,
          logo_url,
          shop_location_pic,
          location,
          address,
          phone,
          operating_hours,
          is_active,
          is_verified,
          is_hub,
          average_rating,
          total_reviews,
          is_pickup,
          is_dropoff,
          owner_id
        `)
        .eq('is_active', true)
        .eq('is_hub', false) // Exclude hubs for security
        .order('name', { ascending: true });

      // Fetch location in parallel (non-blocking)
      const locationPromise = fetchUserLocation().catch(err => {
        console.warn('[usePartners] Location fetch failed (non-critical):', err);
        return null;
      });

      // Add timeout to database query (10 seconds max)
      const shopsWithTimeout = Promise.race([
        shopsPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
        )
      ]);

      // Execute both in parallel
      const [shopsResult, location] = await Promise.all([
        shopsWithTimeout,
        locationPromise,
      ]);

      const { data, error: fetchError } = shopsResult;

      // Set location if available (don't block on this)
      if (location) {
        setUserLocation(location);
      }

      if (fetchError) {
        throw fetchError;
      }

      // Transform data and calculate distances
      const transformedPartners = (data || []).map((shop) => {
        // Extract coordinates from POINT type
        // Supabase POINT format: {x: longitude, y: latitude} or string format "lon,lat"
        let coords = { latitude: 8.9806, longitude: 38.7578 }; // Default to Addis Ababa
        
        if (shop.location) {
          if (typeof shop.location === 'object') {
            // Handle PostGIS POINT object format
            if (shop.location.x !== undefined && shop.location.y !== undefined) {
              coords = {
                latitude: typeof shop.location.y === 'number' ? shop.location.y : parseFloat(shop.location.y) || 8.9806,
                longitude: typeof shop.location.x === 'number' ? shop.location.x : parseFloat(shop.location.x) || 38.7578,
              };
            } else if (shop.location.latitude !== undefined && shop.location.longitude !== undefined) {
              coords = {
                latitude: typeof shop.location.latitude === 'number' ? shop.location.latitude : parseFloat(shop.location.latitude) || 8.9806,
                longitude: typeof shop.location.longitude === 'number' ? shop.location.longitude : parseFloat(shop.location.longitude) || 38.7578,
              };
            }
          } else if (typeof shop.location === 'string') {
            // Handle string format "longitude,latitude" or "latitude,longitude"
            const parts = shop.location.split(',');
            if (parts.length === 2) {
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lon) && !isNaN(lat)) {
                // Check if it's likely lon,lat or lat,lon based on value ranges
                if (lon > -180 && lon < 180 && lat > -90 && lat < 90) {
                  coords = { latitude: lat, longitude: lon };
                } else if (lat > -180 && lat < 180 && lon > -90 && lon < 90) {
                  // Swapped format
                  coords = { latitude: lon, longitude: lat };
                }
              }
            }
          }
        }

        // Calculate distance if user location is available
        let distance = null;
        if (location) {
          distance = calculateDistance(
            location.latitude,
            location.longitude,
            coords.latitude,
            coords.longitude
          );
        }

        const storefrontImage = getPartnerMediaUrl(shop.shop_location_pic);
        const logoImage = getPartnerMediaUrl(shop.logo_url);
        const heroImage = storefrontImage || logoImage || null;
        const status = getOperatingStatus(shop.operating_hours || {});

        return {
          id: shop.id,
          ownerId: shop.owner_id,
          name: shop.name,
          description: shop.description,
          category: shop.category,
          logoUrl: logoImage,
          storefrontImage,
          heroImage,
          location: coords,
          address: shop.address,
          phone: shop.phone,
          operatingHours: shop.operating_hours || {},
          isActive: shop.is_active,
          isVerified: shop.is_verified,
          isHub: false, // Always false since we filter out hubs
          isPickup: shop.is_pickup ?? true,
          isDropoff: shop.is_dropoff ?? true,
          rating: shop.average_rating || 0,
          totalReviews: shop.total_reviews || 0,
          distance: distance,
          isOpen: status.isOpen,
          statusLabel: status.label,
          nextOpening: status.nextOpening,
          todayStatusKey: status.todayKey,
          // type kept for backward compatibility with UI strings
          type: shop.category === 'Logistics Hub' ? 'Pickup Point' : 'Shop Partner',
        };
      });

      setPartners(transformedPartners);
      setFilteredPartners(transformedPartners);
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError(err.message || 'Failed to load partner locations');
    } finally {
      setLoading(false);
    }
  }, [fetchUserLocation, calculateDistance]);

  // Initial fetch with delay to prevent blocking initial render
  useEffect(() => {
    let isMounted = true;
    let fetchTimeout;
    
    // Small delay to let UI render first, then fetch data
    fetchTimeout = setTimeout(() => {
      if (isMounted) {
        fetchPartners().catch(err => {
          console.error('[usePartners] Failed to fetch partners:', err);
          if (isMounted) {
            setError(err.message || 'Failed to load partner locations. Please try again.');
            setLoading(false);
          }
        });
      }
    }, 150); // Small delay to prevent blocking

    return () => {
      isMounted = false;
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, [fetchPartners]);

  // Filter and sort partners (with safe null handling)
  useEffect(() => {
    if (!partners || partners.length === 0) {
      setFilteredPartners([]);
      return;
    }

    // Use setTimeout to make filtering non-blocking
    const filterTimeout = setTimeout(() => {
      let filtered = [...partners];

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (partner) =>
            (partner.name || '').toLowerCase().includes(query) ||
            (partner.address || '').toLowerCase().includes(query) ||
            (partner.category || '').toLowerCase().includes(query)
        );
      }

      // Apply category filter (hubs excluded)
      if (selectedCategory !== 'all') {
        filtered = filtered.filter((partner) => {
          if (selectedCategory === 'pickup') return partner.isPickup === true || partner.type === 'Pickup Point';
          if (selectedCategory === 'dropoff') return partner.isDropoff === true;
          if (selectedCategory === 'shop') return partner.type === 'Shop Partner';
          return (partner.category || '').toLowerCase() === selectedCategory.toLowerCase();
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          default:
            return 0;
        }
      });

      setFilteredPartners(filtered);
    }, 0);

    return () => clearTimeout(filterTimeout);
  }, [partners, searchQuery, selectedCategory, sortBy]);

  // Get unique categories for filter (hubs excluded)
  const categories = ['all', 'pickup', 'shop', ...new Set(partners.map(p => p.category).filter(Boolean))];

  return {
    partners: filteredPartners,
    allPartners: partners,
    loading,
    error,
    userLocation,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
    refresh: fetchPartners,
    calculateDistance,
  };
};
