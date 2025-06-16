/**
 * services/firebaseService.js
 *
 * This service uses the Firebase Admin SDK to send push notifications to a given FCM token.
 *
 * Make sure to:
 * 1) yarn add firebase-admin
 * 2) Provide your Firebase credentials via .env or a .json file.
 */

const admin = require("firebase-admin");

// Initialize the app only once
if (!admin.apps.length) {
  try {
    // Option 1: Using service account JSON file
    const serviceAccount = require("../services/axees.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Optional: Add other configurations if needed
      // databaseURL: "https://your-project.firebaseio.com",
      // storageBucket: "your-project.appspot.com"
    });

    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    // Continue without firebase - tests don't need it
  }
}

module.exports = { admin };
