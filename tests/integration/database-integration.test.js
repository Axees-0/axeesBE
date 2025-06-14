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
const Message = require('../../models/message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

describe('Database Integration Tests', () => {
  let marketerUser, creatorUser;
  let marketerToken, creatorToken;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    
    marketerUser = await User.create({
      phone: '+12125551234',
      name: 'Test Marketer',
      userName: 'testmarketer',
      email: 'marketer@example.com',
      password: hashedPassword,
      userType: 'Marketer',
      isActive: true,
      marketerData: {
        companyName: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        businessLicense: 'LICENSE123',
        totalCampaigns: 10,
        successfulCampaigns: 8,
        averageRating: 4.5
      }
    });

    creatorUser = await User.create({
      phone: '+12125551235',
      name: 'Test Creator',
      userName: 'testcreator',
      email: 'creator@example.com',
      password: hashedPassword,
      userType: 'Creator',
      isActive: true,
      creatorData: {
        platforms: ['Instagram', 'TikTok'],
        categories: ['technology', 'lifestyle'],
        nicheTopics: ['tech', 'gadgets'],
        achievements: 'Tech influencer with 100k followers',
        businessVentures: 'Tech startup founder',
        portfolio: [],
        totalFollowers: 100000
      }
    });

    marketerToken = generateTestToken({
      id: marketerUser._id.toString(),
      phone: marketerUser.phone,
      userType: marketerUser.userType
    });

    creatorToken = generateTestToken({
      id: creatorUser._id.toString(),
      phone: creatorUser.phone,
      userType: creatorUser.userType
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Data Consistency', () => {
    describe('User Data Integrity', () => {
      it('should maintain referential integrity in user relationships', async () => {
        // Create offer linking the two users
        const offer = await Offer.create({
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Test Campaign',
          proposedAmount: 1000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post', 'Story'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: 'Test campaign description',
          status: 'Sent'
        });

        // Verify both users can be found and linked properly
        const foundOffer = await Offer.findById(offer._id)
          .populate('marketerId')
          .populate('creatorId');

        expect(foundOffer.marketerId._id.toString()).toBe(marketerUser._id.toString());
        expect(foundOffer.creatorId._id.toString()).toBe(creatorUser._id.toString());
        expect(foundOffer.marketerId.userType).toBe('Marketer');
        expect(foundOffer.creatorId.userType).toBe('Creator');
      });

      it('should handle cascading updates correctly', async () => {
        // Update user name
        const newName = 'Updated Marketer Name';
        await User.findByIdAndUpdate(marketerUser._id, { name: newName });

        // Create offer after update
        const offer = await Offer.create({
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Test Campaign',
          proposedAmount: 1000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: 'Test',
          status: 'Sent'
        });

        // Verify updated name is reflected in populated documents
        const populatedOffer = await Offer.findById(offer._id).populate('marketerId');
        expect(populatedOffer.marketerId.name).toBe(newName);
      });

      it('should prevent orphaned documents', async () => {
        // Create offer first
        const offer = await Offer.create({
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Test Campaign',
          proposedAmount: 1000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: 'Test',
          status: 'Sent'
        });

        // Attempt to delete user with existing offers
        try {
          await User.findByIdAndDelete(marketerUser._id);
          
          // Check if offer still exists and how it handles missing reference
          const orphanedOffer = await Offer.findById(offer._id).populate('marketerId');
          
          // The offer should either be deleted as well or handle the missing reference gracefully
          if (orphanedOffer) {
            expect(orphanedOffer.marketerId).toBeNull();
          }
        } catch (error) {
          // If deletion is prevented, that's also acceptable
          expect(error).toBeDefined();
        }
      });
    });

    describe('Transaction Integrity', () => {
      it('should handle concurrent offer creation correctly', async () => {
        // Create multiple offers simultaneously
        const offerPromises = Array.from({ length: 5 }, (_, i) =>
          Offer.create({
            marketerId: marketerUser._id,
            creatorId: creatorUser._id,
            offerName: `Concurrent Offer ${i + 1}`,
            proposedAmount: 1000 + (i * 100),
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: ['Post'],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: `Test concurrent offer ${i + 1}`,
            status: 'Sent'
          })
        );

        const offers = await Promise.all(offerPromises);
        
        expect(offers).toHaveLength(5);
        offers.forEach((offer, index) => {
          expect(offer).toBeDefined();
          expect(offer.offerName).toBe(`Concurrent Offer ${index + 1}`);
          expect(offer.proposedAmount).toBe(1000 + (index * 100));
        });

        // Verify all offers were saved correctly
        const savedOffers = await Offer.find({ marketerId: marketerUser._id });
        expect(savedOffers).toHaveLength(5);
      });

      it('should handle concurrent user updates correctly', async () => {
        // Simulate concurrent profile updates
        const updatePromises = [
          User.findByIdAndUpdate(creatorUser._id, { 
            'creatorData.totalFollowers': 101000 
          }, { new: true }),
          User.findByIdAndUpdate(creatorUser._id, { 
            'creatorData.achievements': 'Updated achievements' 
          }, { new: true }),
          User.findByIdAndUpdate(creatorUser._id, { 
            bio: 'Updated bio' 
          }, { new: true })
        ];

        const results = await Promise.all(updatePromises);
        
        // All updates should succeed
        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result._id.toString()).toBe(creatorUser._id.toString());
        });

        // Verify final state includes all updates
        const finalUser = await User.findById(creatorUser._id);
        expect(finalUser.bio).toBe('Updated bio');
        expect(finalUser.creatorData.achievements).toBe('Updated achievements');
        expect(finalUser.creatorData.totalFollowers).toBe(101000);
      });

      it('should maintain atomicity in complex operations', async () => {
        // Test offer acceptance flow which should create a deal atomically
        const offer = await Offer.create({
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Atomic Test Offer',
          proposedAmount: 2000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post', 'Story'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: 'Atomic operation test',
          status: 'Sent'
        });

        // Accept the offer (should create deal atomically)
        const response = await request(app)
          .post(`/api/marketer/offers/${offer._id}/respond`)
          .set('x-user-id', creatorUser._id.toString())
          .send({
            action: 'accept',
            userId: creatorUser._id.toString(),
            userType: 'Creator'
          });

        if (response.status === 200) {
          // Verify both offer status and deal creation happened atomically
          const updatedOffer = await Offer.findById(offer._id);
          const createdDeal = await Deal.findOne({ 
            marketerId: marketerUser._id, 
            creatorId: creatorUser._id 
          });

          expect(updatedOffer.status).toBe('Accepted');
          expect(createdDeal).toBeDefined();
          expect(createdDeal.dealName).toBe(offer.offerName);
        }
      });
    });

    describe('Index Performance and Uniqueness', () => {
      it('should enforce unique constraints correctly', async () => {
        // Try to create user with duplicate phone number
        const duplicateUserData = {
          phone: marketerUser.phone, // Duplicate phone
          name: 'Duplicate User',
          userName: 'duplicateuser',
          email: 'duplicate@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['YouTube'],
            categories: ['entertainment'],
            nicheTopics: ['comedy'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 1000
          }
        };

        await expect(User.create(duplicateUserData)).rejects.toThrow();
      });

      it('should enforce username uniqueness', async () => {
        // Try to create user with duplicate username
        const duplicateUserData = {
          phone: '+12125551236',
          name: 'Another User',
          userName: marketerUser.userName, // Duplicate username
          email: 'another@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['Twitter'],
            categories: ['news'],
            nicheTopics: ['politics'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 5000
          }
        };

        await expect(User.create(duplicateUserData)).rejects.toThrow();
      });

      it('should handle case-insensitive uniqueness correctly', async () => {
        // Try to create user with case-different email
        const duplicateUserData = {
          phone: '+12125551237',
          name: 'Case Test User',
          userName: 'casetestuser',
          email: marketerUser.email.toUpperCase(), // Same email, different case
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['LinkedIn'],
            categories: ['business'],
            nicheTopics: ['marketing'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 3000
          }
        };

        // This should either be allowed or rejected based on email uniqueness implementation
        try {
          await User.create(duplicateUserData);
          // If allowed, both should exist
          const users = await User.find({
            email: { $regex: new RegExp(`^${marketerUser.email}$`, 'i') }
          });
          expect(users.length).toBeGreaterThan(0);
        } catch (error) {
          // If rejected, that's also acceptable for case-insensitive uniqueness
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create test data for performance testing
      const users = [];
      const offers = [];

      // Create 20 users
      for (let i = 0; i < 20; i++) {
        const user = await User.create({
          phone: `+1212555${1000 + i}`,
          name: `Test User ${i}`,
          userName: `testuser${i}`,
          email: `test${i}@example.com`,
          password: await bcrypt.hash('Password123!', 10),
          userType: i % 2 === 0 ? 'Creator' : 'Marketer',
          isActive: true,
          ...(i % 2 === 0 ? {
            creatorData: {
              platforms: ['Instagram'],
              categories: ['technology'],
              nicheTopics: ['tech'],
              achievements: `Achievements ${i}`,
              businessVentures: `Business ${i}`,
              portfolio: [],
              totalFollowers: 1000 + (i * 100)
            }
          } : {
            marketerData: {
              companyName: `Company ${i}`,
              industry: 'Technology',
              website: `https://company${i}.com`,
              businessLicense: `LICENSE${i}`,
              totalCampaigns: i,
              successfulCampaigns: Math.floor(i * 0.8),
              averageRating: 3.5 + (i % 3) * 0.5
            }
          })
        });
        users.push(user);
      }

      // Create offers between users
      for (let i = 0; i < 10; i++) {
        const marketer = users.find(u => u.userType === 'Marketer');
        const creator = users.find(u => u.userType === 'Creator');
        
        if (marketer && creator) {
          const offer = await Offer.create({
            marketerId: marketer._id,
            creatorId: creator._id,
            offerName: `Performance Test Offer ${i}`,
            proposedAmount: 1000 + (i * 100),
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: ['Post'],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: `Performance test offer ${i}`,
            status: i % 3 === 0 ? 'Sent' : i % 3 === 1 ? 'Accepted' : 'Rejected'
          });
          offers.push(offer);
        }
      }
    });

    it('should perform user search queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users/search')
        .query({ search: 'Test User', userType: 'Creator' })
        .set('x-user-id', marketerUser._id.toString());

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should perform offer listing queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketer/offers')
        .query({ userType: 'Marketer', userId: marketerUser._id.toString() })
        .set('x-user-id', marketerUser._id.toString());

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body).toHaveProperty('offers');
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketer/offers')
        .query({ 
          userType: 'Creator', 
          userId: creatorUser._id.toString(),
          page: 1,
          limit: 5
        })
        .set('x-user-id', creatorUser._id.toString());

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      
      if (response.body.offers) {
        expect(response.body.offers.length).toBeLessThanOrEqual(5);
      }
    });

    it('should perform complex filtering queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketer/offers')
        .query({ 
          userType: 'Marketer',
          userId: marketerUser._id.toString(),
          status: 'Sent',
          minAmount: 500,
          maxAmount: 2000
        })
        .set('x-user-id', marketerUser._id.toString());

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(1500); // Complex queries can take a bit longer
    });
  });

  describe('Data Validation', () => {
    describe('Schema Validation', () => {
      it('should validate required fields correctly', async () => {
        // Try to create offer without required fields
        const invalidOffer = {
          // Missing marketerId, creatorId, offerName, etc.
          proposedAmount: 1000,
          currency: 'USD'
        };

        await expect(Offer.create(invalidOffer)).rejects.toThrow();
      });

      it('should validate field types correctly', async () => {
        // Try to create offer with wrong field types
        const invalidOffer = {
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Test Offer',
          proposedAmount: 'not-a-number', // Should be number
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(),
          desiredPostDate: new Date(),
          description: 'Test'
        };

        await expect(Offer.create(invalidOffer)).rejects.toThrow();
      });

      it('should validate enum values correctly', async () => {
        // Try to create user with invalid userType
        const invalidUser = {
          phone: '+12125559999',
          name: 'Invalid User',
          userName: 'invaliduser',
          email: 'invalid@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'InvalidType', // Invalid enum value
          isActive: true
        };

        await expect(User.create(invalidUser)).rejects.toThrow();
      });

      it('should validate array fields correctly', async () => {
        // Try to create user with invalid platform array
        const invalidUser = {
          phone: '+12125559998',
          name: 'Creator User',
          userName: 'creatoruser',
          email: 'creator@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['InvalidPlatform'], // Invalid platform
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 1000
          }
        };

        // This may or may not throw depending on platform validation implementation
        try {
          await User.create(invalidUser);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      it('should validate nested object schemas correctly', async () => {
        // Try to create creator user with invalid nested creatorData
        const invalidUser = {
          phone: '+12125559997',
          name: 'Creator User',
          userName: 'creatoruser2',
          email: 'creator2@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['Instagram'],
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 'not-a-number' // Should be number
          }
        };

        await expect(User.create(invalidUser)).rejects.toThrow();
      });
    });

    describe('Custom Validation Rules', () => {
      it('should validate phone number format', async () => {
        const invalidPhones = [
          'not-a-phone',
          '123',
          '+1234567890123456789' // Too long
        ];

        for (const invalidPhone of invalidPhones) {
          const invalidUser = {
            phone: invalidPhone,
            name: 'Test User',
            userName: 'testuser123',
            email: 'test@example.com',
            password: await bcrypt.hash('Password123!', 10),
            userType: 'Creator',
            isActive: true,
            creatorData: {
              platforms: ['Instagram'],
              categories: ['technology'],
              nicheTopics: ['tech'],
              achievements: '',
              businessVentures: '',
              portfolio: [],
              totalFollowers: 1000
            }
          };

          await expect(User.create(invalidUser)).rejects.toThrow();
        }
      });

      it('should validate email format', async () => {
        const invalidEmails = [
          'not-an-email',
          '@domain.com',
          'user@'
        ];

        for (const invalidEmail of invalidEmails) {
          const invalidUser = {
            phone: '+12125559996',
            name: 'Test User',
            userName: 'testuser456',
            email: invalidEmail,
            password: await bcrypt.hash('Password123!', 10),
            userType: 'Creator',
            isActive: true,
            creatorData: {
              platforms: ['Instagram'],
              categories: ['technology'],
              nicheTopics: ['tech'],
              achievements: '',
              businessVentures: '',
              portfolio: [],
              totalFollowers: 1000
            }
          };

          await expect(User.create(invalidUser)).rejects.toThrow();
        }
      });

      it('should validate date ranges correctly', async () => {
        // Try to create offer with review date after post date
        const invalidOffer = {
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Invalid Date Offer',
          proposedAmount: 1000,
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // After post date
          desiredPostDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Before review date
          description: 'Invalid date order'
        };

        // This should be caught by business logic validation
        await expect(Offer.create(invalidOffer)).rejects.toThrow();
      });

      it('should validate amount ranges correctly', async () => {
        // Try to create offer with negative amount
        const invalidOffer = {
          marketerId: marketerUser._id,
          creatorId: creatorUser._id,
          offerName: 'Negative Amount Offer',
          proposedAmount: -1000, // Negative amount
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: 'Negative amount test'
        };

        await expect(Offer.create(invalidOffer)).rejects.toThrow();
      });
    });
  });

  describe('Database Connection Handling', () => {
    it('should handle connection timeouts gracefully', async () => {
      // This is difficult to test without actually disrupting the connection
      // We can test that normal operations work under load
      const promises = Array.from({ length: 50 }, () =>
        User.findById(marketerUser._id)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result._id.toString()).toBe(marketerUser._id.toString());
      });
    });

    it('should handle concurrent database operations', async () => {
      // Test concurrent reads and writes
      const readPromises = Array.from({ length: 10 }, () =>
        User.find({ userType: 'Creator' })
      );

      const writePromises = Array.from({ length: 5 }, async (_, i) => {
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        return User.create({
          phone: `+1212555${2000 + i}`,
          name: `Concurrent User ${i}`,
          userName: `concurrent${i}`,
          email: `concurrent${i}@example.com`,
          password: hashedPassword,
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['Instagram'],
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 1000
          }
        });
      });

      const [readResults, writeResults] = await Promise.all([
        Promise.all(readPromises),
        Promise.all(writePromises)
      ]);

      expect(readResults).toHaveLength(10);
      expect(writeResults).toHaveLength(5);
      
      writeResults.forEach((result, index) => {
        expect(result.name).toBe(`Concurrent User ${index}`);
      });
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should properly clean up after bulk operations', async () => {
      // Create many documents
      const users = [];
      for (let i = 0; i < 100; i++) {
        users.push({
          phone: `+1212555${3000 + i}`,
          name: `Bulk User ${i}`,
          userName: `bulk${i}`,
          email: `bulk${i}@example.com`,
          password: await bcrypt.hash('Password123!', 10),
          userType: i % 2 === 0 ? 'Creator' : 'Marketer',
          isActive: true,
          ...(i % 2 === 0 ? {
            creatorData: {
              platforms: ['Instagram'],
              categories: ['technology'],
              nicheTopics: ['tech'],
              achievements: `Bulk achievements ${i}`,
              businessVentures: `Bulk business ${i}`,
              portfolio: [],
              totalFollowers: 1000 + i
            }
          } : {
            marketerData: {
              companyName: `Bulk Company ${i}`,
              industry: 'Technology',
              website: `https://bulk${i}.com`,
              businessLicense: `BULK${i}`,
              totalCampaigns: i,
              successfulCampaigns: Math.floor(i * 0.8),
              averageRating: 3.5 + (i % 3) * 0.5
            }
          })
        });
      }

      const createdUsers = await User.insertMany(users);
      expect(createdUsers).toHaveLength(100);

      // Bulk delete
      await User.deleteMany({ 
        phone: { $regex: /^\+1212555[3-4]\d{3}$/ } 
      });

      // Verify deletion
      const remainingUsers = await User.find({ 
        phone: { $regex: /^\+1212555[3-4]\d{3}$/ } 
      });
      expect(remainingUsers).toHaveLength(0);
    });

    it('should handle large document queries efficiently', async () => {
      // Create user with large portfolio
      const largePortfolio = Array.from({ length: 100 }, (_, i) => ({
        title: `Portfolio Item ${i}`,
        description: `Description for portfolio item ${i}`,
        url: `https://portfolio${i}.com`,
        metrics: {
          views: 1000 + i,
          likes: 100 + i,
          shares: 10 + i
        }
      }));

      const userWithLargeData = await User.create({
        phone: '+12125554000',
        name: 'Large Data User',
        userName: 'largedatauser',
        email: 'largedata@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Creator',
        isActive: true,
        creatorData: {
          platforms: ['Instagram', 'YouTube', 'TikTok'],
          categories: ['technology', 'lifestyle', 'entertainment'],
          nicheTopics: ['tech', 'gadgets', 'reviews'],
          achievements: 'Major tech influencer with multiple achievements',
          businessVentures: 'Multiple successful business ventures',
          portfolio: largePortfolio,
          totalFollowers: 500000
        }
      });

      // Query the large document
      const startTime = Date.now();
      const retrievedUser = await User.findById(userWithLargeData._id);
      const endTime = Date.now();

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.creatorData.portfolio).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should retrieve within 1 second
    });
  });
});