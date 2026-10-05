import { Platform } from 'react-native';

/**
 * QR Code Generator for Adera parcel tracking.
 *
 * Produces a data string that encodes:
 *   TRACKING_ID|PHASE|PARTNER_ID|TIMESTAMP|HMAC_HASH
 *
 * On web the component is a lightweight SVG rendered via a data-URI;
 * on native it delegates to react-native-qrcode-svg when available.
 */

const TRACKING_PREFIX = 'ADE';

export function generateTrackingId() {
  const date = new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${TRACKING_PREFIX}${ymd}-${rand}`;
}

export function generateQrPayload({ trackingId, phase, partnerId, timestamp }) {
  const ts = timestamp || Date.now();
  // The server-side HMAC is the real security layer; client-side hash is decorative.
  const clientHash = simpleHash(`${trackingId}|${phase}|${partnerId}|${ts}`);
  return `${trackingId}|${phase}|${partnerId}|${ts}|${clientHash}`;
}

// Deterministic but NOT cryptographically secure — server verifies with HMAC-SHA256.
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).padStart(8, '0');
}

/**
 * React component that renders a QR code.
 * Falls back to a styled <View> placeholder on platforms without
 * react-native-qrcode-svg.
 */
let QRCodeComponent = null;
try {
  QRCodeComponent = require('react-native-qrcode-svg').default;
} catch {
  // Library not installed — provide a lightweight fallback
}

export function QRCodeDisplay({ value, size = 200 }) {
  if (QRCodeComponent) {
    return <QRCodeComponent value={value} size={size} />;
  }

  // Minimal placeholder that renders on any platform
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={[qrStyles.container, { width: size, height: size }]}>
      <Text style={qrStyles.label}>QR</Text>
      <Text style={qrStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const qrStyles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  label: { fontSize: 24, fontWeight: '700', color: '#333' },
  value: { fontSize: 8, color: '#666', textAlign: 'center', marginTop: 4 },
};

export default QRCodeDisplay;
