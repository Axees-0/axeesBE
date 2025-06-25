import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { BarCodeScanner, BarCodeScannedCallback } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DesignSystem from '@/styles/DesignSystem';
import { WebSEO } from '../web-seo';
import { UniversalBackButton } from '@/components/UniversalBackButton';
import { Color } from '@/GlobalStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QRData {
  type: 'profile' | 'offer' | 'payment' | 'channel';
  id: string;
  instant?: boolean;
  amount?: number;
  productId?: string;
}

const QRScannerPage: React.FC = () => {
  const params = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode'>('qr');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ type, data }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      // Vibrate on successful scan (mobile only)
      if (Platform.OS !== 'web') {
        const { Vibration } = require('react-native');
        Vibration.vibrate(100);
      }

      // Parse QR code data
      if (data.startsWith('axees://')) {
        const url = new URL(data);
        const path = url.pathname;
        const queryParams = Object.fromEntries(url.searchParams);

        if (path.startsWith('/profile/')) {
          const profileId = path.split('/')[2];
          handleProfileScan(profileId, queryParams.instant === 'true');
        } else if (path.startsWith('/offer/')) {
          const offerId = path.split('/')[2];
          handleOfferScan(offerId);
        } else if (path.startsWith('/payment/')) {
          const paymentId = path.split('/')[2];
          const amount = parseFloat(queryParams.amount || '0');
          handlePaymentScan(paymentId, amount);
        } else if (path.startsWith('/channel/')) {
          const channelId = path.split('/')[2];
          handleChannelScan(channelId);
        }
      } else {
        // Handle regular URLs or other QR formats
        Alert.alert(
          'QR Code Scanned',
          `Content: ${data}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => handleGenericScan(data) },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
    } finally {
      setIsProcessing(false);
      // Reset scanner after delay
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const handleProfileScan = (profileId: string, instant: boolean) => {
    if (instant) {
      // Navigate to ghost profile creation for instant offers
      router.push({
        pathname: '/ghost-profile/create',
        params: { 
          profileId,
          returnTo: `/profile/${profileId}`,
          action: 'offer'
        }
      });
    } else {
      // Normal profile navigation
      router.push(`/profile/${profileId}`);
    }
  };

  const handleOfferScan = (offerId: string) => {
    router.push({
      pathname: '/offers/view',
      params: { offerId }
    });
  };

  const handlePaymentScan = (paymentId: string, amount: number) => {
    router.push({
      pathname: '/payment/instant',
      params: { paymentId, amount: amount.toString() }
    });
  };

  const handleChannelScan = (channelId: string) => {
    router.push(`/channel/${channelId}`);
  };

  const handleGenericScan = (data: string) => {
    // Try to open as URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      if (Platform.OS === 'web') {
        window.open(data, '_blank');
      } else {
        const { Linking } = require('react-native');
        Linking.openURL(data);
      }
    } else {
      Alert.alert('QR Content', data);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <MaterialIcons name="qr-code-scanner" size={48} color="#ccc" />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <WebSEO 
          title="QR Scanner - Axees"
          description="Scan QR codes to connect with creators instantly"
        />
        <View style={styles.header}>
          <UniversalBackButton fallbackRoute="/explore" />
        </View>
        
        <View style={styles.centerContent}>
          <MaterialIcons name="no-photography" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorDescription}>
            Please enable camera access to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                Alert.alert('Settings', 'Please check your browser settings to enable camera access');
              } else {
                const { Linking } = require('react-native');
                Linking.openSettings();
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <WebSEO 
        title="QR Scanner - Axees"
        description="Scan QR codes to connect with creators instantly"
      />

      {/* Scanner View */}
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={
          scannerType === 'qr' 
            ? [BarCodeScanner.Constants.BarCodeType.qr]
            : [
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
                BarCodeScanner.Constants.BarCodeType.upc_a,
                BarCodeScanner.Constants.BarCodeType.upc_e,
              ]
        }
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <UniversalBackButton 
            fallbackRoute="/explore" 
            style={styles.backButton}
            iconColor="#fff"
          />
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Ionicons 
                name={torchOn ? "flash" : "flash-off"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scanner Frame */}
        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scanning line animation */}
            {!scanned && (
              <LinearGradient
                colors={['transparent', '#8B5CF6', 'transparent']}
                style={styles.scanLine}
              />
            )}

            {/* Success indicator */}
            {scanned && (
              <View style={styles.successIndicator}>
                <MaterialIcons name="check-circle" size={64} color="#10B981" />
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              {scanned ? 'Code Scanned!' : 'Scan QR Code'}
            </Text>
            <Text style={styles.instructionText}>
              {scanned 
                ? 'Processing...' 
                : 'Position the QR code within the frame'
              }
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <View style={styles.scannerTypeToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                scannerType === 'qr' && styles.toggleButtonActive
              ]}
              onPress={() => setScannerType('qr')}
            >
              <MaterialIcons name="qr-code" size={20} color={scannerType === 'qr' ? '#fff' : '#666'} />
              <Text style={[
                styles.toggleText,
                scannerType === 'qr' && styles.toggleTextActive
              ]}>QR Code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                scannerType === 'barcode' && styles.toggleButtonActive
              ]}
              onPress={() => setScannerType('barcode')}
            >
              <MaterialIcons name="barcode-reader" size={20} color={scannerType === 'barcode' ? '#fff' : '#666'} />
              <Text style={[
                styles.toggleText,
                scannerType === 'barcode' && styles.toggleTextActive
              ]}>Barcode</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => {
              Alert.prompt(
                'Enter Code',
                'Manually enter the code',
                (text) => {
                  if (text) {
                    handleBarCodeScanned({ 
                      type: BarCodeScanner.Constants.BarCodeType.qr, 
                      data: text 
                    });
                  }
                },
                'plain-text'
              );
            }}
          >
            <MaterialIcons name="keyboard" size={20} color="#8B5CF6" />
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginTop: 16,
  },
  errorTitle: {
    ...DesignSystem.Typography.h2,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: Color.cSK430B92500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#8B5CF6',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: '50%',
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  instructions: {
    alignItems: 'center',
    marginTop: 32,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  scannerTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  manualButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

export default QRScannerPage;