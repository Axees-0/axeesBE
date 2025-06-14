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

jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123456789',
          client_secret: 'cs_test_123456789_secret',
          metadata: {},
          payment_intent: 'pi_test_123456789'
        })
      }
    }
  }));
});

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const Deal = require('../../models/deal');
const Chat = require('../../models/chat');
const Message = require('../../models/message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');

describe('Performance Baseline Tests', () => {
  let testUser, testToken;
  const performanceMetrics = {};

  beforeAll(async () => {
    await connect();
    
    // Create test user for authentication
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    testUser = await User.create({
      phone: '+12125551234',
      name: 'Performance Test User',
      userName: 'perfuser',
      email: 'perf@example.com',
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
        totalFollowers: 10000
      }
    });

    testToken = generateTestToken({
      id: testUser._id.toString(),
      phone: testUser.phone,
      userType: testUser.userType
    });
  });

  beforeEach(async () => {
    // Clear database for clean performance tests
    await clearDatabase();
    
    // Recreate test user
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    testUser = await User.create({
      phone: '+12125551234',
      name: 'Performance Test User',
      userName: 'perfuser',
      email: 'perf@example.com',
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
        totalFollowers: 10000
      }
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    // Output performance summary
    console.log('\n📊 PERFORMANCE BASELINE RESULTS');
    console.log('================================');
    Object.entries(performanceMetrics).forEach(([test, metrics]) => {
      console.log(`\n${test}:`);
      console.log(`  Average: ${metrics.average}ms`);
      console.log(`  Min: ${metrics.min}ms`);
      console.log(`  Max: ${metrics.max}ms`);
      console.log(`  Total requests: ${metrics.count}`);
      if (metrics.rps) {
        console.log(`  Requests/second: ${metrics.rps}`);
      }
    });
    console.log('\n================================\n');
    
    await closeDatabase();
  });

  // Helper function to measure and record performance
  const measurePerformance = (testName, duration) => {
    if (!performanceMetrics[testName]) {
      performanceMetrics[testName] = {
        times: [],
        count: 0,
        total: 0
      };
    }
    
    performanceMetrics[testName].times.push(duration);
    performanceMetrics[testName].count++;
    performanceMetrics[testName].total += duration;
    performanceMetrics[testName].average = Math.round(performanceMetrics[testName].total / performanceMetrics[testName].count);
    performanceMetrics[testName].min = Math.min(...performanceMetrics[testName].times);
    performanceMetrics[testName].max = Math.max(...performanceMetrics[testName].times);
  };

  describe('API Response Time Benchmarks', () => {
    describe('Authentication Endpoints', () => {
      it('should complete login within performance threshold', async () => {
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              phone: testUser.phone,
              password: 'SecurePassword123!'
            });

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(200);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Authentication - Login', averageTime);

        // Performance threshold: login should complete within 500ms on average
        expect(averageTime).toBeLessThan(500);
        console.log(`Login average response time: ${Math.round(averageTime)}ms`);
      });

      it('should complete user registration within performance threshold', async () => {
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          // Registration start
          let startTime = Date.now();
          
          let response = await request(app)
            .post('/api/auth/register/start')
            .send({
              phone: `+1212555${2000 + i}`,
              userType: 'Creator'
            });

          expect(response.status).toBe(200);

          // OTP verification
          response = await request(app)
            .post('/api/auth/register/verify')
            .send({
              phone: `+1212555${2000 + i}`,
              code: '123456'
            });

          expect(response.status).toBe(200);

          // Complete registration
          response = await request(app)
            .post('/api/auth/register/complete')
            .send({
              phone: `+1212555${2000 + i}`,
              name: `Test User ${i}`,
              userName: `testuser${i}`,
              password: 'SecurePassword123!',
              userType: 'Creator'
            });

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(201);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Authentication - Full Registration', averageTime);

        // Performance threshold: full registration should complete within 2 seconds on average
        expect(averageTime).toBeLessThan(2000);
        console.log(`Registration average response time: ${Math.round(averageTime)}ms`);
      });
    });

    describe('User Management Endpoints', () => {
      it('should retrieve user profile within performance threshold', async () => {
        const iterations = 20;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .get('/api/users/profile')
            .set('x-user-id', testUser._id.toString());

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(200);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('User Management - Get Profile', averageTime);

        // Performance threshold: profile retrieval should complete within 200ms on average
        expect(averageTime).toBeLessThan(200);
        console.log(`Get profile average response time: ${Math.round(averageTime)}ms`);
      });

      it('should update user profile within performance threshold', async () => {
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .patch('/api/users/profile')
            .set('x-user-id', testUser._id.toString())
            .send({
              bio: `Updated bio ${i} - ${Date.now()}`
            });

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(200);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('User Management - Update Profile', averageTime);

        // Performance threshold: profile update should complete within 300ms on average
        expect(averageTime).toBeLessThan(300);
        console.log(`Update profile average response time: ${Math.round(averageTime)}ms`);
      });
    });

    describe('Offer Management Endpoints', () => {
      beforeEach(async () => {
        // Create a marketer for offer tests
        const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
        const marketerUser = await User.create({
          phone: '+12125551235',
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
            totalCampaigns: 5,
            successfulCampaigns: 4,
            averageRating: 4.5
          }
        });
      });

      it('should create offers within performance threshold', async () => {
        const marketer = await User.findOne({ userType: 'Marketer' });
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .post('/api/marketer/offers')
            .set('x-user-id', marketer._id.toString())
            .send({
              creatorId: testUser._id.toString(),
              offerName: `Performance Test Offer ${i}`,
              proposedAmount: 1000 + (i * 100),
              currency: 'USD',
              platforms: ['Instagram'],
              deliverables: ['Post', 'Story'],
              desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              description: `Performance test offer ${i}`
            });

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(201);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Offer Management - Create Offer', averageTime);

        // Performance threshold: offer creation should complete within 400ms on average
        expect(averageTime).toBeLessThan(400);
        console.log(`Create offer average response time: ${Math.round(averageTime)}ms`);
      });

      it('should list offers within performance threshold', async () => {
        // Create test offers first
        const marketer = await User.findOne({ userType: 'Marketer' });
        for (let i = 0; i < 10; i++) {
          await Offer.create({
            marketerId: marketer._id,
            creatorId: testUser._id,
            offerName: `Test Offer ${i}`,
            proposedAmount: 1000 + (i * 100),
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: ['Post'],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: `Test offer ${i}`,
            status: 'Sent'
          });
        }

        const iterations = 15;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .get('/api/marketer/offers')
            .query({
              userType: 'Creator',
              userId: testUser._id.toString()
            })
            .set('x-user-id', testUser._id.toString());

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(200);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Offer Management - List Offers', averageTime);

        // Performance threshold: offer listing should complete within 300ms on average
        expect(averageTime).toBeLessThan(300);
        console.log(`List offers average response time: ${Math.round(averageTime)}ms`);
      });
    });

    describe('Chat/Messaging Endpoints', () => {
      beforeEach(async () => {
        // Create test chat and messages
        const marketer = await User.create({
          phone: '+12125551236',
          name: 'Chat Marketer',
          userName: 'chatmarketer',
          email: 'chatmarketer@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Marketer',
          isActive: true,
          marketerData: {
            companyName: 'Chat Company',
            industry: 'Technology',
            website: 'https://chat.com',
            businessLicense: 'CHAT123',
            totalCampaigns: 3,
            successfulCampaigns: 2,
            averageRating: 4.0
          }
        });

        const chat = await Chat.create({
          participants: [marketer._id, testUser._id],
          unreadCount: {
            [marketer._id.toString()]: 0,
            [testUser._id.toString()]: 0
          }
        });

        // Create test messages
        for (let i = 0; i < 20; i++) {
          await Message.create({
            chatId: chat._id,
            senderId: i % 2 === 0 ? marketer._id : testUser._id,
            text: `Test message ${i}`,
            status: 'sent'
          });
        }
      });

      it('should send messages within performance threshold', async () => {
        const chat = await Chat.findOne();
        const iterations = 10;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .post(`/api/chats/${chat._id}/messages`)
            .set('x-user-id', testUser._id.toString())
            .send({
              text: `Performance test message ${i}`,
              receiverId: chat.participants.find(p => p.toString() !== testUser._id.toString()).toString()
            });

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(201);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Chat - Send Message', averageTime);

        // Performance threshold: message sending should complete within 250ms on average
        expect(averageTime).toBeLessThan(250);
        console.log(`Send message average response time: ${Math.round(averageTime)}ms`);
      });

      it('should retrieve message history within performance threshold', async () => {
        const chat = await Chat.findOne();
        const iterations = 15;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          const response = await request(app)
            .get(`/api/chats/${chat._id}/messages`)
            .set('x-user-id', testUser._id.toString());

          const endTime = Date.now();
          const duration = endTime - startTime;
          times.push(duration);

          expect(response.status).toBe(200);
        }

        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
        measurePerformance('Chat - Get Messages', averageTime);

        // Performance threshold: message retrieval should complete within 200ms on average
        expect(averageTime).toBeLessThan(200);
        console.log(`Get messages average response time: ${Math.round(averageTime)}ms`);
      });
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent user profile requests', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/users/profile')
          .set('x-user-id', testUser._id.toString())
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const averageTime = totalDuration / concurrentRequests;
      const rps = (concurrentRequests * 1000) / totalDuration;

      measurePerformance('Concurrent - User Profile', averageTime);
      performanceMetrics['Concurrent - User Profile'].rps = Math.round(rps);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent processing
      expect(totalDuration).toBeLessThan(2000); // 2 seconds for 20 concurrent requests
      console.log(`Concurrent profile requests: ${concurrentRequests} requests in ${totalDuration}ms (${Math.round(rps)} RPS)`);
    });

    it('should handle concurrent offer creation', async () => {
      const marketer = await User.create({
        phone: '+12125551237',
        name: 'Concurrent Marketer',
        userName: 'concurrentmarketer',
        email: 'concurrent@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Marketer',
        isActive: true,
        marketerData: {
          companyName: 'Concurrent Company',
          industry: 'Technology',
          website: 'https://concurrent.com',
          businessLicense: 'CONCURRENT123',
          totalCampaigns: 1,
          successfulCampaigns: 1,
          averageRating: 5.0
        }
      });

      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/marketer/offers')
          .set('x-user-id', marketer._id.toString())
          .send({
            creatorId: testUser._id.toString(),
            offerName: `Concurrent Offer ${i}`,
            proposedAmount: 1000 + (i * 50),
            currency: 'USD',
            platforms: ['Instagram'],
            deliverables: ['Post'],
            desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            description: `Concurrent test offer ${i}`
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const averageTime = totalDuration / concurrentRequests;
      const rps = (concurrentRequests * 1000) / totalDuration;

      measurePerformance('Concurrent - Offer Creation', averageTime);
      performanceMetrics['Concurrent - Offer Creation'].rps = Math.round(rps);

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success rate

      console.log(`Concurrent offer creation: ${concurrentRequests} requests in ${totalDuration}ms (${Math.round(rps)} RPS)`);
    });

    it('should handle concurrent message sending', async () => {
      const marketer = await User.create({
        phone: '+12125551238',
        name: 'Message Marketer',
        userName: 'messagemarketer',
        email: 'message@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Marketer',
        isActive: true,
        marketerData: {
          companyName: 'Message Company',
          industry: 'Technology',
          website: 'https://message.com',
          businessLicense: 'MESSAGE123',
          totalCampaigns: 1,
          successfulCampaigns: 1,
          averageRating: 4.5
        }
      });

      const chat = await Chat.create({
        participants: [marketer._id, testUser._id],
        unreadCount: {
          [marketer._id.toString()]: 0,
          [testUser._id.toString()]: 0
        }
      });

      const concurrentRequests = 15;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post(`/api/chats/${chat._id}/messages`)
          .set('x-user-id', testUser._id.toString())
          .send({
            text: `Concurrent message ${i}`,
            receiverId: marketer._id.toString()
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const averageTime = totalDuration / concurrentRequests;
      const rps = (concurrentRequests * 1000) / totalDuration;

      measurePerformance('Concurrent - Message Sending', averageTime);
      performanceMetrics['Concurrent - Message Sending'].rps = Math.round(rps);

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success rate

      console.log(`Concurrent message sending: ${concurrentRequests} requests in ${totalDuration}ms (${Math.round(rps)} RPS)`);
    });
  });

  describe('Database Performance', () => {
    it('should handle bulk user creation efficiently', async () => {
      const bulkSize = 50;
      const users = [];

      for (let i = 0; i < bulkSize; i++) {
        users.push({
          phone: `+1212555${3000 + i}`,
          name: `Bulk User ${i}`,
          userName: `bulkuser${i}`,
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

      const startTime = Date.now();
      const createdUsers = await User.insertMany(users);
      const endTime = Date.now();
      const duration = endTime - startTime;

      measurePerformance('Database - Bulk User Creation', duration);

      expect(createdUsers).toHaveLength(bulkSize);
      // Bulk operations should be efficient
      expect(duration).toBeLessThan(2000); // 2 seconds for 50 users
      console.log(`Bulk user creation: ${bulkSize} users in ${duration}ms`);
    });

    it('should handle complex queries efficiently', async () => {
      // Create test data
      const marketer = await User.create({
        phone: '+12125551239',
        name: 'Query Marketer',
        userName: 'querymarketer',
        email: 'query@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Marketer',
        isActive: true,
        marketerData: {
          companyName: 'Query Company',
          industry: 'Technology',
          website: 'https://query.com',
          businessLicense: 'QUERY123',
          totalCampaigns: 20,
          successfulCampaigns: 18,
          averageRating: 4.8
        }
      });

      // Create multiple offers for complex querying
      for (let i = 0; i < 25; i++) {
        await Offer.create({
          marketerId: marketer._id,
          creatorId: testUser._id,
          offerName: `Query Test Offer ${i}`,
          proposedAmount: 1000 + (i * 100),
          currency: 'USD',
          platforms: ['Instagram', 'TikTok'][i % 2],
          deliverables: ['Post', 'Story'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: `Query test offer ${i}`,
          status: ['Sent', 'Accepted', 'Rejected'][i % 3]
        });
      }

      // Complex query with multiple filters, sorting, and population
      const startTime = Date.now();
      
      const offers = await Offer.find({
        $and: [
          { proposedAmount: { $gte: 1500, $lte: 3000 } },
          { platforms: { $in: ['Instagram'] } },
          { status: { $in: ['Sent', 'Accepted'] } }
        ]
      })
      .populate('marketerId', 'name email marketerData.companyName')
      .populate('creatorId', 'name userName creatorData.totalFollowers')
      .sort({ proposedAmount: -1, createdAt: -1 })
      .limit(10);

      const endTime = Date.now();
      const duration = endTime - startTime;

      measurePerformance('Database - Complex Query', duration);

      expect(offers.length).toBeGreaterThan(0);
      // Complex queries should complete reasonably fast
      expect(duration).toBeLessThan(500); // 500ms for complex query
      console.log(`Complex query: ${offers.length} results in ${duration}ms`);
    });

    it('should handle pagination efficiently', async () => {
      // Create test data for pagination
      for (let i = 0; i < 100; i++) {
        await User.create({
          phone: `+1212555${4000 + i}`,
          name: `Pagination User ${i}`,
          userName: `pageuser${i}`,
          email: `page${i}@example.com`,
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['Instagram'],
            categories: ['technology'],
            nicheTopics: ['tech'],
            achievements: `Page achievements ${i}`,
            businessVentures: `Page business ${i}`,
            portfolio: [],
            totalFollowers: 1000 + (i * 10)
          }
        });
      }

      const iterations = 10;
      const times = [];

      for (let page = 1; page <= iterations; page++) {
        const startTime = Date.now();
        
        const users = await User.find({ userType: 'Creator' })
          .sort({ createdAt: -1 })
          .skip((page - 1) * 10)
          .limit(10);

        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);

        expect(users.length).toBeGreaterThan(0);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      measurePerformance('Database - Pagination Query', averageTime);

      // Pagination should be efficient regardless of page number
      expect(averageTime).toBeLessThan(200); // 200ms average for paginated queries
      console.log(`Pagination average query time: ${Math.round(averageTime)}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large response payloads efficiently', async () => {
      // Create user with large portfolio
      const largePortfolio = Array.from({ length: 200 }, (_, i) => ({
        title: `Portfolio Item ${i}`,
        description: `Detailed description for portfolio item ${i} with lots of text to make it realistic and test large payloads`,
        url: `https://portfolio${i}.com`,
        metrics: {
          views: 10000 + (i * 100),
          likes: 1000 + (i * 10),
          shares: 100 + i,
          comments: 50 + i,
          engagement: (Math.random() * 10).toFixed(2)
        },
        tags: [`tag${i}`, `category${i % 5}`, `type${i % 3}`],
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }));

      const userWithLargeData = await User.create({
        phone: '+12125555000',
        name: 'Large Data User',
        userName: 'largedatauser',
        email: 'largedata@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Creator',
        isActive: true,
        bio: 'This is a very long bio with lots of details about the user, their experience, achievements, and background. '.repeat(20),
        creatorData: {
          platforms: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'LinkedIn'],
          categories: ['technology', 'lifestyle', 'entertainment', 'education', 'business'],
          nicheTopics: ['tech', 'gadgets', 'reviews', 'tutorials', 'unboxing'],
          achievements: 'Major tech influencer with multiple awards and recognition. '.repeat(10),
          businessVentures: 'Successful entrepreneur with multiple business ventures. '.repeat(10),
          portfolio: largePortfolio,
          totalFollowers: 1000000,
          metrics: {
            avgEngagement: 8.5,
            totalPosts: 2500,
            totalViews: 50000000,
            totalLikes: 5000000
          }
        }
      });

      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/users/profile')
          .set('x-user-id', userWithLargeData._id.toString());

        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);

        expect(response.status).toBe(200);
        expect(response.body.creatorData.portfolio.length).toBe(200);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      measurePerformance('Large Payload - User Profile', averageTime);

      // Large payloads should still be handled efficiently
      expect(averageTime).toBeLessThan(1000); // 1 second for large payload
      console.log(`Large payload response time: ${Math.round(averageTime)}ms`);
    });

    it('should maintain performance with multiple data relationships', async () => {
      // Create complex data relationships
      const marketer = await User.create({
        phone: '+12125555001',
        name: 'Relationship Marketer',
        userName: 'relationmarketer',
        email: 'relation@example.com',
        password: await bcrypt.hash('Password123!', 10),
        userType: 'Marketer',
        isActive: true,
        marketerData: {
          companyName: 'Relationship Company',
          industry: 'Technology',
          website: 'https://relation.com',
          businessLicense: 'RELATION123',
          totalCampaigns: 50,
          successfulCampaigns: 45,
          averageRating: 4.9
        }
      });

      // Create multiple offers, deals, and chats
      for (let i = 0; i < 30; i++) {
        const offer = await Offer.create({
          marketerId: marketer._id,
          creatorId: testUser._id,
          offerName: `Relationship Offer ${i}`,
          proposedAmount: 2000 + (i * 100),
          currency: 'USD',
          platforms: ['Instagram'],
          deliverables: ['Post', 'Story'],
          desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description: `Relationship test offer ${i}`,
          status: 'Accepted'
        });

        // Create deal for some offers
        if (i % 2 === 0) {
          await Deal.create({
            marketerId: marketer._id,
            creatorId: testUser._id,
            dealName: offer.offerName,
            dealNumber: `REL-${1000 + i}`,
            status: 'Active',
            paymentInfo: {
              currency: 'USD',
              paymentAmount: offer.proposedAmount,
              paymentNeeded: true,
              transactions: []
            },
            milestones: [{
              name: `Milestone ${i}`,
              amount: offer.proposedAmount / 2,
              dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              status: 'Pending'
            }]
          });
        }
      }

      // Create chat with messages
      const chat = await Chat.create({
        participants: [marketer._id, testUser._id],
        unreadCount: {
          [marketer._id.toString()]: 0,
          [testUser._id.toString()]: 0
        }
      });

      for (let i = 0; i < 50; i++) {
        await Message.create({
          chatId: chat._id,
          senderId: i % 2 === 0 ? marketer._id : testUser._id,
          text: `Relationship test message ${i}`,
          status: 'sent'
        });
      }

      // Test complex query with multiple relationships
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/marketer/offers')
        .query({
          userType: 'Creator',
          userId: testUser._id.toString(),
          status: 'Accepted',
          sortBy: 'proposedAmount',
          sortOrder: 'desc'
        })
        .set('x-user-id', testUser._id.toString());

      const endTime = Date.now();
      const duration = endTime - startTime;

      measurePerformance('Complex Relationships - Query', duration);

      expect(response.status).toBe(200);
      expect(response.body.offers.length).toBeGreaterThan(0);
      
      // Complex relationship queries should be optimized
      expect(duration).toBeLessThan(800); // 800ms for complex relationship query
      console.log(`Complex relationship query: ${duration}ms`);
    });
  });
});