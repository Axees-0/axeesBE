import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { Stack, Slot, SplashScreen, router, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast, { BaseToast } from "react-native-toast-message";
import { injectWebCss } from "@/injectCss";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo.svg";
import WebSplashScreen from "@/components/WebSplashScreen";
import Head from "expo-router/head";
import { PaymentProvider } from "@/contexts/PaymentContext";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ConnectionStatus";

// Lazy load heavy components
const NotificationPermissionModal = lazy(() => import("@/components/NotificationPermissionModal").then(m => ({ default: m.NotificationPermissionModal })));
const StripePaymentModal = lazy(() => import("@/components/StripePaymentModal"));
const PaymentAlert = lazy(() => import("@/components/PaymentAlert"));
const CustomBackButton = lazy(() => import("@/components/CustomBackButton"));
const ProfileInfo = lazy(() => import("@/components/ProfileInfo"));
const Header = lazy(() => import("@/components/Header"));

// Defer firebase messaging initialization
let messagingPromise: Promise<any> | null = null;
const getMessaging = async () => {
  if (!messagingPromise) {
    messagingPromise = import("@/firebase-web").then(m => m.messaging);
  }
  return messagingPromise;
};
// UnreadMessagesProvider doesn't exist, removing import
import { useNotifications } from "@/hooks/useNotifications";

const BREAKPOINTS = {
  MOBILE: 550,
  TABLET: 768,
  DESKTOP: 1280,
};

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#430b92" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
      }}
    />
  ),

  customNotification: ({
    text1,
    text2,
    onPress,
  }: {
    text1: string;
    text2: string;
    onPress: () => void;
  }) => (
    <Pressable style={[styles.customToastContainer]} onPress={onPress}>
      <View style={styles.toastContent}>
        <Image
          source={require("@/assets/icon-2.png")}
          style={styles.bellIcon}
        />
        <View style={{ width: "90%" }}>
          <Text style={styles.customToastTitle}>{text1}</Text>
          <Text style={styles.customToastMessage}>{text2}</Text>
        </View>
      </View>
    </Pressable>
  ),
};

