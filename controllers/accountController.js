// controllers/accountController.js

const User = require("../models/User");
const TempRegistration = require("../models/TempRegistration");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { formatPhoneNumber, findUserByPhone } = require("../utils/phoneUtils");
const { sendOtp, verifyOtp } = require("../utils/messageCentral");

// Create a transporter using SMTP credentials from your .env file
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const {
  sendPushNotification: showNotifications,
} = require("../utils/pushNotifications"); // same naming as your code
const { generateToken } = require("../utils/jwtUtils");
const { successResponse, errorResponse } = require("../utils/responseHelper");

// Initialize the Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twiliophone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

/**
 * Helper: Generate a 4-digit OTP code & set 1hr expiry
 */
function generateOtp() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { code, expiresAt };
}

/**
 * Helper: Centralized error handler
 * (mirrors the one in your authController for consistency)
 */
const handleServerError = (res, error, operation) => {
  console.error(`Error during ${operation}:`, error);

  // Handle specific error types
  if (error.code === 11000) {
    return res.status(409).json({
      message: "This phone number is already registered",
      field: Object.keys(error.keyPattern)[0],
    });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Invalid input data",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }
  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid data format",
      field: error.path,
    });
  }
  // Twilio errors
  if (error.status === 400 && error.code === 21211) {
    return res.status(400).json({
      message:
        "Invalid phone number format. Please enter a valid phone number.",
    });
  }
  if (error.status && error.code) {
    return res.status(400).json({
      message:
        "Unable to send verification code. Check your phone number and try again.",
    });
  }

  // Default error
  res.status(500).json({
    message: "Something went wrong. Please try again later.",
    error:
      process.env.NODE_ENV === "development"
        ? {
            name: error.name,
            message: error.message,
            code: error.code,
          }
        : undefined,
  });
};

/**
 * 1) START REGISTRATION
 *    POST /account/register/start
 *    Similar logic to your existing startRegistration
 */

