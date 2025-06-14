// Test setup file - imported before all tests
// This ensures consistent environment and service mocking across all test suites

// Set test environment first
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Import comprehensive service mocks
require('./helpers/serviceMocks');

// Set up additional test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'test_twilio_sid';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test_twilio_token';
process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+12125550000';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret';
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || 'test-firebase-private-key';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@axees-app.iam.gserviceaccount.com';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'axees-app-test';
process.env.MESSAGECENTRAL_API_KEY = process.env.MESSAGECENTRAL_API_KEY || 'test-messagecentral-key';
process.env.MESSAGECENTRAL_BASE_URL = process.env.MESSAGECENTRAL_BASE_URL || 'https://api.messagecentral.com';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-openai-key';

// Payment configuration
process.env.PLATFORM_FEE_PERCENTAGE = process.env.PLATFORM_FEE_PERCENTAGE || '5'; // 5% platform fee
process.env.ESCROW_RELEASE_PERCENTAGE = process.env.ESCROW_RELEASE_PERCENTAGE || '50'; // 50% upfront

// Notification configuration
process.env.NOTIFICATION_DELAY_MS = process.env.NOTIFICATION_DELAY_MS || '2000'; // 2 seconds for testing
process.env.PUSH_NOTIFICATION_ENABLED = process.env.PUSH_NOTIFICATION_ENABLED || 'true';
process.env.EMAIL_NOTIFICATION_ENABLED = process.env.EMAIL_NOTIFICATION_ENABLED || 'true';
process.env.SMS_NOTIFICATION_ENABLED = process.env.SMS_NOTIFICATION_ENABLED || 'true';

// Global test timeout (30 seconds for integration tests)
jest.setTimeout(30000);

// Set up global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate test phone numbers
  generateTestPhone: (index = 0) => `+1212555${1000 + index}`,
  
  // Helper to generate test emails
  generateTestEmail: (prefix = 'test') => `${prefix}+${Date.now()}@example.com`,
  
  // Helper to generate test usernames
  generateTestUsername: (prefix = 'testuser') => `${prefix}${Date.now()}`,
  
  // Helper to create test file buffer
  createTestFile: (size = 1024, content = 'test file content') => {
    return Buffer.alloc(size, content);
  },
  
  // Helper to validate ObjectId format
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  
  // Helper to validate JWT token format
  isValidJWT: (token) => {
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token);
  },
  
  // Helper to validate phone number format
  isValidPhone: (phone) => {
    return /^\+1\d{10}$/.test(phone);
  },
  
  // Helper to validate email format
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: process.env.VERBOSE_TESTS === 'true' ? originalConsole.log : jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Keep error logging for debugging (but filter out known test noise)
  error: (...args) => {
    const message = args.join(' ');
    
    // Filter out known test-related errors/warnings
    if (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('DeprecationWarning') ||
      message.includes('ExperimentalWarning') ||
      message.includes('mongoose connection') ||
      message.includes('ValidationError') ||
      message.includes('CastError')
    ) {
      return;
    }
    
    originalConsole.error.apply(console, args);
  }
};

// Global test hooks
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Restore original console methods
  Object.assign(console, originalConsole);
  
  // Close any open handles
  await new Promise(resolve => setTimeout(() => resolve(), 500));
});

// Global error handlers for tests
process.on('unhandledRejection', (reason, promise) => {
  // Filter out test-related unhandled rejections
  const reasonStr = String(reason);
  if (
    reasonStr.includes('MongooseError') ||
    reasonStr.includes('ValidationError') ||
    reasonStr.includes('Test timeout') ||
    reasonStr.includes('Cannot read properties of null')
  ) {
    return;
  }
  
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  // Filter out test-related uncaught exceptions
  const errorStr = String(error);
  if (
    errorStr.includes('MongooseError') ||
    errorStr.includes('Test timeout') ||
    errorStr.includes('Cannot read properties of null')
  ) {
    return;
  }
  
  console.error('Uncaught Exception:', error);
});