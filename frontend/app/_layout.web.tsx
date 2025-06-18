import React, { useEffect, useState, Suspense, lazy } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Head from "expo-router/head";
import { initSentry, withSentry } from "../sentry.config";
import { getMetrics } from "@/utils/metrics";

// Critical imports only
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import AuthGuard from "@/components/AuthGuard";

// Initialize Sentry and Metrics
initSentry();
if (typeof window !== 'undefined') {
  getMetrics(); // Initialize metrics collection
}

// Defer all non-critical imports
const Toast = lazy(() => import("react-native-toast-message"));
const ConnectionStatus = lazy(() => import("@/components/ConnectionStatus"));
const NavigationDebugger = lazy(() => import("@/components/NavigationDebugger"));
const MetricsDashboard = lazy(() => import("@/components/MetricsDashboard"));

// Minimal loading component
const LoadingApp = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color="#430B92" />
  </View>
);

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function RootLayoutWebOptimized() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Minimal initialization
    const init = async () => {
      try {
        // Critical CSS only
        if (typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.innerHTML = `
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
            * { box-sizing: border-box; }
          `;
          document.head.appendChild(style);
        }
        
        // Hide splash after minimal setup
        await SplashScreen.hideAsync();
        setIsReady(true);
        
        // Defer non-critical imports
        setTimeout(() => {
          import("@/injectCss").then(m => m.injectWebCss());
          import("@/hooks/useNotifications");
        }, 1000);
        
      } catch (error) {
        console.error('Init error:', error);
        setIsReady(true);
      }
    };
    
    init();
  }, []);

  if (!isReady) {
    return <LoadingApp />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Axees</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <AuthProvider>
          <PaymentProvider>
            <AuthGuard>
              <Stack
                screenOptions={{ 
                  headerShown: false,
                  animation: 'none' // Disable animations for faster transitions
                }}
                initialRouteName="(tabs)"
              >
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AuthGuard>
          </PaymentProvider>
        </AuthProvider>
        
        <Suspense fallback={null}>
          <ConnectionStatus />
          <Toast />
          {__DEV__ && (
            <>
              <NavigationDebugger />
              <MetricsDashboard />
            </>
          )}
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default withSentry(RootLayoutWebOptimized);