exports.startRegistration = async (req, res) => {
  try {
    // 🔍 DEBUG: Log all request details to trace the source
    console.log('🔥 REGISTRATION CALL DEBUG:');
    console.log('   📱 Phone:', req.body.phone);
    console.log('   👤 UserType:', req.body.userType);
    console.log('   🌍 User-Agent:', req.headers['user-agent']);
    console.log('   🔗 Referer:', req.headers['referer']);
    console.log('   🏠 Origin:', req.headers['origin']);
    console.log('   📍 IP:', req.ip || req.connection.remoteAddress);
    console.log('   📋 All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   ⏰ Timestamp:', new Date().toISOString());
    console.log('   🔍 Stack trace:');
    console.trace();
    
    const { phone, userType } = req.body;
    if (!phone) {
      return errorResponse(res, "Please provide phone number", 400);
    }
    if (!userType) {
      return errorResponse(res, "Please provide userType", 400);
    }

    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const formattedPhone = phone.replace(/[\s-]/g, "");
    if (!phoneRegex.test(formattedPhone)) {
      return errorResponse(res, "Please enter a valid phone number in international format (+123456...)", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return errorResponse(res, "This phone number is already registered", 409);
    }

    // Attempt to get / create TempRegistration record
    let tempDoc = await TempRegistration.findOne({ phone: formattedPhone });
    if (!tempDoc) {
      tempDoc = new TempRegistration({
        phone: formattedPhone,
        userType,
      });
    }

    // Call MessageCentral sendOtp
    const verificationId = await sendOtp(formattedPhone);
    // Store verificationId in the TempRegistration doc
    tempDoc.verificationId = verificationId;
    tempDoc.otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // e.g. 1 hour from now
    tempDoc.otpSentAt = new Date();
    await tempDoc.save();

    return successResponse(res, "OTP sent successfully. Please check your messages.", {
      otpSentAt: tempDoc.otpSentAt,
    }, 200);
  } catch (err) {
    handleServerError(res, err, "registration start");
  }
};

/** exports.startRegistration = async (req, res) => {
  try {
    const { phone, userType } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Please provide phone number" });
    }

    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
      return res.status(400).json({
        message:
          "Please enter a valid phone number in international format (+123456...)",
      });
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");

    // Check main user collection
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "This phone number is already registered" });
    }

    // Check temp registration
    const existingTemp = await TempRegistration.findOne({
      phone: formattedPhone,
    });
    const { code, expiresAt } = generateOtp();

    if (existingTemp) {
      // Update existing temp doc
      existingTemp.otpCode = code;
      existingTemp.otpExpiresAt = expiresAt;
      existingTemp.otpSentAt = new Date();
      existingTemp.userType = userType;
      await existingTemp.save();
    } else {
      // Create fresh temp doc
      const tempRegistration = new TempRegistration({
        phone: formattedPhone,
        userType,
        otpCode: code,
        otpExpiresAt: expiresAt,
        otpSentAt: new Date(),
      });
      await tempRegistration.save();
    }

    // Send SMS
    await client.messages.create({
      body: `Your Axees verification code is ${code}. Valid for 1 hour.`,
      from: twiliophone,
      to: formattedPhone,
    });

    return res.status(200).json({
      message: "Verification code sent successfully",
      otpSentAt: new Date(),
    });
  } catch (err) {
    handleServerError(res, err, "registration start");
  }
};
 */

/**
 * 2) VERIFY OTP & CREATE ACCOUNT (if new)
 *    POST /account/register/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code, deviceToken } = req.body;
    if (!phone || !code) {
      return errorResponse(res, "Phone number and verification code are required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    // We expect to have saved a verificationId for this phone in TempRegistration
    const tempRegistration = await TempRegistration.findOne({
      phone: formattedPhone,
    });
    if (!tempRegistration || !tempRegistration.verificationId) {
      return errorResponse(res, "No pending registration found. Please start registration first.", 404);
    }

    // Check expiry (you control the times, but only if you want to do local checks)
    if (Date.now() > tempRegistration.otpExpiresAt.getTime()) {
      return errorResponse(res, "Verification code has expired. Please request a new one", 400);
    }

    // Now call the verify API
    try {
      await verifyOtp(tempRegistration.verificationId, code);
    } catch (otpError) {
      return errorResponse(res, "Invalid verification code", 400);
    }

    // If success => create user
    const user = new User({
      phone: tempRegistration.phone,
      userType: tempRegistration.userType,
      deviceToken,
      isActive: false,
    });
    await user.save();

    // Clear temp doc
    await TempRegistration.deleteOne({ _id: tempRegistration._id });

    // Generate your JWT
    const token = generateToken(user);

    // Possibly send a push notification
    if (deviceToken) {
      try {
        await showNotifications(
          deviceToken,
          "Welcome to Axees!",
          "Setup your name to keep using your account smoothly...",
          {
            targetScreen: "URM02Name",
            userId: user._id.toString(),
            type: "welcome",
          },
        );
      } catch (notificationError) {
        console.error(
          "Failed to send welcome notification:",
          notificationError,
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
  } catch (err) {
    handleServerError(res, err, "OTP verification");
  }
};

/**exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code, deviceToken } = req.body;
    if (!phone || !code) {
      return res.status(400).json({
        message: "Phone number & verification code are required",
        received: { phone, code },
      });
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const tempRegistration = await TempRegistration.findOne({
      phone: formattedPhone,
    });

    if (tempRegistration) {
      // New user flow
      if (tempRegistration.otpCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      if (Date.now() > tempRegistration.otpExpiresAt.getTime()) {
        return res
          .status(400)
          .json({ message: "Verification code expired. Request a new one" });
      }

      // Create user
      const user = new User({
        phone: tempRegistration.phone,
        userType: tempRegistration.userType,
        deviceToken,
        isActive: false,
      });
      await user.save();

      // Remove temp doc
      await TempRegistration.deleteOne({ _id: tempRegistration._id });

      // Generate token
      const token = generateToken(user);

      // Send welcome push if device token
      if (deviceToken) {
        try {
          await showNotifications(
            deviceToken,
            "Thank you and welcome to Axees!",
            "Setup your name to keep using your account smoothly or you'll lose access soon",
            {
              targetScreen: "URM02Name",
              userId: user._id.toString(),
              type: "welcome",
            }
          );
        } catch (notificationError) {
          console.error(
            "Failed to send welcome notification:",
            notificationError
          );
        }
      }

      return res.status(201).json({
        message: "Account created successfully",
        token,
        user: {
          _id: user._id,
          phone: user.phone,
          userType: user.userType,
          isActive: user.isActive,
        },
      });
    }

    // If no temp doc, check if user is existing (for e.g. password reset flow)
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({
        message:
          "No pending registration found. Please start registration first",
        phone: formattedPhone,
      });
    }

    // If user has an OTP stored, check
    if (!user.otpCode) {
      return res
        .status(400)
        .json({ message: "No OTP found. Request a new one" });
    }
    if (user.otpCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    if (user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Code expired. Request a new one" });
    }

    // Otherwise, update user, clear OTP
    if (deviceToken) user.deviceToken = deviceToken;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user);
    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    handleServerError(res, err, "OTP verification");
  }
}; */

/**
 * 3) RESEND OTP
 *    POST /account/resend-otp
 */
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return errorResponse(res, "Please provide a phone number", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const tempRegistration = await TempRegistration.findOne({
      phone: formattedPhone,
    });
    if (!tempRegistration) {
      return errorResponse(res, "No pending registration found. Please restart the registration process", 404);
    }

    // Call MessageCentral sendOtp again
    const verificationId = await sendOtp(formattedPhone);
    // Update with new verificationId, new timestamps
    tempRegistration.verificationId = verificationId;
    tempRegistration.otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    tempRegistration.otpSentAt = new Date();
    await tempRegistration.save();

    return successResponse(res, "New verification code sent successfully via MessageCentral", {
      otpSentAt: tempRegistration.otpSentAt,
    });
  } catch (err) {
    handleServerError(res, err, "OTP resend");
  }
};

/**
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Please provide a phone number" });
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const tempRegistration = await TempRegistration.findOne({
      phone: formattedPhone,
    });

    if (!tempRegistration) {
      return res.status(404).json({
        message:
          "No pending registration found. Please restart the registration process",
      });
    }

    const { code, expiresAt } = generateOtp();
    tempRegistration.otpCode = code;
    tempRegistration.otpExpiresAt = expiresAt;
    tempRegistration.otpSentAt = new Date();
    await tempRegistration.save();

    await client.messages.create({
      body: `Your Axees verification code is ${code}. Valid for 1 hour.`,
      from: twiliophone,
      to: formattedPhone,
    });

    res.status(200).json({
      message: "New verification code sent successfully",
      otpSentAt: tempRegistration.otpSentAt,
    });
  } catch (err) {
    handleServerError(res, err, "OTP resend");
  }
};
*/
/**
 * 4) CHECK PHONE EXISTS
 *    GET /account/check-phone
 */
