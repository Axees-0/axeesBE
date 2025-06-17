/**
 * ChatBubble Component - Real-time messaging interface
 * Provides a floating chat bubble with SSE-based real-time messaging
 */

class ChatBubble {
  constructor() {
    this.isOpen = false;
    this.currentChatRoom = null;
    this.messages = [];
    this.eventSource = null;
    this.unreadCount = 0;
    this.typingTimer = null;
    this.isTyping = false;
    this.lastMessageId = null;
    this.uploadInProgress = false;
    
    this.initialize();
  }

  /**
   * Initialize the chat bubble system
   */
  initialize() {
    this.createChatBubbleHTML();
    this.bindEvents();
    this.loadChatRooms();
    this.startUnreadCountPolling();
  }

  /**
   * Create the chat bubble HTML structure
   */
  createChatBubbleHTML() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-bubble-container';
    chatContainer.innerHTML = `
      <!-- Floating Chat Button -->
      <div class="chat-bubble-button" onclick="chatBubble.toggleChat()">
        <div class="chat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <div class="chat-unread-badge" id="chatUnreadBadge" style="display: none;">0</div>
      </div>

      <!-- Chat Window -->
      <div class="chat-window" id="chatWindow" style="display: none;">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-content">
            <h3 class="chat-title">Messages</h3>
            <div class="chat-subtitle" id="chatSubtitle">Select a conversation</div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-minimize" onclick="chatBubble.minimizeChat()">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 9h10v2H5z"/>
              </svg>
            </button>
            <button class="chat-close" onclick="chatBubble.closeChat()">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="chat-body">
          <!-- Chat List -->
          <div class="chat-list" id="chatList">
            <div class="chat-list-loading">
              <div class="loading-spinner"></div>
              <span>Loading conversations...</span>
            </div>
          </div>

          <!-- Message Area -->
          <div class="message-area" id="messageArea" style="display: none;">
            <!-- Messages Container -->
            <div class="messages-container" id="messagesContainer">
              <div class="message-loading">
                <div class="loading-spinner"></div>
                <span>Loading messages...</span>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div class="typing-indicator" id="typingIndicator" style="display: none;">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="typing-text">Someone is typing...</span>
            </div>

            <!-- Message Input -->
            <div class="message-input-container">
              <div class="message-attachments" id="messageAttachments" style="display: none;">
                <!-- Attachment previews will be shown here -->
              </div>
              
              <form class="message-form" id="messageForm" onsubmit="chatBubble.sendMessage(event)">
                <div class="message-input-wrapper">
                  <button type="button" class="attach-button" onclick="chatBubble.triggerFileUpload()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.5 2a5.5 5.5 0 00-5.5 5.5v5a5.5 5.5 0 0011 0v-5a5.5 5.5 0 00-5.5-5.5zM3 7.5a7.5 7.5 0 1115 0v5a7.5 7.5 0 11-15 0v-5z"/>
                      <path d="M10.5 5a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0v-5A2.5 2.5 0 0010.5 5z"/>
                    </svg>
                  </button>
                  
                  <input type="file" id="chatFileInput" style="display: none;" multiple 
                         onchange="chatBubble.handleFileSelection(event)" />
                  
                  <input type="text" 
                         class="message-input" 
                         id="messageInput" 
                         placeholder="Type a message..." 
                         oninput="chatBubble.handleTyping()"
                         autocomplete="off">
                  
                  <button type="submit" class="send-button" id="sendButton">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.925 5.025l14.96-4.02a.5.5 0 01.628.628l-4.02 14.96a.5.5 0 01-.944.064l-2.94-6.857a.5.5 0 00-.264-.264l-6.857-2.94a.5.5 0 01.064-.944l1.373-.577z"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.injectStyles();
    
    // Append to body
    document.body.appendChild(chatContainer);
  }

  /**
   * Load chat rooms for the current user
   */
  async loadChatRooms() {
    try {
      const response = await window.axeesAPI.request('/chats');
      
      if (response.success && response.data) {
        this.renderChatList(response.data);
        this.updateUnreadCount();
      }
    } catch (error) {
      this.showError('Failed to load conversations');
    }
  }

  /**
   * Render chat room list
   */
  renderChatList(chatRooms) {
    const chatList = document.getElementById('chatList');
    
    if (chatRooms.length === 0) {
      chatList.innerHTML = `
        <div class="chat-list-empty">
          <div class="empty-icon">💬</div>
          <p>No conversations yet</p>
          <span>Start a conversation from an offer or deal</span>
        </div>
      `;
      return;
    }

    chatList.innerHTML = chatRooms.map(room => {
      const otherUser = room.otherUser || {};
      const unreadClass = room.unreadCount > 0 ? 'has-unread' : '';
      const lastMessageTime = room.lastMessageTime ? 
        this.formatMessageTime(new Date(room.lastMessageTime)) : '';
      
      return `
        <div class="chat-room-item ${unreadClass}" onclick="chatBubble.openChatRoom('${room._id}')">
          <div class="chat-avatar">
            ${otherUser.avatar ? 
              `<img src="${otherUser.avatar}" alt="${otherUser.userName}">` :
              `<div class="avatar-placeholder">${(otherUser.userName || 'U')[0]}</div>`
            }
          </div>
          <div class="chat-info">
            <div class="chat-name">${otherUser.userName || 'Unknown User'}</div>
            <div class="chat-preview">${room.lastMessage || 'No messages yet'}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">${lastMessageTime}</div>
            ${room.unreadCount > 0 ? 
              `<div class="chat-unread-count">${room.unreadCount}</div>` : ''
            }
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Open a specific chat room
   */
  async openChatRoom(chatRoomId) {
    try {
      // Close existing SSE connection
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      this.currentChatRoom = chatRoomId;
      this.messages = [];
      
      // Show message area
      document.getElementById('chatList').style.display = 'none';
      document.getElementById('messageArea').style.display = 'flex';
      
      // Update header
      const chatSubtitle = document.getElementById('chatSubtitle');
      chatSubtitle.textContent = 'Loading...';
      
      // Load messages
      await this.loadMessages();
      
      // Mark messages as read
      await this.markMessagesAsRead();
      
      // Setup SSE connection
      this.setupSSEConnection();
      
      // Update header with room info
      this.updateChatHeader();
      
    } catch (error) {
      this.showError('Failed to open conversation');
      this.backToChatList();
    }
  }

