// controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
require("dotenv").config();
const {
  sendPushNotification: showNotifications,
} = require("../utils/pushNotifications"); // Import showNotifications
const { generateToken } = require("../utils/jwtUtils");
const TempRegistration = require("../models/TempRegistration");
const { formatPhoneNumber, findUserByPhone } = require("../utils/phoneUtils");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");

// Initialize the Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twiliophone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Helper to generate OTP
function generateOtp() {
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Changed to 1 hour
  console.log("code", code);
  return { code, expiresAt };
}

// Helper function for error handling - now using responseHelper
// This function is imported from responseHelper.js for consistency

/**
 * START REGISTRATION
 * POST /auth/register/start
 */
exports.startRegistration = async (req, res) => {
  try {
    console.log('startRegistration called with:', req.body);
    const { phone, userType } = req.body;
    if (!phone) {
      return errorResponse(res, "Please provide phone number", 400);
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const formattedPhone = formatPhoneNumber(phone);

    if (!phoneRegex.test(formattedPhone)) {
      return errorResponse(res, "Please enter a valid phone number in international format (e.g., +1234567890)", 400);
    }

    // Check for existing user in either format
    const existingUser = await findUserByPhone(User, phone);
    if (existingUser) {
      return errorResponse(res, "This phone number is already registered", 409);
    }

    // Check for existing temp registration in either format
    const existingTemp = await TempRegistration.findOne({
      $or: [{ phone: formattedPhone }, { phone: phone }],
    });

    if (existingTemp) {
      // Update existing temp registration
      const { code, expiresAt } = generateOtp();
      existingTemp.otpCode = code;
      existingTemp.otpExpiresAt = expiresAt;
      existingTemp.otpSentAt = new Date();
      existingTemp.userType = userType;
      await existingTemp.save();

      // Send new OTP
      await client.messages.create({
        body: `Your Axees verification code is ${code}. Valid for 1 hour.`,
        from: twiliophone,
        to: formattedPhone, // Use formatted phone for SMS
      });

      return successResponse(res, "OTP sent successfully. Please check your messages.", {
        otpSentAt: existingTemp.otpSentAt,
      }, 200);
    }

    // Create new temp registration
    const { code, expiresAt } = generateOtp();
    const tempRegistration = new TempRegistration({
      phone: formattedPhone, // Store formatted phone
      userType,
      otpCode: code,
      otpExpiresAt: expiresAt,
      otpSentAt: new Date(),
    });
    await tempRegistration.save();

    // Send Twilio SMS
    await client.messages.create({
      body: `Your Axees verification code is ${code}. Valid for 1 hour.`,
      from: twiliophone,
      to: formattedPhone, // Use formatted phone for SMS
    });

    console.log('About to send success response with tempRegistration.otpSentAt:', tempRegistration.otpSentAt);
    return successResponse(res, "OTP sent successfully. Please check your messages.", {
      otpSentAt: tempRegistration.otpSentAt,
    }, 200);
  } catch (err) {
    return handleServerError(res, err, "registration start");
  }
};

/**
 * VERIFY OTP AND CREATE ACCOUNT
 * POST /auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    console.log("Verify OTP request:", req.body);
    const { phone, code, deviceToken } = req.body;

    if (!phone || !code) {
      return errorResponse(res, "Phone number and verification code are required", 400, {
        received: { phone, code },
      });
    }

    // Format phone number
    const formattedPhone = phone.replace(/[\s-]/g, "");

    // First check TempRegistration for new users
    const tempRegistration = await TempRegistration.findOne({
      phone: formattedPhone,
    });

    if (tempRegistration) {
      // This is a new user registration verification
      if (tempRegistration.otpCode !== code) {
        return errorResponse(res, "Invalid verification code", 400);
      }

      if (Date.now() > tempRegistration.otpExpiresAt.getTime()) {
        return errorResponse(res, "Verification code has expired. Please request a new one", 400);
      }

      // Create new user
      const user = new User({
        phone: tempRegistration.phone,
        userType: tempRegistration.userType,
        deviceToken,
        isActive: false,
      });
      await user.save();

      // Cleanup temp registration
      await TempRegistration.deleteOne({ _id: tempRegistration._id });

      // Generate token
      const token = generateToken(user._id);

      // Send welcome notification
      if (deviceToken) {
        try {
          console.log("Sending welcome notification to:", deviceToken);
          await showNotifications(
            deviceToken,
            "Thank you and welcome to Axees!",
            "How will others see you? Setup your name to keep using your account smoothly. Otherwise you will lose access",
            {
              targetScreen: "URM02Name",
              userId: user._id.toString(),
              type: "welcome",
            }
          );
          console.log("Welcome notification sent successfully");
        } catch (notificationError) {
          console.error(
            "Failed to send welcome notification:",
            notificationError
          );
        }
      }

      return successResponse(res, "Account created successfully", {
        token,
        user: {
          _id: user._id,
          phone: user.phone,
          userType: user.userType,
          isActive: user.isActive,
        },
      }, 201);
    }

    // If not in TempRegistration, check existing users (for password reset etc.)
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "No pending registration found. Please start the registration process first", 404, {
        phone: formattedPhone,
      });
    }

    // Rest of the existing user verification logic...
    if (!user.otpCode) {
      return errorResponse(res, "No verification code found. Please request a new one", 400);
    }

    if (user.otpCode !== code) {
      return errorResponse(res, "Invalid verification code", 400);
    }

    if (user.otpExpiresAt < new Date()) {
      return errorResponse(res, "Verification code has expired. Please request a new one", 400);
    }

    // Update existing user
    if (deviceToken) {
      user.deviceToken = deviceToken;
    }
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user._id);

    return successResponse(res, "OTP verified successfully", {
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
      },
    }, 200);
  } catch (err) {
    console.error("Verify OTP error:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    return handleServerError(res, err, "OTP verification");
  }
};

/**
 * CHECK PHONE EXISTS
 * GET /auth/check-phone
 */
exports.checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return errorResponse(res, "Please provide a phone number", 400);
    }

    const user = await User.findOne({ phone });
    return res.json({
      exists: !!user,
      message: user
        ? "Phone number is already registered"
        : "Phone number is available",
    });
  } catch (err) {
    handleServerError(res, err, "phone check");
  }
};