exports.checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return errorResponse(res, "Please provide a phone number", 400);
    }
    const user = await User.findOne({ phone });
    return successResponse(res, user
      ? "Phone number is already registered"
      : "Phone number is available", {
      exists: !!user,
    });
  } catch (err) {
    handleServerError(res, err, "checkPhoneExists");
  }
};

/**
 * 5) SET PROFILE (Role-specific fields for Marketer or Creator)
 *    POST /account/register/set-profile
 */
exports.setProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Common fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.userName) user.userName = req.body.userName;

    if (user.userType === "Marketer") {
      // Marketer fields
      if (req.body.brandName) user.brandName = req.body.brandName;
      // or store brand data in user.marketerData if you are using sub-doc
    } else {
      // Creator fields
      if (req.body.handleName) user.handleName = req.body.handleName;
      if (req.body.nicheTopics) user.nicheTopics = req.body.nicheTopics;
    }

    await user.save();

    // If device token is set, push a "Profile Updated" notification
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Profile Updated",
          "Your profile has been successfully updated. One step closer to completion!",
          {
            targetScreen: "Profile",
            userId: user._id,
          },
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    // Return new token with updated data if needed
    const token = generateToken(user);
    return res.json({
      message: "Profile updated",
      token,
      user,
    });
  } catch (err) {
    console.error("setProfile error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * 6) SET EMAIL
 *    POST /account/set-email
 */
exports.setEmail = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ message: "userId and email required" });
    }

    // Case-insensitive email check with validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if email is already in use
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    user.email = normalizedEmail;

    // check if still any steps missing
    let currentStep = null;
    if (!user.name || user.name.trim() === "") {
      currentStep = "name";
    } else if (!user.userName || user.userName.trim() === "") {
      currentStep = "userName";
    } else if (!user.password || user.password.trim() === "") {
      currentStep = "password";
    }

    if (!currentStep) {
      user.isActive = true;
    }

    await user.save();

    // Send push prompt if deviceToken
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Thank you for providing your email",
          "Enter your password to keep your Axees account; otherwise you may lose access!",
          {
            targetScreen: "URM06SetPassword",
            userId: user._id.toString(),
            type: "email_updated",
          },
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    return res.json({
      message: "Email updated",
      user,
      currentStep,
    });
  } catch (err) {
    console.error("setEmail error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// change password
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const { currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "userId, currentPassword, and newPassword required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password || "");
    if (!match) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    handleServerError(res, err, "changePassword");
  }
};
/**
 * 7) SET PASSWORD (final stage to fully activate user)
 *    POST /account/set-password
 */
exports.setPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ message: "userId and password required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isActive = true; // Mark active
    // Clear OTP if leftover
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user);
    return res.json({
      message: "Password set successfully",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
        password: user.password,
        email: user.email,
        name: user.name,
        userName: user.userName,
      },
    });
  } catch (err) {
    console.error("setPassword error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * 8) UPDATE NAME
 *    POST /account/update-name
 */
exports.updateName = async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name) {
      return res.status(400).json({
        message: "Please provide both userId and name",
        received: { userId, name },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", userId });
    }

    // // Check if user already exists with same name
    // const existingUser = await User.findOne({ name });
    // if (existingUser) {
    //   return res
    //     .status(409)
    //     .json({ message: "This name is already registered" });
    // }

    user.name = name;

    // check if still any steps missing
    let currentStep = null;
    if (!user.userName || user.userName.trim() === "") {
      currentStep = "userName";
    } else if (!user.email || user.email.trim() === "") {
      currentStep = "email";
    } else if (!user.password || user.password.trim() === "") {
      currentStep = "password";
    }

    if (!currentStep) {
      user.isActive = true;
    }

    await user.save();

    // Send notification
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Thank you for providing your Name",
          "Enter username next or you may lose access in 3 hours!",
          {
            targetScreen: "URM03Username",
            userId: user._id.toString(),
            type: "name_updated",
          },
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Name updated successfully",
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        userType: user.userType,
        isActive: user.isActive,
      },
      currentStep,
    });
  } catch (err) {
    console.error("updateName error:", err);
    handleServerError(res, err, "name update");
  }
};

/**
 * 9) UPDATE USERNAME
 *    POST /account/update-username
 */
exports.updateUsername = async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if taken
    const existingUser = await User.findOne({ userName: username });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.userName = username;

    // check if still any steps missing
    let currentStep = null;
    if (!user.name || user.name.trim() === "") {
      currentStep = "name";
    } else if (!user.email || user.email.trim() === "") {
      currentStep = "email";
    } else if (!user.password || user.password.trim() === "") {
      currentStep = "password";
    }

    if (!currentStep) {
      user.isActive = true;
    }

    await user.save();

    // Notify
    if (user.deviceToken) {
      try {
        await showNotifications(
          user.deviceToken,
          "Thank you for providing your Username",
          "Enter your email to keep using your Axees account or lose access in 8 hours!",
          {
            targetScreen: "URM05SetEmail",
            userId: user._id.toString(),
            type: "username_updated",
          },
        );
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
    } else {
    }

    return res.status(200).json({
      message: "Username updated successfully",
      user: {
        _id: user._id,
        phone: user.phone,
        userType: user.userType,
        userName: user.userName,
        isActive: user.isActive,
      },
      currentStep,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).json({ error: "Failed to update username" });
  }
};