  /**
   * Load messages for current chat room
   */
  async loadMessages() {
    try {
      const response = await window.axeesAPI.request(`/chats/${this.currentChatRoom}/messages`);
      
      if (response.success && response.data) {
        this.messages = response.data.reverse(); // Reverse to show oldest first
        this.renderMessages();
        this.scrollToBottom();
      }
    } catch (error) {
      throw new Error('Failed to load messages');
    }
  }

  /**
   * Render messages in the chat window
   */
  renderMessages() {
    const container = document.getElementById('messagesContainer');
    const currentUserId = window.authContext?.user?.id;
    
    if (this.messages.length === 0) {
      container.innerHTML = `
        <div class="messages-empty">
          <p>No messages yet</p>
          <span>Start the conversation!</span>
        </div>
      `;
      return;
    }

    container.innerHTML = this.messages.map(message => {
      const isOwn = message.sender === currentUserId;
      const messageClass = isOwn ? 'message-own' : 'message-other';
      const time = this.formatMessageTime(new Date(message.createdAt));
      
      let content = '';
      
      // Text content
      if (message.message) {
        content += `<div class="message-text">${this.escapeHtml(message.message)}</div>`;
      }
      
      // Attachments
      if (message.attachments && message.attachments.length > 0) {
        content += `
          <div class="message-attachments">
            ${message.attachments.map(att => this.renderAttachment(att)).join('')}
          </div>
        `;
      }
      
      return `
        <div class="message ${messageClass}" data-message-id="${message._id}">
          <div class="message-bubble">
            ${content}
            <div class="message-meta">
              <span class="message-time">${time}</span>
              ${isOwn ? this.renderMessageStatus(message) : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render attachment based on type
   */
  renderAttachment(attachment) {
    const isImage = attachment.mimetype?.startsWith('image/');
    
    if (isImage) {
      return `
        <div class="attachment-image" onclick="window.open('${attachment.url}', '_blank')">
          <img src="${attachment.url}" alt="${attachment.originalName}">
        </div>
      `;
    }
    
    return `
      <a href="${attachment.url}" target="_blank" class="attachment-file">
        <div class="file-icon">📎</div>
        <div class="file-info">
          <div class="file-name">${attachment.originalName}</div>
          <div class="file-size">${this.formatFileSize(attachment.size)}</div>
        </div>
      </a>
    `;
  }

  /**
   * Render message status (sent/delivered/read)
   */
  renderMessageStatus(message) {
    if (message.readBy && message.readBy.length > 1) {
      return '<span class="message-status read">✓✓</span>';
    } else if (message.deliveredTo && message.deliveredTo.length > 0) {
      return '<span class="message-status delivered">✓✓</span>';
    } else {
      return '<span class="message-status sent">✓</span>';
    }
  }

  /**
   * Setup Server-Sent Events connection
   */
  setupSSEConnection() {
    const token = localStorage.getItem('token');
    if (!token || !this.currentChatRoom) return;

    const eventSourceUrl = `${window.API_BASE_URL}/chats/${this.currentChatRoom}/stream`;
    
    this.eventSource = new EventSource(eventSourceUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleSSEMessage(data);
    };

    this.eventSource.onerror = (error) => {
      if (this.eventSource.readyState === EventSource.CLOSED) {
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (this.currentChatRoom) {
            this.setupSSEConnection();
          }
        }, 5000);
      }
    };
  }

  /**
   * Handle incoming SSE messages
   */
  handleSSEMessage(data) {
    switch (data.type) {
      case 'message':
        this.handleNewMessage(data.data);
        break;
      case 'typing':
        this.showTypingIndicator(data.data);
        break;
      case 'read':
        this.updateMessageStatus(data.data);
        break;
      case 'delivered':
        this.updateMessageStatus(data.data);
        break;
    }
  }

  /**
   * Handle new incoming message
   */
  handleNewMessage(message) {
    // Don't add if message already exists
    if (this.messages.find(m => m._id === message._id)) return;
    
    this.messages.push(message);
    this.renderMessages();
    this.scrollToBottom();
    
    // Play notification sound if not own message
    const currentUserId = window.authContext?.user?.id;
    if (message.sender !== currentUserId) {
      this.playNotificationSound();
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted' && !document.hasFocus()) {
        new Notification('New Message', {
          body: message.message || 'Sent an attachment',
          icon: '/img/logo.png'
        });
      }
    }
  }

  /**
   * Send a message
   */
  async sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    const attachments = this.getSelectedAttachments();
    
    if (!message && attachments.length === 0) return;
    
    try {
      // Disable send button
      document.getElementById('sendButton').disabled = true;
      
      const formData = new FormData();
      formData.append('message', message);
      
      // Add attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      const response = await fetch(`${window.API_BASE_URL}/chats/${this.currentChatRoom}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Clear input and attachments
        input.value = '';
        this.clearAttachments();
        
        // Add message to list (SSE will also send it back)
        if (!this.messages.find(m => m._id === result.data._id)) {
          this.messages.push(result.data);
          this.renderMessages();
          this.scrollToBottom();
        }
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
      
    } catch (error) {
      this.showError('Failed to send message');
    } finally {
      document.getElementById('sendButton').disabled = false;
    }
  }

  /**
   * Handle typing indicator
   */
  handleTyping() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    if (!this.isTyping) {
      this.isTyping = true;
      this.sendTypingIndicator(true);
    }
    
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.sendTypingIndicator(false);
    }, 2000);
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(isTyping) {
    try {
      await window.axeesAPI.request(`/chats/${this.currentChatRoom}/typing`, {
        method: 'POST',
        body: JSON.stringify({ isTyping })
      });
    } catch (error) {
      // Ignore typing indicator errors
    }
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    const currentUserId = window.authContext?.user?.id;
    
    if (data.userId !== currentUserId && data.isTyping) {
      indicator.style.display = 'flex';
      
      // Hide after 3 seconds
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    } else {
      indicator.style.display = 'none';
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead() {
    try {
      await window.axeesAPI.request(`/chats/${this.currentChatRoom}/read`, {
        method: 'POST'
      });
      
      // Update unread count
      this.updateUnreadCount();
    } catch (error) {
      // Ignore read status errors
    }
  }

  /**
   * Update message status (delivered/read)
   */
  updateMessageStatus(data) {
    const message = this.messages.find(m => m._id === data.messageId);
    if (message) {
      if (data.type === 'read') {
        message.readBy = data.readBy;
      } else if (data.type === 'delivered') {
        message.deliveredTo = data.deliveredTo;
      }
      this.renderMessages();
    }
  }

  /**
   * Handle file selection
   */
  handleFileSelection(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        this.showError(`${file.name} is too large. Max size is 10MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      this.showAttachmentPreviews(validFiles);
    }
    
    // Clear file input
    event.target.value = '';
  }

  /**
   * Show attachment previews
   */
  showAttachmentPreviews(files) {
    const container = document.getElementById('messageAttachments');
    container.style.display = 'block';
    
    container.innerHTML = `
      <div class="attachment-list">
        ${files.map((file, index) => `
          <div class="attachment-preview" data-index="${index}">
            <div class="attachment-icon">
              ${file.type.startsWith('image/') ? '🖼️' : '📎'}
            </div>
            <div class="attachment-name">${file.name}</div>
            <button class="attachment-remove" onclick="chatBubble.removeAttachment(${index})">×</button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Store files for sending
    this.pendingAttachments = files;
  }

  /**
   * Get selected attachments
   */
  getSelectedAttachments() {
    return this.pendingAttachments || [];
  }

  /**
   * Clear attachments
   */
  clearAttachments() {
    this.pendingAttachments = [];
    const container = document.getElementById('messageAttachments');
    container.style.display = 'none';
    container.innerHTML = '';
  }

  /**
   * Toggle chat window
   */
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  /**
   * Open chat window
   */
  openChat() {
    this.isOpen = true;
    document.getElementById('chatWindow').style.display = 'flex';
    document.querySelector('.chat-bubble-button').classList.add('active');
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * Close chat window
   */
  closeChat() {
    this.isOpen = false;
    document.getElementById('chatWindow').style.display = 'none';
    document.querySelector('.chat-bubble-button').classList.remove('active');
  }

  /**
   * Minimize chat window
   */
  minimizeChat() {
    this.closeChat();
  }

  /**
   * Back to chat list
   */
  backToChatList() {
    document.getElementById('messageArea').style.display = 'none';
    document.getElementById('chatList').style.display = 'block';
    document.getElementById('chatSubtitle').textContent = 'Select a conversation';
    
    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.currentChatRoom = null;
    this.loadChatRooms();
  }

  /**
   * Update chat header with current room info
   */
  updateChatHeader() {
    // This would be updated with actual room/user info
    const subtitle = document.getElementById('chatSubtitle');
    subtitle.innerHTML = `
      <button class="back-button" onclick="chatBubble.backToChatList()">←</button>
      <span>Conversation</span>
    `;
  }

  /**
   * Start polling for unread count
   */
  startUnreadCountPolling() {
    this.updateUnreadCount();
    
    // Poll every 30 seconds
    setInterval(() => {
      this.updateUnreadCount();
    }, 30000);
  }

  /**
   * Update unread message count
   */
  async updateUnreadCount() {
    try {
      const response = await window.axeesAPI.request('/chats/unread-count');
      
      if (response.success) {
        this.unreadCount = response.count || 0;
        this.updateUnreadBadge();
      }
    } catch (error) {
      // Ignore unread count errors
    }
  }

  /**
   * Update unread badge display
   */
  updateUnreadBadge() {
    const badge = document.getElementById('chatUnreadBadge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Utility functions
   */
  formatMessageTime(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }

  triggerFileUpload() {
    document.getElementById('chatFileInput').click();
  }

  removeAttachment(index) {
    if (this.pendingAttachments) {
      this.pendingAttachments.splice(index, 1);
      if (this.pendingAttachments.length === 0) {
        this.clearAttachments();
      } else {
        this.showAttachmentPreviews(this.pendingAttachments);
      }
    }
  }

  playNotificationSound() {
    // Could implement notification sound here
  }

  showError(message) {
    // Simple error display - could be enhanced
    alert(message);
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('chat-bubble-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'chat-bubble-styles';
    styles.textContent = `
      #chat-bubble-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .chat-bubble-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .chat-bubble-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }

      .chat-bubble-button.active {
        transform: scale(0.95);
      }

      .chat-unread-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        font-size: 12px;
        font-weight: 600;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
      }

      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: chatSlideIn 0.3s ease-out;
      }

      @keyframes chatSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .chat-header {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chat-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .chat-subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .back-button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        opacity: 0.8;
      }

      .back-button:hover {
        opacity: 1;
      }

      .chat-header-actions {
        display: flex;
        gap: 8px;
      }

      .chat-header-actions button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .chat-header-actions button:hover {
        opacity: 1;
      }

      .chat-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .chat-list {
        width: 100%;
        overflow-y: auto;
        background: #f8f9fa;
      }

      .chat-list-loading,
      .chat-list-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .chat-room-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        transition: background 0.2s;
      }

      .chat-room-item:hover {
        background: #f3f4f6;
      }

      .chat-room-item.has-unread {
        background: #eff6ff;
      }

      .chat-avatar {
        width: 48px;
        height: 48px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .chat-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
      }

      .chat-info {
        flex: 1;
        min-width: 0;
      }

      .chat-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .chat-preview {
        font-size: 14px;
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chat-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .chat-time {
        font-size: 12px;
        color: #9ca3af;
      }

      .chat-unread-count {
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
      }

      .message-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8f9fa;
      }

      .message-loading,
      .messages-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #6b7280;
      }

      .message {
        margin-bottom: 16px;
        display: flex;
      }

      .message-own {
        justify-content: flex-end;
      }

      .message-other {
        justify-content: flex-start;
      }

      .message-bubble {
        max-width: 70%;
        padding: 10px 14px;
        border-radius: 18px;
        position: relative;
      }

      .message-own .message-bubble {
        background: #6366f1;
        color: white;
        border-bottom-right-radius: 4px;
      }

      .message-other .message-bubble {
        background: white;
        color: #111827;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .message-text {
        word-wrap: break-word;
        line-height: 1.4;
      }

      .message-attachments {
        margin-top: 8px;
      }

      .attachment-image {
        cursor: pointer;
        margin-top: 8px;
        border-radius: 8px;
        overflow: hidden;
      }

      .attachment-image img {
        width: 100%;
        max-width: 200px;
        height: auto;
        display: block;
      }

      .attachment-file {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin-top: 8px;
        text-decoration: none;
        color: inherit;
      }

      .message-other .attachment-file {
        background: #f3f4f6;
      }

      .file-icon {
        font-size: 20px;
      }

      .file-info {
        flex: 1;
        min-width: 0;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 12px;
        opacity: 0.8;
      }

      .message-meta {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
        font-size: 11px;
        opacity: 0.7;
      }

      .message-status {
        font-size: 14px;
      }

      .message-status.read {
        color: #10b981;
      }

      .typing-indicator {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        border-top: 1px solid #e5e7eb;
      }

      .typing-dots {
        display: flex;
        gap: 4px;
      }

      .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6b7280;
        animation: typingDot 1.4s infinite;
      }

      .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typingDot {
        0%, 60%, 100% {
          opacity: 0.3;
        }
        30% {
          opacity: 1;
        }
      }

      .typing-text {
        font-size: 13px;
        color: #6b7280;
      }

      .message-input-container {
        background: white;
        border-top: 1px solid #e5e7eb;
        padding: 12px;
      }

      .message-attachments {
        margin-bottom: 8px;
      }

      .attachment-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .attachment-preview {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 13px;
      }

      .attachment-icon {
        font-size: 16px;
      }

      .attachment-name {
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .attachment-remove {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        margin-left: 4px;
      }

      .attachment-remove:hover {
        color: #ef4444;
      }

      .message-form {
        display: flex;
      }

      .message-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        background: #f3f4f6;
        border-radius: 24px;
        padding: 4px;
      }

      .attach-button,
      .send-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        transition: color 0.2s;
      }

      .attach-button:hover,
      .send-button:hover {
        color: #6366f1;
      }

      .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .message-input {
        flex: 1;
        background: none;
        border: none;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
      }

      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 8px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 768px) {
        .chat-window {
          width: 100%;
          height: 100%;
          bottom: 0;
          right: 0;
          border-radius: 0;
          max-height: 100vh;
        }

        .chat-bubble-button {
          bottom: 20px;
          right: 20px;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize global chat bubble
window.chatBubble = new ChatBubble();