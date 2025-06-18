// useNotifications.js
import { useState, useCallback } from "react";
import { getToken } from "firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { messaging } from "@/firebase-web";

/**
 * Custom hook to handle browser notification permissions and Firebase token registration.
 */
export function useNotifications() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>(null);

  /**
   * Request notification permission, then register service worker
   * and retrieve Firebase token if granted.
   */
  const requestNotificationPermission = useCallback(() => {
    // Modern browser promise-based API

    if (Notification.permission === "granted") {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", {
          scope: "/",
        })
        .then((registration) =>
          messaging().then((messagingInstance) =>
            getToken(messagingInstance, {
              vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY,
              serviceWorkerRegistration: registration,
            })
          )
        )
        .then((token) => {
          setDeviceToken(token);
          return AsyncStorage.setItem("deviceToken", token);
        })
        .catch((error) => {
          console.log("error", error);
        });
      return;
    }

    if (
      typeof Notification.requestPermission === "function" &&
      Notification.requestPermission.length === 0
    ) {
      Notification.requestPermission()
        .then((permission) => {
          setPermissionStatus(permission);
          if (permission === "granted") {
            return navigator.serviceWorker.register(
              "/firebase-messaging-sw.js",
              {
                scope: "/",
              }
            );
          }
          return Promise.reject("Permission denied");
        })
        .then((registration) =>
          messaging().then((messagingInstance) =>
            getToken(messagingInstance, {
              vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY,
              serviceWorkerRegistration: registration,
            })
          )
        )
        .then((token) => {
          setDeviceToken(token);
          return AsyncStorage.setItem("deviceToken", token);
        })
        .catch((error) => {
          console.log("error", error);
          if (error instanceof TypeError) {
            // Safari fallback
            Notification.requestPermission((permission) => {
              setPermissionStatus(permission);
              if (permission === "granted") {
                navigator.serviceWorker
                  .register("/firebase-messaging-sw.js", {
                    scope: "/",
                  })
                  .then((registration) =>
                    messaging().then((messagingInstance) =>
                      getToken(messagingInstance, {
                        vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY,
                        serviceWorkerRegistration: registration,
                      })
                    )
                  )
                  .then((token) => {
                    setDeviceToken(token);
                    return AsyncStorage.setItem("deviceToken", token);
                  })
                  .catch(setError);
              }
            });
          } else {
            setError(error instanceof Error ? error : new Error(String(error)));
          }
        });
    } else {
      // Legacy browsers (Safari)
      Notification.requestPermission((permission) => {
        setPermissionStatus(permission);

        if (permission === "granted") {
          navigator.serviceWorker
            .register("/firebase-messaging-sw.js", {
              scope: "/",
            })
            .then((registration) =>
              messaging().then((messagingInstance) =>
                getToken(messagingInstance, {
                  vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY,
                  serviceWorkerRegistration: registration,
                })
              )
            )
            .then((token) => {
              setDeviceToken(token);
              return AsyncStorage.setItem("deviceToken", token);
            })
            .catch(setError);
        }
      });
    }
  }, []);

  return {
    deviceToken, // the FCM device token if granted
    error, // any errors during permission or SW registration
    requestNotificationPermission, // function to initiate the permission request
    permissionStatus, // the permission status of the notification
  };
}