/**
 * 10) LOGIN
 *     POST /account/login
 */
exports.login = async (req, res) => {
  try {
    const { phone, password, deviceToken } = req.body;
    if (!phone || !password) {
      return errorResponse(res, "Phone and password are required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "Phone or password is incorrect", 401);
    }

    const match = await bcrypt.compare(password, user.password || "");

    if (!match) {
      return errorResponse(res, "Phone or password is incorrect", 401);
    }
    const token = generateToken(user);

    if (!user.isActive) {
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

      if (currentStep) {
        return errorResponse(res, "User is inactive. Please complete your profile info", 403, {
          currentStep,
          token,
          userId: user._id,
          user: {
            _id: user._id,
            phone: user.phone,
            name: user.name,
            userType: user.userType,
            email: user.email,
            password: user.password,
            userName: user.userName,
            isActive: user.isActive,
            avatarUrl: user.avatarUrl,
          },
        });
      }
    }

    if (deviceToken) {
      user.deviceToken = deviceToken;
      await user.save();
      // Send "welcome back"
      try {
        await showNotifications(
          deviceToken,
          "Welcome Back!",
          "You've successfully logged into your account",
          {
            targetScreen: "/(tabs)",
          },
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
        password: user.password,
        userName: user.userName,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return errorResponse(res, "Server Error", 500);
  }
};

/**
 * 11) START PASSWORD RESET
 *     POST /account/password-reset
 */
/**exports.startPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return errorResponse(res, "phone required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: "No user with that phone" });
    }

    const { code, expiresAt } = generateOtp();
    user.otpCode = code;
    user.otpExpiresAt = expiresAt;
    user.otpSentAt = new Date();
    await user.save();

    client.messages
      .create({
        body: `Your Axees password reset code is ${code}. Valid for 1 hour.`,
        from: twiliophone,
        to: phone,
      })
      .then((message) => {
        res.status(200).json({
          message: "Reset code sent via SMS",
          otpSentAt: user.otpSentAt,
        });
      })
      .catch((err) => {
        console.error("Error sending OTP:", err);
        res.status(500).json({ error: "Failed to send OTP" });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};*/

exports.startPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return errorResponse(res, "phone required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "No user with that phone", 404);
    }

    // Call MessageCentral to send OTP and get a verificationId
    const verificationId = await sendOtp(formattedPhone);

    // Save verificationId and OTP timestamps on the user document
    user.verificationId = verificationId;
    user.otpSentAt = new Date();
    user.otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    await user.save();

    return successResponse(res, "Reset code sent via SMS", {
      otpSentAt: user.otpSentAt,
    });
  } catch (err) {
    console.error("Error starting password reset:", err);
    return errorResponse(res, "Server Error", 500);
  }
};

/**
 * 12) VERIFY RESET OTP
 *     POST /account/verify-reset-otp
 */

/**
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
      return errorResponse(res, "OTP expired", 400);
    }

    // If valid, let them set new password
    res.json({ message: "Code verified, you can now set a new password" });
  } catch (err) {
    console.error("verifyResetOtp error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return errorResponse(res, "phone and code required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Ensure that a verification process was initiated and we have a stored verificationId
    if (!user.verificationId) {
      return errorResponse(res, "No OTP request found. Please initiate password reset.", 400);
    }

    // Optional: Check for expiry (if you store otpExpiresAt on user)
    if (Date.now() > user.otpExpiresAt.getTime()) {
      return errorResponse(res, "OTP expired", 400);
    }

    // Call MessageCentral's verifyOtp helper function
    await verifyOtp(user.verificationId, code);

    // Optionally, clear verification-related fields after successful verification
    user.verificationId = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return successResponse(res, "Code verified, you can now set a new password");
  } catch (err) {
    console.error("verifyResetOtp error:", err);
    return errorResponse(res, "Server Error", 500, { error: err.message });
  }
};

/**
 * 13) COMPLETE PASSWORD RESET
 *     POST /account/complete-password-reset
 */
exports.completePasswordReset = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword) {
      return errorResponse(res, "phone & newPassword required", 400);
    }

    const formattedPhone = phone.replace(/[\s-]/g, "");
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return successResponse(res, "Password reset successful");
  } catch (err) {
    console.error("completePasswordReset error:", err);
    return errorResponse(res, "Server Error", 500);
  }
};

