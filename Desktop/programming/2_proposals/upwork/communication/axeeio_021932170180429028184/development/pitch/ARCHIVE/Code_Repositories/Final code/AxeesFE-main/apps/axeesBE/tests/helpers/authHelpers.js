// tests/helpers/authHelpers.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Authentication helpers for testing
 */
const authHelpers = {
  /**
   * Create a test user with specified role and properties
   */
  createTestUser: async (userData = {}) => {
    const defaultUserData = {
      userName: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      userType: 'Creator',
      isPhoneVerified: true,
      isEmailVerified: true,
      ...userData
    };

    const user = new User(defaultUserData);
    return await user.save();
  },

  /**
   * Create a marketer test user
   */
  createTestMarketer: async (userData = {}) => {
    return authHelpers.createTestUser({
      userName: 'testmarketer',
      email: 'marketer@example.com',
      userType: 'Marketer',
      ...userData
    });
  },

  /**
   * Create a creator test user
   */
  createTestCreator: async (userData = {}) => {
    return authHelpers.createTestUser({
      userName: 'testcreator',
      email: 'creator@example.com',
      userType: 'Creator',
      ...userData
    });
  },

  /**
   * Generate JWT token for a user
   */
  generateJWTToken: (user, expiresIn = '24h') => {
    const payload = {
      id: user._id ? user._id.toString() : user.toString(),
      role: user.role,
      userType: user.userType
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn }
    );
  },

  /**
   * Get authorization header for a user
   */
  getAuthHeader: (user) => {
    const token = authHelpers.generateJWTToken(user);
    return { Authorization: `Bearer ${token}` };
  },

  /**
   * Create authenticated user and return user + auth header
   */
  createAuthenticatedUser: async (userData = {}) => {
    const user = await authHelpers.createTestUser(userData);
    const authHeader = authHelpers.getAuthHeader(user);
    return { user, authHeader };
  },

  /**
   * Create authenticated marketer and return user + auth header
   */
  createAuthenticatedMarketer: async (userData = {}) => {
    const user = await authHelpers.createTestMarketer(userData);
    const authHeader = authHelpers.getAuthHeader(user);
    return { user, authHeader };
  },

  /**
   * Create authenticated creator and return user + auth header
   */
  createAuthenticatedCreator: async (userData = {}) => {
    const user = await authHelpers.createTestCreator(userData);
    const authHeader = authHelpers.getAuthHeader(user);
    return { user, authHeader };
  },

  /**
   * Mock req.user for middleware testing
   */
  mockReqUser: (userId, userData = {}) => {
    return {
      id: userId,
      _id: userId,
      ...userData
    };
  },

  /**
   * Create test user with Stripe Connect account
   */
  createUserWithStripeConnect: async (userData = {}) => {
    return authHelpers.createTestUser({
      stripeConnectId: 'acct_test_1234567890',
      stripeCustomerId: 'cus_test_1234567890',
      onboardingComplete: true,
      ...userData
    });
  },

  /**
   * Create test user with payment methods
   */
  createUserWithPaymentMethods: async (userData = {}) => {
    return authHelpers.createTestUser({
      stripeCustomerId: 'cus_test_1234567890',
      paymentMethods: [
        {
          id: 'pm_test_1234567890',
          isBankAccount: false,
          isPayoutCard: false,
          addedAt: new Date()
        },
        {
          id: 'ba_test_1234567890',
          isBankAccount: true,
          isPayoutCard: false,
          addedAt: new Date()
        }
      ],
      ...userData
    });
  }
};

module.exports = authHelpers;