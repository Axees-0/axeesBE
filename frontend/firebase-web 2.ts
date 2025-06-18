import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const messaging = async () =>
  (await isSupported()) ? getMessaging(app) : null;
