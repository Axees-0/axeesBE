import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DesignSystem from '@/styles/DesignSystem';
import { Color } from '@/GlobalStyles';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  brand?: string;
  size?: string;
  color?: string;
  creatorId?: string;
  creatorName?: string;
}

interface CartProps {
  isVisible: boolean;
  onClose: () => void;
  onCheckout?: (items: CartItem[], total: number) => void;
  position?: 'right' | 'bottom' | 'fullscreen';
}

const CART_STORAGE_KEY = '@axees_cart';

export const Cart: React.FC<CartProps> = ({
  isVisible,
  onClose,
  onCheckout,
  position = 'right',
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const slideAnim = new Animated.Value(position === 'right' ? 400 : 1000);
  const fadeAnim = new Animated.Value(0);

  // Load cart from storage
  useEffect(() => {
    loadCart();
  }, []);

  // Animate cart visibility
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: position === 'right' ? 400 : 1000,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading cart:', error);
      setIsLoading(false);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    const existingItemIndex = cartItems.findIndex(
      cartItem => cartItem.productId === item.productId && 
      cartItem.size === item.size && 
      cartItem.color === item.color
    );

    let updatedCart: CartItem[];
    if (existingItemIndex >= 0) {
      updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      updatedCart = [...cartItems, { ...item, quantity: 1 }];
    }

    setCartItems(updatedCart);
    await saveCart(updatedCart);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    setCartItems(updatedCart);
    await saveCart(updatedCart);
  };

  const removeFromCart = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedCart = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedCart);
            await saveCart(updatedCart);
          },
        },
      ]
    );
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setCartItems([]);
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08; // 8% tax rate
  };

  const handleCheckout = () => {
    const total = calculateTotal();
    if (onCheckout) {
      onCheckout(cartItems, total);
    } else {
      Alert.alert('Checkout', `Total: $${total.toFixed(2)}\n\nCheckout functionality coming soon!`);
    }
  };

  if (!isVisible) return null;

  const getContainerStyle = () => {
    switch (position) {
      case 'bottom':
        return [
          styles.bottomContainer,
          { transform: [{ translateY: slideAnim }] },
        ];
      case 'fullscreen':
        return [
          styles.fullscreenContainer,
          { opacity: fadeAnim },
        ];
      default:
        return [
          styles.rightContainer,
          { transform: [{ translateX: slideAnim }] },
        ];
    }
  };

  const subtotal = calculateTotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: fadeAnim },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Cart Container */}
      <Animated.View style={getContainerStyle()}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="shopping-cart" size={24} color={Color.cSK430B92500} />
              <Text style={styles.title}>Shopping Cart ({cartItems.length})</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
          <ScrollView 
            style={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <MaterialIcons name="shopping-cart" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <Text style={styles.emptySubtext}>
                  Add items from creator content to get started
                </Text>
              </View>
            ) : (
              cartItems.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <Image 
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                  
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    {item.brand && (
                      <Text style={styles.itemBrand}>{item.brand}</Text>
                    )}
                    {(item.size || item.color) && (
                      <Text style={styles.itemVariant}>
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' • '}
                        {item.color && `Color: ${item.color}`}
                      </Text>
                    )}
                    {item.creatorName && (
                      <View style={styles.creatorTag}>
                        <Ionicons name="person-circle-outline" size={14} color="#666" />
                        <Text style={styles.creatorName}>{item.creatorName}</Text>
                      </View>
                    )}
                    
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <MaterialIcons name="remove" size={18} color="#666" />
                        </TouchableOpacity>
                        
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <MaterialIcons name="add" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearCart}
              >
                <Text style={styles.clearText}>Clear Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </>
  );
};

// Export utility functions for use in other components
export const useCart = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();
  }, []);

  const loadCartCount = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData) as CartItem[];
        setCartCount(items.reduce((count, item) => count + item.quantity, 0));
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let cartItems: CartItem[] = cartData ? JSON.parse(cartData) : [];
      
      const existingItemIndex = cartItems.findIndex(
        cartItem => cartItem.productId === item.productId && 
        cartItem.size === item.size && 
        cartItem.color === item.color
      );

      if (existingItemIndex >= 0) {
        cartItems[existingItemIndex].quantity += 1;
      } else {
        cartItems.push({ ...item, quantity: 1 });
      }

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      loadCartCount();
      
      Alert.alert('Added to Cart', `${item.name} has been added to your cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  return { cartCount, addToCart, refreshCart: loadCartCount };
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  backdropTouch: {
    flex: 1,
  },
  rightContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 380,
    zIndex: 1000,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    zIndex: 1000,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...DesignSystem.Typography.h3,
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...DesignSystem.Typography.h3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.AccessibleColors.borderLight,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...DesignSystem.Typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemBrand: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.AccessibleColors.textMuted,
    marginBottom: 2,
  },
  itemVariant: {
    ...DesignSystem.Typography.small,
    color: DesignSystem.AccessibleColors.textSecondary,
    marginBottom: 4,
  },
  creatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  creatorName: {
    ...DesignSystem.Typography.small,
    color: '#666',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    ...DesignSystem.Typography.h3,
    color: Color.cSK430B92500,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DesignSystem.AccessibleColors.backgroundSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    ...DesignSystem.Typography.bodyMedium,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.AccessibleColors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.AccessibleColors.textSecondary,
  },
  summaryValue: {
    ...DesignSystem.Typography.bodyMedium,
  },
  divider: {
    height: 1,
    backgroundColor: DesignSystem.AccessibleColors.borderLight,
    marginVertical: 12,
  },
  totalLabel: {
    ...DesignSystem.Typography.h3,
  },
  totalValue: {
    ...DesignSystem.Typography.h2,
    color: Color.cSK430B92500,
  },
  checkoutButton: {
    ...DesignSystem.ButtonStyles.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  checkoutText: {
    ...DesignSystem.ButtonTextStyles.primary,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearText: {
    ...DesignSystem.Typography.caption,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default Cart;