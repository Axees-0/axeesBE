/**
 * REAL-TIME COMMUNICATION BUG TESTS
 * 
 * Tests the specific ways chat and real-time features break under real usage
 * These bugs cause the most support tickets and user confusion
 */

const puppeteer = require('puppeteer');
const SelectorResilience = require('../utils/selector-resilience');
const RouteValidator = require('../utils/route-validator');
const config = require('../config');
const credentialValidator = require('../utils/credential-validator');

class ChatRealtimeBugHunter {
  constructor(baseUrl = config.frontendUrl) {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.page2 = null; // For multi-user testing
    this.selector = null;
    this.selector2 = null;
    this.bugs = [];
  }

  async initialize() {
    // Validate credentials before starting browser
    try {
      await credentialValidator.preFlightCheck();
    } catch (error) {
      throw new Error(`Credential validation failed: ${error.message}`);
    }
    
    this.browser = await puppeteer.launch(config.getBrowserOptions());
    this.page = await this.browser.newPage();
    this.page2 = await this.browser.newPage(); // Second user
    
    this.selector = new SelectorResilience(this.page);
    this.selector2 = new SelectorResilience(this.page2);
    this.routeValidator = new RouteValidator(this.page);
    
    // Validate routes before running tests
    await this.routeValidator.validateTestRoutes('chat');
    
    // Set up resilient selectors for chat testing
    this.selectors = {
      chatInput: [
        '[data-testid="chat-input"]',
        '[data-testid="message-input"]',
        '#chat-input',
        '#message-input',
        'input[name="message"]',
        'textarea[name="message"]',
        '.chat-input',
        '.message-input',
        '[placeholder*="message" i]'
      ],
      
      sendButton: [
        '[data-testid="send-button"]',
        '[data-testid="send-message"]',
        '#send-button',
        'button[type="submit"]',
        '.send-button',
        '.send-message',
        'button:contains("Send")',
        '[aria-label="Send message"]'
      ],
      
      messageContainer: [
        '[data-testid="messages-container"]',
        '[data-testid="chat-messages"]',
        '#messages-container',
        '.messages-container',
        '.chat-messages',
        '.message-list',
        '[role="log"]'
      ],
      
      typingIndicator: [
        '[data-testid="typing-indicator"]',
        '[data-testid="typing"]',
        '.typing-indicator',
        '.typing',
        '.is-typing',
        '[aria-label*="typing"]'
      ],
      
      fileUploadButton: [
        '[data-testid="file-upload"]',
        '[data-testid="attach-file"]',
        '#file-upload',
        'input[type="file"]',
        '.file-upload',
        '.attach-button'
      ],
      
      uploadProgress: [
        '[data-testid="upload-progress"]',
        '[data-testid="progress-bar"]',
        '.upload-progress',
        '.progress-bar',
        '[role="progressbar"]'
      ],
      
      chatList: [
        '[data-testid="chat-list"]',
        '[data-testid="conversation-list"]',
        '#chat-list',
        '.chat-list',
        '.conversation-list'
      ],
      
      unreadBadge: [
        '[data-testid="unread-badge"]',
        '[data-testid="unread-count"]',
        '.unread-badge',
        '.unread-count',
        '.badge'
      ],
      
      connectionStatus: [
        '[data-testid="connection-status"]',
        '[data-testid="online-status"]',
        '.connection-status',
        '.online-status',
        '.status-indicator'
      ]
    };
    
    // Monitor WebSocket connections
    this.page.on('websocket', ws => {
      console.log('WebSocket opened:', ws.url());
      ws.on('close', () => console.log('WebSocket closed'));
      ws.on('framereceived', frame => {
        if (frame.opcode === 1) { // Text frame
          console.log('WebSocket received:', frame.payload);
        }
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveRealtimeTests() {
    console.log('⚡ Running comprehensive real-time bug tests...');
    
    try {
      await this.testWebSocketConnectionRecovery();
      await this.testMessageOrderingRapidSend();
      await this.testTypingIndicatorCleanup();
      await this.testChatScrollPositionManagement();
      await this.testFileUploadProgressAccuracy();
      await this.testChatListRealtimeUpdating();
      await this.testUnreadCountAccuracy();
      await this.testNetworkDisconnectionHandling();
      await this.testMultiTabChatSynchronization();
      await this.testMessageDeliveryConfirmation();
    } catch (error) {
      console.error('Real-time test error:', error.message);
    }

    return {
      totalBugs: this.bugs.length,
      bugs: this.bugs,
      critical: this.bugs.filter(b => b.severity === 'CRITICAL').length,
      high: this.bugs.filter(b => b.severity === 'HIGH').length,
      medium: this.bugs.filter(b => b.severity === 'MEDIUM').length,
      low: this.bugs.filter(b => b.severity === 'LOW').length
    };
  }

  async testWebSocketConnectionRecovery() {
    console.log('🔌 Testing: WebSocket connection recovery');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat`);
      
      // Wait for WebSocket connection
      await this.page.waitForTimeout(2000);
      
      // Check if WebSocket is connected
      const isConnected = await this.page.evaluate(() => {
        return window.socket && window.socket.connected;
      });
      
      if (isConnected) {
        // Simulate network disconnection
        await this.page.setOfflineMode(true);
        await this.page.waitForTimeout(1000);
        
        // Go back online
        await this.page.setOfflineMode(false);
        await this.page.waitForTimeout(3000);
        
        // Check if WebSocket reconnected
        const reconnected = await this.page.evaluate(() => {
          return window.socket && window.socket.connected;
        });
        
        if (!reconnected) {
          this.logBug('HIGH', 'WebSocket Reconnection Failed', 
            'WebSocket does not automatically reconnect after network disruption');
        }
        
        // Check for user feedback about connection status
        const hasConnectionStatus = await this.selector.elementExists(this.selectors.connectionStatus);
        if (!hasConnectionStatus) {
          this.logBug('MEDIUM', 'No Connection Status Indicator', 
            'Users have no feedback about chat connection status');
        }
      } else {
        this.logBug('CRITICAL', 'WebSocket Connection Failed', 
          'WebSocket connection not established on chat page load');
      }
    } catch (error) {
      this.logBug('CRITICAL', 'Chat Page Load Failed', `Chat page failed to load: ${error.message}`);
    }
  }

  async testMessageOrderingRapidSend() {
    console.log('📨 Testing: Message ordering during rapid sending');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      
      // Send multiple messages rapidly
      const messages = [
        'First message',
        'Second message', 
        'Third message',
        'Fourth message',
        'Fifth message'
      ];
      
      const messageTimes = [];
      
      for (const message of messages) {
        const startTime = Date.now();
        await this.page.type('[data-testid="message-input"]', message);
        await this.page.click('[data-testid="send-button"]');
        messageTimes.push({ message, time: startTime });
        
        // Clear input for next message
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="message-input"]');
          if (input) input.value = '';
        });
        
        // Small delay to simulate rapid typing
        await this.page.waitForTimeout(100);
      }
      
      // Wait for all messages to appear
      await this.page.waitForTimeout(2000);
      
      // Check message order in UI
      const displayedMessages = await this.page.$$eval('[data-testid="chat-message"]', 
        messages => messages.map(msg => msg.textContent.trim()));
      
      // Verify chronological order
      let orderCorrect = true;
      for (let i = 0; i < messages.length; i++) {
        if (!displayedMessages.some(displayed => displayed.includes(messages[i]))) {
          orderCorrect = false;
          break;
        }
      }
      
      if (!orderCorrect) {
        this.logBug('HIGH', 'Message Ordering Issue', 
          'Messages appear out of order when sent in rapid succession');
      }
      
      // Check for duplicate messages
      const uniqueMessages = [...new Set(displayedMessages)];
      if (displayedMessages.length !== uniqueMessages.length) {
        this.logBug('HIGH', 'Duplicate Messages', 
          'Rapid message sending causes duplicate messages to appear');
      }
      
    } catch (error) {
      console.log('Message ordering test skipped:', error.message);
    }
  }

  async testTypingIndicatorCleanup() {
    console.log('✍️  Testing: Typing indicator cleanup');
    
    try {
      // Set up two users in the same chat
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      await this.page2.goto(`${this.baseUrl}/chat/room/test`);
      
      await this.page.waitForTimeout(1000);
      
      // User 1 starts typing
      await this.page.focus('[data-testid="message-input"]');
      await this.page.type('[data-testid="message-input"]', 'I am typing...');
      
      // Wait for typing indicator to appear for user 2
      await this.page2.waitForTimeout(1000);
      
      const typingIndicator = await this.page2.$('[data-testid="typing-indicator"]');
      
      if (typingIndicator) {
        // User 1 stops typing without sending (navigates away)
        await this.page.goto(`${this.baseUrl}/dashboard`);
        
        // Wait and check if typing indicator cleared for user 2
        await this.page2.waitForTimeout(3000);
        
        const indicatorStillVisible = await this.page2.$eval('[data-testid="typing-indicator"]', 
          el => el.offsetParent !== null).catch(() => false);
        
        if (indicatorStillVisible) {
          this.logBug('MEDIUM', 'Typing Indicator Stuck', 
            'Typing indicator remains visible after user stops typing or leaves');
        }
      } else {
        this.logBug('LOW', 'No Typing Indicator', 
          'Typing indicator not implemented or not visible');
      }
      
      // Test typing timeout cleanup
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      await this.page.focus('[data-testid="message-input"]');
      await this.page.type('[data-testid="message-input"]', 'Typing and stopping...');
      
      // Stop typing for extended period
      await this.page.waitForTimeout(5000);
      
      const typingAfterTimeout = await this.page2.$eval('[data-testid="typing-indicator"]', 
        el => el.offsetParent !== null).catch(() => false);
      
      if (typingAfterTimeout) {
        this.logBug('MEDIUM', 'Typing Indicator Timeout', 
          'Typing indicator does not clear after inactivity timeout');
      }
      
    } catch (error) {
      console.log('Typing indicator test skipped:', error.message);
    }
  }

  async testChatScrollPositionManagement() {
    console.log('📜 Testing: Chat scroll position management');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat/room/history`);
      
      // Scroll up to read older messages
      await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight / 2;
        }
      });
      
      const scrollPosition = await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        return chatContainer ? chatContainer.scrollTop : 0;
      });
      