/**
 * 16) UPDATE DEVICE TOKEN
 *     PUT /account/device-token/:userId
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
    console.error("updateDeviceToken error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * GET PROFILE (top-level + sub-docs)
 * GET /account/profile/:userId
 */
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally remove sensitive fields
    delete user.password;
    delete user.otpCode;
    delete user.otpExpiresAt;

    // Add avatar URL if exists
    const avatar = user.avatar ? user.avatar : null;

    // Structure the response
    const response = {
      message: "Profile retrieved",
      user: {
        ...user,
        avatar,
        creatorData:
          user.userType === "Creator"
            ? {
                platforms: user.creatorData?.platforms || [],
                categories: user.creatorData?.categories || [],
                nicheTopics: user.creatorData?.nicheTopics || [],
                achievements: user.creatorData?.achievements || "",
                businessVentures: user.creatorData?.businessVentures || "",
                brandName: user.creatorData?.brandName || "",
                funFact: user.creatorData?.funFact || "",
                totalFollowers: user.creatorData?.totalFollowers || 0,
                mostViewedTitle: user.creatorData?.mostViewedTitle || "",
                buythis: user.creatorData?.buythis || "",
                mainPlatform: user.creatorData?.mainPlatform || "",
                mediaPackageUrl: user.creatorData?.mediaPackageUrl || "",
                portfolio: user.creatorData?.portfolio || [],
                rates: user.creatorData?.rates || {},
              }
            : null,
        marketerData:
          user.userType === "Marketer"
            ? {
                platforms: user.marketerData?.platforms || [],
                categories: user.marketerData?.categories || [],
                nicheTopics: user.marketerData?.nicheTopics || [],
                achievements: user.marketerData?.achievements || "",
                businessVentures: user.marketerData?.businessVentures || "",
                brandName: user.marketerData?.brandName || "",
                funFact: user.marketerData?.funFact || "",
                totalFollowers: user.marketerData?.totalFollowers || 0,
                mostViewedTitle: user.marketerData?.mostViewedTitle || "",
                buythis: user.marketerData?.buythis || "",
                mainPlatform: user.marketerData?.mainPlatform || "",
                mediaPackageUrl: user.marketerData?.mediaPackageUrl || "",
                portfolio: user.marketerData?.portfolio || [],
                rates: user.marketerData?.rates || {},
              }
            : null,
      },
    };

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "getProfile");
  }
};

/**
 * UPDATE PROFILE (top-level fields like name, userName, email, phone, etc.)
 * PATCH /account/profile/:userId
 * Body can include { name, userName, email, phone, ... }
 */
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If phone is being updated, format it
    if (updates.phone) {
      updates.phone = formatPhoneNumber(updates.phone);

      // Check if the new phone number is already taken
      const existingUser = await findUserByPhone(User, updates.phone);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    // Remove newTag from updates as it's not a DB field
    delete updates.newTag;

    // Update all allowed fields
    const allowedFields = [
      "name",
      "userName",
      "email",
      "phone",
      "bio",
      "link",
      "tags",
      "buythis",
      "mainPlatform",
      "mostViewedTitle",
      "achievements",
      "businessVentures",
      "brandName",
      "funFact",
      "categories",
      "platforms",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    return res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update error:", error);
    handleServerError(res, error, "updateProfile");
  }
};

/**
 * UPDATE CREATOR DATA
 * PATCH /account/creator/:userId
 * Body can include fields from creatorData (handleName, nicheTopics, achievements, etc.)
 */
exports.updateCreatorData = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userType !== "Creator") {
      return res.status(403).json({ message: "User is not a Creator" });
    }

    // Initialize creatorData with all required fields if it doesn't exist
    if (!user.creatorData) {
      user.creatorData = {
        platforms: [],
        categories: [],
        nicheTopics: [],
        achievements: "",
        businessVentures: "",
        portfolio: [],
        totalFollowers: 0,
        mediaPackageUrl: "",
      };
    }

    // Ensure portfolio is initialized
    if (!Array.isArray(user.creatorData.portfolio)) {
      user.creatorData.portfolio = [];
    }

    // For each field in updates, assign to user.creatorData
    Object.keys(updates).forEach((key) => {
      if (
        key === "platforms" ||
        key === "categories" ||
        key === "nicheTopics" ||
        key === "portfolio"
      ) {
        // Ensure we're working with arrays for array fields
        user.creatorData[key] = Array.isArray(updates[key]) ? updates[key] : [];
        user.markModified(`creatorData.${key}`); // Mark specific array as modified
      } else {
        user.creatorData[key] = updates[key];
      }
    });

    // Mark the entire creatorData object as modified
    user.markModified("creatorData");

    await user.save();

    res.json({
      message: "Creator data updated",
      creatorData: user.creatorData,
    });
  } catch (error) {
    console.error("UpdateCreatorData error details:", error);
    handleServerError(res, error, "updateCreatorData");
  }
};

/**
 * UPDATE MARKETER DATA
 * PATCH /account/marketer/:userId
 * Body can include brandName, brandWebsite, brandDescription, etc.
 */
