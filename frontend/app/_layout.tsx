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
import messaging from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showNotification } from "@/NotificationController";
import { Platform } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

async function requestUserPermission() {
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
  if (Platform.OS === "ios") {
    const apnsToken = await messaging().getAPNSToken();
    console.log("🚀 APNs Token:", apnsToken);

    const fcmToken = await messaging().getToken();
    console.log("🚀 FCM Token:", fcmToken);
    await AsyncStorage.setItem("fcmToken", fcmToken);
  }
}

if (Platform.OS !== "web") {
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

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{ headerShown: false }}
            initialRouteName="(tabs)"
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
      <Toast position="top" />
    </QueryClientProvider>
  );
}