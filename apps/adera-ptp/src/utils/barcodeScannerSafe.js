/**
 * Safe wrapper for expo-barcode-scanner that handles missing native module
 * during development phase.
 * 
 * TODO: Remove this wrapper once native module is properly linked.
 * For production, run: npx expo prebuild --clean && npx expo run:android/ios
 */

let BarCodeScannerModule = null;
let isAvailable = false;

try {
  // Try to import the native module
  BarCodeScannerModule = require('expo-barcode-scanner').BarCodeScanner;
  isAvailable = true;
} catch (error) {
  console.warn('[DEV] BarCodeScanner native module not available. Using mock fallback.');
  isAvailable = false;
}

// Mock implementation for development
const MockBarCodeScanner = {
  requestPermissionsAsync: async () => ({
    status: 'denied',
    canAskAgain: false,
    granted: false,
  }),
  getPermissionsAsync: async () => ({
    status: 'denied',
    canAskAgain: false,
    granted: false,
  }),
  scanFromURLAsync: async () => {
    throw new Error('Mock scanner - not implemented');
  },
  Constants: {
    BarCodeType: {},
  },
};

// Export either the real module or the mock
export const BarCodeScanner = isAvailable ? BarCodeScannerModule : MockBarCodeScanner;
export const isBarcodeAvailable = isAvailable;

// Mock component for when scanner is not available
export const MockScannerView = () => null;
