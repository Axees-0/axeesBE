const jwt = require('jsonwebtoken');

/**
 * Generate a test JWT token
 * @param {Object} payload - User payload
 * @returns {string} JWT token
 */
const generateTestToken = (payload) => {
  const defaultPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'creator',
    ...payload
  };
  
  return jwt.sign(
    defaultPayload,
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1d' }
  );
};

/**
 * Generate an expired JWT token for testing
 * @param {Object} payload - User payload
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (payload) => {
  const defaultPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'creator',
    ...payload
  };
  
  return jwt.sign(
    defaultPayload,
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '-1h' } // Already expired
  );
};

/**
 * Generate an invalid JWT token
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = () => {
  return 'invalid.jwt.token';
};

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header
 * @returns {string|null} Token or null
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  extractBearerToken
};