// tests/helpers/testUtils.js
const Deal = require('../../models/deal');
const Earning = require('../../models/earnings');
const Payout = require('../../models/payouts');
const Withdrawal = require('../../models/withdrawal');

/**
 * Test utilities for creating test data and common operations
 */
const testUtils = {
  /**
   * Create a test deal
   */
  createTestDeal: async (dealData = {}) => {
    const defaultDealData = {
      dealName: 'Test Deal',
      dealNumber: `DEAL-${Date.now()}`,
      creatorId: null,
      marketerId: null,
      status: 'Accepted',
      paymentInfo: {
        amount: 1000,
        paymentAmount: 1000,
        paymentStatus: 'Pending',
        transactions: []
      },
      milestones: [],
      ...dealData
    };

    const deal = new Deal(defaultDealData);
    return await deal.save();
  },

  /**
   * Create a test earning
   */
  createTestEarning: async (earningData = {}) => {
    const defaultEarningData = {
      amount: 500,
      paymentMethod: 'CreditCard',
      transactionId: `txn_${Date.now()}`,
      reference: 'Test earning',
      createdAt: new Date(),
      ...earningData
    };

    const earning = new Earning(defaultEarningData);
    return await earning.save();
  },

  /**
   * Create a test payout
   */
  createTestPayout: async (payoutData = {}) => {
    const defaultPayoutData = {
      amount: 250,
      paymentMethod: 'bank_transfer',
      status: 'PENDING',
      requestedAt: new Date(),
      ...payoutData
    };

    const payout = new Payout(defaultPayoutData);
    return await payout.save();
  },

  /**
   * Create a test withdrawal
   */
  createTestWithdrawal: async (withdrawalData = {}) => {
    const defaultWithdrawalData = {
      amount: 100,
      paymentMethod: 'ba_test_1234567890',
      status: 'completed',
      transactionId: `wd_${Date.now()}`,
      createdAt: new Date(),
      completedAt: new Date(),
      ...withdrawalData
    };

    const withdrawal = new Withdrawal(defaultWithdrawalData);
    return await withdrawal.save();
  },

  /**
   * Generate test payment intent data
   */
  generatePaymentIntentData: (overrides = {}) => {
    return {
      amount: 5000, // $50.00 in cents
      currency: 'usd',
      metadata: {
        dealId: 'test-deal-id',
        userId: 'test-user-id',
        paymentType: 'escrowPayment'
      },
      ...overrides
    };
  },

  /**
   * Generate test checkout session data
   */
  generateCheckoutSessionData: (overrides = {}) => {
    return {
      amount: 1000, // $10.00
      currency: 'usd',
      quantity: 1,
      metadata: {
        paymentType: 'offerFee',
        dealId: 'test-deal-id',
        userId: 'test-user-id'
      },
      ...overrides
    };
  },

  /**
   * Generate test webhook payload
   */
  generateWebhookPayload: (eventType = 'payment_intent.succeeded', data = {}) => {
    return {
      id: `evt_${Date.now()}`,
      object: 'event',
      type: eventType,
      data: {
        object: {
          id: 'pi_test_1234567890',
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            dealId: 'test-deal-id',
            userId: 'test-user-id'
          },
          ...data
        }
      },
      created: Math.floor(Date.now() / 1000)
    };
  },

  /**
   * Generate test refund data
   */
  generateRefundData: (overrides = {}) => {
    return {
      transactionId: 'pi_test_1234567890',
      amount: 45.00, // Partial refund
      reason: 'requested_by_customer',
      ...overrides
    };
  },

  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate mock Express request object
   */
  mockRequest: (data = {}, headers = {}, user = null) => {
    return {
      body: data.body || {},
      params: data.params || {},
      query: data.query || {},
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      user,
      ...data
    };
  },

  /**
   * Generate mock Express response object
   */
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      headers: {}
    };
    return res;
  },

  /**
   * Assert response has expected structure
   */
  assertResponseStructure: (response, expectedKeys) => {
    expectedKeys.forEach(key => {
      expect(response).toHaveProperty(key);
    });
  },

  /**
   * Assert successful API response
   */
  assertSuccessResponse: (res, expectedData = null) => {
    expect(res.status).toHaveBeenCalledWith(200);
    if (expectedData) {
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expectedData));
    }
  },

  /**
   * Assert error API response
   */
  assertErrorResponse: (res, statusCode, errorMessage = null) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    if (errorMessage) {
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining(errorMessage)
      }));
    }
  },

  /**
   * Clean up test data
   */
  cleanupTestData: async () => {
    await Promise.all([
      Deal.deleteMany({}),
      Earning.deleteMany({}),
      Payout.deleteMany({}),
      Withdrawal.deleteMany({})
    ]);
  },

  /**
   * Mock environment variables
   */
  mockEnvVars: (envVars = {}) => {
    const originalEnv = process.env;
    
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        JWT_SECRET: 'test-jwt-secret',
        STRIPE_SECRET_KEY: 'sk_test_123456789',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123456789',
        STRIPE_PLATFORM_ACCOUNT_ID: 'acct_test_platform',
        ...envVars
      };
    });

    afterEach(() => {
      process.env = originalEnv;
    });
  }
};

module.exports = testUtils;