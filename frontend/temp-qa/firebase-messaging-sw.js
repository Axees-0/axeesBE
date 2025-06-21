importScripts(
  "https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyBm4DWfoXvRGUo1zO9Vcrr7idT6OD-ONBM",

  authDomain: "axees-983ac.firebaseapp.com",

  projectId: "axees-983ac",

  storageBucket: "axees-983ac.firebasestorage.app",

  messagingSenderId: "476514630244",

  appId: "1:476514630244:web:efd9787b35f97f66c4bd71",

  measurementId: "G-2LJ7TDS090",
};

// Handle push events FIRST
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  const payload = event.data.json(); // Assuming the payload is sent as JSON
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    image: payload.notification.image,
    badge: payload.notification.badge,
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Then initialize Firebase for other browsers
const firebaseApp = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(firebaseApp);

// Ensure service worker is activated immediately
self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  // Force the waiting service worker to become active
  event.waitUntil(
    self.skipWaiting().catch((error) => {
      console.error("Error skipping waiting:", error);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  // Take control of all clients immediately
  event.waitUntil(
    self.clients.claim().catch((error) => {
      console.error("Error claiming clients:", error);
    })
  );
});

// Keep notificationclick handler at VERY TOP
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;
  if (!data) {
    console.warn("Notification click event has no data");
    return;
  }

  // Build query parameters from the data (excluding keys already used in the base URL)
  const urlParams = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== "link" && key !== "targetScreen") {
      urlParams.set(key, value);
    }
  });

  // Use the provided link if available, otherwise build the base URL using targetScreen
  const baseUrl =
    data.link || `${self.location.origin}/${data.targetScreen || ""}`;
  const urlToOpen = `${baseUrl}${
    urlParams.toString() ? `?${urlParams.toString()}` : ""
  }`;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an open tab and send a message to it before focusing
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({
              action: "redirect-from-notificationclick",
              url: urlToOpen,
            });
            client.focus();
            return;
          }
        }
        // If no matching tab is found, open a new one
        return clients.openWindow(urlToOpen).catch((error) => {
          console.error("Error opening window:", error);
        });
      })
      .catch((error) => {
        console.error("Error matching clients:", error);
      })
  );
});
