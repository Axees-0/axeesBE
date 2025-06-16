// utils/responseHelper.js
// Standardized API response helper utility

/**
 * Send a success response with standardized format
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Additional data to include in response (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response object
 */
exports.successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  // Spread data properties directly into response if provided
  if (data && typeof data === 'object') {
    Object.assign(response, data);
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response with standardized format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} data - Additional data to include in response (optional)
 * @returns {Object} Express response object
 */
exports.errorResponse = (res, message, statusCode = 400, data = null) => {
  const response = {
    success: false,
    message
  };

  // Spread data properties directly into response if provided
  if (data && typeof data === 'object') {
    Object.assign(response, data);
  }

  return res.status(statusCode).json(response);
};

/**
 * Handle server errors with standardized format
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} operation - Operation description for logging
 * @returns {Object} Express response object
 */
exports.handleServerError = (res, error, operation) => {
  console.error(`Error during ${operation}:`, error);

  // Handle specific error types
  if (error.code === 11000) {
    return exports.errorResponse(res, "This phone number is already registered", 409, {
      field: Object.keys(error.keyPattern)[0]
    });
  }

  if (error.name === "ValidationError") {
    return exports.errorResponse(res, "Invalid input data", 400, {
      errors: Object.values(error.errors).map((err) => err.message)
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === "CastError") {
    return exports.errorResponse(res, "Invalid data format", 400, {
      field: error.path
    });
  }

  // Handle Twilio errors
  if (error.status === 400 && error.code === 21211) {
    return exports.errorResponse(res, "Invalid phone number format. Please enter a valid phone number.", 400);
  }

  // Handle other Twilio errors
  if (error.status && error.code) {
    return exports.errorResponse(res, "Unable to send verification code. Please check your phone number and try again.", 400);
  }

  // Default error response with more detail in development
  const errorDetails = process.env.NODE_ENV === "development" ? {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
    }
  } : {};

  return exports.errorResponse(res, "Something went wrong. Please try again later.", 500, errorDetails);
};