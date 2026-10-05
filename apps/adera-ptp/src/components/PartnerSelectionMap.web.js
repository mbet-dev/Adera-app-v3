import React, { useEffect, useMemo } from 'react';
import { useTheme } from '@adera/ui';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [8.9806, 38.7578];

/**
 * Branded Adera pin icons built as divIcons — no external marker-image CDN
 * (unpkg/github marker PNGs were flaky and unbranded). Geometry: rounded
 * teardrop rotated -45° so the tip sits exactly at the marker coordinate.
 */
const buildPartnerIcon = (color, selected = false) => {
  const size = selected ? 40 : 34;
  return L.divIcon({
    className: 'adera-partner-pin',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
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

const buildUserIcon = (color) =>
  L.divIcon({
    className: 'adera-user-pin',
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <span style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:.35;
          animation:adera-pulse 1.6s ease-out infinite;
        "></span>
        <span style="
          position:absolute;left:5px;top:5px;width:16px;height:16px;border-radius:50%;
          background:${color};border:2.5px solid #fff;
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

const FitBoundsHelper = ({ partners, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    partners.forEach((partner) => {
      if (partner.location) {
        bounds.push([partner.location.latitude, partner.location.longitude]);
      }
    });
    if (userLocation) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }
    if (bounds.length === 0) return;

    map.fitBounds(bounds, { padding: [24, 24] });
  }, [partners, userLocation, map]);

  return null;
};

const PartnerSelectionMap = ({ partners = [], selectedPartner, onSelect, userLocation }) => {
  const theme = useTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  const center = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    const firstPartner = partners.find((partner) => partner.location);
    if (firstPartner) {
      return [firstPartner.location.latitude, firstPartner.location.longitude];
    }
    return DEFAULT_CENTER;
  }, [partners, userLocation]);

  return (
    <div style={{ height: 320, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsHelper partners={partners} userLocation={userLocation} />

        {userLocation && (
          <>
            <CircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={22}
              pathOptions={{
                color: 'transparent',
                fillColor: theme.colors.primary,
                fillOpacity: 0.12,
              }}
            />
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={buildUserIcon('#FF3B30')}
              zIndexOffset={500}
            >
              <Popup>
                <strong>You are here</strong>
              </Popup>
            </Marker>
          </>
        )}

        {partners
          .filter((partner) => partner.location)
          .map((partner) => {
            const statusColor = partner.isOpen ? theme.colors.success : theme.colors.error;
            const isSelected = selectedPartner?.id === partner.id;

            return (
              <Marker
                key={partner.id}
                position={[partner.location.latitude, partner.location.longitude]}
                icon={buildPartnerIcon(isSelected ? theme.colors.success : theme.colors.primary, isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    {partner.heroImage && (
                      <img
                        src={partner.heroImage}
                        alt={partner.name}
                        style={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      />
                    )}
                    <strong>{partner.name}</strong>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 6,
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          display: 'inline-block',
                          backgroundColor: statusColor,
                        }}
                      />
                      <span style={{ color: statusColor }}>{partner.statusLabel || (partner.isOpen ? 'Open now' : 'Closed')}</span>
                    </div>
                    <p style={{ marginTop: 0, marginBottom: 8, fontSize: 12 }}>
                      {partner.address || 'No address available'}
                    </p>
                    <button
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: theme.colors.primary,
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                      onClick={() => onSelect?.(partner)}
                    >
                      Select Partner
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default PartnerSelectionMap;

