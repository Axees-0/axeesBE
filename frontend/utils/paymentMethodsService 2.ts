import React from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api/payments';

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
  };
  bank_account?: {
    bank_name?: string;
    last4: string;
    account_type: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  created: number;
  is_default?: boolean;
}

export interface PaymentMethodsResponse {
  success: boolean;
  paymentMethods: SavedPaymentMethod[];
  defaultPaymentMethod?: string;
}

// Payment Methods Service
export class PaymentMethodsService {
  private static instance: PaymentMethodsService;
  private cachedMethods: SavedPaymentMethod[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PaymentMethodsService {
    if (!PaymentMethodsService.instance) {
      PaymentMethodsService.instance = new PaymentMethodsService();
    }
    return PaymentMethodsService.instance;
  }

  // Fetch saved payment methods from backend
  async getPaymentMethods(userId: string, forceRefresh = false): Promise<SavedPaymentMethod[]> {
    const now = Date.now();
    
    // Return cached data if still fresh and not forcing refresh
    if (!forceRefresh && this.cachedMethods.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedMethods;
    }

    try {
      const response = await axios.get(`${API_URL}/methods`, {
        params: { userId }
      });

      if (response.data.success) {
        this.cachedMethods = response.data.paymentMethods || [];
        this.lastFetchTime = now;
        
        // Cache to local storage for offline access
        await this.cacheToStorage(userId, this.cachedMethods);
        
        return this.cachedMethods;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      
      // Try to load from cache if API fails
      return await this.loadFromStorage(userId);
    }
  }

  // Add a new payment method
  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<{
    success: boolean;
    paymentMethod?: SavedPaymentMethod;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${API_URL}/methods`, {
        userId,
        paymentMethodId
      });

      if (response.data.success) {
        // Refresh cache
        await this.getPaymentMethods(userId, true);
        
        return {
          success: true,
          paymentMethod: response.data.paymentMethod
        };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to add payment method'
      };
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add payment method'
      };
    }
  }

  // Remove a payment method
  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await axios.delete(`${API_URL}/methods/${paymentMethodId}`, {
        params: { userId }
      });

      if (response.data.success) {
        // Update cache
        this.cachedMethods = this.cachedMethods.filter(method => method.id !== paymentMethodId);
        await this.cacheToStorage(userId, this.cachedMethods);
        
        return { success: true };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to remove payment method'
      };
    } catch (error: any) {
      console.error('Failed to remove payment method:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove payment method'
      };
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${API_URL}/methods/${paymentMethodId}/set-default`, {
        userId
      });

      if (response.data.success) {
        // Update cache - mark new default and unmark others
        this.cachedMethods = this.cachedMethods.map(method => ({
          ...method,
          is_default: method.id === paymentMethodId
        }));
        
        await this.cacheToStorage(userId, this.cachedMethods);
        
        return { success: true };
      }

      return {
        success: false,
        error: response.data.error || 'Failed to set default payment method'
      };
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to set default payment method'
      };
    }
  }

  // Get default payment method
  getDefaultPaymentMethod(): SavedPaymentMethod | null {
    return this.cachedMethods.find(method => method.is_default) || null;
  }

  // Check if user has any saved payment methods
  hasSavedMethods(): boolean {
    return this.cachedMethods.length > 0;
  }

  // Cache payment methods to local storage
  private async cacheToStorage(userId: string, methods: SavedPaymentMethod[]): Promise<void> {
    try {
      const cacheData = {
        methods,
        timestamp: Date.now(),
        userId
      };
      
      await AsyncStorage.setItem(`paymentMethods_${userId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache payment methods:', error);
    }
  }

  // Load payment methods from local storage
  private async loadFromStorage(userId: string): Promise<SavedPaymentMethod[]> {
    try {
      const cached = await AsyncStorage.getItem(`paymentMethods_${userId}`);
      
      if (cached) {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Only use cached data if it's less than 24 hours old
        if (cacheData.userId === userId && (now - cacheData.timestamp) < 24 * 60 * 60 * 1000) {
          this.cachedMethods = cacheData.methods || [];
          return this.cachedMethods;
        }
      }
    } catch (error) {
      console.error('Failed to load cached payment methods:', error);
    }
    
    return [];
  }

  // Clear cache
  clearCache(): void {
    this.cachedMethods = [];
    this.lastFetchTime = 0;
  }

  // Format payment method for display
  static formatPaymentMethodDisplay(method: SavedPaymentMethod): string {
    if (method.type === 'card' && method.card) {
      return `${method.card.brand.toUpperCase()} •••• ${method.card.last4}`;
    } else if (method.type === 'bank_account' && method.bank_account) {
      return `${method.bank_account.bank_name || 'Bank'} •••• ${method.bank_account.last4}`;
    }
    return 'Payment Method';
  }

  // Get card expiry display
  static getCardExpiryDisplay(method: SavedPaymentMethod): string {
    if (method.type === 'card' && method.card) {
      return `${method.card.exp_month.toString().padStart(2, '0')}/${method.card.exp_year.toString().substr(-2)}`;
    }
    return '';
  }
}

// React hook for payment methods
export const usePaymentMethods = (userId: string) => {
  const [paymentMethods, setPaymentMethods] = React.useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const service = PaymentMethodsService.getInstance();

  const loadPaymentMethods = React.useCallback(async (forceRefresh = false) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const methods = await service.getPaymentMethods(userId, forceRefresh);
      setPaymentMethods(methods);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  }, [userId, service]);

  const addPaymentMethod = React.useCallback(async (paymentMethodId: string) => {
    if (!userId) return { success: false, error: 'User ID required' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.addPaymentMethod(userId, paymentMethodId);
      
      if (result.success) {
        await loadPaymentMethods(true); // Refresh the list
      } else {
        setError(result.error || 'Failed to add payment method');
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add payment method';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [userId, service, loadPaymentMethods]);

  const removePaymentMethod = React.useCallback(async (paymentMethodId: string) => {
    if (!userId) return { success: false, error: 'User ID required' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.removePaymentMethod(userId, paymentMethodId);
      
      if (result.success) {
        setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
      } else {
        setError(result.error || 'Failed to remove payment method');
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove payment method';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [userId, service]);

  const setDefaultPaymentMethod = React.useCallback(async (paymentMethodId: string) => {
    if (!userId) return { success: false, error: 'User ID required' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.setDefaultPaymentMethod(userId, paymentMethodId);
      
      if (result.success) {
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          is_default: method.id === paymentMethodId
        })));
      } else {
        setError(result.error || 'Failed to set default payment method');
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to set default payment method';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [userId, service]);

  // Load payment methods on mount
  React.useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const defaultPaymentMethod = React.useMemo(() => {
    return paymentMethods.find(method => method.is_default) || null;
  }, [paymentMethods]);

  return {
    paymentMethods,
    defaultPaymentMethod,
    isLoading,
    error,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    hasSavedMethods: paymentMethods.length > 0
  };
};