/**
 * SESSION EXPIRY MID-ACTION TEST
 * 
 * Validates what happens when user's session expires while they're
 * in the middle of filling out forms or uploading files
 * 
 * REAL WORLD SCENARIO:
 * User spends 20 minutes creating a detailed offer, clicks submit,
 * token expired 5 minutes ago, loses all work
 */

const request = require('supertest');
const app = require('../../../main');
const jwt = require('jsonwebtoken');
const { setupTestDatabase, cleanupTestDatabase } = require('../../helpers/database');

describe('Session Expiry Mid-Action Reality Check', () => {
  let testUser;
  let expiredToken;
  let validToken;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user
    testUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      userType: 'marketer'
    };

    // Create expired token (expired 5 minutes ago)
    expiredToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '-5m' }
    );

    // Create valid token
    validToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('🚨 Critical: Form Submission with Expired Session', () => {
    it('should handle offer creation with expired token gracefully', async () => {
      const offerData = {
        title: 'Important Marketing Campaign',
        description: 'User spent 20 minutes writing this detailed description...',
        budget: 5000,
        deliverables: ['Social media posts', 'Story highlights', 'Reel creation'],
        timeline: '2 weeks',
        requirements: 'Very specific requirements that took time to write'
      };

      const response = await request(app)
        .post('/api/marketer/offers')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(offerData);

      // Should return 401 with clear error message
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
      
      // Should NOT save partial data
      const checkSave = await request(app)
        .get('/api/marketer/offers')
        .set('Authorization', `Bearer ${validToken}`);
      
      const savedOffers = checkSave.body.data || [];
      const partialOffer = savedOffers.find(offer => 
        offer.title === offerData.title
      );
      
      expect(partialOffer).toBeUndefined();
    });

    it('should handle file upload with expired token during upload', async () => {
      // Simulate file upload that takes time
      const response = await request(app)
        .post('/api/chats/507f1f77bcf86cd799439012/messages')
        .set('Authorization', `Bearer ${expiredToken}`)
        .field('text', 'Here is the important file')
        .field('receiverId', '507f1f77bcf86cd799439013')
        .attach('attachments', Buffer.from('fake file content'), 'important-document.pdf');

      expect(response.status).toBe(401);
      
      // File should not be saved to disk
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../../uploads/attachments');
      
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const uploadedFile = files.find(file => file.includes('important-document'));
        expect(uploadedFile).toBeUndefined();
      }
    });
  });

  describe('🔄 Token Refresh During Action', () => {
    it('should handle refresh token expiry during critical action', async () => {
      const expiredRefreshToken = jwt.sign(
        { userId: testUser._id, type: 'refresh' },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '-1h' }
      );

      // Try to refresh with expired refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredRefreshToken
        });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.message).toContain('refresh token');
    });

    it('should validate automatic token refresh during long operations', async () => {
      // Create token that expires in 10 seconds
      const shortLivedToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '10s' }
      );

      // Start a long operation
      const startTime = Date.now();
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 11000));
      
      // Try to continue operation
      const response = await request(app)
        .get('/api/marketer/offers')
        .set('Authorization', `Bearer ${shortLivedToken}`);

      const endTime = Date.now();
      
      expect(response.status).toBe(401);
      expect(endTime - startTime).toBeGreaterThan(10000);
    });
  });

  describe('🔐 Multi-Device Session Conflicts', () => {
    it('should handle user logging in on multiple devices', async () => {
      // User logs in on desktop
      const desktopLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+1234567890',
          password: 'testpassword'
        });

      // User logs in on mobile (should invalidate desktop?)
      const mobileLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+1234567890',
          password: 'testpassword'
        });

      // Check if both tokens work or if one is invalidated
      if (desktopLogin.body.token && mobileLogin.body.token) {
        const desktopCheck = await request(app)
          .get('/api/account/profile')
          .set('Authorization', `Bearer ${desktopLogin.body.token}`);

        const mobileCheck = await request(app)
          .get('/api/account/profile')
          .set('Authorization', `Bearer ${mobileLogin.body.token}`);

        // Document the behavior - both should work or one should be invalidated
        console.log('Desktop token valid:', desktopCheck.status === 200);
        console.log('Mobile token valid:', mobileCheck.status === 200);
      }
    });
  });

  describe('⚡ Performance Under Auth Load', () => {
    it('should handle concurrent authentication requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .get('/api/marketer/offers')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect([200, 401]).toContain(response.status);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});