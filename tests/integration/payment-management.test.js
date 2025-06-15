// tests/integration/payment-management.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import test helpers
const authHelpers = require('../helpers/authHelpers');
const { stripeMocks, mockHelpers } = require('../helpers/stripeMocks');
const testUtils = require('../helpers/testUtils');

// Import models
const User = require('../../models/User');
const Deal = require('../../models/deal');
const Earning = require('../../models/earnings');
const Payout = require('../../models/payouts');
const Withdrawal = require('../../models/withdrawal');

// Mock Stripe before importing the controller
jest.mock('stripe', () => {
  return jest.fn(() => require('../helpers/stripeMocks').stripeMocks);
});

// Mock the manualAuth middleware to use JWT verification
jest.mock('../../controllers/authController', () => {
  const actual = jest.requireActual('../../controllers/authController');
  return {
    ...actual,
    manualAuth: (req, res, next) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret');
          req.user = { 
            id: decoded.id,
            role: decoded.role,
            userType: decoded.userType 
          };
          next();
        } catch (error) {
          return res.status(401).json({ error: "Unauthorized: User not authenticated" });
        }
      } else {
        return res.status(401).json({ error: "Unauthorized: User not authenticated" });
      }
    }
  };
});

// Import routes after mocking
const paymentRoutes = require('../../routes/paymentRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Mount payment routes
app.use('/api/payments', paymentRoutes);

describe('Payment Management Tests', () => {
  let testUser, testMarketer, testCreator, testDeal;
  let userAuthHeader, marketerAuthHeader, creatorAuthHeader;

  // Setup environment variables for tests
  testUtils.mockEnvVars({
    STRIPE_SECRET_KEY: 'sk_test_123456789',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123456789',
    STRIPE_PLATFORM_ACCOUNT_ID: 'acct_test_platform',
    EMAIL_HOST: 'smtp.test.com',
    EMAIL_USER: 'test@test.com',
    EMAIL_PASS: 'testpass'
  });

  beforeEach(async () => {
    // Reset Stripe mocks
    mockHelpers.resetMocks();

    // Create test users
    const userData = await authHelpers.createAuthenticatedUser({
      stripeCustomerId: 'cus_test_1234567890',
      stripeConnectId: 'acct_test_1234567890'
    });
    testUser = userData.user;
    userAuthHeader = userData.authHeader;

    const marketerData = await authHelpers.createAuthenticatedMarketer({
      stripeCustomerId: 'cus_test_marketer',
      stripeConnectId: 'acct_test_marketer'
    });
    testMarketer = marketerData.user;
    marketerAuthHeader = marketerData.authHeader;

    const creatorData = await authHelpers.createAuthenticatedCreator({
      stripeCustomerId: 'cus_test_creator',
      stripeConnectId: 'acct_test_creator'
    });
    testCreator = creatorData.user;
    creatorAuthHeader = creatorData.authHeader;

    // Create test deal
    testDeal = await testUtils.createTestDeal({
      creatorId: testCreator._id,
      marketerId: testMarketer._id,
      paymentInfo: {
        amount: 1000,
        paymentAmount: 1000,
        paymentStatus: 'Pending'
      }
    });
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe('POST /api/payments/create-payment-intent', () => {
    describe('✅ Success Cases', () => {
      it('should create payment intent with valid amount and currency', async () => {
        // Setup mock
        const paymentIntent = mockHelpers.setupSuccessfulPaymentIntent(5000, 'usd');

        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 50.00,
            currency: 'usd',
            metadata: {
              dealId: testDeal._id.toString(),
              paymentType: 'escrowPayment'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body.clientSecret).toBe(paymentIntent.client_secret);
        expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith({
          amount: 5000, // $50.00 in cents
          currency: 'usd',
          metadata: {
            dealId: testDeal._id.toString(),
            paymentType: 'escrowPayment',
            userId: testUser._id.toString()
          }
        });
      });

      it('should handle different currency types', async () => {
        mockHelpers.setupSuccessfulPaymentIntent(2500, 'eur');

        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 25.00,
            currency: 'eur'
          });

        expect(response.status).toBe(200);
        expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith({
          amount: 2500,
          currency: 'eur',
          metadata: {
            userId: testUser._id.toString()
          }
        });
      });

      it('should include metadata in payment intent', async () => {
        mockHelpers.setupSuccessfulPaymentIntent(1000, 'usd');

        const metadata = {
          dealId: testDeal._id.toString(),
          paymentType: 'finalPayment',
          milestoneId: 'milestone_123'
        };

        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 10.00,
            currency: 'usd',
            metadata
          });

        expect(response.status).toBe(200);
        expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith({
          amount: 1000,
          currency: 'usd',
          metadata: {
            ...metadata,
            userId: testUser._id.toString()
          }
        });
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 400 for missing amount', async () => {
        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            currency: 'usd'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Amount is required');
      });

      it('should return 400 for invalid amount', async () => {
        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 'invalid',
            currency: 'usd'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Amount is required');
      });

      it('should handle Stripe API errors', async () => {
        mockHelpers.setupFailedPaymentIntent('amount_too_small');

        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 0.01, // Too small for Stripe
            currency: 'usd'
          });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });

      it('should return 401 for unauthorized requests', async () => {
        const response = await request(app)
          .post('/api/payments/create-payment-intent')
          .send({
            amount: 50.00,
            currency: 'usd'
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('POST /api/payments/webhook', () => {
    describe('✅ Success Cases - Payment Intent Succeeded', () => {
      it('should handle successful payment_intent.succeeded webhook', async () => {
        const webhookPayload = testUtils.generateWebhookPayload('payment_intent.succeeded', {
          metadata: {
            dealId: testDeal._id.toString(),
            paymentType: 'escrowPayment',
            escrowAmount: '500'
          }
        });

        mockHelpers.setupWebhookEvent('payment_intent.succeeded', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ received: true });

        // Verify webhook was processed
        expect(stripeMocks.webhooks.constructEvent).toHaveBeenCalled();
      });

      it('should handle milestone funding webhook', async () => {
        // Add milestone to test deal
        const milestoneId = new mongoose.Types.ObjectId();
        testDeal.milestones = [{
          _id: milestoneId,
          name: 'Test Milestone',
          amount: 500,
          status: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: testCreator._id,
          createdAt: new Date()
        }];
        await testDeal.save();

        const webhookPayload = testUtils.generateWebhookPayload('payment_intent.succeeded', {
          metadata: {
            dealId: testDeal._id.toString(),
            milestoneId: milestoneId.toString(),
            paymentType: 'milestoneFunding',
            escrowAmount: '500'
          }
        });

        mockHelpers.setupWebhookEvent('payment_intent.succeeded', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
      });

      it('should handle final payment webhook', async () => {
        const webhookPayload = testUtils.generateWebhookPayload('payment_intent.succeeded', {
          metadata: {
            dealId: testDeal._id.toString(),
            paymentType: 'finalPayment',
            escrowAmount: '500'
          }
        });

        mockHelpers.setupWebhookEvent('payment_intent.succeeded', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
      });
    });

    describe('✅ Success Cases - Payout Events', () => {
      it('should handle payout.created webhook', async () => {
        // Create test withdrawal
        const withdrawal = await testUtils.createTestWithdrawal({
          user: testUser._id,
          transactionId: 'po_test_1234567890',
          status: 'pending'
        });

        const webhookPayload = testUtils.generateWebhookPayload('payout.created', {
          id: 'po_test_1234567890',
          amount: 10000,
          destination: 'ba_test_1234567890'
        });

        mockHelpers.setupWebhookEvent('payout.created', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
      });

      it('should handle payout.paid webhook', async () => {
        const withdrawal = await testUtils.createTestWithdrawal({
          user: testUser._id,
          transactionId: 'po_test_1234567890',
          status: 'pending'
        });

        const webhookPayload = testUtils.generateWebhookPayload('payout.paid', {
          id: 'po_test_1234567890',
          amount: 10000,
          destination: 'ba_test_1234567890'
        });

        mockHelpers.setupWebhookEvent('payout.paid', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
      });

      it('should handle payout.failed webhook', async () => {
        const withdrawal = await testUtils.createTestWithdrawal({
          user: testUser._id,
          transactionId: 'po_test_1234567890',
          status: 'pending'
        });

        const webhookPayload = testUtils.generateWebhookPayload('payout.failed', {
          id: 'po_test_1234567890',
          amount: 10000,
          failure_code: 'insufficient_funds',
          failure_message: 'Insufficient funds in account'
        });

        mockHelpers.setupWebhookEvent('payout.failed', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 400 for invalid webhook signature', async () => {
        mockHelpers.setupInvalidWebhookSignature();

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'invalid_signature')
          .send(JSON.stringify({ test: 'data' }));

        expect(response.status).toBe(400);
        expect(response.text).toContain('Webhook Error');
      });

      it('should handle unrecognized webhook events gracefully', async () => {
        const webhookPayload = testUtils.generateWebhookPayload('unknown.event', {});
        mockHelpers.setupWebhookEvent('unknown.event', webhookPayload.data.object);

        const response = await request(app)
          .post('/api/payments/webhook')
          .set('stripe-signature', 'valid_signature')
          .set('content-type', 'application/json')
          .send(webhookPayload);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ received: true });
      });
    });
  });

  describe('GET /api/payments/earnings', () => {
    describe('✅ Success Cases', () => {
      beforeEach(async () => {
        // Create test earnings for the user
        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 500,
          createdAt: new Date('2024-01-15')
        });

        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 300,
          createdAt: new Date('2024-01-10')
        });

        // Create earning for different user (should not appear)
        await testUtils.createTestEarning({
          user: testMarketer._id,
          deal: testDeal._id,
          amount: 200
        });
      });

      it('should retrieve all earnings for authenticated user', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
        
        // Should be sorted by creation date (newest first)
        expect(response.body.data[0].amount).toBe(500);
        expect(response.body.data[1].amount).toBe(300);
      });

      it('should filter earnings by last 30 days', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ filter: 'last30days' })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter earnings by date range', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({
            filter: 'dateRange',
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);
      });

      it('should include deal information in earnings', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data[0]).toHaveProperty('dealName');
        expect(response.body.data[0]).toHaveProperty('dealNumber');
      });

      it('should handle pagination (implicit through sorting)', async () => {
        // Create more earnings
        for (let i = 0; i < 10; i++) {
          await testUtils.createTestEarning({
            user: testUser._id,
            deal: testDeal._id,
            amount: 100 + i,
            createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Different dates
          });
        }

        const response = await request(app)
          .get('/api/payments/earnings')
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(10);
      });

      it('should support enhanced pagination with page and limit', async () => {
        // Create 15 test earnings
        for (let i = 0; i < 15; i++) {
          await testUtils.createTestEarning({
            user: testUser._id,
            deal: testDeal._id,
            amount: 100 + i,
            createdAt: new Date(Date.now() - i * 60000) // 1 minute apart
          });
        }

        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ page: 1, limit: 5, includeCount: true })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.data).toHaveLength(5);
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.pagination).toHaveProperty('hasMore', true);
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination.total).toBeGreaterThan(15);
      });

      it('should support cursor-based pagination', async () => {
        // Create test earnings
        const earnings = [];
        for (let i = 0; i < 5; i++) {
          const earning = await testUtils.createTestEarning({
            user: testUser._id,
            deal: testDeal._id,
            amount: 100 + i,
            createdAt: new Date(Date.now() - i * 60000)
          });
          earnings.push(earning);
        }

        // First request
        const firstResponse = await request(app)
          .get('/api/payments/earnings')
          .query({ limit: 3 })
          .set(userAuthHeader);

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.data).toHaveLength(3);
        expect(firstResponse.body.pagination).toHaveProperty('nextCursor');

        // Second request with cursor
        const nextCursor = firstResponse.body.pagination.nextCursor;
        const secondResponse = await request(app)
          .get('/api/payments/earnings')
          .query({ limit: 3, cursor: nextCursor })
          .set(userAuthHeader);

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body.data.length).toBeGreaterThan(0);
      });

      it('should filter earnings by transaction status', async () => {
        // Create earnings with different statuses
        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 100,
          status: 'completed'
        });

        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 200,
          status: 'escrowed'
        });

        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 300,
          status: 'pending'
        });

        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ status: 'escrowed' })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('status', 'escrowed');
        expect(response.body.data[0]).toHaveProperty('amount', 200);
      });

      it('should include filters metadata in response', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ 
            filter: 'dateRange', 
            startDate: '2024-01-01', 
            endDate: '2024-01-31',
            status: 'completed'
          })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('filters');
        expect(response.body.filters.applied).toHaveProperty('dateRange');
        expect(response.body.filters.applied).toHaveProperty('status', 'completed');
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app)
          .get('/api/payments/earnings');

        expect(response.status).toBe(401);
      });

      it('should handle database errors gracefully', async () => {
        // Mock database error with proper query chain
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        
        const originalFind = Earning.find;
        Earning.find = jest.fn().mockReturnValue(mockQuery);

        const response = await request(app)
          .get('/api/payments/earnings')
          .set(userAuthHeader);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        // Restore original method
        Earning.find = originalFind;
      });

      it('should validate invalid date formats', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ 
            filter: 'dateRange', 
            startDate: 'invalid-date', 
            endDate: '2024-01-31' 
          })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid date format');
      });

      it('should reject start date after end date', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ 
            filter: 'dateRange', 
            startDate: '2024-02-01', 
            endDate: '2024-01-01' 
          })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Start date cannot be after end date');
      });

      it('should reject date ranges exceeding 2 years', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ 
            filter: 'dateRange', 
            startDate: '2020-01-01', 
            endDate: '2024-01-01' 
          })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Date range cannot exceed 2 years');
      });

      it('should validate transaction status values', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ status: 'invalid-status' })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid status');
      });

      it('should validate pagination limits', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ page: 0, limit: 200 })
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body.pagination.page).toBe(1); // Should default to 1
        expect(response.body.pagination.limit).toBe(100); // Should cap at 100
      });

      it('should validate cursor format', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ cursor: 'invalid-cursor' })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid cursor format');
      });

      it('should require dateRange filter when providing date parameters', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ 
            startDate: '2024-01-01', 
            endDate: '2024-01-31' 
          })
          .set(userAuthHeader);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('filter must be \'dateRange\'');
      });

      it('should handle missing deal data gracefully', async () => {
        // Create earning without deal reference
        await testUtils.createTestEarning({
          user: testUser._id,
          deal: null,
          amount: 100
        });

        const response = await request(app)
          .get('/api/payments/earnings')
          .set(userAuthHeader);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('dealName', 'Unknown Deal');
        expect(response.body.data[0]).toHaveProperty('dealNumber', 'N/A');
      });
    });

    describe('🔑 Role-Based Access Control', () => {
      it('should allow admin users to access other user earnings', async () => {
        // Create admin user
        const adminData = await authHelpers.createAuthenticatedUser({
          role: 'admin',
          userType: 'Marketer'
        });

        // Create earning for regular user
        await testUtils.createTestEarning({
          user: testUser._id,
          deal: testDeal._id,
          amount: 500
        });

        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ adminUserId: testUser._id.toString() })
          .set(adminData.authHeader);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toHaveProperty('amount', 500);
      });

      it('should reject non-admin users trying to access other user earnings', async () => {
        const response = await request(app)
          .get('/api/payments/earnings')
          .query({ adminUserId: testMarketer._id.toString() })
          .set(userAuthHeader);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Insufficient permissions');
      });
    });
  });

  describe('GET /api/payments/earnings/summary', () => {
    beforeEach(async () => {
      // Create test earnings
      await testUtils.createTestEarning({
        user: testUser._id,
        amount: 1000,
        createdAt: new Date()
      });

      await testUtils.createTestEarning({
        user: testUser._id,
        amount: 500,
        createdAt: new Date()
      });

      // Create test withdrawal
      await testUtils.createTestWithdrawal({
        user: testUser._id,
        amount: 300
      });
    });

    it('should return earnings summary with correct calculations', async () => {
      const response = await request(app)
        .get('/api/payments/earnings/summary')
        .set(userAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalEarned', 1500);
      expect(response.body).toHaveProperty('totalWithdrawn', 300);
      expect(response.body).toHaveProperty('availableBalance', 1200);
      expect(response.body).toHaveProperty('currentWeekEarnings');
    });

    it('should filter earnings by date range', async () => {
      const response = await request(app)
        .get('/api/payments/earnings/summary')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .set(userAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalEarned');
      expect(response.body).toHaveProperty('availableBalance');
    });
  });

  describe('POST /api/payments/create-checkout-session', () => {
    describe('✅ Success Cases', () => {
      it('should create checkout session for offer fee', async () => {
        const session = mockHelpers.setupSuccessfulCheckoutSession(100); // $1.00

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .set(userAuthHeader)
          .send({
            amount: 1,
            currency: 'usd',
            quantity: 1,
            metadata: {
              paymentType: 'offerFee',
              dealId: testDeal._id.toString()
            }
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body).toHaveProperty('sessionId');
      });

      it('should create checkout session for escrow payment', async () => {
        const session = mockHelpers.setupSuccessfulCheckoutSession(50000); // $500.00

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .set(userAuthHeader)
          .send({
            amount: 500,
            currency: 'usd',
            metadata: {
              paymentType: 'escrowPayment',
              dealId: testDeal._id.toString(),
              escrowAmount: '400',
              feeAmount: '50',
              bonusAmount: '50'
            }
          });

        expect(response.status).toBe(200);
        expect(stripeMocks.checkout.sessions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
            mode: 'payment',
            line_items: expect.any(Array)
          })
        );
      });

      it('should include user ID in metadata', async () => {
        mockHelpers.setupSuccessfulCheckoutSession(100);

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .set(userAuthHeader)
          .send({
            amount: 1,
            metadata: { paymentType: 'offerFee' }
          });

        expect(response.status).toBe(200);
        
        // Verify the call includes userId in metadata
        const createCall = stripeMocks.checkout.sessions.create.mock.calls[0][0];
        expect(createCall.metadata).toHaveProperty('userId', testUser._id.toString());
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthorized requests', async () => {
        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .send({
            amount: 1,
            currency: 'usd'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });

      it('should handle Stripe errors', async () => {
        const error = new Error('Stripe API error');
        stripeMocks.checkout.sessions.create.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/payments/create-checkout-session')
          .set(userAuthHeader)
          .send({
            amount: 1,
            currency: 'usd'
          });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('POST /api/payments/confirm-payment', () => {
    describe('✅ Success Cases', () => {
      it('should confirm payment intent successfully', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'succeeded',
          amount: 5000,
          currency: 'usd'
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890',
            paymentMethodId: 'pm_test_1234567890'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'succeeded');
        expect(response.body.paymentIntent).toHaveProperty('id', 'pi_test_1234567890');
        expect(stripeMocks.paymentIntents.confirm).toHaveBeenCalledWith(
          'pi_test_1234567890',
          { payment_method: 'pm_test_1234567890' }
        );
      });

      it('should confirm payment and create escrow for deals', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'succeeded',
          amount: 50000,
          currency: 'usd'
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890',
            dealId: testDeal._id.toString(),
            escrowAmount: 500
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'succeeded');
        
        // Verify escrow was created
        const updatedDeal = await Deal.findById(testDeal._id);
        expect(updatedDeal.paymentInfo.paymentStatus).toBe('Paid');
        expect(updatedDeal.paymentInfo.transactions).toHaveLength(1);
        expect(updatedDeal.paymentInfo.transactions[0].type).toBe('escrow');
      });

      it('should handle 3D Secure authentication requirements', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'requires_action',
          client_secret: 'pi_test_1234567890_secret',
          next_action: {
            type: 'use_stripe_sdk'
          }
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'requires_action');
        expect(response.body).toHaveProperty('client_secret');
        expect(response.body).toHaveProperty('next_action');
      });

      it('should confirm payment without payment method if already attached', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'succeeded',
          amount: 2500,
          currency: 'usd'
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(200);
        expect(stripeMocks.paymentIntents.confirm).toHaveBeenCalledWith('pi_test_1234567890');
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthorized requests', async () => {
        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });

      it('should return 400 for missing payment intent ID', async () => {
        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Payment Intent ID is required');
      });

      it('should return 404 for non-existent payment intent', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_nonexistent'
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Payment intent not found');
      });

      it('should handle already confirmed payment intents', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'succeeded'
        });

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Payment intent already confirmed');
      });

      it('should handle canceled payment intents', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'canceled'
        });

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Payment intent has been canceled');
      });

      it('should handle card declined errors', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });

        const stripeError = new Error('Your card was declined.');
        stripeError.type = 'StripeCardError';
        stripeError.decline_code = 'generic_decline';
        stripeError.message = 'Your card was declined.';
        
        stripeMocks.paymentIntents.confirm.mockRejectedValue(stripeError);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Payment failed');
        expect(response.body).toHaveProperty('decline_code', 'generic_decline');
      });

      it('should handle rate limit errors', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });

        const rateLimitError = new Error('Too many requests');
        rateLimitError.type = 'StripeRateLimitError';
        
        stripeMocks.paymentIntents.confirm.mockRejectedValue(rateLimitError);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(429);
        expect(response.body).toHaveProperty('error', 'Too many requests, please try again later');
      });

      it('should handle invalid request errors', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });

        const invalidError = new Error('Invalid payment method');
        invalidError.type = 'StripeInvalidRequestError';
        invalidError.message = 'Invalid payment method';
        
        stripeMocks.paymentIntents.confirm.mockRejectedValue(invalidError);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890',
            paymentMethodId: 'pm_invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid request');
        expect(response.body).toHaveProperty('message', 'Invalid payment method');
      });

      it('should handle payment failed status', async () => {
        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });

        const failedPayment = {
          id: 'pi_test_1234567890',
          status: 'payment_failed',
          last_payment_error: {
            decline_code: 'insufficient_funds',
            message: 'Your card has insufficient funds.'
          }
        };
        
        stripeMocks.paymentIntents.confirm.mockResolvedValue(failedPayment);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(userAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Payment failed');
        expect(response.body).toHaveProperty('decline_code', 'insufficient_funds');
      });
    });

    describe('🔒 Escrow Creation Tests', () => {
      it('should create earning record with escrowed status', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'succeeded',
          amount: 100000,
          currency: 'usd'
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(marketerAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890',
            dealId: testDeal._id.toString(),
            escrowAmount: 1000
          });

        expect(response.status).toBe(200);
        
        // Verify earning was created with escrowed status
        const earning = await Earning.findOne({
          deal: testDeal._id,
          transactionId: 'pi_test_1234567890'
        });
        
        expect(earning).toBeTruthy();
        expect(earning.status).toBe('escrowed');
        expect(earning.amount).toBe(1000);
        expect(earning.user.toString()).toBe(testCreator._id.toString());
      });

      it('should continue processing even if escrow creation fails', async () => {
        const paymentIntent = {
          id: 'pi_test_1234567890',
          status: 'succeeded',
          amount: 50000,
          currency: 'usd'
        };

        stripeMocks.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_1234567890',
          status: 'requires_confirmation'
        });
        stripeMocks.paymentIntents.confirm.mockResolvedValue(paymentIntent);

        // Mock Deal.findById to throw error
        const originalFindById = Deal.findById;
        Deal.findById = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/payments/confirm-payment')
          .set(marketerAuthHeader)
          .send({
            paymentIntentId: 'pi_test_1234567890',
            dealId: 'invalid_deal_id',
            escrowAmount: 500
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'succeeded');

        // Restore original method
        Deal.findById = originalFindById;
      });
    });
  });

  describe('GET /api/payments/session-status', () => {
    it('should retrieve session status successfully', async () => {
      const session = mockHelpers.setupSuccessfulCheckoutSession();
      session.payment_intent = {
        charges: {
          data: [{ id: 'ch_test_1234567890' }]
        }
      };
      
      stripeMocks.checkout.sessions.retrieve.mockResolvedValue(session);

      const response = await request(app)
        .get('/api/payments/session-status')
        .query({ session_id: 'cs_test_1234567890' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payment_status', 'paid');
      expect(response.body).toHaveProperty('transaction_number');
    });

    it('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .get('/api/payments/session-status');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Session ID is required');
    });
  });

  describe('Access Control Tests', () => {
    it('should only allow users to access their own earnings', async () => {
      // Create earning for user 1
      await testUtils.createTestEarning({
        user: testUser._id,
        amount: 500
      });

      // User 2 tries to access user 1's earnings (should only see their own)
      const response = await request(app)
        .get('/api/payments/earnings')
        .set(marketerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(0); // Should see no earnings
    });

    it('should only allow users to access their own withdrawal history', async () => {
      // Create withdrawal for user 1
      await testUtils.createTestWithdrawal({
        user: testUser._id,
        amount: 100
      });

      // User 2 tries to access user 1's withdrawals
      const response = await request(app)
        .get('/api/payments/withdrawals/history')
        .set(marketerAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0); // Should see no withdrawals
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      mockHelpers.setupSuccessfulPaymentIntent();
      
      const requests = Array(10).fill().map(() => 
        request(app)
          .post('/api/payments/create-payment-intent')
          .set(userAuthHeader)
          .send({
            amount: 50,
            currency: 'usd'
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('clientSecret');
      });
    });

    it('should handle large amounts of earnings data efficiently', async () => {
      // Create many earnings
      const earnings = Array(100).fill().map((_, i) => ({
        user: testUser._id,
        deal: testDeal._id,
        amount: 100 + i,
        createdAt: new Date(Date.now() - i * 60000) // 1 minute apart
      }));

      await Earning.insertMany(earnings);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/payments/earnings')
        .set(userAuthHeader);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      // Since we created 100 + the 2 from beforeEach, minus pagination limit of 50
      expect(response.body.data.length).toBeGreaterThan(0);
<<<<<<< HEAD
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
=======
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms per payment endpoint SLA
>>>>>>> feature/testing-infrastructure
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle zero amount payments', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set(userAuthHeader)
        .send({
          amount: 0,
          currency: 'usd'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Amount is required');
    });

    it('should handle very large amounts', async () => {
      mockHelpers.setupSuccessfulPaymentIntent(99999999); // $999,999.99

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set(userAuthHeader)
        .send({
          amount: 999999.99,
          currency: 'usd'
        });

      expect(response.status).toBe(200);
      expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith({
        amount: 99999999,
        currency: 'usd',
        metadata: { userId: testUser._id.toString() }
      });
    });

    it('should handle malformed JSON in webhook', async () => {
      mockHelpers.setupInvalidWebhookSignature();
      
      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_signature')
        .set('content-type', 'text/plain')
        .send('malformed json');

      expect(response.status).toBe(400);
      expect(response.text).toContain('Webhook Error');
    });

    it('should handle missing deal in earnings query', async () => {
      // Create earning without deal reference
      await testUtils.createTestEarning({
        user: testUser._id,
        deal: null,
        amount: 100
      });

      const response = await request(app)
        .get('/api/payments/earnings')
        .set(userAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
    });
  });
});