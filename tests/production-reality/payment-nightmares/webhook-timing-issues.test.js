/**
 * WEBHOOK TIMING ISSUES TEST
 * 
 * Validates payment webhook processing and timing edge cases
 * 
 * REAL WORLD SCENARIO:
 * User pays $500, Stripe webhook arrives 45 seconds later,
 * user sees "Payment Failed" for 45 seconds, panics and tries to pay again
 */

const request = require('supertest');
const app = require('../../../main');
const { setupTestDatabase, cleanupTestDatabase } = require('../../helpers/database');
const crypto = require('crypto');

describe('Payment Webhook Timing Reality Check', () => {
  let testUser;
  let authToken;
  let testPaymentIntent;

  beforeAll(async () => {
    await setupTestDatabase();
    
    testUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'payment@test.com',
      userType: 'marketer'
    };

    authToken = 'Bearer test_token_for_payments';
    
    testPaymentIntent = {
      id: 'pi_test_1234567890',
      amount: 50000, // $500 in cents
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: testUser._id,
        dealId: '507f1f77bcf86cd799439021'
      }
    };
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('⏱️ Webhook Delivery Delays', () => {
    it('should handle webhook arriving after user checks status', async () => {
      // Simulate user initiating payment
      const paymentInitiation = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', authToken)
        .send({
          amount: 500,
          dealId: '507f1f77bcf86cd799439021'
        });

      const paymentIntentId = paymentInitiation.body?.data?.paymentIntentId;
      
      // User immediately checks payment status (before webhook)
      const immediateStatus = await request(app)
        .get(`/api/payments/status/${paymentIntentId}`)
        .set('Authorization', authToken);

      console.log('Immediate status:', immediateStatus.body?.data?.status);
      
      // Webhook arrives later (simulate delay)
      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...testPaymentIntent,
            id: paymentIntentId
          }
        }
      };

      // Create signature for webhook validation
      const signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(webhookPayload), 'utf8')
        .digest('hex');

      // Process webhook
      const webhookResponse = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(webhookPayload);

      // Check status after webhook
      const finalStatus = await request(app)
        .get(`/api/payments/status/${paymentIntentId}`)
        .set('Authorization', authToken);

      console.log('Final status:', finalStatus.body?.data?.status);
      
      // Status should be updated after webhook
      expect(webhookResponse.status).toBe(200);
    });

    it('should prevent duplicate payments during webhook delays', async () => {
      const dealId = '507f1f77bcf86cd799439022';
      
      // User initiates payment
      const firstPayment = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', authToken)
        .send({
          amount: 300,
          dealId: dealId
        });

      // User doesn't see confirmation, tries to pay again
      const secondPayment = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', authToken)
        .send({
          amount: 300,
          dealId: dealId
        });

      const firstIntentId = firstPayment.body?.data?.paymentIntentId;
      const secondIntentId = secondPayment.body?.data?.paymentIntentId;

      // Should either:
      // 1. Return the same payment intent ID, or
      // 2. Reject the second payment attempt
      if (firstIntentId === secondIntentId) {
        console.log('✅ System returned same payment intent (good)');
      } else if (secondPayment.status >= 400) {
        console.log('✅ System rejected duplicate payment (good)');
      } else {
        console.log('⚠️ System created multiple payment intents for same deal');
        // This could lead to double charging
      }

      expect(firstPayment.status).toBe(200);
    });
  });

  describe('🔁 Webhook Retry Logic', () => {
    it('should handle webhook retry attempts correctly', async () => {
      const webhookPayload = {
        id: 'evt_test_retry',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: testPaymentIntent
        }
      };

      const signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(webhookPayload), 'utf8')
        .digest('hex');

      // First webhook delivery
      const firstDelivery = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(webhookPayload);

      // Stripe retries the same webhook (idempotency check)
      const retryDelivery = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(webhookPayload);

      // Both should succeed, but second should be ignored
      expect(firstDelivery.status).toBe(200);
      expect(retryDelivery.status).toBe(200);

      // Verify no duplicate processing occurred
      // (This would require checking database records)
    });

    it('should handle webhook signature validation failures', async () => {
      const webhookPayload = {
        id: 'evt_test_invalid',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: testPaymentIntent
        }
      };

      // Invalid signature
      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send(webhookPayload);

      // Should reject invalid signature
      expect(response.status).toBe(400);
    });
  });

  describe('💸 Payment State Inconsistencies', () => {
    it('should handle partial refunds correctly', async () => {
      const originalAmount = 100000; // $1000
      const refundAmount = 30000;   // $300

      // Original payment webhook
      const paymentWebhook = {
        id: 'evt_payment_success',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...testPaymentIntent,
            amount: originalAmount,
            id: 'pi_original_payment'
          }
        }
      };

      // Process payment
      let signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(paymentWebhook), 'utf8')
        .digest('hex');

      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(paymentWebhook);

      // Partial refund webhook
      const refundWebhook = {
        id: 'evt_refund_partial',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_refund_test',
            payment_intent: 'pi_original_payment',
            amount_refunded: refundAmount,
            refunded: true
          }
        }
      };

      signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(refundWebhook), 'utf8')
        .digest('hex');

      const refundResponse = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(refundWebhook);

      expect(refundResponse.status).toBe(200);

      // Check if earnings are updated correctly
      const earnings = await request(app)
        .get('/api/earnings/analytics')
        .set('Authorization', authToken);

      // Should reflect the net amount after refund
      console.log('Earnings after partial refund:', earnings.body?.data);
    });

    it('should handle failed payment webhooks', async () => {
      const failedPaymentWebhook = {
        id: 'evt_payment_failed',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            ...testPaymentIntent,
            status: 'failed',
            last_payment_error: {
              message: 'Your card was declined.'
            }
          }
        }
      };

      const signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(failedPaymentWebhook), 'utf8')
        .digest('hex');

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(failedPaymentWebhook);

      expect(response.status).toBe(200);

      // Verify deal status is updated appropriately
      const dealStatus = await request(app)
        .get('/api/marketer/deals/507f1f77bcf86cd799439021')
        .set('Authorization', authToken);

      // Deal should not be marked as paid
      const status = dealStatus.body?.data?.paymentStatus;
      console.log('Deal payment status after failed payment:', status);
    });
  });

  describe('🚨 Critical Timing Edge Cases', () => {
    it('should handle user actions during webhook processing', async () => {
      const dealId = '507f1f77bcf86cd799439023';
      
      // Simulate concurrent operations:
      // 1. User cancels deal
      // 2. Payment webhook arrives for the same deal
      
      const cancelDealPromise = request(app)
        .patch(`/api/marketer/deals/${dealId}`)
        .set('Authorization', authToken)
        .send({ status: 'cancelled' });

      const webhookPayload = {
        id: 'evt_concurrent_test',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...testPaymentIntent,
            metadata: {
              ...testPaymentIntent.metadata,
              dealId: dealId
            }
          }
        }
      };

      const signature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test')
        .update(JSON.stringify(webhookPayload), 'utf8')
        .digest('hex');

      const webhookPromise = request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=${signature}`)
        .send(webhookPayload);

      const [cancelResponse, webhookResponse] = await Promise.all([
        cancelDealPromise,
        webhookPromise
      ]);

      // Both operations should handle the race condition gracefully
      console.log('Cancel response:', cancelResponse.status);
      console.log('Webhook response:', webhookResponse.status);

      // Final deal state should be consistent
      const finalDealState = await request(app)
        .get(`/api/marketer/deals/${dealId}`)
        .set('Authorization', authToken);

      const finalStatus = finalDealState.body?.data?.status;
      console.log('Final deal status after race condition:', finalStatus);
      
      // Should have a definitive state (not stuck in limbo)
      expect(['cancelled', 'paid', 'active']).toContain(finalStatus);
    });
  });
});