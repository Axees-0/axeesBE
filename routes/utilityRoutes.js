const express = require("express");
const router = express.Router();
const emailHelper = require("../utils/emailHelper");
const { successResponse, errorResponse } = require("../utils/responseHelper");

/**
 * Utility Routes
 * Provides utility endpoints for various services
 */

// POST /api/utils/verify-email - Verify if an email address is valid
router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email address is required");
    }

    // Use the existing email helper validation
    const validationResult = emailHelper.validateEmail(email);

    if (!validationResult.isValid) {
      return errorResponse(res, 400, validationResult.error || "Invalid email address");
    }

    // Additional verification can be added here in the future
    // For example: DNS validation, SMTP verification, etc.

    return successResponse(res, 200, "Email verified successfully", {
      email: email,
      isValid: true,
      domain: email.split('@')[1],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse(res, 500, "Failed to verify email address");
  }
});

module.exports = router;