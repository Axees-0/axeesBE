import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';

interface QRGeneratorProps {
  value: string;
  creatorName?: string;
  profileUrl?: string;
  onScan?: () => void;
  size?: number;
  includeActions?: boolean;
  customMessage?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  value,
  creatorName,
  profileUrl,
  onScan,
  size = 200,
  includeActions = true,
  customMessage,
}) => {
  const [qrRef, setQrRef] = useState<any>(null);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const getDataURL = async () => {
    return new Promise<string>((resolve) => {
      qrRef?.toDataURL((data: string) => {
        resolve(`data:image/png;base64,${data}`);
      });
    });
  };

  const handleShare = async () => {
    try {
      const message = customMessage || 
        `${creatorName ? `Connect with ${creatorName} on Axees!` : 'Check out my Axees profile!'}\n\n${profileUrl || value}`;

      if (Platform.OS === 'web') {
        await Share.share({
          message,
          url: profileUrl || value,
        });
      } else {
        // For mobile, save QR code as image and share
        const dataUrl = await getDataURL();
        const fileUri = FileSystem.cacheDirectory + 'axees-qr-code.png';
        
        await FileSystem.writeAsStringAsync(
          fileUri,
          dataUrl.replace('data:image/png;base64,', ''),
          { encoding: FileSystem.EncodingType.Base64 }
        );

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Axees Profile',
          });
        } else {
          await Share.share({ message });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'web') {
        const dataUrl = await getDataURL();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `axees-qr-${creatorName || 'profile'}.png`;
        link.click();
      } else {
        const dataUrl = await getDataURL();
        const fileUri = FileSystem.documentDirectory + `axees-qr-${Date.now()}.png`;
        
        await FileSystem.writeAsStringAsync(
          fileUri,
          dataUrl.replace('data:image/png;base64,', ''),
          { encoding: FileSystem.EncodingType.Base64 }
        );

        Alert.alert('Success', 'QR code saved to your device!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  const handleCopyLink = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(profileUrl || value);
    } else {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(profileUrl || value);
    }
    Alert.alert('Success', 'Link copied to clipboard!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Connect</Text>
      
      <View style={styles.qrContainer}>
        <Animated.View
          style={[
            styles.qrWrapper,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <QRCode
            value={value}
            size={size}
            backgroundColor="white"
            color="#430B92"
            getRef={setQrRef}
            logo={require('@/assets/icon.png')}
            logoSize={40}
            logoBackgroundColor="white"
            logoMargin={2}
            logoBorderRadius={8}
          />
          
          {/* Decorative corners */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </Animated.View>

        <Text style={styles.instructions}>
          Scan this code to instantly connect{creatorName ? ` with ${creatorName}` : ''}
        </Text>

        {customMessage && (
          <View style={styles.messageBox}>
            <MaterialIcons name="info-outline" size={16} color="#8B5CF6" />
            <Text style={styles.customMessage}>{customMessage}</Text>
          </View>
        )}
      </View>

      {includeActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.primaryActionText}>Share QR</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleDownload}
            >
              <MaterialIcons name="download" size={20} color="#8B5CF6" />
              <Text style={styles.secondaryActionText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleCopyLink}
            >
              <MaterialIcons name="link" size={20} color="#8B5CF6" />
              <Text style={styles.secondaryActionText}>Copy Link</Text>
            </TouchableOpacity>

            {onScan && (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={onScan}
              >
                <MaterialIcons name="qr-code-scanner" size={20} color="#8B5CF6" />
                <Text style={styles.secondaryActionText}>Scan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Instant offer hint */}
      <View style={styles.hint}>
        <View style={styles.hintIcon}>
          <MaterialIcons name="bolt" size={16} color="#F59E0B" />
        </View>
        <Text style={styles.hintText}>
          Scanning creates instant connection • No login required
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    ...DesignSystem.Typography.h3,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DesignSystem.AccessibleColors.borderLight,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#430B92',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instructions: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    maxWidth: 280,
  },
  customMessage: {
    ...DesignSystem.Typography.small,
    color: '#8B5CF6',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    width: '100%',
    marginBottom: 16,
  },
  primaryAction: {
    ...DesignSystem.ButtonStyles.primary,
    flexDirection: 'row',
    marginBottom: 12,
  },
  primaryActionText: {
    ...DesignSystem.ButtonTextStyles.primary,
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    ...DesignSystem.Typography.caption,
    color: '#8B5CF6',
    marginLeft: 6,
    fontWeight: '600',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintIcon: {
    marginRight: 8,
  },
  hintText: {
    ...DesignSystem.Typography.small,
    color: '#92400E',
  },
});

export default QRGenerator;