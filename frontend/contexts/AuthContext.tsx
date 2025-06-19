import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showErrorToast } from '@/utils/errorHandler';

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  userType?: 'creator' | 'marketer';
  profilePicture?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for demo mode auto-login
      if (process.env.EXPO_PUBLIC_DEMO_MODE === 'true' && process.env.EXPO_PUBLIC_AUTO_LOGIN === 'true') {
        const demoUser = process.env.EXPO_PUBLIC_AUTO_LOGIN_USER || 'marketer';
        const demoUserData: User = {
          id: 'demo-marketer-001',
          email: 'sarah@techstyle.com',
          name: 'Sarah Martinez',
          userType: 'marketer',
          isEmailVerified: true,
        };
        setToken('demo-token');
        setUser(demoUserData);
        setIsLoading(false);
        return;
      }

      const storedToken = await AsyncStorage.getItem('axees_token');
      const storedUser = await AsyncStorage.getItem('axees_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      showErrorToast(error, 'Failed to restore authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem('axees_token', authToken);
      await AsyncStorage.setItem('axees_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
      showErrorToast(error, 'Failed to save authentication data');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('axees_token');
      await AsyncStorage.removeItem('axees_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      showErrorToast(error, 'Failed to logout completely');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await AsyncStorage.setItem('axees_user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error updating user data:', error);
        showErrorToast(error, 'Failed to update user profile');
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;