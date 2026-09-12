import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@adera_cache:';
const RECENT_PRODUCTS_KEY = `${CACHE_PREFIX}recent_products`;
const RECENT_PARCELS_KEY = `${CACHE_PREFIX}recent_parcels`;
const PRODUCT_CACHE_PREFIX = `${CACHE_PREFIX}product_`;
const PARCEL_CACHE_PREFIX = `${CACHE_PREFIX}parcel_`;

const MAX_RECENT_PRODUCTS = 20;
const MAX_RECENT_PARCELS = 10;
const PRODUCT_CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const PARCEL_CACHE_TTL = 1000 * 60 * 5; // 5 minutes (more volatile)

/**
 * Hook for offline caching of recently viewed products and parcels.
 * Caches Supabase responses in AsyncStorage so they're available offline.
 */
const useOfflineCache = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentParcels, setRecentParcels] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const cacheTimestampsRef = useRef({});

  // Load cached data on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const [productsJson, parcelsJson] = await Promise.all([
          AsyncStorage.getItem(RECENT_PRODUCTS_KEY),
          AsyncStorage.getItem(RECENT_PARCELS_KEY),
        ]);
        if (productsJson) setRecentProducts(JSON.parse(productsJson));
        if (parcelsJson) setRecentParcels(JSON.parse(parcelsJson));
      } catch (err) {
        console.warn('[OfflineCache] Load error:', err);
      } finally {
        setIsReady(true);
      }
    };
    loadCache();
  }, []);

  // ── Product caching ──

  /**
   * Cache a product detail for offline access
   */
  const cacheProduct = useCallback(async (product) => {
    if (!product?.id) return;
    try {
      const cacheEntry = {
        data: product,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(`${PRODUCT_CACHE_PREFIX}${product.id}`, JSON.stringify(cacheEntry));
      cacheTimestampsRef.current[product.id] = Date.now();

      // Update recent products list
      setRecentProducts((prev) => {
        const filtered = prev.filter((p) => p.id !== product.id);
        const updated = [
          { id: product.id, name: product.name, price: product.price, image: product.images?.[0] || null, cachedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT_PRODUCTS);
        AsyncStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (err) {
      console.warn('[OfflineCache] cacheProduct error:', err);
    }
  }, []);

  /**
   * Get a cached product by ID (returns null if expired or missing)
   */
  const getCachedProduct = useCallback(async (productId) => {
    try {
      const json = await AsyncStorage.getItem(`${PRODUCT_CACHE_PREFIX}${productId}`);
      if (!json) return null;
      const entry = JSON.parse(json);
      if (Date.now() - entry.cachedAt > PRODUCT_CACHE_TTL) return null;
      return entry.data;
    } catch {
      return null;
    }
  }, []);

  /**
   * Fetch a product with offline fallback — try network first, fall back to cache
   */
  const fetchProductWithCache = useCallback(async (productId, fetchFn) => {
    try {
      const data = await fetchFn(productId);
      if (data) {
        await cacheProduct(data);
        return { data, isFromCache: false };
      }
    } catch (err) {
      // Network failed — try cache
    }
    const cached = await getCachedProduct(productId);
    if (cached) {
      return { data: cached, isFromCache: true };
    }
    return { data: null, isFromCache: false };
  }, [cacheProduct, getCachedProduct]);

  // ── Parcel caching ──

  /**
   * Cache a parcel for offline tracking access
   */
  const cacheParcel = useCallback(async (parcel) => {
    if (!parcel?.id && !parcel?.trackingId) return;
    const key = parcel.trackingId || parcel.id;
    try {
      const cacheEntry = {
        data: parcel,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(`${PARCEL_CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));

      // Update recent parcels list
      setRecentParcels((prev) => {
        const filtered = prev.filter((p) => (p.trackingId || p.id) !== key);
        const updated = [
          {
            id: parcel.id,
            trackingId: parcel.trackingId || parcel.tracking_id,
            status: parcel.currentStatus ?? parcel.status,
            recipient: parcel.recipient || parcel.recipient_name,
            cachedAt: Date.now(),
          },
          ...filtered,
        ].slice(0, MAX_RECENT_PARCELS);
        AsyncStorage.setItem(RECENT_PARCELS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (err) {
      console.warn('[OfflineCache] cacheParcel error:', err);
    }
  }, []);

  /**
   * Get a cached parcel by tracking ID
   */
  const getCachedParcel = useCallback(async (trackingId) => {
    try {
      const json = await AsyncStorage.getItem(`${PARCEL_CACHE_PREFIX}${trackingId}`);
      if (!json) return null;
      const entry = JSON.parse(json);
      if (Date.now() - entry.cachedAt > PARCEL_CACHE_TTL) return null;
      return entry.data;
    } catch {
      return null;
    }
  }, []);

  /**
   * Fetch a parcel with offline fallback
   */
  const fetchParcelWithCache = useCallback(async (trackingId, fetchFn) => {
    try {
      const data = await fetchFn(trackingId);
      if (data) {
        await cacheParcel(data);
        return { data, isFromCache: false };
      }
    } catch (err) {
      // Network failed — try cache
    }
    const cached = await getCachedParcel(trackingId);
    if (cached) {
      return { data: cached, isFromCache: true };
    }
    return { data: null, isFromCache: false };
  }, [cacheParcel, getCachedParcel]);

  // ── Cache management ──

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      setRecentProducts([]);
      setRecentParcels([]);
      cacheTimestampsRef.current = {};
    } catch (err) {
      console.warn('[OfflineCache] clearCache error:', err);
    }
  }, []);

  /**
   * Get total cache size estimate (keys count)
   */
  const getCacheInfo = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      return {
        totalKeys: cacheKeys.length,
        recentProducts: recentProducts.length,
        recentParcels: recentParcels.length,
      };
    } catch {
      return { totalKeys: 0, recentProducts: 0, recentParcels: 0 };
    }
  }, [recentProducts, recentParcels]);

  return {
    isReady,
    // Recent items
    recentProducts,
    recentParcels,
    // Product caching
    cacheProduct,
    getCachedProduct,
    fetchProductWithCache,
    // Parcel caching
    cacheParcel,
    getCachedParcel,
    fetchParcelWithCache,
    // Management
    clearCache,
    getCacheInfo,
  };
};

export default useOfflineCache;