exports.updateMarketerData = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Initialize marketerData if it doesn't exist
    if (!user.marketerData) {
      user.marketerData = {
        platforms: [],
        totalFollowers: 0,
        brandName: "",
        brandWebsite: "",
        handleName: "",
        nicheTopics: [],
        brandDescription: "",
        industry: "",
        mediaPackageUrl: "",
        budget: 0,
        offers: 0,
        deals: 0,
        categories: [], // Ensure categories is initialized
        portfolio: [],
        listedEvents: 0,
        combinedViews: 0,
        offersCount: 0,
        dealsCompleted: 0,
      };
    }

    // Ensure all array fields exist
    const arrayFields = ["platforms", "nicheTopics", "categories", "portfolio"];

    // Initialize any missing array fields
    arrayFields.forEach((field) => {
      if (!user.marketerData[field]) {
        user.marketerData[field] = [];
      }
    });

    // For each field in updates, assign to user.marketerData
    Object.keys(updates).forEach((key) => {
      if (arrayFields.includes(key)) {
        // Ensure we're working with arrays for array fields
        user.marketerData[key] = Array.isArray(updates[key])
          ? updates[key]
          : [];
        user.markModified(`marketerData.${key}`); // Mark specific array as modified
      } else {
        user.marketerData[key] = updates[key];
      }
    });

    // Mark the entire marketerData object as modified
    user.markModified("marketerData");

    await user.save();

    // Verify the save by fetching fresh data
    const updatedUser = await User.findById(userId);

    res.json({
      message: "Marketer data updated",
      marketerData: updatedUser.marketerData,
    });
  } catch (error) {
    console.error("updateMarketerData error:", error);
    console.error("Error details:", error.message);
    handleServerError(res, error, "updateMarketerData");
  }
};

/**
 * ADD SOCIAL HANDLE (Creator)
 * POST /account/creator/:userId/social-handles
 * body: { platform, handle, followersCount }
 */
exports.addSocialHandle = async (req, res) => {
  try {
    const { userId } = req.params;
    const { platform, handle, followersCount } = req.body;

    if (!platform || !handle) {
      return res
        .status(400)
        .json({ message: "Platform and handle are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1) Initialize creatorData/marketerData if missing
    if (!user.creatorData && user.userType === "Creator") {
      user.creatorData = {
        platforms: [],
        totalFollowers: 0,
      };
    }

    if (!user.marketerData && user.userType === "Marketer") {
      user.marketerData = {
        platforms: [],
        totalFollowers: 0,
      };
    }

    // 2) Initialize platforms array if missing
    if (!user?.creatorData?.platforms && user.userType === "Creator") {
      user.creatorData.platforms = [];
    }

    if (!user?.marketerData?.platforms && user.userType === "Marketer") {
      user.marketerData.platforms = [];
    }

    const newFollowersCount = parseInt(followersCount) || 0;

    // Now safe to push and update total followers
    if (user.userType === "Creator") {
      user.creatorData.platforms.push({
        platform,
        handle,
        followersCount: newFollowersCount,
      });
      // Update total followers
      user.creatorData.totalFollowers =
        (user.creatorData.totalFollowers || 0) + newFollowersCount;
    } else if (user.userType === "Marketer") {
      user.marketerData.platforms.push({
        platform,
        handle,
        followersCount: newFollowersCount,
      });
      // Update total followers
      user.marketerData.totalFollowers =
        (user.marketerData.totalFollowers || 0) + newFollowersCount;
    }

    await user.save();
    res.json({
      message: "Social handle added",
      platforms:
        user.userType === "Creator"
          ? user.creatorData.platforms
          : user.marketerData.platforms,
      totalFollowers:
        user.userType === "Creator"
          ? user.creatorData.totalFollowers
          : user.marketerData.totalFollowers,
    });
  } catch (error) {
    handleServerError(res, error, "addSocialHandle");
  }
};

/**
 * UPDATE SOCIAL HANDLE (Creator)
 * PATCH /account/creator/:userId/social-handles/:handleId
 * body can have { platform, handle, followersCount }
 */
exports.updateSocialHandle = async (req, res) => {
  try {
    const { userId, handleId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let handleDoc;
    let dataContainer =
      user.userType === "Creator" ? user.creatorData : user.marketerData;

    if (user.userType === "Creator") {
      handleDoc = user.creatorData.platforms.id(handleId);
      if (!handleDoc) {
        return res.status(404).json({ message: "Social handle not found" });
      }
    } else if (user.userType === "Marketer") {
      handleDoc = user.marketerData.platforms.id(handleId);
      if (!handleDoc) {
        return res.status(404).json({ message: "Social handle not found" });
      }
    }

    // Calculate followers difference if followersCount is being updated
    if (updates.followersCount !== undefined) {
      const oldCount = handleDoc.followersCount || 0;
      const newCount = parseInt(updates.followersCount) || 0;
      const difference = newCount - oldCount;

      // Update total followers
      dataContainer.totalFollowers =
        (dataContainer.totalFollowers || 0) + difference;
    }

    // update fields
    if (updates.platform !== undefined) handleDoc.platform = updates.platform;
    if (updates.handle !== undefined) handleDoc.handle = updates.handle;
    if (updates.followersCount !== undefined) {
      handleDoc.followersCount = parseInt(updates.followersCount) || 0;
    }

    await user.save();
    res.json({
      message: "Social handle updated",
      platforms: dataContainer.platforms,
      totalFollowers: dataContainer.totalFollowers,
    });
  } catch (error) {
    handleServerError(res, error, "updateSocialHandle");
  }
};

/**
 * REMOVE SOCIAL HANDLE (Creator)
 * DELETE /account/creator/:userId/social-handles/:handleId
 */
exports.deleteSocialHandle = async (req, res) => {
  try {
    const { userId, handleId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let dataContainer =
      user.userType === "Creator" ? user.creatorData : user.marketerData;

    // Find the handle to get its followers count before removal
    const handleToRemove = dataContainer.platforms.id(handleId);
    if (!handleToRemove) {
      return res.status(404).json({ message: "Social handle not found" });
    }

    // Subtract the followers count from total
    const followersToRemove = handleToRemove.followersCount || 0;
    dataContainer.totalFollowers = Math.max(
      0,
      (dataContainer.totalFollowers || 0) - followersToRemove,
    );

    // Remove the platform
    if (user.userType === "Creator") {
      user.creatorData.platforms.pull({ _id: handleId });
    } else if (user.userType === "Marketer") {
      user.marketerData.platforms.pull({ _id: handleId });
    }

    await user.save();

    res.json({
      message: "Social handle removed",
      platforms: dataContainer.platforms,
      totalFollowers: dataContainer.totalFollowers,
    });
  } catch (error) {
    handleServerError(res, error, "deleteSocialHandle");
  }
};

/**
 * ADD PORTFOLIO ITEM
 * POST /account/creator/:userId/portfolio
 * body: { mediaUrl, mediaType, title, description }
 */
exports.addPortfolioItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { mediaUrl, mediaType, title, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userType !== "Creator") {
      return res
        .status(403)
        .json({ message: "Only Creators can add portfolio items" });
    }

    user.creatorData.portfolio.push({
      mediaUrl,
      mediaType,
      title,
      description,
    });

    await user.save();
    res.json({
      message: "Portfolio item added",
      portfolio: user.creatorData.portfolio,
    });
  } catch (error) {
    handleServerError(res, error, "addPortfolioItem");
  }
};

/**
 * UPDATE PORTFOLIO ITEM
 * PATCH /account/creator/:userId/portfolio/:itemId
 */
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const updates = req.body; // { mediaUrl, mediaType, title, description }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userType !== "Creator") {
      return res
        .status(403)
        .json({ message: "Only Creators can update portfolio items" });
    }

    const portfolioItem = user.creatorData.portfolio.id(itemId);
    if (!portfolioItem) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    // update fields
    if (updates.mediaUrl !== undefined)
      portfolioItem.mediaUrl = updates.mediaUrl;
    if (updates.mediaType !== undefined)
      portfolioItem.mediaType = updates.mediaType;
    if (updates.title !== undefined) portfolioItem.title = updates.title;
    if (updates.description !== undefined)
      portfolioItem.description = updates.description;

    await user.save();
    res.json({
      message: "Portfolio item updated",
      portfolio: user.creatorData.portfolio,
    });
  } catch (error) {
    handleServerError(res, error, "updatePortfolioItem");
  }
};

