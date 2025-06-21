import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

// Define which routes require authentication
const PROTECTED_ROUTES = [
  '/messages',
  '/notifications', 
  '/profile',
  '/deals',
  // Payment routes
  '/UOEPM01PaymentHistoryCreator',
  '/UOEPM02WithdrawMoneyCreator', 
  '/UOEPM03TransactionDetailsCreator',
  '/UOEPM04AddNewMethodCreator',
  '/UOEPM05PaymentHistoryMarketer',
  // Offer management routes
  '/UOM02MarketerOfferDetail',
  '/UOM03MarketerPreviewAndPay',
  '/UOM04MarketerCustomOffer',
  '/UOM05MarketerOfferCounter',
  '/UOM06MarketerOfferCounterEdit',
  '/UOM07MarketerOfferHistoryList',
  '/UOM08MarketerDealHistoryList',
  '/UOM09MarketerDraftHistoryList',
  '/UOM10CreatorOfferDetails',
  '/UOM11CreatorOfferCounterEdit',
  '/UOM12CreatorDealDetails',
  '/UOM13CreatorUploadProof',
  '/UOM13CreatorDealHistoryList',
  // Settings routes
  '/UAM003NotificationSettings',
  '/UAM02EditCreatorProfile',
  '/UAM03Settings',
  '/UAM05InviteList',
];

// Authentication routes that should redirect to home if already logged in
const AUTH_ROUTES = [
  '/login',
  '/URM01CreateAccount',
  '/URM01Phone',
  '/URM02Name', 
  '/URM03Username',
  '/URM04Success',
  '/URM05SetEmail',
  '/URM06SetPassword',
  '/ULM02ForgotPassword',
  '/ULM3OTP',
  '/ULM4ResetPassword',
];

export function AuthGuard({ children, requireAuth, redirectTo = '/login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check if current route requires authentication
  const isProtectedRoute = requireAuth !== undefined 
    ? requireAuth 
    : PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return <Redirect href={redirectTo} />;
  }

  // Redirect authenticated users away from auth routes
  if (isAuthenticated && isAuthRoute) {
    return <Redirect href="/" />;
  }

  // Render children if auth requirements are met
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
});

export default AuthGuard;