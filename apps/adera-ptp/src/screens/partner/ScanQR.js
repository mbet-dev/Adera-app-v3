import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, Button, SafeArea, useTheme, TextInput } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner, isBarcodeAvailable } from '../../utils/barcodeScannerSafe';
import { useCameraPermission } from '../../hooks/useCameraPermission';

const { width, height } = Dimensions.get('window');

const ScanQR = ({ navigation }) => {
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputError, setInputError] = useState('');
  const hasPermission = useCameraPermission();

  // Validate tracking code format (e.g., AD001234)
  const validateTrackingCode = (code) => {
    const trimmedCode = code.trim().toUpperCase();
    // Expected format: 2-3 letters followed by 6-8 digits
    const trackingPattern = /^[A-Z]{2,3}\d{6,8}$/;
    return trackingPattern.test(trimmedCode);
  };

  // Process tracking code (from QR or manual input)
  const processTrackingCode = (code) => {
    setIsProcessing(true);
    setInputError('');
    
    // Validate format
    if (!validateTrackingCode(code)) {
      setInputError('Invalid tracking code format. Expected format: AD001234');
      setIsProcessing(false);
      return;
    }

    // TODO: Implement actual API call to verify parcel
    setTimeout(() => {
      Alert.alert(
        'Parcel Found',
        `Tracking Code: ${code.trim().toUpperCase()}\n\nParcel verified successfully!`,
        [
          {
            text: 'View Details',
            onPress: () => {
              // Navigate to parcel details or update status
              navigation?.navigate?.('PartnerDashboard', { 
                scannedCode: code.trim().toUpperCase() 
              });
            }
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setTrackingCode('');
              setScanning(false);
            }
          }
        ]
      );
      setIsProcessing(false);
      setTrackingCode('');
    }, 1000);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);
    processTrackingCode(data);
  };

  const handleManualSubmit = () => {
    if (!trackingCode.trim()) {
      setInputError('Please enter a tracking code');
      return;
    }
    processTrackingCode(trackingCode);
  };

  // Dev mode: Show manual input when scanner is not available
  if (!isBarcodeAvailable) {
    return (
      <SafeArea style={styles.container} withBottomNav={true}>
        <AppBar 
          title="Scan QR Code"
          onBack={() => navigation?.goBack?.()}
        />
        
        <View style={styles.content}>
          <Card style={styles.devModeCard}>
            <Ionicons name="information-circle-outline" size={64} color="#2196F3" style={styles.devIcon} />
            <Text variant="headlineSmall" style={styles.devTitle}>
              Manual Input Mode
            </Text>
            <Text variant="bodyMedium" style={styles.devDescription}>
              QR scanner unavailable in development. Use manual input below.
            </Text>
          </Card>

          <Card style={styles.manualInputCard}>
            <Text variant="titleMedium" style={styles.manualInputTitle}>
              Enter Tracking Code
            </Text>
            <Text variant="bodySmall" style={styles.manualInputSubtitle}>
              Type the parcel tracking code manually
            </Text>
            
            <TextInput
              label="Tracking Code"
              value={trackingCode}
              onChangeText={(text) => {
                setTrackingCode(text);
                setInputError('');
              }}
              placeholder="AD001234"
              autoCapitalize="characters"
              maxLength={11}
              error={!!inputError}
              style={styles.input}
              right={
                trackingCode.length > 0 ? (
                  <TextInput.Icon 
                    icon="close" 
                    onPress={() => {
                      setTrackingCode('');
                      setInputError('');
                    }}
                  />
                ) : null
              }
            />
            {inputError ? (
              <Text variant="bodySmall" style={styles.errorText}>
                {inputError}
              </Text>
            ) : null}
            
            <Button
              mode="contained"
              onPress={handleManualSubmit}
              loading={isProcessing}
              disabled={!trackingCode.trim() || isProcessing}
              style={styles.submitButton}
              icon="checkmark-circle"
            >
              Verify Parcel
            </Button>
          </Card>

          <Card style={styles.infoCard}>
            <Text variant="titleMedium" style={styles.infoTitle}>
              Tracking Code Format
            </Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoStep}>•</Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Starts with 2-3 letters (e.g., AD, ADR)
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoStep}>•</Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Followed by 6-8 digits
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoStep}>•</Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Example: AD001234, ADR12345678
              </Text>
            </View>
          </Card>
        </View>
      </SafeArea>
    );
  }

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar 
        title="Scan QR Code"
        onBack={() => navigation?.goBack?.()}
      />
      
      <View style={styles.content}>
        <Card style={styles.scanCard}>
          <View style={styles.scanArea}>
            <BarCodeScanner
              onBarCodeScanned={scanning ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text variant="headlineSmall" style={styles.scanTitle}>
                Scan Parcel QR Code
              </Text>
              <Text variant="bodyMedium" style={styles.scanDescription}>
                Position the QR code within the frame to scan
              </Text>
            </View>
          </View>
          
          <Button
            mode="contained"
            onPress={() => setScanning(true)}
            disabled={scanning}
            style={styles.scanButton}
          >
            {scanning ? 'Scanning...' : 'Start Scanning'}
          </Button>
        </Card>

        {/* Manual Input Fallback */}
        <Card style={styles.manualInputCard}>
          <Text variant="titleMedium" style={styles.manualInputTitle}>
            Or Enter Code Manually
          </Text>
          <Text variant="bodySmall" style={styles.manualInputSubtitle}>
            Can't scan? Type the tracking code
          </Text>
          
          <TextInput
            label="Tracking Code"
            value={trackingCode}
            onChangeText={(text) => {
              setTrackingCode(text);
              setInputError('');
            }}
            placeholder="AD001234"
            autoCapitalize="characters"
            maxLength={11}
            error={!!inputError}
            style={styles.input}
            right={
              trackingCode.length > 0 ? (
                <TextInput.Icon 
                  icon="close" 
                  onPress={() => {
                    setTrackingCode('');
                    setInputError('');
                  }}
                />
              ) : null
            }
          />
          {inputError ? (
            <Text variant="bodySmall" style={styles.errorText}>
              {inputError}
            </Text>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleManualSubmit}
            loading={isProcessing}
            disabled={!trackingCode.trim() || isProcessing}
            style={styles.submitButton}
            icon="checkmark-circle"
          >
            Verify Parcel
          </Button>
        </Card>

        <Card style={styles.infoCard}>
          <Text variant="titleMedium" style={styles.infoTitle}>
            How to Use
          </Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>1.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Scan the QR code on the parcel, or
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>2.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Manually enter the tracking code below
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>3.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Wait for verification and confirmation
            </Text>
          </View>
        </Card>
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scanCard: {
    padding: 32,
    marginBottom: 16,
  },
  scanArea: {
    alignItems: 'center',
    marginBottom: 24,
    width: width - 32,
    height: width - 32,
    overflow: 'hidden',
    borderRadius: 12,
    position: 'relative'
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width - 80,
    height: width - 80,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
  },
  scanTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  scanDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  scanButton: {
    paddingVertical: 8,
  },
  infoCard: {
    padding: 20,
  },
  infoTitle: {
    fontWeight: '500',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 20,
  },
  infoText: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  devModeCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  devIcon: {
    marginBottom: 16,
  },
  devTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  devDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  devInstruction: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  devCommand: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  devCommandText: {
    fontFamily: 'monospace',
    color: '#333',
  },
  devButton: {
    paddingVertical: 8,
    minWidth: 120,
  },
  manualInputCard: {
    padding: 20,
    marginBottom: 16,
  },
  manualInputTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  manualInputSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 8,
    marginTop: 8,
  },
});

export default ScanQR;
