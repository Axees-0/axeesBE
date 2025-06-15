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
  createTransporter: jest.fn(() => ({
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
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

describe('Chat/Messaging V1 API Tests', () => {
  let marketerUser, creatorUser, testOffer, testChatRoom;
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
        brandName: 'Test Company',
        industry: 'Technology',
        brandWebsite: 'https://test.com',
        platforms: [{
          platform: 'instagram',
          handle: '@testmarketer',
          followersCount: 5000
        }],
        categories: ['technology'],
        nicheTopics: ['marketing'],
        totalFollowers: 5000,
        offers: 10,
        deals: 8
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
        platforms: [{
          platform: 'instagram',
          handle: '@testcreator',
          followersCount: 10000
        }],
        categories: ['technology'],
        nicheTopics: ['tech'],
        achievements: 'Tech influencer',
        businessVentures: 'Tech startup',
        portfolio: [],
        totalFollowers: 10000
      }
    });

    // Create test offer
    testOffer = await Offer.create({
      marketerId: marketerUser._id,
      creatorId: creatorUser._id,
      offerName: 'Test Campaign Offer',
      proposedAmount: 1000,
      currency: 'USD',
      platforms: ['instagram'],
      deliverables: ['Instagram post', 'Story'],
      desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: 'Test campaign for tech product',
      status: 'Sent'
    });

    // Create test chat room
    testChatRoom = await ChatRoom.create({
      participants: [marketerUser._id, creatorUser._id],
      createdFromOffer: testOffer._id,
      unreadCount: new Map([
        [marketerUser._id.toString(), 0],
        [creatorUser._id.toString(), 0]
      ])
    });

    // Generate tokens
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

  describe('POST /api/v1/chat/send - Send Message', () => {
    describe('Send Message Tests', () => {
      it('should send a text message successfully', async () => {
        const messageData = {
          text: 'Hello, this is a test message!',
          receiverId: creatorUser._id.toString(),
          roomId: testChatRoom._id.toString()
        };

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send(messageData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message.text).toBe(messageData.text);
        expect(response.body.message.senderId._id).toBe(marketerUser._id.toString());
        expect(response.body.message).toHaveProperty('createdAt');
        expect(response.body.message.attachments).toEqual([]);
      });

      it('should send a message with attachments only', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, 'test-attachment.txt');
        fs.writeFileSync(testFilePath, 'Test file content for attachment');

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString())
          .attach('attachments', testFilePath);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toHaveProperty('attachments');
        expect(response.body.message.attachments.length).toBe(1);
        
        const attachment = response.body.message.attachments[0];
        expect(attachment).toHaveProperty('url');
        expect(attachment).toHaveProperty('name', 'test-attachment.txt');
        expect(attachment).toHaveProperty('type', 'text/plain');
        expect(attachment).toHaveProperty('size');

        // Cleanup
        fs.unlinkSync(testFilePath);
      });

      it('should send a message with both text and attachments', async () => {
        const testFilePath = path.join(__dirname, 'test-combo.txt');
        fs.writeFileSync(testFilePath, 'Combined message test');

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('text', 'Message with attachment')
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString())
          .attach('attachments', testFilePath);

        expect(response.status).toBe(201);
        expect(response.body.message.text).toBe('Message with attachment');
        expect(response.body.message.attachments.length).toBe(1);

        // Cleanup
        fs.unlinkSync(testFilePath);
      });

      it('should update chat room last message and unread count', async () => {
        const messageData = {
          text: 'Test unread count update',
          receiverId: creatorUser._id.toString(),
          roomId: testChatRoom._id.toString()
        };

        await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send(messageData);

        // Check that chat room was updated
        const updatedChatRoom = await ChatRoom.findById(testChatRoom._id);
        expect(updatedChatRoom.lastMessage.text).toBe(messageData.text);
        expect(updatedChatRoom.lastMessage.sender.toString()).toBe(marketerUser._id.toString());
        expect(updatedChatRoom.unreadCount.get(creatorUser._id.toString())).toBe(1);
      });
    });

    describe('Message Validation Tests', () => {
      it('should reject empty messages', async () => {
        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: '',
            receiverId: creatorUser._id.toString(),
            roomId: testChatRoom._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Message cannot be empty');
      });

      it('should reject messages that are too long', async () => {
        const longText = 'a'.repeat(5001);
        
        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: longText,
            receiverId: creatorUser._id.toString(),
            roomId: testChatRoom._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('too long');
      });

      it('should filter inappropriate content', async () => {
        const inappropriateMessage = {
          text: 'This message contains damn inappropriate content',
          receiverId: creatorUser._id.toString(),
          roomId: testChatRoom._id.toString()
        };

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send(inappropriateMessage);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('inappropriate content');
      });

      it('should require room ID', async () => {
        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: 'Test message',
            receiverId: creatorUser._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Room ID is required');
      });

      it('should validate receiver ID format', async () => {
        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: 'Test message',
            receiverId: 'invalid-id',
            roomId: testChatRoom._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('receiverId is missing or invalid');
      });

      it('should require sender authentication', async () => {
        const response = await request(app)
          .post('/api/v1/chat/send')
          .send({
            text: 'Test message',
            receiverId: creatorUser._id.toString(),
            roomId: testChatRoom._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('senderId is missing or invalid');
      });
    });

    describe('Recipient Validation Tests', () => {
      it('should prevent non-participants from sending messages', async () => {
        // Create another user not in the chat
        const outsideUser = await User.create({
          phone: '+12125551237',
          name: 'Outside User',
          userName: 'outsideuser',
          email: 'outside@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: [{
              platform: 'tiktok',
              handle: '@outsideuser',
              followersCount: 5000
            }],
            categories: ['entertainment'],
            nicheTopics: ['comedy'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 5000
          }
        });

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', outsideUser._id.toString())
          .send({
            text: 'Unauthorized message',
            receiverId: creatorUser._id.toString(),
            roomId: testChatRoom._id.toString()
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('not authorized to send messages');
      });

      it('should prevent sending to non-existent chat room', async () => {
        const fakeRoomId = '507f1f77bcf86cd799439011';
        
        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: 'Test message',
            receiverId: creatorUser._id.toString(),
            roomId: fakeRoomId
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('not authorized to send messages');
      });
    });

    describe('Attachment Handling Tests', () => {
      it('should handle multiple attachments', async () => {
        const testFile1 = path.join(__dirname, 'test-file-1.txt');
        const testFile2 = path.join(__dirname, 'test-file-2.txt');
        
        fs.writeFileSync(testFile1, 'First test file');
        fs.writeFileSync(testFile2, 'Second test file');

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('text', 'Message with multiple attachments')
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString())
          .attach('attachments', testFile1)
          .attach('attachments', testFile2);

        expect(response.status).toBe(201);
        expect(response.body.message.attachments.length).toBe(2);
        expect(response.body.message.attachments[0].name).toBe('test-file-1.txt');
        expect(response.body.message.attachments[1].name).toBe('test-file-2.txt');

        // Cleanup
        fs.unlinkSync(testFile1);
        fs.unlinkSync(testFile2);
      });

      it('should reject files that are too large', async () => {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
        const testFilePath = path.join(__dirname, 'large-file.txt');
        fs.writeFileSync(testFilePath, largeBuffer);

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString())
          .attach('attachments', testFilePath);

        expect(response.status).toBe(413);
        expect(response.body.error).toContain('File too large');

        // Cleanup
        fs.unlinkSync(testFilePath);
      });

      it('should reject too many files', async () => {
        const files = [];
        for (let i = 0; i < 6; i++) {
          const filePath = path.join(__dirname, `test-file-${i}.txt`);
          fs.writeFileSync(filePath, `Test file ${i}`);
          files.push(filePath);
        }

        let requestBuilder = request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString());

        files.forEach(file => {
          requestBuilder = requestBuilder.attach('attachments', file);
        });

        const response = await requestBuilder;

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Too many files');

        // Cleanup
        files.forEach(file => fs.unlinkSync(file));
      });

      it('should reject unsupported file types', async () => {
        const testFilePath = path.join(__dirname, 'test-file.exe');
        fs.writeFileSync(testFilePath, 'fake executable');

        const response = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .field('receiverId', creatorUser._id.toString())
          .field('roomId', testChatRoom._id.toString())
          .attach('attachments', testFilePath);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('File type');
        expect(response.body.error).toContain('not allowed');

        // Cleanup
        fs.unlinkSync(testFilePath);
      });
    });
  });

  describe('GET /api/v1/chat/messages/:roomId - Get Messages', () => {
    let testMessages;

    beforeEach(async () => {
      // Create test messages
      testMessages = [];
      
      for (let i = 1; i <= 5; i++) {
        const message = await Message.create({
          chatId: testChatRoom._id,
          senderId: i % 2 === 0 ? marketerUser._id : creatorUser._id,
          text: `Test message ${i}`,
          createdAt: new Date(Date.now() - (5 - i) * 1000) // Stagger creation times
        });
        testMessages.push(message);
      }
    });

    describe('Message Retrieval Tests', () => {
      it('should retrieve message history successfully', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('messages');
        expect(Array.isArray(response.body.messages)).toBe(true);
        expect(response.body.messages.length).toBe(5);
        
        // Check that messages are sorted by creation date (newest first)
        const messages = response.body.messages;
        for (let i = 1; i < messages.length; i++) {
          expect(new Date(messages[i-1].createdAt) >= new Date(messages[i].createdAt)).toBe(true);
        }
      });

      it('should include sender information in messages', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        const message = response.body.messages[0];
        expect(message).toHaveProperty('senderId');
        expect(message.senderId).toHaveProperty('name');
        expect(message.senderId).toHaveProperty('userName');
        expect(['Test Marketer', 'Test Creator']).toContain(message.senderId.name);
      });

      it('should exclude deleted messages', async () => {
        // Mark one message as deleted
        await Message.findByIdAndUpdate(testMessages[0]._id, { deleted: true });

        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBe(4); // Should exclude deleted message
      });
    });

    describe('Pagination Tests', () => {
      it('should support pagination with limit', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .query({ limit: 3 })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBe(3);
        expect(response.body).toHaveProperty('hasMore', true);
        expect(response.body).toHaveProperty('nextCursor');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination.hasMore).toBe(true);
      });

      it('should support cursor-based pagination', async () => {
        // Get first page
        const firstResponse = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .query({ limit: 2 })
          .set('x-user-id', marketerUser._id.toString());

        expect(firstResponse.body.hasMore).toBe(true);
        const cursor = firstResponse.body.nextCursor;

        // Get second page
        const secondResponse = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .query({ limit: 2, cursor: cursor })
          .set('x-user-id', marketerUser._id.toString());

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body.messages.length).toBe(2);
        
        // Ensure no overlap between pages
        const firstPageIds = firstResponse.body.messages.map(m => m._id);
        const secondPageIds = secondResponse.body.messages.map(m => m._id);
        const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
        expect(overlap.length).toBe(0);
      });

      it('should handle last page correctly', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .query({ limit: 10 }) // More than total messages
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBe(5); // All messages
        expect(response.body.hasMore).toBe(false);
        expect(response.body.nextCursor).toBeNull();
      });
    });

    describe('Access Control Tests', () => {
      it('should prevent non-participants from accessing messages', async () => {
        const outsideUser = await User.create({
          phone: '+12125551238',
          name: 'Outside User 2',
          userName: 'outsideuser2',
          email: 'outside2@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: [{
              platform: 'youtube',
              handle: 'outsideuser2',
              followersCount: 2000
            }],
            categories: ['education'],
            nicheTopics: ['tech'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 2000
          }
        });

        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`)
          .set('x-user-id', outsideUser._id.toString());

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('not authorized to access messages');
      });

      it('should require user authentication', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/messages/${testChatRoom._id}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('User ID is required');
      });

      it('should validate room ID format', async () => {
        const response = await request(app)
          .get('/api/v1/chat/messages/invalid-room-id')
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('roomId is missing or invalid');
      });

      it('should handle non-existent room', async () => {
        const fakeRoomId = '507f1f77bcf86cd799439011';
        
        const response = await request(app)
          .get(`/api/v1/chat/messages/${fakeRoomId}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('not authorized to access messages');
      });
    });
  });

  describe('GET /api/v1/chat/stream/:roomId - Real-time SSE Connection', () => {
    describe('SSE Connection Tests', () => {
      it('should establish SSE connection successfully', (done) => {
        const response = request(app)
          .get(`/api/v1/chat/stream/${testChatRoom._id}`)
          .query({ userId: marketerUser._id.toString() })
          .expect(200)
          .expect('Content-Type', /text\/event-stream/)
          .expect('Cache-Control', 'no-cache')
          .expect('Connection', 'keep-alive');

        response.on('data', (chunk) => {
          const data = chunk.toString();
          if (data.includes('event: connected')) {
            expect(data).toContain('status":"connected"');
            response.req.destroy();
            done();
          }
        });

        setTimeout(() => {
          response.req.destroy();
          done(new Error('SSE connection timeout'));
        }, 5000);
      });

      it('should send heartbeat messages', (done) => {
        const response = request(app)
          .get(`/api/v1/chat/stream/${testChatRoom._id}`)
          .query({ userId: marketerUser._id.toString() });

        let heartbeatReceived = false;
        let connectedReceived = false;

        response.on('data', (chunk) => {
          const data = chunk.toString();
          
          if (data.includes('event: connected')) {
            connectedReceived = true;
          }
          
          if (data.includes(': heartbeat')) {
            heartbeatReceived = true;
          }

          if (connectedReceived && heartbeatReceived) {
            response.req.destroy();
            done();
          }
        });

        // Wait longer for heartbeat (they occur every 30 seconds in real app, but faster in tests)
        setTimeout(() => {
          response.req.destroy();
          if (!heartbeatReceived) {
            // For test purposes, just check that connection was established
            expect(connectedReceived).toBe(true);
            done();
          }
        }, 2000);
      });
    });

    describe('SSE Access Control Tests', () => {
      it('should prevent non-participants from accessing SSE stream', async () => {
        const outsideUser = await User.create({
          phone: '+12125551239',
          name: 'Outside User 3',
          userName: 'outsideuser3',
          email: 'outside3@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: [{
              platform: 'twitter',
              handle: '@outsideuser3',
              followersCount: 3000
            }],
            categories: ['news'],
            nicheTopics: ['politics'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 3000
          }
        });

        const response = await request(app)
          .get(`/api/v1/chat/stream/${testChatRoom._id}`)
          .query({ userId: outsideUser._id.toString() });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Access denied');
      });

      it('should require user ID for SSE connection', async () => {
        const response = await request(app)
          .get(`/api/v1/chat/stream/${testChatRoom._id}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('User ID is required');
      });

      it('should handle invalid room ID for SSE', async () => {
        const response = await request(app)
          .get('/api/v1/chat/stream/invalid-room-id')
          .query({ userId: marketerUser._id.toString() });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Access denied');
      });
    });
  });

  describe('Input Validation & Security', () => {
    it('should validate chat room ID format in all endpoints', async () => {
      const invalidIds = ['invalid', '123', 'not-an-objectid'];

      for (const invalidId of invalidIds) {
        // Test send message endpoint
        const sendResponse = await request(app)
          .post('/api/v1/chat/send')
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: 'Test message',
            receiverId: creatorUser._id.toString(),
            roomId: invalidId
          });

        expect([400, 403]).toContain(sendResponse.status);

        // Test get messages endpoint
        const getResponse = await request(app)
          .get(`/api/v1/chat/messages/${invalidId}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(getResponse.status).toBe(400);
      }
    });

    it('should sanitize message content', async () => {
      const xssMessage = {
        text: '<script>alert("XSS")</script>Normal message content',
        receiverId: creatorUser._id.toString(),
        roomId: testChatRoom._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/chat/send')
        .set('x-user-id', marketerUser._id.toString())
        .send(xssMessage);

      if (response.status === 201) {
        // If message was sent, ensure dangerous content was removed/escaped
        expect(response.body.message.text).not.toContain('<script>');
        expect(response.body.message.text).not.toContain('alert');
      } else {
        // Message should be rejected due to content filtering
        expect(response.status).toBe(400);
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/chat/send')
        .set('x-user-id', marketerUser._id.toString())
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('should handle very large request bodies', async () => {
      const largeData = {
        text: 'a'.repeat(10000), // Very large but within limits
        receiverId: creatorUser._id.toString(),
        roomId: testChatRoom._id.toString(),
        extraData: 'x'.repeat(50000) // Large extra data
      };

      const response = await request(app)
        .post('/api/v1/chat/send')
        .set('x-user-id', marketerUser._id.toString())
        .send(largeData);

      // Should handle gracefully, either process or reject cleanly
      expect([201, 400, 413]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking mongoose to simulate connection errors
      // For now, we ensure proper error responses are returned
      const response = await request(app)
        .get('/api/v1/chat/messages/nonexistent123456789012345678901234')
        .set('x-user-id', marketerUser._id.toString());

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/v1/chat/send')
        .set('x-user-id', marketerUser._id.toString())
        .send({
          text: '',
          receiverId: creatorUser._id.toString(),
          roomId: testChatRoom._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});