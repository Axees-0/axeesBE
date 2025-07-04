import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, SplashScreen, Slot, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast, { BaseToast } from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Only import native modules on non-web platforms
let messaging: any = null;
let notifee: any = null;
let EventType: any = null;
let showNotification: any = null;

if (Platform.OS !== "web") {
  messaging = require("@react-native-firebase/messaging").default;
  const notifeeModule = require("@notifee/react-native");
  notifee = notifeeModule.default;
  EventType = notifeeModule.EventType;
  showNotification = require("@/NotificationController").showNotification;
}
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DiscoveryFilterProvider } from "@/contexts/DiscoveryFilterContext";
import { useSegments } from "expo-router";
import { WebFeatures } from "./web-features";
import ErrorBoundary from "@/components/ErrorBoundary";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

async function requestUserPermission() {
  if (Platform.OS === "web" || !messaging) {
    console.log("🌐 Web platform: Skipping Firebase messaging setup");
    return;
  }
  
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("🔔 Firebase Messaging: Permission granted");
    await getToken();
  } else {
    console.log("❌ Firebase Messaging: Permission denied");
  }
}

async function getToken() {
  if (Platform.OS === "web" || !messaging) {
    return;
  }
  
  if (Platform.OS === "ios") {
    const apnsToken = await messaging().getAPNSToken();
    console.log("🚀 APNs Token:", apnsToken);

    const fcmToken = await messaging().getToken();
    console.log("🚀 FCM Token:", fcmToken);
    await AsyncStorage.setItem("fcmToken", fcmToken);
  }
}

if (Platform.OS !== "web" && messaging && showNotification) {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Get the stored navigation params if they exist
    const pendingParams = await AsyncStorage.getItem("pendingNavigationParams");
    const navigationParams = pendingParams ? JSON.parse(pendingParams) : {};

    if (remoteMessage?.data?.targetScreen) {
      router.push(remoteMessage.data.targetScreen, navigationParams);
    }

    await showNotification(remoteMessage);
  });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
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

  useEffect(() => {
    if (loaded || error) {
      requestUserPermission();
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (Platform.OS === "web" || !messaging || !showNotification) {
      return;
    }
    
    const unsubscribeMessaging = messaging().onMessage(
      async (remoteMessage: any) => {
        try {
          await showNotification(remoteMessage);
        } catch (error) {
          console.error("Error handling notification:", error);
        }
      }
    );

    return unsubscribeMessaging;
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !notifee || !EventType) {
      return;
    }
    
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log("User dismissed notification", detail.notification);
          break;
        case EventType.PRESS:
          console.log("User pressed notification", detail.notification);
          const token = await AsyncStorage.getItem("userToken");
          console.log("Token:", token);
          if (detail?.notification?.data?.targetScreen) {
            const { targetScreen, ...navigationParams } =
              detail?.notification?.data;

            console.log("Pushing to:", targetScreen);

            router.push(targetScreen, {
              ...navigationParams,
              token,
            });
          }

          break;
      }
    });
  }, []);

  console.log('🌟 _layout.tsx: loaded =', loaded, 'error =', error);
  
  if (!loaded && !error) {
    console.log('🌟 _layout.tsx: Early return - fonts not loaded yet');
    return null;
  }

  console.log('🌟 _layout.tsx: About to render providers');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <DiscoveryFilterProvider>
              <WebFeatures>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="register-details" />
                  <Stack.Screen name="register-success" />
                  <Stack.Screen name="profile/[id]" />
                  <Stack.Screen name="offers" />
                  <Stack.Screen name="deals/[id]" />
                  <Stack.Screen name="deals/submit" />
                  <Stack.Screen name="deals/proof" />
                  <Stack.Screen name="chat/[id]" />
                  <Stack.Screen name="notifications/center" />
                  <Stack.Screen name="payments/marketer" />
                  <Stack.Screen name="offers/handle-counter" />
                  <Stack.Screen name="earnings" />
                </Stack>
                <StatusBar style="auto" />
              </WebFeatures>
            </DiscoveryFilterProvider>
          </ThemeProvider>
        </AuthProvider>
        <Toast position="top" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}