/**
 * REMOVE PORTFOLIO ITEM
 * DELETE /account/creator/:userId/portfolio/:itemId
 */
exports.deletePortfolioItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userType !== "Creator") {
      return res
        .status(403)
        .json({ message: "Only Creators can remove portfolio items" });
    }

    const portfolioItem = user.creatorData.portfolio.id(itemId);
    if (!portfolioItem) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    portfolioItem.remove();
    await user.save();

    res.json({
      message: "Portfolio item removed",
      portfolio: user.creatorData.portfolio,
    });
  } catch (error) {
    handleServerError(res, error, "deletePortfolioItem");
  }
};

/**
 * UPDATE SETTINGS
 * PATCH /account/settings/:userId
 * body: { notifications: {...}, privacy: {...} }
 */
exports.updateSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notifications, privacy } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (notifications) {
      Object.assign(user.settings.notifications, notifications);
    }
    if (privacy) {
      Object.assign(user.settings.privacy, privacy);
    }

    await user.save();
    res.json({
      message: "Settings updated",
      settings: user.settings,
    });
  } catch (error) {
    handleServerError(res, error, "updateSettings");
  }
};

/**
 * DELETE (Soft-Delete) ACCOUNT
 * DELETE /account/:userId
 * optional body: { reason, ... }
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Soft delete
    user.status = "deleted";
    user.deletedAt = new Date();
    user.deletionReason = reason;
    await user.save();

    res.json({ message: "Account deleted (soft)", status: user.status });
  } catch (error) {
    handleServerError(res, error, "deleteAccount");
  }
};

/**
 * DEACTIVATE ACCOUNT
 * Temporarily disables user account
 */
exports.deactivateAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    user.status = "deactivated";
    user.deactivatedAt = new Date();
    await user.save();

    res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    handleServerError(res, err, "deactivateAccount");
  }
};

/**
 * UPLOAD AVATAR
 * Handles profile picture uploads
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/avatars"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.params.userId}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (
      !file.originalname.match(
        /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
      )
    ) {
      return cb(
        new Error(
          "Only image, pdf, doc, docx, xls, xlsx, ppt, pptx files are allowed!",
        ),
        false,
      );
    }
    cb(null, true);
  },
}).single("avatar");

exports.uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure uploads directory exists
    await fs.promises.mkdir(path.join(__dirname, "../uploads/avatars"), {
      recursive: true,
    });

    // Handle the file upload
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No avatar file uploaded" });
      }

      try {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Update user avatar URL
        user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await user.save();

        res.json({
          message: "Avatar uploaded successfully",
          avatarUrl: user.avatarUrl,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Error updating user avatar" });
      }
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE NOTIFICATION SETTINGS
 * PATCH /account/notification-settings/:userId
 */
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { push, email, sms } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.notifications) {
      user.settings.notifications = {};
    }

    // Update only the provided settings
    if (push !== undefined) {
      user.settings.notifications.push = push;
    }
    if (email !== undefined) {
      user.settings.notifications.email = email;
    }
    if (sms !== undefined) {
      user.settings.notifications.sms = sms;
    }

    await user.save();

    return res.json({
      message: "Notification settings updated successfully",
      settings: user.settings.notifications,
    });
  } catch (error) {
    console.error("updateNotificationSettings error:", error);
    res.status(500).json({ message: "Failed to update notification settings" });
  }
};

