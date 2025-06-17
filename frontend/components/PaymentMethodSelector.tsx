import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { 
  CreditCard, 
  Plus, 
  Check, 
  Trash2, 
  Star,
  Building2,
  AlertCircle
} from 'lucide-react-native';
import { usePaymentMethods, SavedPaymentMethod, PaymentMethodsService } from '@/utils/paymentMethodsService';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethodSelectorProps {
  onMethodSelected?: (method: SavedPaymentMethod | null) => void;
  onAddNewMethod?: () => void;
  showAddButton?: boolean;
  allowRemoval?: boolean;
  compact?: boolean;
}

export default function PaymentMethodSelector({
  onMethodSelected,
  onAddNewMethod,
  showAddButton = true,
  allowRemoval = true,
  compact = false
}: PaymentMethodSelectorProps) {
  const { user } = useAuth();
  const { selectedPaymentMethod, setSelectedPaymentMethod, useNewPaymentMethod, setUseNewPaymentMethod } = usePayment();
  
  const {
    paymentMethods,
    defaultPaymentMethod,
    isLoading,
    error,
    loadPaymentMethods,
    removePaymentMethod,
    setDefaultPaymentMethod
  } = usePaymentMethods(user?._id || '');

  const [removingMethodId, setRemovingMethodId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPaymentMethod && !selectedPaymentMethod && !useNewPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod);
      onMethodSelected?.(defaultPaymentMethod);
    }
  }, [defaultPaymentMethod, selectedPaymentMethod, useNewPaymentMethod]);

  const handleMethodSelect = (method: SavedPaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    setUseNewPaymentMethod(method === null);
    onMethodSelected?.(method);
  };

  const handleRemoveMethod = async (methodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingMethodId(methodId);
            
            try {
              const result = await removePaymentMethod(methodId);
              
              if (result.success) {
                // If we removed the selected method, reset selection
                if (selectedPaymentMethod?.id === methodId) {
                  setSelectedPaymentMethod(null);
                  setUseNewPaymentMethod(true);
                  onMethodSelected?.(null);
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to remove payment method');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method');
            } finally {
              setRemovingMethodId(null);
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (methodId: string) => {
    setSettingDefaultId(methodId);
    
    try {
      const result = await setDefaultPaymentMethod(methodId);
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to set default payment method');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const renderPaymentMethodIcon = (method: SavedPaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard width={20} height={20} color="#430B92" />;
    } else {
      return <Building2 width={20} height={20} color="#430B92" />;
    }
  };

  const renderPaymentMethod = (method: SavedPaymentMethod) => {
    const isSelected = selectedPaymentMethod?.id === method.id;
    const isRemoving = removingMethodId === method.id;
    const isSettingDefault = settingDefaultId === method.id;
    
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.methodCard,
          isSelected && styles.selectedMethodCard,
          compact && styles.compactMethodCard
        ]}
        onPress={() => handleMethodSelect(method)}
        disabled={isRemoving || isSettingDefault}
      >
        <View style={styles.methodHeader}>
          <View style={styles.methodInfo}>
            {renderPaymentMethodIcon(method)}
            <View style={styles.methodDetails}>
              <Text style={[styles.methodName, compact && styles.compactText]}>
                {PaymentMethodsService.formatPaymentMethodDisplay(method)}
              </Text>
              {method.type === 'card' && !compact && (
                <Text style={styles.methodExpiry}>
                  Expires {PaymentMethodsService.getCardExpiryDisplay(method)}
                </Text>
              )}
              {method.billing_details?.name && !compact && (
                <Text style={styles.methodHolder}>
                  {method.billing_details.name}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.methodActions}>
            {method.is_default && (
              <View style={styles.defaultBadge}>
                <Star width={12} height={12} color="#FFC107" fill="#FFC107" />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
            
            {isSelected && (
              <View style={styles.selectedIcon}>
                <Check width={20} height={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        {!compact && (
          <View style={styles.methodFooter}>
            <View style={styles.methodSecondaryActions}>
              {!method.is_default && (
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleSetDefault(method.id)}
                  disabled={isSettingDefault}
                >
                  {isSettingDefault ? (
                    <ActivityIndicator size="small" color="#430B92" />
                  ) : (
                    <>
                      <Star width={14} height={14} color="#430B92" />
                      <Text style={styles.secondaryActionText}>Set Default</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {allowRemoval && (
                <TouchableOpacity
                  style={[styles.secondaryAction, styles.removeAction]}
                  onPress={() => handleRemoveMethod(method.id)}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color="#ED0006" />
                  ) : (
                    <>
                      <Trash2 width={14} height={14} color="#ED0006" />
                      <Text style={[styles.secondaryActionText, styles.removeActionText]}>
                        Remove
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && paymentMethods.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading saved payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <Text style={styles.sectionTitle}>Payment Method</Text>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle width={16} height={16} color="#ED0006" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadPaymentMethods(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.methodsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Add New Payment Method Option */}
        {showAddButton && (
          <TouchableOpacity
            style={[
              styles.methodCard,
              styles.addMethodCard,
              useNewPaymentMethod && styles.selectedMethodCard,
              compact && styles.compactMethodCard
            ]}
            onPress={() => {
              handleMethodSelect(null);
              onAddNewMethod?.();
            }}
          >
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Plus width={20} height={20} color="#430B92" />
                <Text style={[styles.methodName, styles.addMethodText, compact && styles.compactText]}>
                  Add new payment method
                </Text>
              </View>
              
              {useNewPaymentMethod && (
                <View style={styles.selectedIcon}>
                  <Check width={20} height={20} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Saved Payment Methods */}
        {paymentMethods.map(renderPaymentMethod)}

        {paymentMethods.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <CreditCard width={48} height={48} color="#6C6C6C" />
            <Text style={styles.emptyStateTitle}>No saved payment methods</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add a payment method to make future payments faster
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactContainer: {
    flex: 0,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6C6C6C',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#ED0006',
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ED0006',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  methodsList: {
    flex: 1,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D0FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  compactMethodCard: {
    padding: 12,
    marginBottom: 8,
  },
  selectedMethodCard: {
    borderColor: '#430B92',
    backgroundColor: '#FCFAFF',
  },
  addMethodCard: {
    borderStyle: 'dashed',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
  },
  compactText: {
    fontSize: 14,
  },
  addMethodText: {
    color: '#430B92',
  },
  methodExpiry: {
    fontSize: 14,
    color: '#6C6C6C',
    marginTop: 2,
  },
  methodHolder: {
    fontSize: 14,
    color: '#6C6C6C',
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '500',
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#430B92',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  methodSecondaryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  removeAction: {
    marginLeft: 'auto',
  },
  secondaryActionText: {
    fontSize: 14,
    color: '#430B92',
    fontWeight: '500',
  },
  removeActionText: {
    color: '#ED0006',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6C6C6C',
    textAlign: 'center',
    lineHeight: 20,
  },
});