export default function RootLayoutWeb() {
  // Load only critical fonts initially
  const [fontsLoaded, fontsError] = useFonts({
    interRegular: require("../assets/fonts/Inter-Regular.ttf"),
    interMedium: require("../assets/fonts/Inter-Medium.ttf"),
    interSemiBold: require("../assets/fonts/Inter-SemiBold.ttf"),
  });
  
  // Load additional fonts asynchronously
  useEffect(() => {
    if (fontsLoaded) {
      // Lazy load non-critical fonts
      import("expo-font").then(({ loadAsync }) => {
        loadAsync({
          interLight: require("../assets/fonts/Inter-Light.ttf"),
          interBold: require("../assets/fonts/Inter-Bold.ttf"),
          degularDemoSemibold: require("../assets/fonts/DegularDemo-Semibold.otf"),
          clashDisplaySemibold: require("../assets/fonts/ClashDisplay-Semibold.otf"),
          sFProDisplaySemibold: require("../assets/fonts/SFProDisplay-Semibold.ttf"),
          degularMedium: require("../assets/fonts/Degular-Medium.otf"),
          degularSemiBold: require("../assets/fonts/Degular-Semibold.otf"),
          degular: require("../assets/fonts/Degular-Regular.otf"),
          sFPro: require("../assets/fonts/SFPRODISPLAYREGULAR.otf"),
          rOGLyonsType: require("../assets/fonts/ROGLyonsTypeRegular3.ttf"),
        }).catch(err => console.log("Non-critical fonts failed to load:", err));
      });
    }
  }, [fontsLoaded]);

  /* ──────────────────────────────────────────────────────────
+   *  Web-push permission + FCM token
+   * ────────────────────────────────────────────────────────── */
  const {
    permissionStatus,
    requestNotificationPermission,
    deviceToken,
    error: notifError,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(true);

  const windowSize = useWindowDimensions();
  const pathname = usePathname();
  const isWeb = Platform.OS === "web";
  const isWideScreen = windowSize.width >= BREAKPOINTS.TABLET;
  const isMobile = windowSize.width < BREAKPOINTS.TABLET;

  


  // Trigger the native permission prompt after the first click / tap
  useEffect(() => {
    if (permissionStatus !== 'default') return; // already answered

    const ask = () => {
      requestNotificationPermission();
      window.removeEventListener('click', ask);
    };

    window.addEventListener('click', ask, { once: true });
    return () => window.removeEventListener('click', ask);
  }, [permissionStatus, requestNotificationPermission]);

  useEffect(() => {
    if (deviceToken) console.info('[FCM] web-push token:', deviceToken);
    if (notifError)  console.error('[FCM] permission / SW error:', notifError);
  }, [deviceToken, notifError]);

  // ADD THE NEW SERVICE WORKER LISTENER HERE
  useEffect(() => {
    // Listen to service worker messages sent via postMessage()
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const messageHandler = (event: any) => {
        if (!event.data || !event.data.action) {
          return;
        }

        switch (event.data.action) {
          case "redirect-from-notificationclick":
            try {
              const url = new URL(event.data.url || event.data.link);
              const searchParams = Object.fromEntries(url.searchParams);

              // Ensure we have the required params
              if (url.pathname && searchParams) {
                router.push({
                  pathname: url.pathname as any,
                  params: searchParams,
                });
              }
            } catch (error) {
              console.error("Error parsing notification URL:", error);
            }
            break;
          default:
            break;
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);

      // Cleanup
      return () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      };
    }
  }, []);


  useEffect(() => {
    if (notifError) {
      console.warn("[Notifications] ", notifError);
    }
  }, [notifError]);


  // Initialize router and hide splash screen quickly for proper navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      SplashScreen.hideAsync();
      // Trigger only if the user hasn't decided yet
      if (permissionStatus === null) {
        try {
          requestNotificationPermission();
        } catch (error) {
          console.error("Notification permission request failed:", error);
        }
      }
    }, 500); // Reduced from 3000ms to 500ms for faster router initialization
    
    return () => clearTimeout(timer);
  }, [permissionStatus, requestNotificationPermission]);

  // 1) Listen for focus events -> parse "?targetScreen=..." from the URL
  useEffect(() => {
    const handleFocus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetScreen = urlParams.get("targetScreen");
      const userId = urlParams.get("userId");
      const type = urlParams.get("type");

      // If we have these, navigate
      if (targetScreen) {
        router.push({
          pathname: `/${targetScreen}` as any,
          params: { userId, type },
        });

        // Clear the query from the URL so it doesn't re-fire
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  useEffect(() => {
    let unsubscribe: any;
    const handleForegroundMessage = async () => {
      try {
        // Dynamically import firebase messaging
        const { onMessage } = await import("firebase/messaging");
        const messagingInstance = await getMessaging();
        const resolvedMessaging = await messagingInstance();

        if (!resolvedMessaging) return;
        unsubscribe = onMessage(resolvedMessaging, (payload) => {
          // Show system notification even in foreground
          navigator.serviceWorker
            .getRegistration("/firebase-cloud-messaging-push-scope")
            .then((registration) => {
              if (registration?.active) {
                const { title, ...options } = payload.notification || {};

                registration.showNotification(title || "New Notification", {
                  ...options,
                  icon: "/icon.png",
                  badge: "/icon.png",
                  data: payload.data,
                });
              }
            })
            .catch((error) => {
              console.error("Service worker notification error:", error);
            });
        });
      } catch (error) {
        console.error("Messaging setup failed:", error);
      }
    };

    // Delay firebase initialization to after critical rendering
    setTimeout(() => {
      handleForegroundMessage();
    }, 2000);
    
    injectWebCss();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Initialize app as soon as fonts are loaded
  useEffect(() => {
    if (fontsLoaded && !fontsError) {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (isLoading) {
    return <WebSplashScreen />;
  }

  if (!fontsLoaded || fontsError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Axees</title>
        </Head>
        <AuthProvider>
          <PaymentProvider>
            <AuthGuard>
              <Stack
                screenOptions={{ headerShown: false }}
                initialRouteName="(tabs)"
              >
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AuthGuard>
            <Suspense fallback={null}>
              <StripePaymentModal />
            </Suspense>
          </PaymentProvider>
        </AuthProvider>

        <ConnectionStatus />
        <Toast config={toastConfig} position="top" />
        {/* <NotificationPermissionModal
          visible={showNotificationModal}
          onAllow={handleAllowNotifications}
          onDeny={handleDenyNotifications}
        /> */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: "5%",
    marginTop: "2%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 550,
    marginHorizontal: "5%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  header: {
    padding: 16,
    maxWidth: 1280,
    marginHorizontal: "5%",
    width: "100%",
  },
  customToastContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.85)", // Darker opaque background
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "95%",
    boxShadow: "0px 3px 4px rgba(0, 0, 0, 0.3)",
    elevation: 5,
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: 10,
    marginTop: Dimensions.get("window").width > 420 ? 0 : -20,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customToastTitle: {
    fontWeight: "bold",
    fontSize: Dimensions.get("window").width > 420 ? 18 : 12,
    color: "white",
  },
  customToastMessage: {
    fontSize: Dimensions.get("window").width > 420 ? 14 : 10,
    color: "white",
  },
  bellIcon: {
    width: 32,
    height: 32,
  },
});