// cron/activationReminders.js

const cron = require("node-cron");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendPushNotification } = require("../utils/pushNotifications");

// Run every 15 minutes (*/15 * * * *)
cron.schedule("*/15 * * * *", async () => {
  try {
    const now = new Date();

    // Find users who are inactive but have a device token
    const users = await User.find({
      isActive: false,
      deviceToken: { $exists: true, $ne: null },
    });

    for (const user of users) {
      try {
        let currentStep = null;

        // Determine which single step is missing
        if (!user.name || user.name.trim() === "") {
          currentStep = "name";
        } else if (!user.userName || user.userName.trim() === "") {
          currentStep = "userName";
        } else if (!user.email || user.email.trim() === "") {
          currentStep = "email";
        } else if (!user.password || user.password.trim() === "") {
          currentStep = "password";
        }

        // If no steps missing, mark user active
        if (!currentStep) {
          user.isActive = true;
          await user.save();
          continue;
        }

        // Ensure reminderDeadlines object exists
        if (!user.reminderDeadlines) {
          user.reminderDeadlines = {};
        }

        // If no deadline for this step, set it now
        if (!user.reminderDeadlines[currentStep]) {
          if (currentStep === "email") {
            // 40-hour deadline for email
            user.reminderDeadlines.email = new Date(
              now.getTime() + 40 * 60 * 60 * 1000
            );
          } else {
            // 40-hour deadline for name, username, password
            user.reminderDeadlines[currentStep] = new Date(
              now.getTime() + 40 * 60 * 60 * 1000
            );
          }
          await user.save();
        }

        // If this is the final step ("password") and deadline has passed => mark inactive/locked
        if (
          currentStep === "password" &&
          now >= new Date(user.reminderDeadlines.password)
        ) {
          await sendPushNotification(
            user.deviceToken,
            "Account Inactive",
            "Your account has been locked due to not providing your password in time.",
            {
              userId: user._id.toString(),
              type: "account_inactive",
            }
          );
          console.log(`User ${user._id} marked inactive (password missing).`);
          // Optionally: user.isLocked = true; await user.save();
          continue;
        }

        // Check if there's a recent unread notification for this step (within last 15 mins)
        const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
        const existingNotification = await Notification.findOne({
          user: user._id,
          type: "missing_info",
          step: currentStep,
          unread: true,
          createdAt: { $gte: fifteenMinsAgo },
        }).lean();

        if (existingNotification) {
          console.log(
            `User ${user._id} already has a recent notification for step ${currentStep}, skipping.`
          );
          continue;
        }

        // Build message, targetScreen, etc. depending on currentStep
        let message, targetScreen, notifType;

        if (currentStep === "name") {
          message = "How will others call you?";
          targetScreen = "URM02Name";
          notifType = "name_step";
        } else if (currentStep === "userName") {
          message =
            "Enter your username to keep using your Axees account. Otherwise you lose access in 3 hours.";
          targetScreen = "URM03Username";
          notifType = "username_step";
        } else if (currentStep === "email") {
          message =
            "Enter your email to keep using your Axees account. Otherwise you lose access in 8 hours.";
          targetScreen = "URM05SetEmail";
          notifType = "email_step";
        } else if (currentStep === "password") {
          message =
            "Enter your password to keep using your Axees account. Otherwise you lose access in 3 hours.";
          targetScreen = "URM06SetPassword";
          notifType = "password_step";
        }

        // Send push notification with error handling
        try {
          await sendPushNotification(user.deviceToken, "Hurry Up!", message, {
            targetScreen,
            userId: user._id.toString(),
            type: notifType,
          });
          console.log(
            `Reminder sent for user ${user._id} step: ${currentStep}`
          );
        } catch (pushError) {
          // Handle invalid/expired device token
          if (
            pushError?.errorInfo?.code ===
            "messaging/registration-token-not-registered"
          ) {
            console.log(
              `Invalid device token for user ${user._id}, removing token`
            );
            user.deviceToken = null;
            await user.save();
          } else {
            console.error(
              `Push notification failed for user ${user._id}:`,
              pushError
            );
          }
        }

        // Create DB notification regardless of push success
        await Notification.create({
          user: user._id,
          type: "missing_info",
          step: currentStep,
          title: "Hurry Up!",
          subtitle: `Set your ${currentStep} to keep using your Axees. Otherwise you will lose access soon.`,
          unread: true,
        });
      } catch (userError) {
        console.error(`Error processing user ${user._id}:`, userError);
        // Continue with next user
        continue;
      }
    }
  } catch (error) {
    console.error("Activation reminder cron job failed:", error);
    // Job will run again in 15 minutes
  }
});