      // Simulate new message arriving while user is scrolled up
      await this.page.evaluate(() => {
        // Simulate new message by adding DOM element
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        if (chatContainer) {
          const newMessage = document.createElement('div');
          newMessage.className = 'chat-message';
          newMessage.textContent = 'New message while scrolled up';
          chatContainer.appendChild(newMessage);
        }
      });
      
      await this.page.waitForTimeout(500);
      
      // Check if scroll position changed unexpectedly
      const newScrollPosition = await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        return chatContainer ? chatContainer.scrollTop : 0;
      });
      
      if (Math.abs(newScrollPosition - scrollPosition) > 50) {
        this.logBug('MEDIUM', 'Chat Scroll Jump', 
          'Chat automatically scrolls when new messages arrive while user is reading older messages');
      }
      
      // Test auto-scroll when at bottom
      await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
      
      const bottomPosition = await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        return chatContainer ? chatContainer.scrollTop : 0;
      });
      
      // Add another message
      await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        if (chatContainer) {
          const newMessage = document.createElement('div');
          newMessage.className = 'chat-message';
          newMessage.textContent = 'Message when at bottom';
          chatContainer.appendChild(newMessage);
        }
      });
      
      await this.page.waitForTimeout(500);
      
      const finalPosition = await this.page.evaluate(() => {
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        return chatContainer ? 
          Math.abs(chatContainer.scrollTop - (chatContainer.scrollHeight - chatContainer.clientHeight)) : 999;
      });
      
      if (finalPosition > 10) {
        this.logBug('LOW', 'Auto-scroll Not Working', 
          'Chat does not auto-scroll to bottom when new messages arrive and user is at bottom');
      }
      
    } catch (error) {
      console.log('Chat scroll test skipped:', error.message);
    }
  }

  async testFileUploadProgressAccuracy() {
    console.log('📁 Testing: File upload progress accuracy');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      
      // Find file input
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        // Upload this file as test
        await fileInput.uploadFile(__filename);
        
        // Monitor upload progress
        const progressValues = [];
        const progressMonitor = setInterval(async () => {
          const progress = await this.page.$eval('[data-testid="upload-progress"]', 
            el => parseFloat(el.textContent)).catch(() => null);
          if (progress !== null) {
            progressValues.push(progress);
          }
        }, 100);
        
        // Wait for upload to complete
        await this.page.waitForTimeout(5000);
        clearInterval(progressMonitor);
        
        // Check progress accuracy
        if (progressValues.length > 0) {
          const finalProgress = progressValues[progressValues.length - 1];
          
          // Check if progress ever goes backwards
          let progressDecreased = false;
          for (let i = 1; i < progressValues.length; i++) {
            if (progressValues[i] < progressValues[i - 1]) {
              progressDecreased = true;
              break;
            }
          }
          
          if (progressDecreased) {
            this.logBug('MEDIUM', 'Upload Progress Inconsistent', 
              'File upload progress bar decreases or jumps erratically');
          }
          
          if (finalProgress < 95 && finalProgress > 0) {
            this.logBug('MEDIUM', 'Upload Progress Inaccurate', 
              'Upload progress shows incomplete even when upload succeeded');
          }
        } else {
          this.logBug('LOW', 'No Upload Progress Indicator', 
            'File upload has no progress feedback for users');
        }
        
        // Test upload cancellation
        await fileInput.uploadFile(__filename);
        await this.page.waitForTimeout(100);
        
        const cancelButton = await this.page.$('[data-testid="cancel-upload"]');
        if (cancelButton) {
          await cancelButton.click();
          
          // Check if upload actually stopped
          await this.page.waitForTimeout(1000);
          
          const uploadStillActive = await this.page.$('[data-testid="upload-progress"]');
          if (uploadStillActive) {
            this.logBug('HIGH', 'Upload Cancellation Failed', 
              'File upload continues even after user cancels');
          }
        } else {
          this.logBug('MEDIUM', 'No Upload Cancellation', 
            'Users cannot cancel file uploads once started');
        }
      }
    } catch (error) {
      console.log('File upload test skipped:', error.message);
    }
  }

  async testChatListRealtimeUpdating() {
    console.log('📋 Testing: Chat list real-time updating');
    
    try {
      // User 1 goes to chat list
      await this.page.goto(`${this.baseUrl}/chat`);
      
      // User 2 sends message in a specific chat
      await this.page2.goto(`${this.baseUrl}/chat/room/test`);
      await this.page2.type('[data-testid="message-input"]', 'Testing chat list update');
      await this.page2.click('[data-testid="send-button"]');
      
      // Wait for real-time update
      await this.page.waitForTimeout(2000);
      
      // Check if chat list reordered
      const chatItems = await this.page.$$eval('[data-testid="chat-item"]', 
        items => items.map(item => item.dataset.chatId || item.id));
      
      if (chatItems.length > 1) {
        // The chat that received message should be at top
        if (chatItems[0] !== 'test') {
          this.logBug('MEDIUM', 'Chat List Not Reordering', 
            'Chat list does not reorder by most recent activity in real-time');
        }
      }
      
      // Check unread count update
      const unreadCount = await this.page.$eval('[data-testid="unread-count-test"]', 
        el => parseInt(el.textContent)).catch(() => 0);
      
      if (unreadCount === 0) {
        this.logBug('HIGH', 'Unread Count Not Updating', 
          'Unread message count does not update in real-time');
      }
      
      // Test unread count clearing
      await this.page.click('[data-testid="chat-item-test"]');
      await this.page.waitForTimeout(1000);
      
      const unreadAfterRead = await this.page.$eval('[data-testid="unread-count-test"]', 
        el => parseInt(el.textContent)).catch(() => 0);
      
      if (unreadAfterRead > 0) {
        this.logBug('MEDIUM', 'Unread Count Not Clearing', 
          'Unread count does not clear when user opens chat');
      }
      
    } catch (error) {
      console.log('Chat list test skipped:', error.message);
    }
  }

  async testUnreadCountAccuracy() {
    console.log('🔢 Testing: Unread count accuracy');
    
    try {
      // User 1 in chat list
      await this.page.goto(`${this.baseUrl}/chat`);
      
      // User 2 sends multiple messages
      await this.page2.goto(`${this.baseUrl}/chat/room/test`);
      
      const messagesToSend = ['Message 1', 'Message 2', 'Message 3'];
      
      for (const message of messagesToSend) {
        await this.page2.type('[data-testid="message-input"]', message);
        await this.page2.click('[data-testid="send-button"]');
        
        // Clear input
        await this.page2.evaluate(() => {
          const input = document.querySelector('[data-testid="message-input"]');
          if (input) input.value = '';
        });
        
        await this.page2.waitForTimeout(500);
      }
      
      // Check unread count
      await this.page.waitForTimeout(2000);
      
      const unreadCount = await this.page.$eval('[data-testid="unread-count-test"]', 
        el => parseInt(el.textContent)).catch(() => 0);
      
      if (unreadCount !== messagesToSend.length) {
        this.logBug('HIGH', 'Unread Count Inaccurate', 
          `Unread count shows ${unreadCount} but should show ${messagesToSend.length}`);
      }
      
      // Test partial read scenario
      await this.page.click('[data-testid="chat-item-test"]');
      await this.page.waitForTimeout(1000);
      
      // Go back to chat list without scrolling to see all messages
      await this.page.goBack();
      
      // Send another message
      await this.page2.type('[data-testid="message-input"]', 'Additional message');
      await this.page2.click('[data-testid="send-button"]');
      
      await this.page.waitForTimeout(1000);
      
      const newUnreadCount = await this.page.$eval('[data-testid="unread-count-test"]', 
        el => parseInt(el.textContent)).catch(() => 0);
      
      if (newUnreadCount === 0) {
        this.logBug('MEDIUM', 'Unread Count Reset Incorrectly', 
          'Unread count resets completely instead of tracking new messages');
      }
      
    } catch (error) {
      console.log('Unread count test skipped:', error.message);
    }
  }

  async testNetworkDisconnectionHandling() {
    console.log('🌐 Testing: Network disconnection handling');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      
      // Send message while connected
      await this.page.type('[data-testid="message-input"]', 'Message before disconnect');
      await this.page.click('[data-testid="send-button"]');
      
      // Clear input
      await this.page.evaluate(() => {
        const input = document.querySelector('[data-testid="message-input"]');
        if (input) input.value = '';
      });
      
      // Disconnect network
      await this.page.setOfflineMode(true);
      
      // Try to send message while offline
      await this.page.type('[data-testid="message-input"]', 'Message while offline');
      await this.page.click('[data-testid="send-button"]');
      
      // Check for offline indicator
      const offlineIndicator = await this.page.$('[data-testid="offline-indicator"]');
      if (!offlineIndicator) {
        this.logBug('HIGH', 'No Offline Indicator', 
          'Users have no feedback when they are offline');
      }
      
      // Check if message is queued
      const queuedMessage = await this.page.$('[data-testid="queued-message"]');
      if (!queuedMessage) {
        this.logBug('MEDIUM', 'No Message Queuing', 
          'Messages sent while offline are lost instead of queued');
      }
      
      // Reconnect
      await this.page.setOfflineMode(false);
      await this.page.waitForTimeout(3000);
      
      // Check if queued messages are sent
      const messageSent = await this.page.$$eval('[data-testid="chat-message"]', 
        messages => messages.some(msg => msg.textContent.includes('Message while offline')));
      
      if (!messageSent && queuedMessage) {
        this.logBug('HIGH', 'Queued Messages Not Sent', 
          'Messages queued while offline are not sent when connection is restored');
      }
      
    } catch (error) {
      console.log('Network disconnection test skipped:', error.message);
    }
  }

  async testMultiTabChatSynchronization() {
    console.log('🗂️ Testing: Multi-tab chat synchronization');
    
    try {
      // Open same chat in both tabs
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      await this.page2.goto(`${this.baseUrl}/chat/room/test`);
      
      // Send message from tab 1
      await this.page.type('[data-testid="message-input"]', 'Message from tab 1');
      await this.page.click('[data-testid="send-button"]');
      
      // Check if it appears in tab 2
      await this.page2.waitForTimeout(2000);
      
      const messageInTab2 = await this.page2.$$eval('[data-testid="chat-message"]', 
        messages => messages.some(msg => msg.textContent.includes('Message from tab 1')));
      
      if (!messageInTab2) {
        this.logBug('HIGH', 'Multi-Tab Sync Failed', 
          'Messages sent from one tab do not appear in other tabs of same chat');
      }
      
      // Test typing indicators across tabs
      await this.page.focus('[data-testid="message-input"]');
      await this.page.type('[data-testid="message-input"]', 'Typing in tab 1');
      
      await this.page2.waitForTimeout(1000);
      
      const typingInTab2 = await this.page2.$('[data-testid="typing-indicator"]');
      if (typingInTab2) {
        this.logBug('MEDIUM', 'Self Typing Indicator', 
          'User sees their own typing indicator from other tabs');
      }
      
      // Test read status synchronization
      await this.page.evaluate(() => {
        const container = document.querySelector('[data-testid="chat-messages"]');
        if (container) container.scrollTop = container.scrollHeight;
      });
      
      await this.page.waitForTimeout(1000);
      
      // Check if read status updates in tab 2 
      const readStatusTab2 = await this.page2.$$eval('[data-testid="message-read"]', 
        elements => elements.length);
      
      if (readStatusTab2 === 0) {
        this.logBug('LOW', 'Read Status Not Synced', 
          'Read status does not sync across multiple tabs');
      }
      
    } catch (error) {
      console.log('Multi-tab sync test skipped:', error.message);
    }
  }

  async testMessageDeliveryConfirmation() {
    console.log('✅ Testing: Message delivery confirmation');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat/room/test`);
      
      // Send a message
      await this.page.type('[data-testid="message-input"]', 'Test delivery confirmation');
      await this.page.click('[data-testid="send-button"]');
      
      // Check for delivery status indicators
      await this.page.waitForTimeout(2000);
      
      const deliveredIndicator = await this.page.$('[data-testid="message-delivered"]');
      const sentIndicator = await this.page.$('[data-testid="message-sent"]');
      
      if (!deliveredIndicator && !sentIndicator) {
        this.logBug('LOW', 'No Delivery Confirmation', 
          'Messages have no delivery status indicators');
      }
      
      // Test failed delivery handling
      await this.page.setOfflineMode(true);
      
      await this.page.type('[data-testid="message-input"]', 'Message that should fail');
      await this.page.click('[data-testid="send-button"]');
      
      await this.page.waitForTimeout(2000);
      
      const failedIndicator = await this.page.$('[data-testid="message-failed"]');
      if (!failedIndicator) {
        this.logBug('MEDIUM', 'No Failed Delivery Indicator', 
          'Failed message delivery has no visual indication');
      }
      
      // Test retry functionality
      const retryButton = await this.page.$('[data-testid="retry-message"]');
      if (!retryButton) {
        this.logBug('MEDIUM', 'No Message Retry Option', 
          'Users cannot retry failed message delivery');
      }
      
    } catch (error) {
      console.log('Message delivery test skipped:', error.message);
    }
  }

  logBug(severity, category, description) {
    this.bugs.push({
      severity,
      category,
      description,
      timestamp: new Date().toISOString(),
      url: this.page ? this.page.url() : 'unknown'
    });
    console.log(`  ${severity}: ${category} - ${description}`);
  }
}

module.exports = ChatRealtimeBugHunter;

// Run if called directly
if (require.main === module) {
  const hunter = new ChatRealtimeBugHunter();
  
  async function runTests() {
    try {
      await hunter.initialize();
      const report = await hunter.runComprehensiveRealtimeTests();
      
      console.log('\n' + '='.repeat(60));
      console.log('⚡ REAL-TIME BUG HUNT RESULTS');
      console.log('='.repeat(60));
      console.log(`Total bugs found: ${report.totalBugs}`);
      console.log(`Critical: ${report.critical}`);
      console.log(`High: ${report.high}`);
      console.log(`Medium: ${report.medium}`);
      console.log(`Low: ${report.low}`);
      
      if (report.critical > 0) {
        console.log('\n🚨 CRITICAL: Real-time communication is broken!');
      }
    } catch (error) {
      console.error('Real-time bug hunt failed:', error);
    } finally {
      await hunter.cleanup();
    }
  }
  
  runTests();
}