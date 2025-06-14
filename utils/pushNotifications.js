const { admin } = require("../services/firebaseService");

const sendPushNotification = async (deviceToken, title, body, data) => {
  // Validate device token first
  if (!deviceToken || typeof deviceToken !== 'string') {
    console.error('Invalid device token:', deviceToken);
    return null;
  }

  // Define the message payload
  const message = {
    notification: {
      title,
      body,
    },
    token: deviceToken,
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  if (data) {
    message.data = data;
  }

  try {
    // Remove setTimeout - it's not needed and can cause issues
    const response = await admin.messaging().send(message);
    console.log("Successfully sent push notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    
    // Handle specific error cases
    if (error.errorInfo && error.errorInfo.code === "messaging/registration-token-not-registered") {
      console.log("Invalid device token:", deviceToken);
      // Here you might want to call a function to remove the token from your database
    } else if (error.errorInfo && error.errorInfo.code === "messaging/invalid-argument") {
      console.log("Invalid message payload:", error.errorInfo.message);
    } else if (error.errorInfo && error.errorInfo.code === "messaging/internal-error") {
      console.log("Internal Firebase error occurred");
    }
    
    return null;
  }
};

module.exports = {
  sendPushNotification,
};