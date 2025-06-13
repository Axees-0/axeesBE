// tests/helpers/testUtils.js
const mongoose = require('mongoose');
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
   * Create a test deal with milestones
   */
  createDealWithMilestones: async (dealData = {}, milestonesData = []) => {
    const defaultMilestones = milestonesData.length > 0 ? milestonesData : [
      {
        name: 'Content Creation',
        amount: 500,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        description: 'Create initial content',
        status: 'pending',
        deliverables: [],
        feedback: []
      },
      {
        name: 'Content Review',
        amount: 300,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        description: 'Review and revise content',
        status: 'pending',
        deliverables: [],
        feedback: []
      }
    ];

    const deal = await testUtils.createTestDeal({
      ...dealData,
      milestones: defaultMilestones.map(milestone => ({
        ...milestone,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        createdBy: dealData.creatorId || new mongoose.Types.ObjectId()
      }))
    });

    return deal;
  },

  /**
   * Create a test milestone for a deal
   */
  createTestMilestone: (milestoneData = {}) => {
    return {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Milestone',
      amount: 500,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      description: 'Test milestone description',
      status: 'pending',
      deliverables: [],
      feedback: [],
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
      ...milestoneData
    };
  },

  /**
   * Create test deliverable data
   */
  createTestDeliverable: (deliverableData = {}) => {
    return {
      type: 'file',
      url: '/uploads/test-file.jpg',
      originalName: 'test-file.jpg',
      content: null,
      submittedAt: new Date(),
      submittedBy: new mongoose.Types.ObjectId(),
      ...deliverableData
    };
  },

  /**
   * Create mock file upload data
   */
  createMockFileUpload: (fileData = {}) => {
    return {
      fieldname: 'files',
      originalname: 'test-document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      destination: '/uploads/deliverables',
      filename: `${Date.now()}-test-document.pdf`,
      path: `/uploads/deliverables/${Date.now()}-test-document.pdf`,
      size: 1024 * 100, // 100KB
      ...fileData
    };
  },

  /**
   * Generate test milestone submission data
   */
  generateMilestoneSubmissionData: (overrides = {}) => {
    return {
      milestoneId: new mongoose.Types.ObjectId().toString(),
      deliverables: [
        {
          type: 'file',
          url: '/uploads/deliverables/test-file.jpg',
          originalName: 'design-mockup.jpg'
        },
        {
          type: 'text',
          content: 'Here is the completed work as requested.'
        }
      ],
      notes: 'Work completed according to specifications',
      ...overrides
    };
  },

  /**
   * Generate test milestone approval data
   */
  generateMilestoneApprovalData: (action = 'approve', overrides = {}) => {
    const baseData = {
      milestoneId: new mongoose.Types.ObjectId().toString(),
      action: action
    };

    // Set action-specific defaults only if not provided in overrides
    if (action === 'reject' && !overrides.feedback) {
      baseData.feedback = 'Please revise according to feedback';
    } else if (action === 'approve' && !overrides.rating) {
      baseData.rating = 5;
    }

    // Apply overrides after setting defaults to ensure custom values take precedence
    return {
      ...baseData,
      ...overrides
    };
  },

  /**
   * Generate test deal completion data
   */
  generateDealCompletionData: (overrides = {}) => {
    return {
      rating: 5,
      feedback: 'Excellent work, very satisfied with the results',
      triggerFinalPayment: true,
      ...overrides
    };
  },

  /**
   * Create a deal in specific state for testing
   */
  createDealInState: async (state, dealData = {}, milestonesData = []) => {
    let deal;
    
    switch (state) {
      case 'with_funded_milestone':
        deal = await testUtils.createDealWithMilestones(dealData, [
          testUtils.createTestMilestone({
            name: 'Funded Milestone',
            status: 'active',
            fundedAt: new Date()
          })
        ]);
        break;
        
      case 'with_submitted_milestone':
        deal = await testUtils.createDealWithMilestones(dealData, [
          testUtils.createTestMilestone({
            name: 'Submitted Milestone',
            status: 'submitted',
            submittedAt: new Date(),
            deliverables: [testUtils.createTestDeliverable()]
          })
        ]);
        break;
        
      case 'with_approved_milestones':
        deal = await testUtils.createDealWithMilestones(dealData, [
          testUtils.createTestMilestone({
            name: 'Approved Milestone 1',
            status: 'approved',
            completedAt: new Date()
          }),
          testUtils.createTestMilestone({
            name: 'Approved Milestone 2',
            status: 'approved',
            completedAt: new Date()
          })
        ]);
        break;
        
      case 'ready_for_completion':
        const totalPayment = dealData.paymentInfo?.paymentAmount || 1000;
        deal = await testUtils.createDealWithMilestones(dealData, [
          testUtils.createTestMilestone({
            name: 'Completed Milestone',
            status: 'approved',
            completedAt: new Date(),
            amount: totalPayment * 0.7 // Use 70% for milestone, leaving 30% for final payment
          })
        ]);
        break;
        
      default:
        deal = await testUtils.createDealWithMilestones(dealData, milestonesData);
    }
    
    return deal;
  },

  /**
   * Assert milestone status and properties
   */
  assertMilestoneStatus: (milestone, expectedStatus, additionalChecks = {}) => {
    expect(milestone.status).toBe(expectedStatus);
    
    Object.keys(additionalChecks).forEach(key => {
      expect(milestone[key]).toBeDefined();
      if (additionalChecks[key] !== null) {
        expect(milestone[key]).toBe(additionalChecks[key]);
      }
    });
  },

  /**
   * Assert deal has expected milestones
   */
  assertDealMilestones: (deal, expectedCount, statusCounts = {}) => {
    expect(deal.milestones).toHaveLength(expectedCount);
    
    Object.keys(statusCounts).forEach(status => {
      const milestonesWithStatus = deal.milestones.filter(m => m.status === status);
      expect(milestonesWithStatus).toHaveLength(statusCounts[status]);
    });
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