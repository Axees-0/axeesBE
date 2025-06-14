// tests/helpers/stripeMocks.js

/**
 * Comprehensive Stripe mock for payment tests
 * Simulates all Stripe SDK methods used in the application
 */

const stripeMocks = {
  // Mock payment intent operations
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
  },

  // Mock checkout session operations
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },

  // Mock webhook operations
  webhooks: {
    constructEvent: jest.fn(),
  },

  // Mock customer operations
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },

  // Mock payment method operations
  paymentMethods: {
    attach: jest.fn(),
    detach: jest.fn(),
    list: jest.fn(),
  },

  // Mock account operations for Connect
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    createExternalAccount: jest.fn(),
    listExternalAccounts: jest.fn(),
    retrieveExternalAccount: jest.fn(),
  },

  // Mock transfer operations
  transfers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },

  // Mock payout operations
  payouts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
  },

  // Mock refund operations
  refunds: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },

  // Mock balance operations
  balance: {
    retrieve: jest.fn(),
  },
};

/**
 * Helper functions to setup common mock responses
 */
const mockHelpers = {
  /**
   * Setup successful payment intent creation
   */
  setupSuccessfulPaymentIntent: (amount = 5000, currency = 'usd') => {
    const paymentIntent = {
      id: 'pi_test_1234567890',
      object: 'payment_intent',
      amount,
      currency,
      status: 'requires_payment_method',
      client_secret: 'pi_test_1234567890_secret_test',
      metadata: {},
      charges: {
        data: [{
          id: 'ch_test_1234567890',
          amount,
          currency,
          status: 'succeeded'
        }]
      }
    };

    stripeMocks.paymentIntents.create.mockResolvedValue(paymentIntent);
    stripeMocks.paymentIntents.retrieve.mockResolvedValue(paymentIntent);
    
    return paymentIntent;
  },

  /**
   * Setup successful payment intent confirmation
   */
  setupSuccessfulPaymentConfirmation: (amount = 5000, currency = 'usd') => {
    const retrieveResponse = {
      id: 'pi_test_1234567890',
      object: 'payment_intent',
      amount,
      currency,
      status: 'requires_confirmation',
      client_secret: 'pi_test_1234567890_secret_test',
      metadata: {}
    };

    const confirmResponse = {
      id: 'pi_test_1234567890',
      object: 'payment_intent',
      amount,
      currency,
      status: 'succeeded',
      client_secret: 'pi_test_1234567890_secret_test',
      metadata: {},
      charges: {
        data: [{
          id: 'ch_test_1234567890',
          amount,
          currency,
          status: 'succeeded'
        }]
      }
    };

    stripeMocks.paymentIntents.retrieve.mockResolvedValue(retrieveResponse);
    stripeMocks.paymentIntents.confirm.mockResolvedValue(confirmResponse);
    
    return { retrieveResponse, confirmResponse };
  },

  /**
   * Setup payment intent requiring 3D Secure
   */
  setupPaymentIntentRequiringAction: (amount = 5000, currency = 'usd') => {
    const retrieveResponse = {
      id: 'pi_test_1234567890',
      status: 'requires_confirmation'
    };

    const confirmResponse = {
      id: 'pi_test_1234567890',
      object: 'payment_intent',
      amount,
      currency,
      status: 'requires_action',
      client_secret: 'pi_test_1234567890_secret_test',
      next_action: {
        type: 'use_stripe_sdk'
      }
    };

    stripeMocks.paymentIntents.retrieve.mockResolvedValue(retrieveResponse);
    stripeMocks.paymentIntents.confirm.mockResolvedValue(confirmResponse);
    
    return { retrieveResponse, confirmResponse };
  },

  /**
   * Setup payment intent confirmation failure
   */
  setupPaymentConfirmationFailure: (errorType = 'card_declined') => {
    const retrieveResponse = {
      id: 'pi_test_1234567890',
      status: 'requires_confirmation'
    };

    const error = new Error('Your card was declined.');
    error.type = 'StripeCardError';
    error.code = errorType;
    error.decline_code = 'generic_decline';
    
    stripeMocks.paymentIntents.retrieve.mockResolvedValue(retrieveResponse);
    stripeMocks.paymentIntents.confirm.mockRejectedValue(error);
    
    return { retrieveResponse, error };
  },

  /**
   * Setup failed payment intent
   */
  setupFailedPaymentIntent: (errorCode = 'card_declined') => {
    const error = new Error('Your card was declined.');
    error.type = 'StripeCardError';
    error.code = errorCode;
    error.decline_code = 'generic_decline';
    
    stripeMocks.paymentIntents.create.mockRejectedValue(error);
    return error;
  },

  /**
   * Setup successful checkout session
   */
  setupSuccessfulCheckoutSession: (amount = 5000) => {
    const session = {
      id: 'cs_test_1234567890',
      object: 'checkout.session',
      mode: 'payment',
      payment_status: 'paid',
      client_secret: 'cs_test_1234567890_secret',
      amount_total: amount,
      currency: 'usd',
      payment_intent: 'pi_test_1234567890',
      metadata: {}
    };

    stripeMocks.checkout.sessions.create.mockResolvedValue(session);
    stripeMocks.checkout.sessions.retrieve.mockResolvedValue(session);
    
    return session;
  },

  /**
   * Setup webhook event construction
   */
  setupWebhookEvent: (eventType = 'payment_intent.succeeded', data = {}) => {
    const event = {
      id: 'evt_test_1234567890',
      object: 'event',
      type: eventType,
      data: {
        object: {
          id: 'pi_test_1234567890',
          object: 'payment_intent',
          status: 'succeeded',
          ...data
        }
      },
      created: Math.floor(Date.now() / 1000)
    };

    stripeMocks.webhooks.constructEvent.mockReturnValue(event);
    return event;
  },

  /**
   * Setup invalid webhook signature
   */
  setupInvalidWebhookSignature: () => {
    const error = new Error('Invalid signature');
    error.type = 'StripeSignatureVerificationError';
    stripeMocks.webhooks.constructEvent.mockImplementation(() => {
      throw error;
    });
    return error;
  },

  /**
   * Setup successful Connect account operations
   */
  setupConnectAccount: () => {
    const account = {
      id: 'acct_test_1234567890',
      object: 'account',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      type: 'express'
    };

    stripeMocks.accounts.create.mockResolvedValue(account);
    stripeMocks.accounts.retrieve.mockResolvedValue(account);
    
    return account;
  },

  /**
   * Setup external account (bank account) operations
   */
  setupExternalAccount: () => {
    const bankAccount = {
      id: 'ba_test_1234567890',
      object: 'bank_account',
      bank_name: 'Test Bank',
      last4: '1234',
      currency: 'usd',
      status: 'verified'
    };

    stripeMocks.accounts.createExternalAccount.mockResolvedValue(bankAccount);
    stripeMocks.accounts.retrieveExternalAccount.mockResolvedValue(bankAccount);
    stripeMocks.accounts.listExternalAccounts.mockResolvedValue({
      data: [bankAccount]
    });
    
    return bankAccount;
  },

  /**
   * Setup balance operations
   */
  setupBalance: (availableAmount = 100000) => {
    const balance = {
      object: 'balance',
      available: [
        {
          amount: availableAmount,
          currency: 'usd'
        }
      ],
      pending: [
        {
          amount: 0,
          currency: 'usd'
        }
      ]
    };

    stripeMocks.balance.retrieve.mockResolvedValue(balance);
    return balance;
  },

  /**
   * Reset all mocks
   */
  resetMocks: () => {
    Object.values(stripeMocks).forEach(mockCategory => {
      if (typeof mockCategory === 'object') {
        Object.values(mockCategory).forEach(mock => {
          if (typeof mock.mockReset === 'function') {
            mock.mockReset();
          } else if (typeof mock === 'object') {
            Object.values(mock).forEach(nestedMock => {
              if (typeof nestedMock.mockReset === 'function') {
                nestedMock.mockReset();
              }
            });
          }
        });
      }
    });
  },

  /**
   * Get call count for specific mock
   */
  getCallCount: (mockPath) => {
    const pathParts = mockPath.split('.');
    let current = stripeMocks;
    
    for (const part of pathParts) {
      current = current[part];
    }
    
    return current.mock?.calls?.length || 0;
  }
};

module.exports = {
  stripeMocks,
  mockHelpers
};