import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseBoxQrPayload } from '../../src/domain';

export default function QrScanRoute() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!isScanning) {
      return;
    }

    const scannedBoxId = parseBoxQrPayload(result.data);

    if (!scannedBoxId) {
      setIsScanning(false);
      setErrorMessage('This QR does not belong to AI Box Catalog.');
      return;
    }

    setIsScanning(false);
    setErrorMessage(null);
    router.replace({ pathname: '/qr/[boxId]', params: { boxId: scannedBoxId } });
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.body}>Camera permission is required to scan QR labels.</Text>
        <Pressable accessibilityRole="button" onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        style={styles.camera}
      />
      {errorMessage ? (
        <View style={styles.messageBlock}>
          <Text style={styles.error}>{errorMessage}</Text>
          <Pressable accessibilityRole="button" onPress={() => setIsScanning(true)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Scan again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  body: {
    fontSize: 16
  },
  camera: {
    borderRadius: 8,
    flex: 1,
    overflow: 'hidden'
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b57d0',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#0b57d0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '700'
  },
  messageBlock: {
    gap: 10
  },
  error: {
    color: '#b42318',
    fontSize: 14
  }
});
