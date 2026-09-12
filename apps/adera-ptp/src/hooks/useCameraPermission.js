import { useEffect, useState } from 'react';
import { BarCodeScanner } from '../utils/barcodeScannerSafe';

export function useCameraPermission() {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        if (mounted) setHasPermission(status === 'granted');
      } catch (e) {
        if (mounted) setHasPermission(false);
        console.error('Camera permission request failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return hasPermission;
}
