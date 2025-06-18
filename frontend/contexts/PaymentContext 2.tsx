import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface PaymentContextType {
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  isProcessing: boolean;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (methodId: string) => void;
  selectPaymentMethod: (methodId: string) => void;
  processPayment: (amount: number) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods(prev => [...prev, method]);
  };

  const removePaymentMethod = (methodId: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
  };

  const selectPaymentMethod = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method) setSelectedMethod(method);
  };

  const processPayment = async (amount: number): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch {
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider value={{
      paymentMethods,
      selectedMethod,
      isProcessing,
      addPaymentMethod,
      removePaymentMethod,
      selectPaymentMethod,
      processPayment,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};