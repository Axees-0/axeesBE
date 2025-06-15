// Mock external services first, before any requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

jest.mock('../../utils/pushNotifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
// Note: Using native Node.js HTTP for SSE testing instead of eventsource package
const http = require('http');

describe('Concurrent SSE Connection Tests', () => {
  let testUsers = [];
  let testChatRooms = [];
  let testServer;
  let serverPort;
  const performanceMetrics = {};
  const connectionMetrics = {};

  beforeAll(async () => {
    await connect();
    
    // Create test users for SSE testing
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    
    // Create 10 test users (5 marketers, 5 creators)
    for (let i = 0; i < 10; i++) {
      const userType = i < 5 ? 'Marketer' : 'Creator';
      const userData = {
        phone: `+1212555${3000 + i}`,
        name: `SSE Test ${userType} ${i}`,
        userName: `sse_${userType.toLowerCase()}_${i}`,
        email: `sse${i}@test.com`,
        password: hashedPassword,
        userType: userType,
        isActive: true
      };

      if (userType === 'Marketer') {
        userData.marketerData = {
          companyName: `SSE Company ${i}`,
          industry: 'Technology',
          website: `https://sse${i}.com`,
          businessLicense: `SSE${i}`,
          totalCampaigns: 5 + i,
          successfulCampaigns: 4 + i,
          averageRating: 4.0 + (i * 0.1)
        };
      } else {
        userData.platforms = [{
          platform: 'instagram',
          handle: `@sse_creator_${i}`,
          followersCount: 5000 + (i * 1000)
        }];
        userData.creatorData = {
          platforms: ['Instagram'],
          categories: ['technology'],
          nicheTopics: ['tech'],
          achievements: `SSE achievements ${i}`,
          businessVentures: `SSE business ${i}`,
          portfolio: [],
          totalFollowers: 5000 + (i * 1000)
        };
      }

      const user = await User.create(userData);
      testUsers.push(user);
    }

    // Create chat rooms for SSE testing
    for (let i = 0; i < 5; i++) {
      for (let j = 5; j < 10; j++) {
        const chatRoom = await ChatRoom.create({
          participants: [testUsers[i]._id, testUsers[j]._id],
          lastMessage: {
            text: 'SSE test room setup',
            sender: testUsers[i]._id,
            createdAt: new Date()
          },
          unreadCount: {
            [testUsers[i]._id.toString()]: 0,
            [testUsers[j]._id.toString()]: 0
          }
        });
        testChatRooms.push(chatRoom);
      }
    }

    // Start test server for SSE connections
    testServer = http.createServer(app);
    serverPort = 0; // Let system assign port
    await new Promise((resolve) => {
      testServer.listen(serverPort, () => {
        serverPort = testServer.address().port;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Clear messages for clean tests
    await Message.deleteMany({});
  });

  afterAll(async () => {
    // Output performance summary
    console.log('\n🌐 CONCURRENT SSE CONNECTION RESULTS');
    console.log('====================================');
    Object.entries(performanceMetrics).forEach(([test, metrics]) => {
      console.log(`\n${test}:`);
      console.log(`  Average: ${metrics.average}ms`);
      console.log(`  Min: ${metrics.min}ms`);
      console.log(`  Max: ${metrics.max}ms`);
      console.log(`  Operations: ${metrics.count}`);
      if (metrics.successRate) {
        console.log(`  Success rate: ${metrics.successRate}%`);
      }
    });

    console.log('\n📡 CONNECTION METRICS');
    console.log('=====================');
    Object.entries(connectionMetrics).forEach(([test, metrics]) => {
      console.log(`\n${test}:`);
      console.log(`  Concurrent connections: ${metrics.concurrent}`);
      console.log(`  Connection time: ${metrics.connectionTime}ms`);
      console.log(`  Stable connections: ${metrics.stable}/${metrics.total}`);
      console.log(`  Message delivery rate: ${metrics.deliveryRate}%`);
      if (metrics.memoryUsage) {
        console.log(`  Memory usage: ${metrics.memoryUsage}MB`);
      }
    });
    console.log('\n====================================\n');
    
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    await closeDatabase();
  });

  // Helper function to measure performance
  const measurePerformance = (testName, duration, options = {}) => {
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
    
    if (options.successRate) {
      performanceMetrics[testName].successRate = options.successRate;
    }
  };

  // Helper function to measure connection metrics
  const measureConnection = (testName, concurrent, connectionTime, stable, total, deliveryRate, options = {}) => {
    connectionMetrics[testName] = {
      concurrent,
      connectionTime,
      stable,
      total,
      deliveryRate
    };
    
    if (options.memoryUsage) {
      connectionMetrics[testName].memoryUsage = options.memoryUsage;
    }
  };

  // Helper function to create SSE connection using Node.js HTTP
  const createSSEConnection = (roomId, userId, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const connectionData = {
        request: null,
        connected: false,
        messages: [],
        connectionTime: null,
        errors: [],
        close: () => {
          if (connectionData.request) {
            connectionData.request.destroy();
          }
        }
      };

      const options = {
        hostname: 'localhost',
        port: serverPort,
        path: `/api/v1/chat/stream/${roomId}?userId=${userId}`,
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          connectionData.connected = true;
          connectionData.connectionTime = Date.now() - startTime;
          
          let buffer = '';
          
          res.on('data', (chunk) => {
            buffer += chunk.toString();
            
            // Parse SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                try {
                  const parsedData = JSON.parse(data);
                  connectionData.messages.push({
                    data: parsedData,
                    timestamp: Date.now()
                  });
                } catch (e) {
                  connectionData.messages.push({
                    raw: data,
                    timestamp: Date.now()
                  });
                }
              }
            }
          });

          res.on('error', (error) => {
            connectionData.errors.push({
              error: error.message,
              timestamp: Date.now()
            });
          });

          resolve(connectionData);
        } else {
          reject(new Error(`SSE connection failed with status: ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        connectionData.errors.push({
          error: error.message,
          timestamp: Date.now()
        });
        if (!connectionData.connected) {
          reject(new Error(`SSE connection failed: ${error.message}`));
        }
      });

      // Timeout for connection
      setTimeout(() => {
        if (!connectionData.connected) {
          req.destroy();
          reject(new Error('SSE connection timeout'));
        }
      }, timeout);

      connectionData.request = req;
      req.end();
    });
  };

  describe('Concurrent SSE Connection Establishment', () => {
    it('should handle 10 concurrent SSE connections', async () => {
      const concurrentConnections = 10;
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      const overallStartTime = Date.now();
      
      // Create promises for concurrent SSE connections
      const connectionPromises = testChatRooms.slice(0, concurrentConnections).map((room, index) => {
        const userId = room.participants[index % 2];
        return createSSEConnection(room._id.toString(), userId.toString())
          .then(connectionData => ({ ...connectionData, roomId: room._id, userId, success: true }))
          .catch(error => ({ error, roomId: room._id, userId, success: false }));
      });

      const connectionResults = await Promise.all(connectionPromises);
      const connectionTime = Date.now() - overallStartTime;
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryUsed = Math.round(memoryAfter - memoryBefore);

      // Analyze connection results
      const successfulConnections = connectionResults.filter(result => result.success);
      const failedConnections = connectionResults.filter(result => !result.success);
      
      const averageConnectionTime = successfulConnections.length > 0 
        ? successfulConnections.reduce((sum, conn) => sum + conn.connectionTime, 0) / successfulConnections.length
        : 0;

      const successRate = Math.round((successfulConnections.length / concurrentConnections) * 100);

      measurePerformance('SSE Connection Establishment', averageConnectionTime, { successRate });
      measureConnection(
        '10 Concurrent SSE Connections',
        concurrentConnections,
        Math.round(averageConnectionTime),
        successfulConnections.length,
        concurrentConnections,
        successRate,
        { memoryUsage: memoryUsed }
      );

      // Clean up connections
      successfulConnections.forEach(conn => {
        if (conn.close) {
          conn.close();
        }
      });

      // Assertions
      expect(successfulConnections.length).toBeGreaterThan(concurrentConnections * 0.8); // 80% success rate
      expect(averageConnectionTime).toBeLessThan(2000); // Average connection time under 2 seconds
      expect(connectionTime).toBeLessThan(5000); // Total connection time under 5 seconds
      
      console.log(`✅ SSE connections: ${successfulConnections.length}/${concurrentConnections} connected in ${connectionTime}ms (avg: ${Math.round(averageConnectionTime)}ms per connection)`);
    });

    it('should handle 25 concurrent SSE connections with load', async () => {
      const concurrentConnections = 25;
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      const overallStartTime = Date.now();
      
      // Create more connections by reusing rooms with different users
      const connectionPromises = Array.from({ length: concurrentConnections }, (_, index) => {
        const roomIndex = index % testChatRooms.length;
        const room = testChatRooms[roomIndex];
        const userIndex = index % 2;
        const userId = room.participants[userIndex];
        
        return createSSEConnection(room._id.toString(), userId.toString(), 8000) // Longer timeout for load test
          .then(connectionData => ({ ...connectionData, roomId: room._id, userId, success: true, index }))
          .catch(error => ({ error, roomId: room._id, userId, success: false, index }));
      });

      const connectionResults = await Promise.all(connectionPromises);
      const connectionTime = Date.now() - overallStartTime;
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryUsed = Math.round(memoryAfter - memoryBefore);

      // Analyze results
      const successfulConnections = connectionResults.filter(result => result.success);
      const averageConnectionTime = successfulConnections.length > 0 
        ? successfulConnections.reduce((sum, conn) => sum + conn.connectionTime, 0) / successfulConnections.length
        : 0;

      const successRate = Math.round((successfulConnections.length / concurrentConnections) * 100);

      measurePerformance('SSE High Load Connections', averageConnectionTime, { successRate });
      measureConnection(
        '25 Concurrent SSE Connections',
        concurrentConnections,
        Math.round(averageConnectionTime),
        successfulConnections.length,
        concurrentConnections,
        successRate,
        { memoryUsage: memoryUsed }
      );

      // Clean up connections
      successfulConnections.forEach(conn => {
        if (conn.close) {
          conn.close();
        }
      });

      // Assertions for high load
      expect(successfulConnections.length).toBeGreaterThan(concurrentConnections * 0.7); // 70% success rate under high load
      expect(averageConnectionTime).toBeLessThan(3000); // Average connection time under 3 seconds
      expect(connectionTime).toBeLessThan(10000); // Total connection time under 10 seconds
      expect(memoryUsed).toBeLessThan(20); // Memory usage under 20MB
      
      console.log(`✅ High load SSE: ${successfulConnections.length}/${concurrentConnections} connected in ${connectionTime}ms (avg: ${Math.round(averageConnectionTime)}ms, memory: ${memoryUsed}MB)`);
    });
  });

  describe('SSE Message Broadcasting Under Load', () => {
    it('should broadcast messages to multiple SSE connections reliably', async () => {
      const connectionCount = 8;
      const messagesPerConnection = 5;
      const room = testChatRooms[0];
      const testConnections = [];
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      try {
        // Establish multiple SSE connections
        const connectionPromises = Array.from({ length: connectionCount }, (_, index) => {
          const userIndex = index % 2;
          const userId = room.participants[userIndex];
          return createSSEConnection(room._id.toString(), userId.toString(), 6000);
        });

        const connectionResults = await Promise.all(connectionPromises);
        testConnections.push(...connectionResults);

        // Wait for connections to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send messages that should be broadcast to all connections
        const messagePromises = Array.from({ length: messagesPerConnection }, (_, msgIndex) => {
          const senderIndex = msgIndex % 2;
          const senderId = room.participants[senderIndex];
          const receiverId = room.participants[1 - senderIndex];
          
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', senderId.toString())
            .send({
              text: `Broadcast test message ${msgIndex} - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        });

        const messageResponses = await Promise.all(messagePromises);
        const successfulMessages = messageResponses.filter(r => r.status === 201);

        // Wait for message delivery through SSE
        await new Promise(resolve => setTimeout(resolve, 2000));

        const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryUsed = Math.round(memoryAfter - memoryBefore);

        // Analyze message delivery
        const connectionsWithMessages = testConnections.filter(conn => conn.messages.length > 0);
        const totalMessagesReceived = testConnections.reduce((sum, conn) => sum + conn.messages.length, 0);
        const expectedTotalMessages = connectionCount * successfulMessages.length;
        const deliveryRate = expectedTotalMessages > 0 
          ? Math.round((totalMessagesReceived / expectedTotalMessages) * 100)
          : 0;

        measurePerformance('SSE Message Broadcasting', totalMessagesReceived / connectionCount);
        measureConnection(
          'SSE Message Broadcasting',
          connectionCount,
          0, // No connection time for this test
          connectionsWithMessages.length,
          connectionCount,
          deliveryRate,
          { memoryUsage: memoryUsed }
        );

        // Assertions
        expect(successfulMessages.length).toBe(messagesPerConnection);
        expect(connectionsWithMessages.length).toBeGreaterThan(connectionCount * 0.75); // 75% of connections receive messages
        expect(deliveryRate).toBeGreaterThan(60); // 60% message delivery rate
        
        console.log(`✅ SSE Broadcasting: ${successfulMessages.length} messages sent, ${totalMessagesReceived} total received across ${connectionCount} connections (${deliveryRate}% delivery rate)`);

      } finally {
        // Clean up all connections
        testConnections.forEach(conn => {
          if (conn.eventSource) {
            conn.eventSource.close();
          }
        });
      }
    });

    it('should maintain connection stability during high message volume', async () => {
      const connectionCount = 6;
      const highVolumeMessages = 20;
      const room = testChatRooms[1];
      const testConnections = [];
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      try {
        // Establish SSE connections
        const connectionPromises = Array.from({ length: connectionCount }, (_, index) => {
          const userIndex = index % 2;
          const userId = room.participants[userIndex];
          return createSSEConnection(room._id.toString(), userId.toString(), 6000);
        });

        const connectionResults = await Promise.all(connectionPromises);
        testConnections.push(...connectionResults);

        // Wait for connections to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send high volume of messages rapidly
        const startTime = Date.now();
        const rapidMessagePromises = Array.from({ length: highVolumeMessages }, (_, msgIndex) => {
          const senderIndex = msgIndex % 2;
          const senderId = room.participants[senderIndex];
          const receiverId = room.participants[1 - senderIndex];
          
          return request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', senderId.toString())
            .send({
              text: `High volume message ${msgIndex} - rapid fire - ${Date.now()}`,
              receiverId: receiverId.toString(),
              roomId: room._id.toString()
            });
        });

        const messageResponses = await Promise.all(rapidMessagePromises);
        const messageTime = Date.now() - startTime;
        const successfulMessages = messageResponses.filter(r => r.status === 201);

        // Wait for message propagation
        await new Promise(resolve => setTimeout(resolve, 3000));

        const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryUsed = Math.round(memoryAfter - memoryBefore);

        // Check connection stability
        const stableConnections = testConnections.filter(conn => 
          conn.connected && conn.errors.length === 0
        );
        
        const totalMessagesReceived = testConnections.reduce((sum, conn) => sum + conn.messages.length, 0);
        const expectedTotalMessages = connectionCount * successfulMessages.length;
        const deliveryRate = expectedTotalMessages > 0 
          ? Math.round((totalMessagesReceived / expectedTotalMessages) * 100)
          : 0;

        const connectionStabilityRate = Math.round((stableConnections.length / connectionCount) * 100);

        measurePerformance('High Volume SSE Stability', messageTime / highVolumeMessages);
        measureConnection(
          'High Volume SSE Test',
          connectionCount,
          messageTime,
          stableConnections.length,
          connectionCount,
          deliveryRate,
          { memoryUsage: memoryUsed }
        );

        // Assertions
        expect(successfulMessages.length).toBeGreaterThan(highVolumeMessages * 0.9); // 90% message send success
        expect(connectionStabilityRate).toBeGreaterThan(80); // 80% connection stability
        expect(deliveryRate).toBeGreaterThan(50); // 50% delivery rate under high volume
        expect(messageTime).toBeLessThan(5000); // High volume messages sent within 5 seconds
        
        console.log(`✅ High Volume SSE: ${successfulMessages.length}/${highVolumeMessages} messages in ${messageTime}ms, ${stableConnections.length}/${connectionCount} stable connections (${deliveryRate}% delivery)`);

      } finally {
        // Clean up all connections
        testConnections.forEach(conn => {
          if (conn.eventSource) {
            conn.eventSource.close();
          }
        });
      }
    });
  });

  describe('SSE Connection Lifecycle Management', () => {
    it('should handle connection drops and reconnections gracefully', async () => {
      const room = testChatRooms[2];
      const userId = room.participants[0];
      const connectionAttempts = 5;
      const connectionResults = [];

      for (let attempt = 0; attempt < connectionAttempts; attempt++) {
        try {
          const startTime = Date.now();
          const connectionData = await createSSEConnection(room._id.toString(), userId.toString(), 4000);
          
          // Keep connection alive for a short time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Send a test message
          const messageResponse = await request(app)
            .post('/api/v1/chat/send')
            .set('x-user-id', userId.toString())
            .send({
              text: `Reconnection test message ${attempt} - ${Date.now()}`,
              receiverId: room.participants[1].toString(),
              roomId: room._id.toString()
            });

          // Wait for message delivery
          await new Promise(resolve => setTimeout(resolve, 500));

          const connectionTime = Date.now() - startTime;
          connectionResults.push({
            attempt,
            success: true,
            connectionTime: connectionData.connectionTime,
            totalTime: connectionTime,
            messagesReceived: connectionData.messages.length,
            messageSuccess: messageResponse.status === 201
          });

          // Close connection
          if (connectionData.eventSource) {
            connectionData.eventSource.close();
          }

          // Small delay between connection attempts
          if (attempt < connectionAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }

        } catch (error) {
          connectionResults.push({
            attempt,
            success: false,
            error: error.message
          });
        }
      }

      // Analyze reconnection performance
      const successfulReconnections = connectionResults.filter(result => result.success);
      const reconnectionSuccessRate = Math.round((successfulReconnections.length / connectionAttempts) * 100);
      const averageConnectionTime = successfulReconnections.length > 0
        ? successfulReconnections.reduce((sum, result) => sum + result.connectionTime, 0) / successfulReconnections.length
        : 0;

      measurePerformance('SSE Reconnection Reliability', averageConnectionTime, { successRate: reconnectionSuccessRate });
      measureConnection(
        'SSE Reconnection Test',
        1, // Single connection at a time
        Math.round(averageConnectionTime),
        successfulReconnections.length,
        connectionAttempts,
        reconnectionSuccessRate
      );

      // Assertions
      expect(reconnectionSuccessRate).toBeGreaterThan(80); // 80% reconnection success rate
      expect(averageConnectionTime).toBeLessThan(2000); // Average reconnection time under 2 seconds
      
      console.log(`✅ SSE Reconnection: ${successfulReconnections.length}/${connectionAttempts} successful reconnections (${reconnectionSuccessRate}% success, avg: ${Math.round(averageConnectionTime)}ms)`);
    });

    it('should properly clean up resources on connection close', async () => {
      const room = testChatRooms[3];
      const connectionCount = 10;
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      const testConnections = [];

      try {
        // Create multiple connections
        const connectionPromises = Array.from({ length: connectionCount }, (_, index) => {
          const userIndex = index % 2;
          const userId = room.participants[userIndex];
          return createSSEConnection(room._id.toString(), userId.toString(), 5000);
        });

        const connectionResults = await Promise.all(connectionPromises);
        testConnections.push(...connectionResults);

        // Let connections stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const memoryAfterConnections = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryWithConnections = Math.round(memoryAfterConnections - memoryBefore);

        // Close all connections
        testConnections.forEach(conn => {
          if (conn.eventSource) {
            conn.eventSource.close();
          }
        });

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));

        const memoryAfterCleanup = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryAfterCleanup2 = Math.round(memoryAfterCleanup - memoryBefore);
        const memoryReclaimed = memoryWithConnections - memoryAfterCleanup2;

        measureConnection(
          'SSE Resource Cleanup',
          connectionCount,
          0,
          connectionCount,
          connectionCount,
          100, // All connections were successfully created and closed
          { memoryUsage: memoryAfterCleanup2 }
        );

        // Assertions
        expect(memoryReclaimed).toBeGreaterThan(0); // Some memory should be reclaimed
        expect(memoryAfterCleanup2).toBeLessThan(memoryWithConnections * 1.2); // Memory usage shouldn't grow significantly
        
        console.log(`✅ SSE Cleanup: ${connectionCount} connections, memory: ${memoryWithConnections}MB → ${memoryAfterCleanup2}MB (${memoryReclaimed}MB reclaimed)`);

      } finally {
        // Ensure all connections are closed
        testConnections.forEach(conn => {
          if (conn.eventSource) {
            try {
              conn.eventSource.close();
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        });
      }
    });
  });
});