import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router, usePathname, Redirect, useRouter } from 'expo-router';
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
  '/deals', // May contain user-specific deal data
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

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/privacy-policy',
  // Authentication routes
  '/UAM001Login',
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
  '/UAM04ChangePassword',
  '/VerifyEmailScreen',
];

export function AuthGuard({ children, requireAuth, redirectTo = '/UAM001Login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const routerHook = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Determine if current route requires authentication
  const needsAuth = requireAuth !== undefined 
    ? requireAuth 
    : PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Check if router is ready for navigation
  useEffect(() => {
    const checkRouterReady = () => {
      try {
        // Test if router can access current state
        if (pathname && typeof pathname === 'string') {
          setIsRouterReady(true);
        }
      } catch (error) {
        console.log('Router not ready yet:', error);
        // Retry after a short delay
        setTimeout(checkRouterReady, 50);
      }
    };
    
    checkRouterReady();
  }, [pathname]);

  useEffect(() => {
    // Don't redirect while still loading auth state or router not ready
    if (isLoading || !isRouterReady) return;

    // If route needs auth but user is not authenticated, set redirect
    if (needsAuth && !isAuthenticated) {
      console.log(`🔒 AuthGuard: Preparing redirect from ${pathname} to ${redirectTo} (not authenticated)`);
      setShouldRedirect(redirectTo);
      return;
    }

    // If user is authenticated and trying to access auth pages, redirect to home
    if (isAuthenticated && pathname.includes('/(Registeration)/')) {
      console.log(`🏠 AuthGuard: Preparing redirect from ${pathname} to / (authenticated user)`);
      setShouldRedirect('/');
      return;
    }

    // Clear any pending redirects if conditions are met
    setShouldRedirect(null);
  }, [isAuthenticated, isLoading, pathname, needsAuth, redirectTo, isRouterReady]);

  // Handle programmatic navigation with better error handling
  useEffect(() => {
    if (shouldRedirect && isRouterReady && !isLoading) {
      const performRedirect = () => {
        try {
          console.log(`🔄 AuthGuard: Executing redirect to ${shouldRedirect}`);
          routerHook.replace(shouldRedirect);
          setShouldRedirect(null);
        } catch (error) {
          console.log('Router hook failed, using fallback method:', error);
          
          // Fallback: try using global router with additional delay
          setTimeout(() => {
            try {
              router.replace(shouldRedirect);
              setShouldRedirect(null);
            } catch (fallbackError) {
              console.error('All navigation methods failed:', fallbackError);
              // As last resort, use declarative redirect
              setShouldRedirect(shouldRedirect);
            }
          }, 200);
        }
      };

      // Ensure navigation happens after all renders are complete
      const timeoutId = setTimeout(performRedirect, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldRedirect, isRouterReady, isLoading, routerHook]);

  // Show loading while checking auth state or router readiness
  if (isLoading || !isRouterReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>
          {isLoading ? 'Checking authentication...' : 'Initializing navigation...'}
        </Text>
      </View>
    );
  }

  // Use declarative redirect if programmatic navigation failed
  if (shouldRedirect) {
    console.log(`📍 AuthGuard: Using declarative redirect to ${shouldRedirect}`);
    return <Redirect href={shouldRedirect} />;
  }

  // If route needs auth but user is not authenticated, show redirecting state
  if (needsAuth && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
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