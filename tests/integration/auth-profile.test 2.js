const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const { generateTestToken, generateExpiredToken } = require('../helpers/auth');

// Mock external services
jest.mock('twilio', () => ({
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'SM123456789', status: 'sent' })
  }
}));

jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

describe('Authentication Profile & Token Tests', () => {
  let testUser;
  
  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      phone: '+12125551234',
      name: 'Test User',
      userType: 'Creator',
      isActive: true,
      password: '$2b$10$YourHashedPasswordHere'
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/account/profile/:userId', () => {
    it('should return user profile with valid token', async () => {
      const token = generateTestToken({
        id: testUser._id.toString(),
        phone: testUser.phone,
        userType: testUser.userType
      });

      const response = await request(app)
        .get(`/api/account/profile/${testUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.phone).toBe('+12125551234');
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(`/api/account/profile/${testUser._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get(`/api/account/profile/${testUser._id}`)
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = generateExpiredToken({
        id: testUser._id.toString(),
        phone: testUser.phone,
        userType: testUser.userType
      });

      const response = await request(app)
        .get(`/api/account/profile/${testUser._id}`)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should reject request with malformed authorization header', async () => {
      const token = generateTestToken({
        id: testUser._id.toString(),
        phone: testUser.phone,
        userType: testUser.userType
      });

      const response = await request(app)
        .get(`/api/account/profile/${testUser._id}`)
        .set('Authorization', token); // Missing 'Bearer' prefix

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject access to other users profiles', async () => {
      // Create another user
      const otherUser = await User.create({
        phone: '+12125551235',
        name: 'Other User',
        userType: 'Creator',
        isActive: true,
        password: '$2b$10$YourHashedPasswordHere'
      });

      const token = generateTestToken({
        id: testUser._id.toString(),
        phone: testUser.phone,
        userType: testUser.userType
      });

      const response = await request(app)
        .get(`/api/account/profile/${otherUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('Token Expiration Handling', () => {
    it('should handle token expiration gracefully on protected routes', async () => {
      const expiredToken = generateExpiredToken({
        id: testUser._id.toString(),
        phone: testUser.phone,
        userType: testUser.userType
      });

      // Test on multiple protected endpoints
      const protectedEndpoints = [
        '/api/users/profile',
        '/api/marketer/offers',
        '/api/payments/history'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('expired');
      }
    });
  });

  describe('Password Validation Rules', () => {
    it('should enforce minimum password length', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'Short1!', // Too short (less than 8 chars)
          name: 'Test User',
          userType: 'Creator'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should require uppercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'lowercase123!', // No uppercase
          name: 'Test User',
          userType: 'Creator'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('uppercase');
    });

    it('should require lowercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'UPPERCASE123!', // No lowercase
          name: 'Test User',
          userType: 'Creator'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('lowercase');
    });

    it('should require number in password', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'NoNumbers!', // No numbers
          name: 'Test User',
          userType: 'Creator'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('number');
    });

    it('should require special character in password', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'NoSpecial123', // No special chars
          name: 'Test User',
          userType: 'Creator'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('special character');
    });

    it('should accept valid password meeting all requirements', async () => {
      const response = await request(app)
        .post('/api/auth/complete-profile')
        .send({
          phone: '+12125551235',
          password: 'ValidPass123!', // Meets all requirements
          name: 'Test User',
          userType: 'Creator'
        });

      // Should proceed to next validation or success
      expect(response.status).not.toBe(400);
    });
  });

  describe('OTP Rate Limiting', () => {
    it('should limit OTP resend attempts', async () => {
      // Create temp registration
      const TempRegistration = require('../../models/TempRegistration');
      await TempRegistration.create({
        phone: '+12125551236',
        userType: 'Creator',
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        otpSentAt: new Date()
      });

      // Attempt multiple resends
      const maxAttempts = 3;
      for (let i = 0; i < maxAttempts + 1; i++) {
        const response = await request(app)
          .post('/api/auth/resend-otp')
          .send({ phone: '+12125551236' });

        if (i < maxAttempts) {
          expect(response.status).toBe(200);
        } else {
          // Should be rate limited after max attempts
          expect(response.status).toBe(429);
          expect(response.body.message).toContain('Too many attempts');
        }
      }
    });

    it('should limit OTP verification attempts', async () => {
      // Create temp registration
      const TempRegistration = require('../../models/TempRegistration');
      await TempRegistration.create({
        phone: '+12125551237',
        userType: 'Creator',
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        otpSentAt: new Date(),
        verificationId: 123456
      });

      // Attempt multiple wrong verifications
      const maxAttempts = 5;
      for (let i = 0; i < maxAttempts + 1; i++) {
        const response = await request(app)
          .post('/api/auth/register/verify-otp')
          .send({
            phone: '+12125551237',
            code: '999999', // Wrong code
            deviceToken: 'test-device-token'
          });

        if (i < maxAttempts) {
          expect(response.status).toBe(400); // Invalid OTP
        } else {
          // Should be rate limited after max attempts
          expect(response.status).toBe(429);
          expect(response.body.message).toContain('Too many failed attempts');
        }
      }
    });
  });
});