/**
 * Notification System - Real-time notifications with SSE
 * Handles browser notifications, in-app alerts, and notification preferences
 */

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.eventSource = null;
    this.isDropdownOpen = false;
    this.preferences = {
      sound: true,
      desktop: true,
      email: true,
      push: true
    };
    
    this.initialize();
  }

  /**
   * Initialize the notification system
   */
  initialize() {
    this.loadPreferences();
    this.createNotificationUI();
    this.bindEvents();
    this.requestPermission();
    this.connectToNotificationStream();
    this.loadRecentNotifications();
  }

  /**
   * Create notification UI components
   */
  createNotificationUI() {
    // Create notification bell in header
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    notificationContainer.innerHTML = `
      <button class="notification-bell" onclick="notificationSystem.toggleDropdown()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
      </button>
      
      <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="notification-actions">
            <button class="mark-all-read" onclick="notificationSystem.markAllAsRead()">
              Mark all as read
            </button>
            <button class="notification-settings" onclick="notificationSystem.openSettings()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z"/>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 002.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 001.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 00-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 00-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 00-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 001.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 003.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 002.692-1.115l.094-.319z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="notification-list" id="notificationList">
          <div class="notification-loading">
            <div class="loading-spinner"></div>
            <span>Loading notifications...</span>
          </div>
        </div>
        
        <div class="notification-footer">
          <a href="/notifications" class="view-all-link">View all notifications</a>
        </div>
      </div>
    `;

    // Find a suitable place to inject the notification container
    const header = document.querySelector('header') || document.querySelector('.header');
    const nav = document.querySelector('nav') || document.querySelector('.navigation');
    const targetElement = header || nav || document.body;
    
    // If there's a user menu or profile section, insert before it
    const userMenu = targetElement.querySelector('.user-menu, .profile-menu, [class*="user"], [class*="profile"]');
    if (userMenu) {
      userMenu.parentNode.insertBefore(notificationContainer, userMenu);
    } else {
      // Otherwise append to target element
      targetElement.appendChild(notificationContainer);
    }

    // Create settings modal
    this.createSettingsModal();
    
    // Inject styles
    this.injectStyles();
  }

  /**
   * Create notification settings modal
   */
  createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'notification-settings-modal';
    modal.className = 'notification-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="notificationSystem.closeSettings()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Notification Settings</h3>
          <button class="modal-close" onclick="notificationSystem.closeSettings()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="settings-section">
            <h4>Notification Types</h4>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Desktop Notifications</div>
                <div class="setting-description">Show notifications on your desktop</div>
              </div>
              <input type="checkbox" id="desktopNotifications" 
                     ${this.preferences.desktop ? 'checked' : ''} 
                     onchange="notificationSystem.updatePreference('desktop', this.checked)">
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Sound Notifications</div>
                <div class="setting-description">Play a sound when you receive notifications</div>
              </div>
              <input type="checkbox" id="soundNotifications" 
                     ${this.preferences.sound ? 'checked' : ''} 
                     onchange="notificationSystem.updatePreference('sound', this.checked)">
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Email Notifications</div>
                <div class="setting-description">Receive notifications via email</div>
              </div>
              <input type="checkbox" id="emailNotifications" 
                     ${this.preferences.email ? 'checked' : ''} 
                     onchange="notificationSystem.updatePreference('email', this.checked)">
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Push Notifications</div>
                <div class="setting-description">Receive push notifications on mobile</div>
              </div>
              <input type="checkbox" id="pushNotifications" 
                     ${this.preferences.push ? 'checked' : ''} 
                     onchange="notificationSystem.updatePreference('push', this.checked)">
            </label>
          </div>
          
          <div class="settings-section">
            <h4>Notification Categories</h4>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Messages</div>
                <div class="setting-description">New messages and chat activity</div>
              </div>
              <input type="checkbox" checked>
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Offers & Deals</div>
                <div class="setting-description">Updates on offers and deal status</div>
              </div>
              <input type="checkbox" checked>
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Payments</div>
                <div class="setting-description">Payment confirmations and releases</div>
              </div>
              <input type="checkbox" checked>
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">Milestones</div>
                <div class="setting-description">Milestone submissions and approvals</div>
              </div>
              <input type="checkbox" checked>
            </label>
            
            <label class="setting-item">
              <div class="setting-info">
                <div class="setting-title">System Updates</div>
                <div class="setting-description">Important system announcements</div>
              </div>
              <input type="checkbox" checked>
            </label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="notificationSystem.closeSettings()">Cancel</button>
          <button class="btn btn-primary" onclick="notificationSystem.saveSettings()">Save Settings</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Connect to notification stream using SSE
   */
  connectToNotificationStream() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSourceUrl = `${window.API_BASE_URL}/notifications/stream`;
    
    this.eventSource = new EventSource(eventSourceUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    this.eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.handleNewNotification(notification);
    };

    this.eventSource.onerror = (error) => {
      if (this.eventSource.readyState === EventSource.CLOSED) {
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.connectToNotificationStream();
        }, 5000);
      }
    };

    // Handle specific event types
    this.eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      this.handleNotificationEvent('message', data);
    });

    this.eventSource.addEventListener('offer', (event) => {
      const data = JSON.parse(event.data);
      this.handleNotificationEvent('offer', data);
    });

    this.eventSource.addEventListener('payment', (event) => {
      const data = JSON.parse(event.data);
      this.handleNotificationEvent('payment', data);
    });

    this.eventSource.addEventListener('milestone', (event) => {
      const data = JSON.parse(event.data);
      this.handleNotificationEvent('milestone', data);
    });
  }

  /**
   * Handle different notification event types
   */
  handleNotificationEvent(type, data) {
    // Create notification object
    const notification = {
      _id: data._id || Date.now().toString(),
      type: type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    this.handleNewNotification(notification);
  }

  /**
   * Handle new incoming notification
   */
  handleNewNotification(notification) {
    // Add to notifications array
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
      this.updateBadge();
    }

    // Show desktop notification
    if (this.preferences.desktop && Notification.permission === 'granted') {
      this.showDesktopNotification(notification);
    }

    // Play sound
    if (this.preferences.sound) {
      this.playNotificationSound();
    }

    // Update dropdown if open
    if (this.isDropdownOpen) {
      this.renderNotifications();
    }

    // Show in-app toast notification
    this.showToastNotification(notification);
  }

  /**
   * Load recent notifications
   */
  async loadRecentNotifications() {
    try {
      const response = await window.axeesAPI.request('/notifications?limit=20');
      
      if (response.success && response.data) {
        this.notifications = response.data;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
        
        if (this.isDropdownOpen) {
          this.renderNotifications();
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }

  /**
   * Render notifications in dropdown
   */
  renderNotifications() {
    const listElement = document.getElementById('notificationList');
    
    if (this.notifications.length === 0) {
      listElement.innerHTML = `
        <div class="notification-empty">
          <div class="empty-icon">🔔</div>
          <p>No notifications yet</p>
          <span>We'll notify you when something important happens</span>
        </div>
      `;
      return;
    }

    listElement.innerHTML = this.notifications.slice(0, 10).map(notification => {
      const icon = this.getNotificationIcon(notification.type);
      const timeAgo = this.formatTimeAgo(new Date(notification.createdAt));
      const unreadClass = notification.read ? '' : 'unread';
      
      return `
        <div class="notification-item ${unreadClass}" 
             onclick="notificationSystem.handleNotificationClick('${notification._id}')"
             data-notification-id="${notification._id}">
          <div class="notification-icon ${notification.type}">${icon}</div>
          <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
          ${!notification.read ? '<div class="notification-dot"></div>' : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    const icons = {
      message: '💬',
      offer: '📄',
      payment: '💳',
      milestone: '🎯',
      system: '📢',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || '🔔';
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(notificationId) {
    const notification = this.notifications.find(n => n._id === notificationId);
    if (!notification) return;

    // Mark as read
    if (!notification.read) {
      await this.markAsRead(notificationId);
    }

    // Navigate based on notification type and data
    if (notification.data) {
      if (notification.data.chatRoomId) {
        // Open chat
        if (window.chatBubble) {
          window.chatBubble.openChat();
          window.chatBubble.openChatRoom(notification.data.chatRoomId);
        }
      } else if (notification.data.offerId) {
        // Navigate to offer
        window.location.href = `/offers/${notification.data.offerId}`;
      } else if (notification.data.dealId) {
        // Navigate to deal
        window.location.href = `/deals/${notification.data.dealId}`;
      }
    }

    // Close dropdown
    this.closeDropdown();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await window.axeesAPI.request(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      // Update local state
      const notification = this.notifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
        
        // Update UI
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
          element.classList.remove('unread');
          const dot = element.querySelector('.notification-dot');
          if (dot) dot.remove();
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await window.axeesAPI.request('/notifications/read-all', {
        method: 'PUT'
      });

      // Update local state
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      this.updateBadge();
      this.renderNotifications();
    } catch (error) {
      this.showError('Failed to mark notifications as read');
    }
  }

  /**
   * Show desktop notification
   */
  showDesktopNotification(notification) {
    if (!document.hasFocus()) {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/img/logo.png',
        tag: notification._id,
        requireInteraction: false
      });

      desktopNotification.onclick = () => {
        window.focus();
        this.handleNotificationClick(notification._id);
      };
    }
  }

  /**
   * Show toast notification
   */
  showToastNotification(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
        <div class="toast-text">
          <div class="toast-title">${notification.title}</div>
          <div class="toast-message">${notification.message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Click to view
    toast.addEventListener('click', (e) => {
      if (!e.target.classList.contains('toast-close')) {
        this.handleNotificationClick(notification._id);
        toast.remove();
      }
    });
  }

  /**
   * Toggle notification dropdown
   */
  toggleDropdown() {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open notification dropdown
   */
  openDropdown() {
    this.isDropdownOpen = true;
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = 'block';
    
    // Load/refresh notifications
    this.renderNotifications();
    
    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 100);
  }

  /**
   * Close notification dropdown
   */
  closeDropdown() {
    this.isDropdownOpen = false;
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = 'none';
    
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  }

  /**
   * Handle click outside dropdown
   */
  handleClickOutside = (event) => {
    const container = document.getElementById('notification-container');
    if (!container.contains(event.target)) {
      this.closeDropdown();
    }
  }

  /**
   * Update notification badge
   */
  updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.preferences.desktop = permission === 'granted';
      this.savePreferences();
    }
  }

  /**
   * Open settings modal
   */
  openSettings() {
    document.getElementById('notification-settings-modal').style.display = 'flex';
    this.closeDropdown();
  }

  /**
   * Close settings modal
   */
  closeSettings() {
    document.getElementById('notification-settings-modal').style.display = 'none';
  }

  /**
   * Update preference
   */
  updatePreference(key, value) {
    this.preferences[key] = value;
    
    // Special handling for desktop notifications
    if (key === 'desktop' && value && Notification.permission === 'default') {
      this.requestPermission();
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      // Save preferences locally
      this.savePreferences();
      
      // Save to server
      await window.axeesAPI.request('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(this.preferences)
      });
      
      this.closeSettings();
      this.showSuccess('Notification settings saved');
    } catch (error) {
      this.showError('Failed to save settings');
    }
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      this.preferences = { ...this.preferences, ...JSON.parse(saved) };
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    // Create and play a simple notification sound
    const audio = new Audio('data:audio/wav;base64,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');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors if audio playback fails
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast error';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">❌</div>
        <div class="toast-text">
          <div class="toast-message">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast success';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">✅</div>
        <div class="toast-text">
          <div class="toast-message">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Bind global events
   */
  bindEvents() {
    // Listen for custom notification events
    document.addEventListener('app:notification', (event) => {
      this.handleNewNotification(event.detail);
    });

    // Listen for visibility change to update badge
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.loadRecentNotifications();
      }
    });
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('notification-system-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-system-styles';
    styles.textContent = `
      .notification-container {
        position: relative;
        display: inline-block;
      }

      .notification-bell {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: #6b7280;
        transition: color 0.2s;
      }

      .notification-bell:hover {
        color: #111827;
      }

      .notification-badge {
        position: absolute;
        top: 0;
        right: 0;
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

      .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        width: 380px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        animation: dropdownSlideIn 0.3s ease-out;
      }

      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .notification-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .notification-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .notification-actions {
        display: flex;
        gap: 8px;
      }

      .mark-all-read {
        background: none;
        border: none;
        color: #6366f1;
        font-size: 14px;
        cursor: pointer;
        font-weight: 500;
      }

      .mark-all-read:hover {
        text-decoration: underline;
      }

      .notification-settings {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #6b7280;
      }

      .notification-settings:hover {
        color: #111827;
      }

      .notification-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .notification-loading,
      .notification-empty {
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

      .notification-item {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: #f9fafb;
      }

      .notification-item.unread {
        background: #eff6ff;
      }

      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .notification-icon.message { background: #dbeafe; }
      .notification-icon.offer { background: #fef3c7; }
      .notification-icon.payment { background: #d1fae5; }
      .notification-icon.milestone { background: #e0e7ff; }
      .notification-icon.system { background: #f3f4f6; }
      .notification-icon.warning { background: #fed7aa; }
      .notification-icon.success { background: #d1fae5; }
      .notification-icon.error { background: #fee2e2; }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-title {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .notification-message {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .notification-time {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 4px;
      }

      .notification-dot {
        position: absolute;
        top: 50%;
        right: 16px;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
      }

      .notification-footer {
        padding: 12px 16px;
        background: #f9fafb;
        text-align: center;
      }

      .view-all-link {
        color: #6366f1;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }

      .view-all-link:hover {
        text-decoration: underline;
      }

      /* Settings Modal */
      .notification-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .modal-content {
        position: relative;
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .settings-section {
        margin-bottom: 24px;
      }

      .settings-section h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        cursor: pointer;
      }

      .setting-info {
        flex: 1;
      }

      .setting-title {
        font-weight: 500;
        color: #111827;
        margin-bottom: 2px;
      }

      .setting-description {
        font-size: 13px;
        color: #6b7280;
      }

      .setting-item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #6366f1;
        color: white;
      }

      .btn-primary:hover {
        background: #4f46e5;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      /* Toast Notifications */
      .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        min-width: 300px;
        max-width: 400px;
        z-index: 3000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease-out;
      }

      .notification-toast.show {
        opacity: 1;
        transform: translateX(0);
      }

      .notification-toast.error {
        border-left: 4px solid #ef4444;
      }

      .notification-toast.success {
        border-left: 4px solid #10b981;
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .toast-text {
        flex: 1;
      }

      .toast-title {
        font-weight: 600;
        color: #111827;
        margin-bottom: 2px;
      }

      .toast-message {
        font-size: 14px;
        color: #6b7280;
      }

      .toast-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        margin-left: 8px;
      }

      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 8px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 768px) {
        .notification-dropdown {
          width: calc(100vw - 32px);
          right: -8px;
        }

        .notification-toast {
          left: 16px;
          right: 16px;
          min-width: auto;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize global notification system
window.notificationSystem = new NotificationSystem();