# QR Scanner & Icons — Setup & Notes

1) From repo root run (managed expo):
   - cd apps/adera-ptp
   - expo install expo-barcode-scanner
   - expo install @expo/vector-icons
   - expo install expo-location
   - (optional) expo install react-native-safe-area-context react-native-paper

2) For bare/native builds (prebuild / EAS):
   - Ensure android/app/src/main/AndroidManifest.xml includes:
     <uses-permission android:name="android.permission.CAMERA" />
   - iOS: Info.plist must include NSCameraUsageDescription (already set in app.json).
   - Rebuild native app: eas build or npx react-native run-android / run-ios after prebuild.

3) Runtime notes (already applied in code):
   - Call BarCodeScanner.requestPermissionsAsync() before rendering scanner.
   - Use onBarCodeScanned handler once scanning is enabled.
   - app.json already includes "android.permissions": ["CAMERA"] and iOS NSCameraUsageDescription.

4) Common troubleshooting:
   - If scanner shows black screen on Android emulator, test on a real device or enable camera emulation.
   - If icons are missing, run: expo start -c (clear cache) and ensure @expo/vector-icons is installed.
   - For bare builds, ensure react-native-vector-icons is linked (auto-linking normally handles it).

5) Quick test flow:
   - cd apps/adera-ptp
   - expo start
   - Press 'a' (android) or open on device via Expo Go — scan a QR from another device or image.

This file documents the exact commands and native config required to make QR scanning and icons function reliably.
