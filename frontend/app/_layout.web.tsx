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
import React, { useEffect, useState } from "react";
import { Slot, SplashScreen, router, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast, { BaseToast } from "react-native-toast-message";
import { injectWebCss } from "@/injectCss";
import { messaging } from "@/firebase-web";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";
import { getToken, onMessage } from "firebase/messaging";
import { AuthProvider } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo.svg";
import WebSplashScreen from "@/components/WebSplashScreen";
import Head from "expo-router/head";
import { PaymentProvider } from "@/contexts/PaymentContext";
import StripePaymentModal from "@/components/StripePaymentModal";
import PaymentAlert from "@/components/PaymentAlert";
import CustomBackButton from "@/components/CustomBackButton";
import ProfileInfo from "@/components/ProfileInfo";
import Header from "@/components/Header";
import { UnreadMessagesProvider } from "@/hooks/messagesContext";
import { useNotifications } from "@/hooks/useNotifications";
let messagingResolved: any;

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
  const [fontsLoaded, fontsError] = useFonts({
    interLight: require("../assets/fonts/Inter-Light.ttf"),
    interRegular: require("../assets/fonts/Inter-Regular.ttf"),
    interMedium: require("../assets/fonts/Inter-Medium.ttf"),
    interSemiBold: require("../assets/fonts/Inter-SemiBold.ttf"),
    interBold: require("../assets/fonts/Inter-Bold.ttf"),
    degularDemoSemibold: require("../assets/fonts/DegularDemo-Semibold.otf"),
    clashDisplaySemibold: require("../assets/fonts/ClashDisplay-Semibold.otf"),
    sFProDisplaySemibold: require("../assets/fonts/SFProDisplay-Semibold.ttf"),
    degularMedium: require("../assets/fonts/Degular-Medium.otf"),
    degularSemiBold: require("../assets/fonts/Degular-Semibold.otf"),
    degular: require("../assets/fonts/Degular-Regular.otf"),
    sFPro: require("../assets/fonts/SFPRODISPLAYREGULAR.otf"),
    rOGLyonsType: require("../assets/fonts/ROGLyonsTypeRegular3.ttf"),
  });

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

    
      Notification.permission === "granted"
    
  }, []);


  useEffect(() => {
    if (notifError) {
      console.warn("[Notifications] ", notifError);
    }
  }, [notifError]);


  // Ask for notification permission as soon as the splash disappears
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      // Trigger only if the user hasn't decided yet
      if (permissionStatus === null) {
        requestNotificationPermission();
      }
    }, 3000);
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
      const messagingInstance = await messaging();

      if (!messagingInstance) return;
      unsubscribe = onMessage(messagingInstance, (payload) => {
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
          });
      });
    };

    handleForegroundMessage();
    injectWebCss();
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <WebSplashScreen />;
  }

  if (!fontsLoaded || fontsError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Axees</title>
      </Head>
      <AuthProvider>
      <UnreadMessagesProvider>
        <PaymentProvider>
          {/* <View style={styles.container}>
            <View style={styles.content}> */}
          <Slot />
          {/* </View>
          </View> */}
          <StripePaymentModal />
        </PaymentProvider>
        </UnreadMessagesProvider>
      </AuthProvider>

      <Toast config={toastConfig} position="top" />
      {/* <NotificationPermissionModal
        visible={showNotificationModal}
        onAllow={handleAllowNotifications}
        onDeny={handleDenyNotifications}
      /> */}
    </QueryClientProvider>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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