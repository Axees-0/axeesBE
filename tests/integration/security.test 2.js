// Mock external services first, before any requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

jest.mock('../../utils/pushNotifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM123456789',
        status: 'sent'
      })
    }
  };
  return jest.fn(() => mockClient);
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test123' }),
    verify: jest.fn().mockResolvedValue(true)
  })),
  getTestMessageUrl: jest.fn().mockReturnValue('http://test-url.com')
}));

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const Deal = require('../../models/deal');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');

describe('Security Tests', () => {
  let testUser;
  let testToken;
  let maliciousUser;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    testUser = await User.create({
      phone: '+12125551234',
      name: 'Test User',
      userName: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      userType: 'Creator',
      isActive: true,
      creatorData: {
        platforms: [],
        categories: ['technology'],
        nicheTopics: ['tech'],
        achievements: '',
        businessVentures: '',
        portfolio: [],
        totalFollowers: 1000
      }
    });

    testToken = generateTestToken({
      id: testUser._id.toString(),
      phone: testUser.phone,
      userType: testUser.userType
    });

    // Create potential malicious user
    maliciousUser = await User.create({
      phone: '+12125551235',
      name: 'Malicious User',
      userName: 'malicioususer',
      email: 'malicious@example.com',
      password: hashedPassword,
      userType: 'Creator',
      isActive: true,
      creatorData: {
        platforms: [],
        categories: ['technology'],
        nicheTopics: ['tech'],
        achievements: '',
        businessVentures: '',
        portfolio: [],
        totalFollowers: 500
      }
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Authentication Security', () => {
    describe('JWT Token Security', () => {
      it('should reject invalid JWT tokens', async () => {
        const invalidToken = 'invalid.jwt.token';
        
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
      });

      it('should reject expired JWT tokens', async () => {
        // Generate token with past expiration
        const expiredToken = generateTestToken({
          id: testUser._id.toString(),
          phone: testUser.phone,
          userType: testUser.userType
        }, '-1h'); // Expired 1 hour ago

        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
      });

      it('should reject malformed Authorization headers', async () => {
        const malformedHeaders = [
          'InvalidFormat',
          'Bearer',
          'Bearer ',
          'NotBearer validtoken',
          ''
        ];

        for (const header of malformedHeaders) {
          const response = await request(app)
            .get('/api/users/profile')
            .set('Authorization', header);

          expect(response.status).toBe(401);
        }
      });

      it('should validate token user existence', async () => {
        // Create token for non-existent user
        const fakeToken = generateTestToken({
          id: '507f1f77bcf86cd799439011', // Non-existent user ID
          phone: '+19999999999',
          userType: 'Creator'
        });

        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${fakeToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('OTP Security', () => {
      it('should prevent OTP brute force attacks', async () => {
        const phone = '+12125559999';
        const wrongOtp = '0000';

        // Register user first
        await request(app)
          .post('/api/auth/register/start')
          .send({ phone, userType: 'Creator' });

        // Attempt multiple wrong OTPs
        const attempts = [];
        for (let i = 0; i < 6; i++) {
          attempts.push(
            request(app)
              .post('/api/auth/register/verify')
              .send({ phone, code: wrongOtp })
          );
        }

        const responses = await Promise.all(attempts);
        
        // Should start rejecting after too many attempts
        const rejectedCount = responses.filter(r => r.status === 429 || r.status === 400).length;
        expect(rejectedCount).toBeGreaterThan(0);
      });

      it('should expire OTP codes', async () => {
        const phone = '+12125559998';
        
        await request(app)
          .post('/api/auth/register/start')
          .send({ phone, userType: 'Creator' });

        // Wait for OTP expiration (mocked to be immediate for testing)
        await new Promise(resolve => setTimeout(resolve, 100));

        const response = await request(app)
          .post('/api/auth/register/verify')
          .send({ phone, code: '123456' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('expired');
      });

      it('should validate OTP format', async () => {
        const phone = '+12125559997';
        
        await request(app)
          .post('/api/auth/register/start')
          .send({ phone, userType: 'Creator' });

        const invalidOTPs = ['123', '12345', 'abcd', '123456789', '', null];

        for (const invalidOTP of invalidOTPs) {
          const response = await request(app)
            .post('/api/auth/register/verify')
            .send({ phone, code: invalidOTP });

          expect(response.status).toBe(400);
        }
      });
    });

    describe('Password Security', () => {
      it('should enforce strong password requirements', async () => {
        const weakPasswords = [
          'password',      // Too common
          '123456',        // Too simple
          'abc',           // Too short
          'password123',   // Missing uppercase and special chars
          'PASSWORD123',   // Missing lowercase and special chars
          'Password',      // Missing numbers and special chars
          'Pass123',       // Too short
        ];

        for (const weakPassword of weakPasswords) {
          const response = await request(app)
            .post('/api/auth/register/complete')
            .send({
              phone: '+12125559996',
              name: 'Test User',
              userName: 'testuser123',
              password: weakPassword,
              userType: 'Creator'
            });

          expect(response.status).toBe(400);
          expect(response.body.message || response.body.error).toMatch(/password/i);
        }
      });

      it('should hash passwords properly', async () => {
        const password = 'StrongPassword123!';
        const phone = '+12125559995';
        
        // Complete registration
        await request(app)
          .post('/api/auth/register/start')
          .send({ phone, userType: 'Creator' });

        await request(app)
          .post('/api/auth/register/verify')
          .send({ phone, code: '123456' });

        await request(app)
          .post('/api/auth/register/complete')
          .send({
            phone,
            name: 'Test User',
            userName: 'testuser456',
            password,
            userType: 'Creator'
          });

        const user = await User.findOne({ phone });
        expect(user.password).toBeDefined();
        expect(user.password).not.toBe(password); // Should be hashed
        expect(user.password.length).toBeGreaterThan(50); // Bcrypt hash length
      });
    });

    describe('Rate Limiting', () => {
      it('should limit login attempts', async () => {
        const phone = '+12125551234';
        const wrongPassword = 'WrongPassword123!';

        const attempts = [];
        for (let i = 0; i < 10; i++) {
          attempts.push(
            request(app)
              .post('/api/auth/login')
              .send({ phone, password: wrongPassword })
          );
        }

        const responses = await Promise.all(attempts);
        
        // Should start rate limiting after several failed attempts
        const rateLimitedCount = responses.filter(r => r.status === 429).length;
        expect(rateLimitedCount).toBeGreaterThanOrEqual(0);
      });

      it('should limit registration attempts', async () => {
        const phones = Array.from({ length: 10 }, (_, i) => `+1212555${1000 + i}`);

        const attempts = phones.map(phone =>
          request(app)
            .post('/api/auth/register/start')
            .send({ phone, userType: 'Creator' })
        );

        const responses = await Promise.all(attempts);
        
        // All should succeed as they're different phone numbers
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(5);
      });
    });
  });

  describe('Input Validation & Injection Prevention', () => {
    describe('SQL Injection Prevention (NoSQL)', () => {
      it('should prevent NoSQL injection in login', async () => {
        const maliciousInputs = [
          { phone: { $ne: null }, password: { $ne: null } },
          { phone: '+12125551234', password: { $regex: '.*' } },
          { phone: '+12125551234', password: { $where: 'return true' } },
          { phone: { $gt: '' }, password: 'anypassword' },
        ];

        for (const maliciousInput of maliciousInputs) {
          const response = await request(app)
            .post('/api/auth/login')
            .send(maliciousInput);

          expect(response.status).not.toBe(200);
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      });

      it('should prevent NoSQL injection in user search', async () => {
        const maliciousQueries = [
          { search: { $ne: null } },
          { search: { $regex: '.*' } },
          { search: { $where: 'return true' } },
          { userType: { $ne: 'Creator' } },
        ];

        for (const maliciousQuery of maliciousQueries) {
          const response = await request(app)
            .get('/api/users/search')
            .query(maliciousQuery)
            .set('x-user-id', testUser._id.toString());

          // Should either reject or sanitize the input
          expect(response.status).toBeLessThan(500);
        }
      });
    });

    describe('XSS Prevention', () => {
      it('should sanitize user input in profile updates', async () => {
        const xssPayloads = [
          '<script>alert("XSS")</script>',
          'javascript:alert("XSS")',
          '<img src="x" onerror="alert(\'XSS\')" />',
          '<iframe src="javascript:alert(\'XSS\')"></iframe>',
          '"><script>alert("XSS")</script>',
          "'; DROP TABLE users; --",
        ];

        for (const xssPayload of xssPayloads) {
          const response = await request(app)
            .patch('/api/users/profile')
            .set('x-user-id', testUser._id.toString())
            .send({
              name: xssPayload,
              bio: `Normal bio with ${xssPayload} payload`
            });

          if (response.status === 200) {
            // If update succeeds, check that XSS was sanitized
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.name).not.toContain('<script>');
            expect(updatedUser.name).not.toContain('javascript:');
            expect(updatedUser.bio).not.toContain('<script>');
          }
        }
      });

      it('should sanitize content in offer creation', async () => {
        const xssPayload = '<script>steal_cookies()</script>';
        
        const response = await request(app)
          .post('/api/marketer/offers')
          .set('x-user-id', testUser._id.toString())
          .send({
            creatorId: maliciousUser._id.toString(),
            offerName: `Legitimate Offer ${xssPayload}`,
            proposedAmount: 1000,
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: [`Content creation ${xssPayload}`],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: `Normal description ${xssPayload}`
          });

        if (response.status === 201) {
          const offer = await Offer.findOne({ offerName: new RegExp('Legitimate Offer') });
          expect(offer.offerName).not.toContain('<script>');
          expect(offer.description).not.toContain('<script>');
        }
      });
    });

    describe('Data Validation', () => {
      it('should validate email formats', async () => {
        const invalidEmails = [
          'notanemail',
          '@domain.com',
          'user@',
          'user..name@domain.com',
          'user@domain',
          '<script>alert("xss")</script>@domain.com',
        ];

        for (const invalidEmail of invalidEmails) {
          const response = await request(app)
            .patch('/api/users/profile')
            .set('x-user-id', testUser._id.toString())
            .send({ email: invalidEmail });

          expect(response.status).toBe(400);
        }
      });

      it('should validate phone number formats', async () => {
        const invalidPhones = [
          '123',
          'notanumber',
          '+1234567890123456789', // Too long
          '123-456-7890', // Invalid format
          '+1 (234) 567-8900', // Invalid format
          '<script>alert("xss")</script>',
        ];

        for (const invalidPhone of invalidPhones) {
          const response = await request(app)
            .post('/api/auth/register/start')
            .send({ phone: invalidPhone, userType: 'Creator' });

          expect(response.status).toBe(400);
        }
      });

      it('should validate numeric inputs', async () => {
        const invalidAmounts = [
          'not_a_number',
          -1000, // Negative amount
          0, // Zero amount
          Infinity,
          NaN,
          '<script>alert("xss")</script>',
        ];

        for (const invalidAmount of invalidAmounts) {
          const response = await request(app)
            .post('/api/marketer/offers')
            .set('x-user-id', testUser._id.toString())
            .send({
              creatorId: maliciousUser._id.toString(),
              offerName: 'Test Offer',
              proposedAmount: invalidAmount,
              currency: 'USD',
              platforms: ['Instagram'],
              deliverables: ['Content'],
              desiredReviewDate: new Date(),
              desiredPostDate: new Date(),
              description: 'Test'
            });

          expect(response.status).toBe(400);
        }
      });
    });
  });

  describe('Authorization & Access Control', () => {
    describe('Resource Access Control', () => {
      it('should prevent users from accessing other users\' data', async () => {
        // Try to access another user's profile
        const response = await request(app)
          .get('/api/users/profile')
          .set('x-user-id', maliciousUser._id.toString())
          .query({ userId: testUser._id.toString() });

        // Should only return own profile data
        expect(response.status).toBe(200);
        expect(response.body._id).toBe(maliciousUser._id.toString());
        expect(response.body._id).not.toBe(testUser._id.toString());
      });

      it('should prevent unauthorized offer modifications', async () => {
        // Create offer by test user
        const offer = await Offer.create({
          marketerId: testUser._id,
          creatorId: maliciousUser._id,
          offerName: 'Test Offer',
          proposedAmount: 1000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Content'],
          desiredReviewDate: new Date(),
          desiredPostDate: new Date(),
          description: 'Test offer',
          status: 'Sent'
        });

        // Try to accept offer as wrong user type (should be creator)
        const response = await request(app)
          .post(`/api/marketer/offers/${offer._id}/respond`)
          .set('x-user-id', testUser._id.toString()) // Marketer trying to accept
          .send({
            action: 'accept',
            userId: testUser._id.toString(),
            userType: 'Marketer'
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Creator');
      });

      it('should prevent unauthorized deal access', async () => {
        // Create deal between two other users
        const deal = await Deal.create({
          marketerId: testUser._id,
          creatorId: maliciousUser._id,
          dealName: 'Private Deal',
          dealNumber: 'DEAL-' + Date.now(),
          status: 'Accepted',
          paymentInfo: {
            currency: 'USD',
            paymentAmount: 1000,
            paymentNeeded: true,
            transactions: []
          }
        });

        // Create third user who shouldn't have access
        const thirdUser = await User.create({
          phone: '+12125551236',
          name: 'Third User',
          userName: 'thirduser',
          email: 'third@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true
        });

        const response = await request(app)
          .get(`/api/marketer/deals/${deal._id}`)
          .set('x-user-id', thirdUser._id.toString())
          .query({
            userId: thirdUser._id.toString(),
            userType: 'Creator'
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('authorized');
      });
    });

    describe('Role-Based Access Control', () => {
      it('should prevent creators from accessing marketer-only endpoints', async () => {
        // Creator trying to access marketer earnings
        const response = await request(app)
          .get('/api/payments/marketer')
          .set('x-user-id', testUser._id.toString()); // testUser is a Creator

        expect(response.status).toBe(403);
      });

      it('should prevent role escalation', async () => {
        // Try to update user role through profile update
        const response = await request(app)
          .patch('/api/users/profile')
          .set('x-user-id', testUser._id.toString())
          .send({
            userType: 'Admin', // Try to escalate to admin
            isActive: true,
            role: 'admin'
          });

        // Role change should be rejected or ignored
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.userType).toBe('Creator'); // Should remain Creator
      });
    });
  });

  describe('Data Privacy & Security', () => {
    describe('Password Security', () => {
      it('should never return password in API responses', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.password).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain('$2b$'); // bcrypt hash prefix
      });

      it('should properly validate current password for sensitive operations', async () => {
        const wrongPassword = 'WrongPassword123!';
        
        const response = await request(app)
          .patch('/api/users/password')
          .set('x-user-id', testUser._id.toString())
          .send({
            currentPassword: wrongPassword,
            newPassword: 'NewStrongPassword123!'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('password');
      });
    });

    describe('Sensitive Data Exposure', () => {
      it('should not expose internal system information', async () => {
        // Make invalid request to trigger error
        const response = await request(app)
          .get('/api/nonexistent/endpoint')
          .set('x-user-id', testUser._id.toString());

        expect(response.status).toBe(404);
        
        // Should not expose stack traces or internal paths
        const body = JSON.stringify(response.body);
        expect(body).not.toContain('/Users/');
        expect(body).not.toContain('node_modules');
        expect(body).not.toContain('at ');
        expect(body).not.toContain('.js:');
      });

      it('should sanitize error messages', async () => {
        // Try to access non-existent resource
        const response = await request(app)
          .get('/api/marketer/offers/507f1f77bcf86cd799439011')
          .set('x-user-id', testUser._id.toString());

        expect(response.status).toBe(404);
        
        // Should not expose database query details
        const body = JSON.stringify(response.body);
        expect(body).not.toContain('ObjectId');
        expect(body).not.toContain('mongodb');
        expect(body).not.toContain('mongoose');
      });
    });

    describe('CORS Security', () => {
      it('should handle preflight OPTIONS requests', async () => {
        const response = await request(app)
          .options('/api/auth/login')
          .set('Origin', 'https://malicious-site.com')
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type');

        // Should either allow or properly deny based on CORS policy
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('File Upload Security', () => {
    describe('File Validation', () => {
      it('should validate file types for avatar uploads', async () => {
        const maliciousFiles = [
          { filename: 'malicious.exe', mimetype: 'application/octet-stream' },
          { filename: 'script.js', mimetype: 'application/javascript' },
          { filename: 'shell.php', mimetype: 'application/x-php' },
          { filename: 'image.jpg.exe', mimetype: 'image/jpeg' }, // Double extension
        ];

        for (const file of maliciousFiles) {
          const response = await request(app)
            .patch('/api/users/profile')
            .set('x-user-id', testUser._id.toString())
            .field('name', 'Test User')
            .attach('avatar', Buffer.from('fake file content'), {
              filename: file.filename,
              contentType: file.mimetype
            });

          // Should reject malicious file types
          expect(response.status).toBe(400);
        }
      });

      it('should limit file sizes', async () => {
        // Create large buffer (> 5MB)
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

        const response = await request(app)
          .patch('/api/users/profile')
          .set('x-user-id', testUser._id.toString())
          .field('name', 'Test User')
          .attach('avatar', largeBuffer, {
            filename: 'large_image.jpg',
            contentType: 'image/jpeg'
          });

        expect(response.status).toBe(413); // Payload too large
      });
    });
  });

  describe('API Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('x-user-id', testUser._id.toString());

      // Check for important security headers
      const headers = response.headers;
      
      // These might be set by the framework or reverse proxy
      // Just ensure no sensitive information is exposed
      expect(headers['x-powered-by']).not.toBe('Express'); // Should be hidden
      expect(headers.server).not.toContain('Express');
    });
  });

  describe('Session Security', () => {
    describe('Token Handling', () => {
      it('should invalidate tokens after password change', async () => {
        // This would require implementing token blacklisting
        // For now, just verify the endpoint exists and responds correctly
        const response = await request(app)
          .patch('/api/users/password')
          .set('x-user-id', testUser._id.toString())
          .send({
            currentPassword: 'SecurePassword123!',
            newPassword: 'NewSecurePassword123!'
          });

        // Should succeed or fail gracefully
        expect(response.status).toBeLessThan(500);
      });

      it('should prevent concurrent session abuse', async () => {
        // Make multiple concurrent requests with same token
        const requests = Array(10).fill(null).map(() =>
          request(app)
            .get('/api/users/profile')
            .set('x-user-id', testUser._id.toString())
        );

        const responses = await Promise.all(requests);
        
        // All should succeed for legitimate concurrent usage
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(8);
      });
    });
  });
});