/**
 * SET PROFILE
 * - userId plus Marketer/Creator fields
 * - for Marketer: brandName, name, ...
 * - for Creator: handleName, nicheTopics, ...
 * - also could set name/username
 */
exports.setProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return errorResponse(res, "userId required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Update user fields
    user.name = req.body.name || user.name;
    user.userName = req.body.userName || user.userName;

    if (user.userType === "Marketer") {
      user.brandName = req.body.brandName || user.brandName;
    } else {
      user.handleName = req.body.handleName || user.handleName;
      if (req.body.nicheTopics) {
        user.nicheTopics = req.body.nicheTopics;
      }
    }

    await user.save();

    // Send notification if device token exists
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Profile Updated",
          "Your profile has been successfully updated. One step closer to completion!",
          {
            targetScreen: "Profile",
            userId: user._id,
          }
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    // Generate new token with updated user data
    const token = generateToken(user._id);

    return successResponse(res, "Profile updated successfully", {
      token,
      user,
    }, 200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * SET PASSWORD
 * - final stage to fully activate user
 */
exports.setPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        message: "userId and password required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    user.password = hashedPassword;
    user.isActive = true; // Mark user as active once password is set

    // Clear any existing OTP
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    // Generate new token with updated user data
    const token = generateToken(user._id);

    res.json({
      message: "Password set successfully",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Error setting password:", err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

/**
 * SET EMAIL
 * - user might add/update email after registration
 */
exports.setEmail = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ message: "userId and email required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.email = email;
    await user.save();

    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Thank you for providing your email",
          "Enter your password to keep using your Axees account; otherwise you will lose access in 3 hours!",
          {
            targetScreen: "URM06SetPassword",
            userId: user._id.toString(),
            type: "email_updated",
          }
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }
    res.json({ message: "Email updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * LOGIN
 * - phone + password
 */
exports.login = async (req, res) => {  
  try {
    const { phone, password, deviceToken } = req.body;
    
    if (!phone || !password) {
      return errorResponse(res, "phone and password required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");

    const user = await User.findOne({ phone: formattedPhone });    
    if (!user) {
      return errorResponse(res, "Invalid phone or password", 401);
    }

    const match = await bcrypt.compare(password, user.password || "");
    if (!match) {
      return errorResponse(res, "Invalid phone or password", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Account is inactive. Complete your profile or contact support.", 403);
    }

    // Update device token if provided and different from current
    if (deviceToken && deviceToken !== user.deviceToken) {
      user.deviceToken = deviceToken;
      await user.save({ validateBeforeSave: false }); // Skip validation to ensure save
    }
    console.log("Users is ",user)
    // Generate JWT
    const token = generateToken(user._id);

    // Send welcome back notification
    if (deviceToken) {
      try {
        await showNotifications(
          deviceToken,
          "Welcome Back!",
          "You've successfully logged into your account",
          {
            targetScreen: "/(tabs)",
            token,
          }
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    return successResponse(res, "Login successful", {
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        userType: user.userType,
        email: user.email,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
      },
    }, 200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * START PASSWORD RESET
 * - user provides phone, we send OTP
 */
exports.startPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return errorResponse(res, "phone required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const { code, expiresAt } = generateOtp();
    user.otpCode = code;
    user.otpExpiresAt = expiresAt;
    user.otpSentAt = new Date(); // Add this for resend timer
    await user.save();

    // send Twilio SMS
    client.messages
      .create({
        body: `Your Axees password reset code is ${code}. Valid for 1 hour.`,
        from: twiliophone,
        to: phone,
      })
      .then((message) => {
        console.log(`OTP sent with Message SID: ${message.sid}`);
        return successResponse(res, "OTP sent successfully. Please check your messages.", {
          otpSentAt: user.otpSentAt,
        }, 200);
      })
      .catch((err) => {
        console.error("Error sending OTP:", err);
        return errorResponse(res, "Failed to send OTP", 500);
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * VERIFY RESET OTP
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: "phone and code required" });
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }
    if (Date.now() > user.otpExpiresAt.getTime()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Let them proceed to next step
    res.json({ message: "Code verified, you may now set a new password" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * COMPLETE PASSWORD RESET
 */
exports.completePasswordReset = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword) {
      return res
        .status(400)
        .json({ message: "phone and newPassword required" });
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Clear OTP fields
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return successResponse(res, "Password reset successfully", null, 200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * RESEND OTP
 * POST /auth/resend-otp
 */
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return errorResponse(res, "Please provide a phone number", 400);
    }

    const tempRegistration = await TempRegistration.findOne({ phone });
    if (!tempRegistration) {
      return errorResponse(res, "No pending registration found. Please restart the registration process", 404);
    }

    // Generate new OTP
    const { code, expiresAt } = generateOtp();

    // Update temp registration
    tempRegistration.otpCode = code;
    tempRegistration.otpExpiresAt = expiresAt;
    tempRegistration.otpSentAt = new Date();
    await tempRegistration.save();

    // Send new OTP
    await client.messages.create({
      body: `Your Axees verification code is ${code}. Valid for 1 hour.`,
      from: twiliophone,
      to: phone,
    });

    return successResponse(res, "New verification code resent successfully", {
      otpSentAt: tempRegistration.otpSentAt,
    }, 200);
  } catch (err) {
    handleServerError(res, err, "OTP resend");
  }
};

/**
 * UPDATE PROFILE
 */
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "username",
      "email",
      "avatar",
      "bio",
      "deviceToken",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    // Send notification if deviceToken exists
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Profile Updated",
          "Your profile has been successfully updated",
          {
            targetScreen: "URM06SetPassword",
          }
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * DELETE ACCOUNT
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Soft delete - update status to 'deleted'
    user.status = "deleted";
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE DEVICE TOKEN
 */
exports.updateDeviceToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ message: "deviceToken required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.deviceToken = deviceToken;
    await user.save();

    res.json({ message: "Device token updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE NAME
 * POST /auth/update-name
 */
exports.updateName = async (req, res) => {
  try {
    console.log("Update name request:", req.body);

    const { userId, name } = req.body;

    // Validate required fields
    if (!userId || !name) {
      return res.status(400).json({
        message: "Please provide both userId and name",
        received: { userId, name },
      });
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        userId,
      });
    }

    // Update user's name
    user.name = name;
    await user.save();

    console.log("Name updated successfully:", {
      userId,
      name,
      userType: user.userType,
    });

    // Send notification if deviceToken exists
    if (user.deviceToken) {
      try {
        // Instead of "Hurry Up!", we do:
        await showNotifications(
          user.deviceToken,
          "Thank you for providing your Name",
          "Enter username to keep using your Axees account otherwise you will lose access in 3 hours!",
          {
            targetScreen: "URM03Username", // or wherever
            userId: user._id.toString(),
            type: "name_updated",
          }
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    // Generate new token with updated user data
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Name updated successfully",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        userType: user.userType,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Update name error:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    handleServerError(res, err, "name update");
  }
};

// controllers/authController.js
exports.manualAuth = (req, res, next) => {
  const bearer = req.get("authorization") || "";
  const token  = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";

  const userId =
      req.query.userId  ||
      req.body.userId   ||
      req.get("x-user-id") ||
      token;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  req.user = { id: userId };
  next();
};




exports.updateUsername = async (req, res) => {
  try {
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ userName: username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.userName = username;
    await user.save();

    // Send notification using showNotifications
    if (user.deviceToken) {
      try {
        console.log(
          "Sending notification for username update to:",
          user.deviceToken
        );

        // First notification for username success

        await showNotifications(
          user.deviceToken,
          "Thank you for providing your Username",
          "Enter your email to keep using your Axees account otherwise you will lose access in 8 hours!",
          {
            targetScreen: "URM05SetEmail",
            userId: user._id.toString(),
            type: "username_updated",
          }
        );

        console.log("Notifications sent successfully for username update");
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    } else {
      console.log("No device token found for user:", userId);
    }

    return res.status(200).json({
      message: "Username updated successfully",
      user: {
        id: user._id,
        username: user.userName,
      },
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).json({ error: "Failed to update username" });
  }
};
