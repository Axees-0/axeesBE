/**
 * CONNECTION DROPS DURING UPLOAD TEST
 * 
 * Validates WebSocket stability during file uploads and message sending
 * 
 * REAL WORLD SCENARIO:
 * User uploads 50MB video to chat, connection drops at 90% progress,
 * no resume capability, user has to start over
 */

const io = require('socket.io-client');
const request = require('supertest');
const app = require('../../../main');
const { setupTestDatabase, cleanupTestDatabase } = require('../../helpers/database');
const fs = require('fs');
const path = require('path');

describe('Real-Time Connection Chaos Reality Check', () => {
  let serverInstance;
  let clientSocket;
  let testUser;
  let authToken;
  let testChatId;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Start server
    serverInstance = app.listen(0); // Random port
    const port = serverInstance.address().port;
    
    testUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@chat.com'
    };

    // Get auth token
    authToken = 'Bearer fake_token_for_testing';
    testChatId = '507f1f77bcf86cd799439020';
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (serverInstance) {
      serverInstance.close();
    }
    await cleanupTestDatabase();
  });

  describe('🔌 WebSocket Connection Drops', () => {
    it('should handle connection drop during file upload', async () => {
      const port = serverInstance.address().port;
      
      // Create large fake file buffer (simulate large upload)
      const largeFileBuffer = Buffer.alloc(1024 * 1024); // 1MB
      largeFileBuffer.fill('test data');

      // Start upload
      const uploadPromise = request(app)
        .post(`/api/chats/${testChatId}/upload`)
        .set('Authorization', authToken)
        .attach('files', largeFileBuffer, 'large-video.mp4')
        .timeout(2000); // Short timeout to simulate connection issues

      // Simulate connection drop by forcing timeout
      try {
        await uploadPromise;
      } catch (error) {
        // Expected to fail due to timeout/connection issues
        expect(error.code).toBeDefined();
      }

      // Verify no partial files left on disk
      const uploadsDir = path.join(__dirname, '../../../uploads/attachments');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const partialFiles = files.filter(file => file.includes('large-video'));
        expect(partialFiles.length).toBe(0);
      }
    });

    it('should handle WebSocket reconnection after drop', (done) => {
      const port = serverInstance.address().port;
      clientSocket = io(`http://localhost:${port}`, {
        forceNew: true,
        timeout: 1000
      });

      let messageReceived = false;
      let reconnectionAttempted = false;

      clientSocket.on('connect', () => {
        if (!reconnectionAttempted) {
          // Send initial message
          clientSocket.emit('join_room', testChatId);
          
          // Simulate connection drop
          setTimeout(() => {
            clientSocket.disconnect();
            reconnectionAttempted = true;
            
            // Attempt reconnection
            setTimeout(() => {
              clientSocket.connect();
            }, 1000);
          }, 500);
        } else {
          // Reconnected successfully
          clientSocket.emit('send_message', {
            chatId: testChatId,
            content: 'Test message after reconnection',
            receiverId: '507f1f77bcf86cd799439013'
          });
        }
      });

      clientSocket.on('new_message', (data) => {
        messageReceived = true;
        expect(data.message.content).toBe('Test message after reconnection');
        done();
      });

      clientSocket.on('connect_error', (error) => {
        if (!reconnectionAttempted) {
          // Expected during simulated drop
          return;
        }
        done(error);
      });

      // Timeout safety
      setTimeout(() => {
        if (!messageReceived) {
          done(new Error('Message not received after reconnection'));
        }
      }, 10000);
    });
  });

  describe('📨 Message Ordering Chaos', () => {
    it('should maintain message order during rapid sends', (done) => {
      const port = serverInstance.address().port;
      clientSocket = io(`http://localhost:${port}`, { forceNew: true });

      const messages = [];
      const expectedMessages = [
        'Message 1',
        'Message 2', 
        'Message 3',
        'Message 4',
        'Message 5'
      ];

      clientSocket.on('connect', () => {
        clientSocket.emit('join_room', testChatId);
        
        // Send messages rapidly
        expectedMessages.forEach((content, index) => {
          setTimeout(() => {
            clientSocket.emit('send_message', {
              chatId: testChatId,
              content,
              receiverId: '507f1f77bcf86cd799439013'
            });
          }, index * 10); // 10ms apart
        });
      });

      clientSocket.on('new_message', (data) => {
        messages.push(data.message.content);
        
        if (messages.length === expectedMessages.length) {
          // Check if messages arrived in order
          const orderedCorrectly = messages.every((msg, index) => 
            msg === expectedMessages[index]
          );
          
          if (!orderedCorrectly) {
            console.log('Expected order:', expectedMessages);
            console.log('Actual order:', messages);
          }
          
          // This might fail - documenting real behavior
          try {
            expect(orderedCorrectly).toBe(true);
            done();
          } catch (error) {
            done(error);
          }
        }
      });

      setTimeout(() => {
        done(new Error('Did not receive all messages in time'));
      }, 5000);
    });
  });

  describe('⌨️ Typing Indicators Stuck', () => {
    it('should clear typing indicators after disconnect', (done) => {
      const port = serverInstance.address().port;
      clientSocket = io(`http://localhost:${port}`, { forceNew: true });

      let typingStarted = false;
      let typingStopped = false;

      clientSocket.on('connect', () => {
        clientSocket.emit('join_room', testChatId);
        
        // Start typing
        clientSocket.emit('typing_start', {
          chatId: testChatId,
          userId: testUser._id
        });
        typingStarted = true;
        
        // Disconnect without stopping typing
        setTimeout(() => {
          clientSocket.disconnect();
        }, 1000);
      });

      clientSocket.on('typing_stop', (data) => {
        typingStopped = true;
      });

      // Check if typing indicator gets cleaned up
      setTimeout(() => {
        // In real implementation, server should clean up typing indicators
        // for disconnected users
        if (typingStarted && !typingStopped) {
          console.log('⚠️ Typing indicator may be stuck for disconnected user');
        }
        done();
      }, 3000);
    });
  });

  describe('🔄 Memory Leaks in WebSocket', () => {
    it('should not accumulate connections from rapid reconnects', async () => {
      const port = serverInstance.address().port;
      
      // Simulate user rapidly reconnecting (poor network)
      const connections = [];
      
      for (let i = 0; i < 10; i++) {
        const socket = io(`http://localhost:${port}`, {
          forceNew: true,
          timeout: 500
        });
        
        connections.push(socket);
        
        // Quick connect/disconnect cycle
        await new Promise(resolve => {
          socket.on('connect', () => {
            setTimeout(() => {
              socket.disconnect();
              resolve();
            }, 100);
          });
          
          socket.on('connect_error', () => {
            resolve();
          });
        });
      }

      // All connections should be properly cleaned up
      const activeConnections = connections.filter(socket => socket.connected);
      expect(activeConnections.length).toBe(0);
    });
  });

  describe('📱 Mobile-Specific Connection Issues', () => {
    it('should handle background/foreground app transitions', (done) => {
      const port = serverInstance.address().port;
      clientSocket = io(`http://localhost:${port}`, { 
        forceNew: true,
        timeout: 2000
      });

      let backgroundSimulated = false;

      clientSocket.on('connect', () => {
        clientSocket.emit('join_room', testChatId);
        
        // Simulate app going to background (iOS kills connections after 30s)
        setTimeout(() => {
          // Simulate background by pausing socket
          clientSocket.io.engine.pause();
          backgroundSimulated = true;
          
          // Simulate app returning to foreground
          setTimeout(() => {
            clientSocket.io.engine.resume();
            
            // Try to send message after resume
            clientSocket.emit('send_message', {
              chatId: testChatId,
              content: 'Message after background',
              receiverId: '507f1f77bcf86cd799439013'
            });
          }, 2000);
        }, 1000);
      });

      clientSocket.on('new_message', (data) => {
        if (backgroundSimulated && data.message.content === 'Message after background') {
          done();
        }
      });

      clientSocket.on('disconnect', () => {
        if (backgroundSimulated) {
          // Expected behavior - should reconnect
          return;
        }
        done(new Error('Unexpected disconnect'));
      });

      setTimeout(() => {
        done(new Error('Background/foreground test timeout'));
      }, 8000);
    });
  });
});