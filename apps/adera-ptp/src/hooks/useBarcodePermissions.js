import { useState, useEffect, useCallback } from 'react';
import { BarCodeScanner } from '../utils/barcodeScannerSafe';

export default function useBarcodePermissions() {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await BarCodeScanner.getPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch {
        setHasPermission(false);
      }
    })();
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  return { hasPermission, requestPermission };
}
