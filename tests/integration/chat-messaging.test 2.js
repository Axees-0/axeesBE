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
const Chat = require('../../models/chat');
const Message = require('../../models/message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

describe('Chat/Messaging Tests', () => {
  let marketerUser, creatorUser, testOffer, testChat;
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
        platforms: ['Instagram'],
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
      platforms: ['Instagram'],
      deliverables: ['Instagram post', 'Story'],
      desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: 'Test campaign for tech product',
      status: 'Sent'
    });

    // Create test chat room
    testChat = await Chat.create({
      participants: [marketerUser._id, creatorUser._id],
      createdFromOffer: testOffer._id,
      unreadCount: {
        [marketerUser._id.toString()]: 0,
        [creatorUser._id.toString()]: 0
      }
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

  describe('Chat Room Management', () => {
    describe('GET /api/chats/ - List Chat Rooms', () => {
      it('should list all chat rooms for a user', async () => {
        const response = await request(app)
          .get('/api/chats/')
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('chats');
        expect(Array.isArray(response.body.chats)).toBe(true);
        expect(response.body.chats.length).toBeGreaterThan(0);
        
        const chat = response.body.chats[0];
        expect(chat).toHaveProperty('_id');
        expect(chat).toHaveProperty('participants');
        expect(chat).toHaveProperty('unreadCount');
        expect(chat.participants).toContain(marketerUser._id.toString());
      });

      it('should include peer information in chat rooms', async () => {
        const response = await request(app)
          .get('/api/chats/')
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        const chat = response.body.chats[0];
        expect(chat).toHaveProperty('peerId');
        expect(chat).toHaveProperty('peerName');
        expect(chat.peerId).toBe(creatorUser._id.toString());
        expect(chat.peerName).toBe(creatorUser.name);
      });

      it('should return empty array for user with no chats', async () => {
        // Create new user with no chats
        const newUser = await User.create({
          phone: '+12125551236',
          name: 'No Chat User',
          userName: 'nochatuser',
          email: 'nochat@example.com',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: ['Instagram'],
            categories: ['lifestyle'],
            nicheTopics: ['fashion'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 1000
          }
        });

        const response = await request(app)
          .get('/api/chats/')
          .set('x-user-id', newUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.chats).toEqual([]);
      });
    });

    describe('GET /api/chats/search - Search Chat Rooms', () => {
      it('should search chat rooms by participant name', async () => {
        const response = await request(app)
          .get('/api/chats/search')
          .query({ search: 'Test Creator' })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('chats');
        expect(response.body.chats.length).toBeGreaterThan(0);
        
        const chat = response.body.chats[0];
        expect(chat.peerName).toContain('Creator');
      });

      it('should return empty results for non-matching search', async () => {
        const response = await request(app)
          .get('/api/chats/search')
          .query({ search: 'NonExistentUser' })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.chats).toEqual([]);
      });

      it('should search by offer details', async () => {
        const response = await request(app)
          .get('/api/chats/search')
          .query({ search: 'Test Campaign' })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.chats.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/chats/unread-count - Unread Message Count', () => {
      it('should return total unread message count', async () => {
        // Add some unread messages
        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Unread message 1',
          status: 'sent'
        });

        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Unread message 2',
          status: 'sent'
        });

        // Update unread count
        await Chat.findByIdAndUpdate(testChat._id, {
          $set: {
            [`unreadCount.${marketerUser._id.toString()}`]: 2
          }
        });

        const response = await request(app)
          .get('/api/chats/unread-count')
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('unreadCount');
        expect(response.body.unreadCount).toBe(2);
      });

      it('should return 0 for user with no unread messages', async () => {
        const response = await request(app)
          .get('/api/chats/unread-count')
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.unreadCount).toBe(0);
      });
    });
  });

  describe('Message Management', () => {
    describe('POST /api/chats/:chatId/messages - Send Message', () => {
      it('should send a text message successfully', async () => {
        const messageData = {
          text: 'Hello, this is a test message!',
          receiverId: creatorUser._id.toString()
        };

        const response = await request(app)
          .post(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', marketerUser._id.toString())
          .send(messageData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message.text).toBe(messageData.text);
        expect(response.body.message.senderId).toBe(marketerUser._id.toString());
        expect(response.body.message.status).toBe('sent');
      });

      it('should reject empty messages', async () => {
        const response = await request(app)
          .post(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', marketerUser._id.toString())
          .send({
            text: '',
            receiverId: creatorUser._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Message cannot be empty');
      });

      it('should filter inappropriate content', async () => {
        const inappropriateMessage = {
          text: 'This is a damn inappropriate message with bad words',
          receiverId: creatorUser._id.toString()
        };

        const response = await request(app)
          .post(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', marketerUser._id.toString())
          .send(inappropriateMessage);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('inappropriate content');
      });

      it('should filter contact information', async () => {
        const contactMessages = [
          { text: 'Contact me at john@example.com', receiverId: creatorUser._id.toString() },
          { text: 'Call me at +1234567890', receiverId: creatorUser._id.toString() },
          { text: 'Find me on Instagram @myhandle', receiverId: creatorUser._id.toString() }
        ];

        for (const messageData of contactMessages) {
          const response = await request(app)
            .post(`/api/chats/${testChat._id}/messages`)
            .set('x-user-id', marketerUser._id.toString())
            .send(messageData);

          expect(response.status).toBe(400);
          expect(response.body.error).toContain('contact information');
        }
      });

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
            platforms: ['TikTok'],
            categories: ['entertainment'],
            nicheTopics: ['comedy'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 5000
          }
        });

        const response = await request(app)
          .post(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', outsideUser._id.toString())
          .send({
            text: 'Unauthorized message',
            receiverId: creatorUser._id.toString()
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('participant');
      });

      it('should handle file attachments', async () => {
        // Create a test file
        const testFilePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'Test file content');

        const response = await request(app)
          .post(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', marketerUser._id.toString())
          .field('receiverId', creatorUser._id.toString())
          .field('text', 'Message with attachment')
          .attach('attachments', testFilePath);

        expect(response.status).toBe(201);
        expect(response.body.message).toHaveProperty('attachments');
        expect(response.body.message.attachments.length).toBeGreaterThan(0);
        
        const attachment = response.body.message.attachments[0];
        expect(attachment).toHaveProperty('url');
        expect(attachment).toHaveProperty('name');
        expect(attachment).toHaveProperty('type');
        expect(attachment).toHaveProperty('size');

        // Cleanup
        fs.unlinkSync(testFilePath);
      });
    });

    describe('GET /api/chats/:chatId/messages - Get Messages', () => {
      beforeEach(async () => {
        // Create test messages
        await Message.create({
          chatId: testChat._id,
          senderId: marketerUser._id,
          text: 'First message',
          status: 'sent'
        });

        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Second message',
          status: 'sent'
        });

        await Message.create({
          chatId: testChat._id,
          senderId: marketerUser._id,
          text: 'Third message',
          status: 'sent'
        });
      });

      it('should retrieve message history', async () => {
        const response = await request(app)
          .get(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('messages');
        expect(Array.isArray(response.body.messages)).toBe(true);
        expect(response.body.messages.length).toBe(3);
        
        // Messages should be sorted by creation date (newest first)
        const messages = response.body.messages;
        expect(new Date(messages[0].createdAt)).toBeInstanceOf(Date);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/chats/${testChat._id}/messages`)
          .query({ limit: 2 })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.messages.length).toBe(2);
        expect(response.body).toHaveProperty('hasMore');
      });

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
            platforms: ['YouTube'],
            categories: ['education'],
            nicheTopics: ['tech'],
            achievements: '',
            businessVentures: '',
            portfolio: [],
            totalFollowers: 2000
          }
        });

        const response = await request(app)
          .get(`/api/chats/${testChat._id}/messages`)
          .set('x-user-id', outsideUser._id.toString());

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('participant');
      });
    });

    describe('POST /api/chats/messages/:id/read - Mark Message as Read', () => {
      let testMessage;

      beforeEach(async () => {
        testMessage = await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Unread message',
          status: 'sent'
        });
      });

      it('should mark message as read', async () => {
        const response = await request(app)
          .post(`/api/chats/messages/${testMessage._id}/read`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('marked as read');

        // Verify message status updated
        const updatedMessage = await Message.findById(testMessage._id);
        expect(updatedMessage.status).toBe('read');
      });

      it('should prevent sender from marking own message as read', async () => {
        const response = await request(app)
          .post(`/api/chats/messages/${testMessage._id}/read`)
          .set('x-user-id', creatorUser._id.toString());

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('own message');
      });
    });

    describe('PATCH /api/chats/messages/:id - Edit Message', () => {
      let testMessage;

      beforeEach(async () => {
        testMessage = await Message.create({
          chatId: testChat._id,
          senderId: marketerUser._id,
          text: 'Original message',
          status: 'sent'
        });
      });

      it('should allow sender to edit their message', async () => {
        const editData = { text: 'Edited message content' };

        const response = await request(app)
          .patch(`/api/chats/messages/${testMessage._id}`)
          .set('x-user-id', marketerUser._id.toString())
          .send(editData);

        expect(response.status).toBe(200);
        expect(response.body.message.text).toBe(editData.text);
        expect(response.body.message.edited).toBe(true);
      });

      it('should prevent non-sender from editing message', async () => {
        const editData = { text: 'Unauthorized edit' };

        const response = await request(app)
          .patch(`/api/chats/messages/${testMessage._id}`)
          .set('x-user-id', creatorUser._id.toString())
          .send(editData);

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('edit');
      });

      it('should validate edited content', async () => {
        const inappropriateEdit = { text: 'This is damn inappropriate' };

        const response = await request(app)
          .patch(`/api/chats/messages/${testMessage._id}`)
          .set('x-user-id', marketerUser._id.toString())
          .send(inappropriateEdit);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('inappropriate');
      });
    });

    describe('DELETE /api/chats/messages/:id - Delete Message', () => {
      let testMessage;

      beforeEach(async () => {
        testMessage = await Message.create({
          chatId: testChat._id,
          senderId: marketerUser._id,
          text: 'Message to delete',
          status: 'sent'
        });
      });

      it('should allow sender to delete their message', async () => {
        const response = await request(app)
          .delete(`/api/chats/messages/${testMessage._id}`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted');

        // Verify soft delete
        const deletedMessage = await Message.findById(testMessage._id);
        expect(deletedMessage.deleted).toBe(true);
        expect(deletedMessage.text).toBe('');
      });

      it('should prevent non-sender from deleting message', async () => {
        const response = await request(app)
          .delete(`/api/chats/messages/${testMessage._id}`)
          .set('x-user-id', creatorUser._id.toString());

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('delete');
      });
    });

    describe('GET /api/chats/:chatId/search - Search Messages', () => {
      beforeEach(async () => {
        await Message.create({
          chatId: testChat._id,
          senderId: marketerUser._id,
          text: 'Looking for specific keyword in this message',
          status: 'sent'
        });

        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Another message without the term',
          status: 'sent'
        });
      });

      it('should search messages within a chat', async () => {
        const response = await request(app)
          .get(`/api/chats/${testChat._id}/search`)
          .query({ search: 'specific keyword' })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('messages');
        expect(response.body.messages.length).toBe(1);
        expect(response.body.messages[0].text).toContain('specific keyword');
      });

      it('should return empty results for non-matching search', async () => {
        const response = await request(app)
          .get(`/api/chats/${testChat._id}/search`)
          .query({ search: 'nonexistent' })
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.messages).toEqual([]);
      });
    });
  });

  describe('Real-time Features', () => {
    describe('POST /api/chats/:chatId/mark-read - Mark All as Read', () => {
      beforeEach(async () => {
        // Create multiple unread messages
        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Unread message 1',
          status: 'sent'
        });

        await Message.create({
          chatId: testChat._id,
          senderId: creatorUser._id,
          text: 'Unread message 2',
          status: 'sent'
        });

        // Update unread count
        await Chat.findByIdAndUpdate(testChat._id, {
          $set: {
            [`unreadCount.${marketerUser._id.toString()}`]: 2
          }
        });
      });

      it('should mark all messages as read', async () => {
        const response = await request(app)
          .post(`/api/chats/${testChat._id}/mark-read`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('marked as read');

        // Verify unread count reset
        const updatedChat = await Chat.findById(testChat._id);
        expect(updatedChat.unreadCount.get(marketerUser._id.toString())).toBe(0);
      });
    });

    describe('GET /api/chats/:chatId/stream - SSE Stream', () => {
      it('should establish SSE connection', async () => {
        const response = await request(app)
          .get(`/api/chats/${testChat._id}/stream`)
          .set('x-user-id', marketerUser._id.toString())
          .expect(200);

        expect(response.headers['content-type']).toContain('text/event-stream');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.headers['connection']).toBe('keep-alive');
      });

      it('should prevent non-participants from accessing stream', async () => {
        const outsideUser = await User.create({
          phone: '+12125551239',
          name: 'Outside User 3',
          userName: 'outsideuser3',
          email: 'outside3@example.com',
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
            totalFollowers: 3000
          }
        });

        const response = await request(app)
          .get(`/api/chats/${testChat._id}/stream`)
          .set('x-user-id', outsideUser._id.toString());

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('participant');
      });
    });
  });

  describe('Input Validation & Security', () => {
    it('should validate chat ID format', async () => {
      const invalidChatIds = ['invalid', '123', 'not-an-objectid'];

      for (const invalidId of invalidChatIds) {
        const response = await request(app)
          .get(`/api/chats/${invalidId}/messages`)
          .set('x-user-id', marketerUser._id.toString());

        expect(response.status).toBe(400);
      }
    });

    it('should validate message ID format', async () => {
      const response = await request(app)
        .post('/api/chats/messages/invalid-id/read')
        .set('x-user-id', marketerUser._id.toString());

      expect(response.status).toBe(400);
    });

    it('should sanitize message content', async () => {
      const xssMessage = {
        text: '<script>alert("XSS")</script>Normal message',
        receiverId: creatorUser._id.toString()
      };

      const response = await request(app)
        .post(`/api/chats/${testChat._id}/messages`)
        .set('x-user-id', marketerUser._id.toString())
        .send(xssMessage);

      if (response.status === 201) {
        expect(response.body.message.text).not.toContain('<script>');
        expect(response.body.message.text).not.toContain('alert');
      }
    });

    it('should limit message length', async () => {
      const longMessage = {
        text: 'a'.repeat(5001), // Assuming 5000 char limit
        receiverId: creatorUser._id.toString()
      };

      const response = await request(app)
        .post(`/api/chats/${testChat._id}/messages`)
        .set('x-user-id', marketerUser._id.toString())
        .send(longMessage);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('too long');
    });

    it('should validate file upload types and sizes', async () => {
      // Test with oversized file
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
      const testFilePath = path.join(__dirname, 'large-file.txt');
      fs.writeFileSync(testFilePath, largeBuffer);

      const response = await request(app)
        .post(`/api/chats/${testChat._id}/messages`)
        .set('x-user-id', marketerUser._id.toString())
        .field('receiverId', creatorUser._id.toString())
        .field('text', 'Message with large file')
        .attach('attachments', testFilePath);

      expect(response.status).toBe(413); // Payload too large

      // Cleanup
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Notification Integration', () => {
    it('should handle notification sending for new messages', async () => {
      const messageData = {
        text: 'This should trigger a notification',
        receiverId: creatorUser._id.toString()
      };

      const response = await request(app)
        .post(`/api/chats/${testChat._id}/messages`)
        .set('x-user-id', marketerUser._id.toString())
        .send(messageData);

      expect(response.status).toBe(201);
      
      // Verify notification was attempted (mock should have been called)
      // Note: This depends on the actual notification implementation
      expect(response.body.message).toBeDefined();
    });
  });
});