// Upload media package endpoint
exports.uploadMediaPackage = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Before handling the file upload, ensure the directory exists
    const uploadDir = path.join(__dirname, "../../uploads/media-packages");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the file path to user's profile
    const mediaPackageUrl = `/uploads/media-packages/${req.file.filename}`;

    // Create portfolio item
    const newPortfolioItem = {
      mediaUrl: mediaPackageUrl,
      mediaType: req.file.mimetype.includes("pdf")
        ? "pdf"
        : req.file.mimetype.includes("image")
          ? "image"
          : "other",
      title: req.file.originalname,
      description: "Media Package Upload",
    };

    if (user.userType === "Creator") {
      // Initialize creatorData if it doesn't exist
      if (!user.creatorData) {
        user.creatorData = {
          platforms: [],
          categories: [],
          nicheTopics: [],
          achievements: "",
          businessVentures: "",
          portfolio: [],
          totalFollowers: 0,
          mediaPackageUrl: "",
        };
      }

      // Ensure portfolio is initialized
      if (!Array.isArray(user.creatorData.portfolio)) {
        user.creatorData.portfolio = [];
      }

      user.creatorData.portfolio.push(newPortfolioItem);
      user.creatorData.mediaPackageUrl = mediaPackageUrl;

      user.markModified("creatorData");
      user.markModified("creatorData.portfolio");
      user.markModified("creatorData.mediaPackageUrl");
    } else if (user.userType === "Marketer") {
      // Initialize marketerData if it doesn't exist
      if (!user.marketerData) {
        user.marketerData = {
          platforms: [],
          categories: [],
          nicheTopics: [],
          portfolio: [],
          totalFollowers: 0,
          mediaPackageUrl: "",
        };
      }

      // Ensure portfolio is initialized
      if (!Array.isArray(user.marketerData.portfolio)) {
        user.marketerData.portfolio = [];
      }

      user.marketerData.portfolio.push(newPortfolioItem);
      user.marketerData.mediaPackageUrl = mediaPackageUrl;

      user.markModified("marketerData");
      user.markModified("marketerData.portfolio");
      user.markModified("marketerData.mediaPackageUrl");
    }

    // Save with error handling
    try {
      await user.save();
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      throw saveError;
    }

    // Verify the save by fetching fresh data
    const updatedUser = await User.findById(userId);

    res.json({
      message: "Media package uploaded successfully",
      mediaPackageUrl,
      portfolio:
        user.userType === "Creator"
          ? updatedUser.creatorData?.portfolio
          : updatedUser.marketerData?.portfolio,
      user: updatedUser,
      debug: {
        savedUrl:
          user.userType === "Creator"
            ? updatedUser.creatorData?.mediaPackageUrl
            : updatedUser.marketerData?.mediaPackageUrl,
        userType: user.userType,
        hasCreatorData: !!updatedUser.creatorData,
        hasMarketerData: !!updatedUser.marketerData,
        portfolioLength:
          user.userType === "Creator"
            ? updatedUser.creatorData?.portfolio?.length
            : updatedUser.marketerData?.portfolio?.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    handleServerError(res, error, "uploadMediaPackage");
  }
};

/**
 * POST /account/send-verification-email
 * Sends a verification email to the user's email address.
 * Expects a JSON body: { userId }
 */
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a random token and set expiry (e.g., 1 hour)
    const emailToken = crypto.randomBytes(16).toString("hex");
    const emailTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save token and expiry in user document
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = emailTokenExpires;
    await user.save();

    // Build the verification link (adjust the URL as needed)
    const verifyLink = `${process.env.FRONTEND_URL}/VerifyEmailScreen?token=${emailToken}`;

    // HTML email template with logo and button
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
          }
          .logo {
            width: 150px;
            margin-bottom: 20px;
            align-self: center;
          }
          .button {
            background-color: #430B92;
            color: #ffffff !important;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin: 20px 0;
            font-weight: bold;
            align-self: flex-start;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="${
            process.env.BACKEND_URL
          }/uploads/assets/icon.png"></img>
          <h2>Verify Your Email</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a class="button" href="${verifyLink}">Verify Email</a>
          <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
          <p>${verifyLink}</p>
          <div class="footer">
            <p>Thank you,<br/>The Axees Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configure mail options
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@axees.com",
      to: user.email,
      subject: "Verify Your Email for Axees",
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      message: "Verification email sent",
      previewUrl: nodemailer.getTestMessageUrl(info), // Useful for testing in sandbox mode
    });
  } catch (err) {
    console.error("Error sending verification email:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /account/verify-email/:token
 * Verifies the user's email using the provided token.
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Email verification failed: your token is either invalid or has expired.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Error verifying email:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Function to ensure directory exists
const ensureDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
