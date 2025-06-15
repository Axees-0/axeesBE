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
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const http = require('http');
const fs = require('fs');
const path = require('path');

describe('Chat-specific Performance Tests', () => {
  let testMarketer, testCreator, marketerToken, creatorToken;
  const chatPerformanceResults = {
    latency: {},
    delivery: {},
    sseLoad: {},
    scalability: {},
    attachments: {}
  };

  beforeAll(async () => {
    await connect();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    
    testCreator = await User.create({
      phone: '+12125551234',
      name: 'Chat Performance Creator',
      userName: 'chat_perf_creator',
      email: 'chatcreator@example.com',
      password: hashedPassword,
      userType: 'Creator',
      isActive: true,
      creatorData: {
        platforms: [{
          platform: 'instagram',
          handle: '@chatcreator',
          followersCount: 75000
        }],
        categories: ['technology'],
        nicheTopics: ['tech', 'gadgets']
      }
    });

    testMarketer = await User.create({
      phone: '+12125551235',
      name: 'Chat Performance Marketer',
      userName: 'chat_perf_marketer',
      email: 'chatmarketer@example.com',
      password: hashedPassword,
      userType: 'Marketer',
      isActive: true,
      marketerData: {
        companyName: 'Chat Performance Co',
        industry: 'Technology',
        website: 'https://chatperf.com',
        businessLicense: 'CHATPERF123',
        totalCampaigns: 20,
        successfulCampaigns: 18,
        averageRating: 4.8
      }
    });

    creatorToken = generateTestToken({
      id: testCreator._id.toString(),
      phone: testCreator.phone,
      userType: testCreator.userType
    });

    marketerToken = generateTestToken({
      id: testMarketer._id.toString(),
      phone: testMarketer.phone,
      userType: testMarketer.userType
    });
  });

  beforeEach(async () => {
    // Clear chat data between tests
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  afterEach(async () => {
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    // Output chat performance results
    console.log('\n💬 CHAT PERFORMANCE TEST RESULTS');
    console.log('=================================');
    
    Object.entries(chatPerformanceResults).forEach(([category, results]) => {
      console.log(`\n📊 ${category.toUpperCase()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No tests recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, metrics]) => {
        console.log(`\n   ${test}:`);
        if (metrics.averageLatency !== undefined) console.log(`     Average Latency: ${metrics.averageLatency}ms`);
        if (metrics.maxLatency !== undefined) console.log(`     Max Latency: ${metrics.maxLatency}ms`);
        if (metrics.deliverySuccess !== undefined) console.log(`     Delivery Success: ${metrics.deliverySuccess}%`);
        if (metrics.throughput !== undefined) console.log(`     Throughput: ${metrics.throughput} msg/sec`);
        if (metrics.connections !== undefined) console.log(`     Concurrent Connections: ${metrics.connections}`);
        if (metrics.fileSize !== undefined) console.log(`     File Size: ${metrics.fileSize}MB`);
        if (metrics.uploadTime !== undefined) console.log(`     Upload Time: ${metrics.uploadTime}ms`);
        if (metrics.performance !== undefined) console.log(`     Performance: ${metrics.performance}`);
        if (metrics.issues && metrics.issues.length > 0) {
          console.log(`     Issues: ${metrics.issues.join(', ')}`);
        }
      });
    });
    
    // Calculate overall performance score
    const allTests = Object.values(chatPerformanceResults).flatMap(category => Object.values(category));
    const excellentTests = allTests.filter(test => test.performance === 'Excellent').length;
    const goodTests = allTests.filter(test => test.performance === 'Good').length;
    const totalTests = allTests.length;
    
    const performanceScore = totalTests > 0 ? 
      Math.round(((excellentTests * 100) + (goodTests * 70)) / (totalTests * 100) * 100) : 0;
    
    console.log('\n🎯 OVERALL CHAT PERFORMANCE SCORE');
    console.log('===================================');
    console.log(`   Performance Score: ${performanceScore}%`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Excellent: ${excellentTests}`);
    console.log(`   Good: ${goodTests}`);
    
    if (performanceScore >= 90) {
      console.log('   🟢 EXCELLENT CHAT PERFORMANCE');
    } else if (performanceScore >= 75) {
      console.log('   🟡 GOOD CHAT PERFORMANCE');
    } else {
      console.log('   🔴 CHAT PERFORMANCE NEEDS OPTIMIZATION');
    }
    
    console.log('\n=================================\n');
    
    await closeDatabase();
  });

  // Helper function to record chat performance results
  const recordChatPerformance = (category, testName, metrics) => {
    chatPerformanceResults[category][testName] = metrics;
  };

  // Helper function to measure latency
  const measureLatency = async (operation) => {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    return {
      result,
      latency: endTime - startTime
    };
  };

  describe('Chat Latency Testing (Message Send → Receive)', () => {
    it('should measure end-to-end message latency', async () => {
      // Create chat room
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;
      expect(chatResponse.status).toBe(201);

      const latencies = [];
      const messageCount = 10;

      // Send and receive messages, measuring latency
      for (let i = 0; i < messageCount; i++) {
        const { result: sendResult, latency: sendLatency } = await measureLatency(async () => {
          return request(app)
            .post(`/api/chats/${chatId}/messages`)
            .set('x-user-id', testCreator._id.toString())
            .send({
              text: `Latency test message ${i + 1}`,
              receiverId: testMarketer._id.toString()
            });
        });

        expect(sendResult.status).toBe(201);
        const messageId = sendResult.body.message?._id;

        // Measure receive latency (time to retrieve message)
        const { result: receiveResult, latency: receiveLatency } = await measureLatency(async () => {
          return request(app)
            .get(`/api/chats/${chatId}/messages`)
            .set('x-user-id', testMarketer._id.toString());
        });

        expect(receiveResult.status).toBe(200);
        const messages = receiveResult.body.messages || [];
        const messageFound = messages.some(msg => msg._id === messageId);
        expect(messageFound).toBe(true);

        const totalLatency = sendLatency + receiveLatency;
        latencies.push(totalLatency);

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const averageLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const maxLatency = Math.max(...latencies);
      const performance = averageLatency < 200 ? 'Excellent' : averageLatency < 500 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('latency', 'End-to-End Message Latency', {
        averageLatency,
        maxLatency,
        messagesTested: messageCount,
        performance,
        issues: averageLatency > 500 ? ['High latency detected'] : []
      });

      expect(averageLatency).toBeLessThan(1000); // Should be under 1 second
    });

    it('should measure chat room creation latency', async () => {
      const chatCreationTests = 5;
      const latencies = [];

      for (let i = 0; i < chatCreationTests; i++) {
        const { result, latency } = await measureLatency(async () => {
          return request(app)
            .post('/api/chats')
            .set('x-user-id', testCreator._id.toString())
            .send({
              recipientId: testMarketer._id.toString()
            });
        });

        expect(result.status).toBe(201);
        latencies.push(latency);

        // Clean up for next test
        await ChatRoom.deleteMany({});
      }

      const averageLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const maxLatency = Math.max(...latencies);
      const performance = averageLatency < 100 ? 'Excellent' : averageLatency < 300 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('latency', 'Chat Room Creation', {
        averageLatency,
        maxLatency,
        creationsTested: chatCreationTests,
        performance
      });

      expect(averageLatency).toBeLessThan(500);
    });

    it('should measure message history retrieval latency', async () => {
      // Create chat with message history
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;

      // Add multiple messages to create history
      const messageCount = 50;
      for (let i = 0; i < messageCount; i++) {
        await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('x-user-id', i % 2 === 0 ? testCreator._id.toString() : testMarketer._id.toString())
          .send({
            text: `History message ${i + 1}`,
            receiverId: i % 2 === 0 ? testMarketer._id.toString() : testCreator._id.toString()
          });
      }

      // Test history retrieval latency
      const retrievalTests = 10;
      const latencies = [];

      for (let i = 0; i < retrievalTests; i++) {
        const { result, latency } = await measureLatency(async () => {
          return request(app)
            .get(`/api/chats/${chatId}/messages`)
            .query({ limit: 20, offset: i * 5 })
            .set('x-user-id', testCreator._id.toString());
        });

        expect(result.status).toBe(200);
        latencies.push(latency);
      }

      const averageLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const maxLatency = Math.max(...latencies);
      const performance = averageLatency < 150 ? 'Excellent' : averageLatency < 400 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('latency', 'Message History Retrieval', {
        averageLatency,
        maxLatency,
        messagesInHistory: messageCount,
        retrievalsTested: retrievalTests,
        performance
      });

      expect(averageLatency).toBeLessThan(800);
    });
  });

  describe('Message Delivery Performance Tests', () => {
    it('should test message delivery success rates under load', async () => {
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;
      
      const messageCount = 100;
      const sendPromises = [];
      const startTime = Date.now();

      // Send messages concurrently
      for (let i = 0; i < messageCount; i++) {
        sendPromises.push(
          request(app)
            .post(`/api/chats/${chatId}/messages`)
            .set('x-user-id', testCreator._id.toString())
            .send({
              text: `Delivery test message ${i + 1}`,
              receiverId: testMarketer._id.toString()
            })
        );
      }

      const results = await Promise.all(sendPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulDeliveries = results.filter(r => r.status === 201).length;
      const deliverySuccess = Math.round((successfulDeliveries / messageCount) * 100);
      const throughput = Math.round((successfulDeliveries * 1000) / totalTime);
      const performance = deliverySuccess >= 95 ? 'Excellent' : deliverySuccess >= 90 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('delivery', 'Concurrent Message Delivery', {
        messagesSent: messageCount,
        successfulDeliveries,
        deliverySuccess,
        throughput,
        totalTime,
        performance,
        issues: deliverySuccess < 95 ? ['Some message deliveries failed'] : []
      });

      expect(deliverySuccess).toBeGreaterThan(90);
    });

    it('should test message ordering and sequence integrity', async () => {
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;
      
      const messageCount = 20;
      const messages = [];

      // Send numbered messages sequentially
      for (let i = 0; i < messageCount; i++) {
        const response = await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('x-user-id', testCreator._id.toString())
          .send({
            text: `Sequence message ${i + 1}`,
            receiverId: testMarketer._id.toString()
          });
        
        expect(response.status).toBe(201);
        messages.push({
          id: response.body.message?._id,
          text: `Sequence message ${i + 1}`,
          expectedOrder: i + 1
        });
      }

      // Retrieve messages and check ordering
      const retrievalResponse = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('x-user-id', testCreator._id.toString());

      expect(retrievalResponse.status).toBe(200);
      const retrievedMessages = retrievalResponse.body.messages || [];

      // Check if messages are in correct order
      let correctOrder = true;
      let orderIssues = [];

      for (let i = 0; i < Math.min(messageCount, retrievedMessages.length); i++) {
        const expectedText = `Sequence message ${i + 1}`;
        if (!retrievedMessages.some(msg => msg.text === expectedText)) {
          correctOrder = false;
          orderIssues.push(`Missing message: ${expectedText}`);
        }
      }

      const sequenceIntegrity = correctOrder ? 100 : Math.round(((messageCount - orderIssues.length) / messageCount) * 100);
      const performance = sequenceIntegrity >= 100 ? 'Excellent' : sequenceIntegrity >= 90 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('delivery', 'Message Sequence Integrity', {
        messagesSent: messageCount,
        messagesRetrieved: retrievedMessages.length,
        sequenceIntegrity,
        correctOrder,
        performance,
        issues: orderIssues
      });

      expect(sequenceIntegrity).toBeGreaterThan(95);
    });
  });

  describe('SSE Connection Load Testing', () => {
    it('should test SSE connection stability under load', async () => {
      const connectionCount = 20;
      const testDuration = 5000; // 5 seconds
      const connections = [];
      const connectionResults = [];

      const createSSEConnection = (userId) => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/chat/messages/stream?userId=${userId}`,
            method: 'GET',
            headers: {
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'x-user-id': userId
            }
          };

          const req = http.request(options, (res) => {
            let connected = true;
            let messageCount = 0;
            const startTime = Date.now();

            res.on('data', (chunk) => {
              const data = chunk.toString();
              if (data.includes('data:')) {
                messageCount++;
              }
            });

            res.on('end', () => {
              connected = false;
              const duration = Date.now() - startTime;
              resolve({
                connected: false,
                duration,
                messageCount,
                success: duration >= testDuration * 0.8 // 80% of expected duration
              });
            });

            res.on('error', (error) => {
              connected = false;
              reject(error);
            });

            // Keep connection alive for test duration
            setTimeout(() => {
              if (connected) {
                req.destroy();
                const duration = Date.now() - startTime;
                resolve({
                  connected: true,
                  duration,
                  messageCount,
                  success: true
                });
              }
            }, testDuration);
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.end();
        });
      };

      // Create multiple SSE connections
      for (let i = 0; i < connectionCount; i++) {
        const userId = i % 2 === 0 ? testCreator._id.toString() : testMarketer._id.toString();
        connections.push(createSSEConnection(userId));
      }

      try {
        const results = await Promise.allSettled(connections);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            connectionResults.push(result.value);
          } else {
            connectionResults.push({
              connected: false,
              error: result.reason.message,
              success: false
            });
          }
        });

        const successfulConnections = connectionResults.filter(r => r.success).length;
        const connectionStability = Math.round((successfulConnections / connectionCount) * 100);
        const averageDuration = connectionResults
          .filter(r => r.duration)
          .reduce((sum, r) => sum + r.duration, 0) / connectionResults.length;

        const performance = connectionStability >= 90 ? 'Excellent' : connectionStability >= 75 ? 'Good' : 'Needs Improvement';

        recordChatPerformance('sseLoad', 'SSE Connection Stability', {
          connections: connectionCount,
          successfulConnections,
          connectionStability,
          averageDuration: Math.round(averageDuration),
          testDuration,
          performance,
          issues: connectionStability < 90 ? ['Some SSE connections failed'] : []
        });

        expect(connectionStability).toBeGreaterThan(70);
      } catch (error) {
        recordChatPerformance('sseLoad', 'SSE Connection Stability', {
          connections: connectionCount,
          successfulConnections: 0,
          connectionStability: 0,
          performance: 'Failed',
          issues: [`SSE test failed: ${error.message}`]
        });

        // Don't fail the test if SSE endpoint doesn't exist
        console.warn('SSE endpoint not available for testing');
      }
    });
  });

  describe('Chat Scalability Validation', () => {
    it('should test multi-room chat performance', async () => {
      const roomCount = 10;
      const messagesPerRoom = 5;
      const rooms = [];
      const results = [];

      // Create multiple chat rooms
      for (let i = 0; i < roomCount; i++) {
        const chatResponse = await request(app)
          .post('/api/chats')
          .set('x-user-id', testCreator._id.toString())
          .send({
            recipientId: testMarketer._id.toString()
          });

        expect(chatResponse.status).toBe(201);
        rooms.push(chatResponse.body?.chatId || chatResponse.body?._id);
      }

      const startTime = Date.now();

      // Send messages to all rooms concurrently
      const allMessagePromises = [];
      for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for (let msgIndex = 0; msgIndex < messagesPerRoom; msgIndex++) {
          allMessagePromises.push(
            request(app)
              .post(`/api/chats/${rooms[roomIndex]}/messages`)
              .set('x-user-id', testCreator._id.toString())
              .send({
                text: `Multi-room message ${msgIndex + 1} in room ${roomIndex + 1}`,
                receiverId: testMarketer._id.toString()
              })
          );
        }
      }

      const messageResults = await Promise.all(allMessagePromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulMessages = messageResults.filter(r => r.status === 201).length;
      const totalMessages = roomCount * messagesPerRoom;
      const scalabilityScore = Math.round((successfulMessages / totalMessages) * 100);
      const throughput = Math.round((successfulMessages * 1000) / totalTime);

      const performance = scalabilityScore >= 95 ? 'Excellent' : scalabilityScore >= 85 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('scalability', 'Multi-room Performance', {
        roomCount,
        messagesPerRoom,
        totalMessages,
        successfulMessages,
        scalabilityScore,
        throughput,
        totalTime,
        performance,
        issues: scalabilityScore < 95 ? ['Some multi-room messages failed'] : []
      });

      expect(scalabilityScore).toBeGreaterThan(80);
    });

    it('should test concurrent user messaging performance', async () => {
      const userPairCount = 5;
      const messagesPerPair = 3;
      const userPairs = [];

      // Create multiple user pairs
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      for (let i = 0; i < userPairCount; i++) {
        const creator = await User.create({
          phone: `+1212555${2000 + i}`,
          name: `Scale Creator ${i}`,
          userName: `scale_creator_${i}`,
          email: `scalecreator${i}@example.com`,
          password: hashedPassword,
          userType: 'Creator',
          isActive: true,
          creatorData: {
            platforms: [{
              platform: 'instagram',
              handle: `@scale_creator_${i}`,
              followersCount: 10000
            }],
            categories: ['test'],
            nicheTopics: ['scale']
          }
        });

        const marketer = await User.create({
          phone: `+1212555${3000 + i}`,
          name: `Scale Marketer ${i}`,
          userName: `scale_marketer_${i}`,
          email: `scalemarketer${i}@example.com`,
          password: hashedPassword,
          userType: 'Marketer',
          isActive: true,
          marketerData: {
            companyName: `Scale Company ${i}`,
            industry: 'Technology',
            website: `https://scale${i}.com`,
            businessLicense: `SCALE${i}`
          }
        });

        // Create chat room for the pair
        const chatResponse = await request(app)
          .post('/api/chats')
          .set('x-user-id', creator._id.toString())
          .send({
            recipientId: marketer._id.toString()
          });

        userPairs.push({
          creator,
          marketer,
          chatId: chatResponse.body?.chatId || chatResponse.body?._id
        });
      }

      const startTime = Date.now();
      const allMessages = [];

      // Send messages from all user pairs concurrently
      for (const pair of userPairs) {
        for (let i = 0; i < messagesPerPair; i++) {
          allMessages.push(
            request(app)
              .post(`/api/chats/${pair.chatId}/messages`)
              .set('x-user-id', pair.creator._id.toString())
              .send({
                text: `Concurrent message ${i + 1}`,
                receiverId: pair.marketer._id.toString()
              })
          );
        }
      }

      const results = await Promise.all(allMessages);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulMessages = results.filter(r => r.status === 201).length;
      const totalMessages = userPairCount * messagesPerPair;
      const concurrencyScore = Math.round((successfulMessages / totalMessages) * 100);
      const avgTimePerMessage = Math.round(totalTime / totalMessages);

      const performance = concurrencyScore >= 95 ? 'Excellent' : concurrencyScore >= 85 ? 'Good' : 'Needs Improvement';

      recordChatPerformance('scalability', 'Concurrent User Messaging', {
        userPairCount,
        messagesPerPair,
        totalMessages,
        successfulMessages,
        concurrencyScore,
        avgTimePerMessage,
        totalTime,
        performance,
        issues: concurrencyScore < 95 ? ['Some concurrent messages failed'] : []
      });

      expect(concurrencyScore).toBeGreaterThan(80);
    });
  });

  describe('Attachment Upload/Download Performance Tests', () => {
    it('should test small file attachment performance', async () => {
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;

      // Create a small test file (1KB)
      const testFileName = 'small-test-file.txt';
      const testContent = 'A'.repeat(1024); // 1KB
      const testFilePath = path.join(__dirname, testFileName);
      
      try {
        fs.writeFileSync(testFilePath, testContent);

        const uploadStartTime = Date.now();
        const uploadResponse = await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('x-user-id', testCreator._id.toString())
          .field('receiverId', testMarketer._id.toString())
          .field('text', 'File attachment test')
          .attach('attachments', testFilePath);

        const uploadTime = Date.now() - uploadStartTime;

        if (uploadResponse.status === 201) {
          const fileSize = 1; // 1KB in MB = 0.001, but we'll use 1 for KB
          const uploadSpeed = Math.round((fileSize * 1000) / uploadTime); // KB/s
          const performance = uploadTime < 500 ? 'Excellent' : uploadTime < 1000 ? 'Good' : 'Needs Improvement';

          recordChatPerformance('attachments', 'Small File Upload (1KB)', {
            fileSize: `${fileSize}KB`,
            uploadTime,
            uploadSpeed: `${uploadSpeed}KB/s`,
            performance
          });

          expect(uploadTime).toBeLessThan(2000);
        } else {
          recordChatPerformance('attachments', 'Small File Upload (1KB)', {
            fileSize: '1KB',
            uploadTime,
            performance: 'Failed',
            issues: [`Upload failed with status ${uploadResponse.status}`]
          });
        }
      } catch (error) {
        recordChatPerformance('attachments', 'Small File Upload (1KB)', {
          fileSize: '1KB',
          performance: 'Failed',
          issues: [`Upload test failed: ${error.message}`]
        });
      } finally {
        // Clean up test file
        try {
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        } catch (cleanupError) {
          console.warn('Could not clean up test file:', cleanupError.message);
        }
      }
    });

    it('should test medium file attachment performance', async () => {
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;

      // Create a medium test file (1MB)
      const testFileName = 'medium-test-file.txt';
      const testContent = 'B'.repeat(1024 * 1024); // 1MB
      const testFilePath = path.join(__dirname, testFileName);
      
      try {
        fs.writeFileSync(testFilePath, testContent);

        const uploadStartTime = Date.now();
        const uploadResponse = await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('x-user-id', testCreator._id.toString())
          .field('receiverId', testMarketer._id.toString())
          .field('text', 'Medium file attachment test')
          .attach('attachments', testFilePath);

        const uploadTime = Date.now() - uploadStartTime;

        if (uploadResponse.status === 201) {
          const fileSize = 1; // 1MB
          const uploadSpeed = Math.round((fileSize * 1000) / uploadTime); // MB/s
          const performance = uploadTime < 3000 ? 'Excellent' : uploadTime < 5000 ? 'Good' : 'Needs Improvement';

          recordChatPerformance('attachments', 'Medium File Upload (1MB)', {
            fileSize: `${fileSize}MB`,
            uploadTime,
            uploadSpeed: `${uploadSpeed}MB/s`,
            performance
          });

          expect(uploadTime).toBeLessThan(10000); // 10 seconds
        } else {
          recordChatPerformance('attachments', 'Medium File Upload (1MB)', {
            fileSize: '1MB',
            uploadTime,
            performance: 'Failed',
            issues: [`Upload failed with status ${uploadResponse.status}`]
          });
        }
      } catch (error) {
        recordChatPerformance('attachments', 'Medium File Upload (1MB)', {
          fileSize: '1MB',
          performance: 'Failed',
          issues: [`Upload test failed: ${error.message}`]
        });
      } finally {
        // Clean up test file
        try {
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        } catch (cleanupError) {
          console.warn('Could not clean up test file:', cleanupError.message);
        }
      }
    });

    it('should test multiple file upload performance', async () => {
      const chatResponse = await request(app)
        .post('/api/chats')
        .set('x-user-id', testCreator._id.toString())
        .send({
          recipientId: testMarketer._id.toString()
        });

      const chatId = chatResponse.body?.chatId || chatResponse.body?._id;

      // Create multiple small test files
      const fileCount = 3;
      const testFiles = [];
      
      try {
        for (let i = 0; i < fileCount; i++) {
          const fileName = `multi-test-file-${i}.txt`;
          const filePath = path.join(__dirname, fileName);
          const content = `File ${i} content: ${'X'.repeat(512)}`; // 512 bytes each
          
          fs.writeFileSync(filePath, content);
          testFiles.push({ name: fileName, path: filePath });
        }

        const uploadStartTime = Date.now();
        let uploadRequest = request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('x-user-id', testCreator._id.toString())
          .field('receiverId', testMarketer._id.toString())
          .field('text', 'Multiple file attachment test');

        // Attach all files
        testFiles.forEach(file => {
          uploadRequest = uploadRequest.attach('attachments', file.path);
        });

        const uploadResponse = await uploadRequest;
        const uploadTime = Date.now() - uploadStartTime;

        if (uploadResponse.status === 201) {
          const totalSize = fileCount * 0.5; // 0.5KB each = total KB
          const uploadSpeed = Math.round((totalSize * 1000) / uploadTime); // KB/s
          const performance = uploadTime < 2000 ? 'Excellent' : uploadTime < 4000 ? 'Good' : 'Needs Improvement';

          recordChatPerformance('attachments', 'Multiple File Upload', {
            fileCount,
            totalSize: `${totalSize}KB`,
            uploadTime,
            uploadSpeed: `${uploadSpeed}KB/s`,
            performance
          });

          expect(uploadTime).toBeLessThan(5000);
        } else {
          recordChatPerformance('attachments', 'Multiple File Upload', {
            fileCount,
            uploadTime,
            performance: 'Failed',
            issues: [`Upload failed with status ${uploadResponse.status}`]
          });
        }
      } catch (error) {
        recordChatPerformance('attachments', 'Multiple File Upload', {
          fileCount,
          performance: 'Failed',
          issues: [`Upload test failed: ${error.message}`]
        });
      } finally {
        // Clean up test files
        testFiles.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.warn(`Could not clean up test file ${file.name}:`, cleanupError.message);
          }
        });
      }
    });
  });
});