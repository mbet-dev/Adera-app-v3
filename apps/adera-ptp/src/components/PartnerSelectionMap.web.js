import React, { useEffect, useMemo } from 'react';
import { useTheme } from '@adera/ui';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [8.9806, 38.7578];

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={8}
            pathOptions={{
              color: theme.colors.primary,
              fillColor: theme.colors.primary,
              fillOpacity: 0.4,
            }}
          />
        )}

        {partners
          .filter((partner) => partner.location)
          .map((partner) => {
            const statusColor = partner.isOpen ? theme.colors.success : theme.colors.error;

            return (
              <Marker
                key={partner.id}
                position={[partner.location.latitude, partner.location.longitude]}
                icon={selectedPartner?.id === partner.id ? selectedIcon : defaultIcon}
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

