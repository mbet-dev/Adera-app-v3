import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * QR Code Scanner for Adera parcel verification.
 *
 * On web: uses a hidden <input> with capture or falls back to manual entry.
 * On native: uses expo-camera when available.
 *
 * The parsed payload is validated against:
 *   TRACKING_ID|PHASE|PARTNER_ID|TIMESTAMP|HASH
 */

export const SCAN_STATUS = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Parse a raw QR code string into structured data.
 * Returns null if the format is invalid.
 */
export function parseQrPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.trim().split('|');
  if (parts.length < 4) return null;

  const [trackingId, phase, partnerId, timestamp, hash] = parts;
  const phaseNum = parseInt(phase, 10);

  if (!trackingId || isNaN(phaseNum) || !timestamp) return null;

  return {
    trackingId,
    phase: phaseNum,
    partnerId: partnerId === 'NULL' ? null : partnerId,
    timestamp: parseInt(timestamp, 10),
    hash: hash || null,
  };
}

/**
 * Validate a parsed QR payload against expected values.
 */
export function validateQrPayload(payload, expected) {
  if (!payload || !expected) return false;
  return (
    payload.trackingId === expected.trackingId &&
    payload.phase === expected.phase &&
    payload.partnerId === expected.partnerId
  );
}

/**
 * Lightweight scanner component.
 * Props: onScan(string), onError(Error), style
 */
export default function QRCodeScanner({ onScan, onError, style }) {
  const [status, setStatus] = useState(SCAN_STATUS.IDLE);
  const [manualEntry, setManualEntry] = useState('');
  const inputRef = useRef(null);

  // On native, try to use expo-camera
  let CameraComponent = null;
  if (Platform.OS !== 'web') {
    try {
      CameraComponent = require('expo-camera').CameraView;
    } catch {
      CameraComponent = null;
    }
  }

  const handleBarCodeScanned = ({ data }) => {
    setStatus(SCAN_STATUS.SUCCESS);
    onScan?.(data);
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      setStatus(SCAN_STATUS.SUCCESS);
      onScan?.(manualEntry.trim());
    }
  };

  // Web fallback — manual entry only
  if (Platform.OS === 'web' || !CameraComponent) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.manualContainer}>
          <Text style={styles.label}>Scan QR Code</Text>
          <Text style={styles.hint}>Enter the tracking code manually</Text>
          <View style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              placeholder="e.g. ADE20250110-ABCD|0|partner|1234567890|hash"
              style={styles.webInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSubmit();
              }}
            />
            <button onClick={handleManualSubmit} style={styles.submitButton}>
              Verify
            </button>
          </View>
        </View>
      </View>
    );
  }

  // Native camera scanner
  return (
    <View style={[styles.container, style]}>
      <CameraComponent
        style={styles.camera}
        onBarcodeScanned={status !== SCAN_STATUS.SUCCESS ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Align QR code within the frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA',
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 480,
  },
  webInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #CCC',
    outlineStyle: 'none',
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: '#1565C0',
    color: '#FFF',
    border: 'none',
    borderRadius: 8,
    fontWeight: '600',
    cursor: 'pointer',
  },
});
