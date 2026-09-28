import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useTheme } from '@adera/ui';

/**
 * WebMapView — real interactive Leaflet map for web.
 *
 * Replaces the previous static OSM <iframe> embed (whose overlay "pins" were
 * positioned by percentage and never matched real coordinates). This version
 * renders an actual Leaflet map with:
 *  - a branded pin at the partner's exact location,
 *  - a distinct pulsing "You" marker at the user's location (when available),
 *  - auto-fit bounds so both pins are always visible,
 *  - the Google Maps hand-off button preserved.
 *
 * Leaflet CSS is injected once on mount — without it tiles and markers render
 * misaligned or invisible.
 */

const DEFAULT_CENTER = [9.03, 38.74];

// Leaflet CSS singleton injection (idempotent across mounts)
const LEAFLET_CSS_ID = 'leaflet-css-adera';
const ensureLeafletCss = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
};

const buildPartnerIcon = (primaryColor, selected = false) => {
  const L = require('leaflet');
  const size = selected ? 40 : 34;
  return L.divIcon({
    className: 'adera-partner-pin',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);transform-origin:center;
        background:${primaryColor};
        border:2.5px solid #fff;
        box-shadow:0 3px 8px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);color:#fff;font-size:${selected ? 18 : 15}px;font-weight:800;line-height:1;">A</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
  });
};

const buildUserIcon = (accentColor) => {
  const L = require('leaflet');
  return L.divIcon({
    className: 'adera-user-pin',
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <span style="
          position:absolute;inset:0;border-radius:50%;
          background:${accentColor};opacity:.35;
          animation:adera-pulse 1.6s ease-out infinite;
        "></span>
        <span style="
          position:absolute;left:5px;top:5px;width:16px;height:16px;border-radius:50%;
          background:${accentColor};border:2.5px solid #fff;
          box-shadow:0 1px 5px rgba(0,0,0,.4);
        "></span>
      </div>
      <style>
        @keyframes adera-pulse {
          0% { transform: scale(.6); opacity:.5; }
          100% { transform: scale(2.2); opacity:0; }
        }
      </style>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const WebMapView = ({ partner, userLocation, height = 260 }) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  useEffect(() => {
    ensureLeafletCss();
  }, []);

  const validPartner = useMemo(() => {
    const lat = Number(partner?.location?.latitude);
    const lon = Number(partner?.location?.longitude);
    if (!lat || !lon) return null;
    return { lat, lon };
  }, [partner?.location?.latitude, partner?.location?.longitude]);

  const validUser = useMemo(() => {
    const lat = Number(userLocation?.latitude);
    const lon = Number(userLocation?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (!lat && !lon)) return null;
    return { lat, lon };
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return undefined;

    const L = require('leaflet');
    const center = validPartner
      ? [validPartner.lat, validPartner.lon]
      : validUser
      ? [validUser.lat, validUser.lon]
      : DEFAULT_CENTER;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(containerRef.current, {
        center,
        zoom: 15,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // --- Partner pin ---
    if (layersRef.current.partner) {
      map.removeLayer(layersRef.current.partner);
      layersRef.current.partner = null;
    }
    if (validPartner) {
      const marker = L.marker([validPartner.lat, validPartner.lon], {
        icon: buildPartnerIcon(theme.colors.primary, true),
      });
      marker
        .bindPopup(
          `<strong>${partner.name || 'Adera Partner'}</strong>` +
            (partner.address ? `<br/><span style="font-size:12px;color:#555">${partner.address}</span>` : ''),
        )
        .addTo(map);
      layersRef.current.partner = marker;
    }

    // --- User pin ---
    if (layersRef.current.user) {
      map.removeLayer(layersRef.current.user);
      layersRef.current.user = null;
    }
    if (validUser) {
      const marker = L.marker([validUser.lat, validUser.lon], {
        icon: buildUserIcon('#FF3B30'),
        zIndexOffset: 500,
      });
      marker.bindPopup('<strong>You are here</strong>').addTo(map);
      layersRef.current.user = marker;
    }

    // --- Fit bounds around both pins ---
    const points = [validPartner, validUser].filter(Boolean).map((p) => [p.lat, p.lon]);
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points).pad(0.25));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layersRef.current = {};
      }
    };
    // Rebuild pins when positions or theme change
  }, [validPartner, validUser, theme.colors.primary, partner?.name, partner?.address]);

  const openInGoogleMaps = () => {
    try {
      const target = validPartner || validUser;
      if (!target) return;
      const url = `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lon}`;
      if (typeof window !== 'undefined') window.open(url, '_blank');
      else Linking.openURL(url);
    } catch (e) {
      // ignore
    }
  };

  if (!validPartner && !validUser) {
    return (
      <View style={[styles.mapUnavailableContainer, height != null && { height }]}>
        <Text style={styles.mapUnavailableText}>Map unavailable — no location data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, height != null && { height }]}>
      <View ref={containerRef} style={styles.mapHost} collapsable={false} />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.legendRow} pointerEvents="none">
          {validPartner && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>{partner?.name || 'Partner'}</Text>
            </View>
          )}
          {validUser && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>You</Text>
            </View>
          )}
        </View>
        {validPartner && (
          <TouchableOpacity onPress={openInGoogleMaps} style={styles.gmapsButton}>
            <Text style={styles.gmapsButtonText}>Open in Google Maps</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8ECEF',
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  legendRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: '#333' },
  gmapsButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gmapsButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  mapUnavailableContainer: {
    width: '100%',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  mapUnavailableText: {
    color: '#666',
  },
});

export default WebMapView;
