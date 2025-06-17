/**
 * Contextual Communication - Smart notifications and AI-powered suggestions
 * Provides ghost account alerts, documentation reminders, deadline warnings, and AI suggestions
 */

class ContextualCommunication {
  constructor() {
    this.activeContext = null;
    this.contextData = {};
    this.reminders = [];
    this.suggestions = [];
    this.ghostAccountStatus = null;
    
    this.initialize();
  }

  /**
   * Initialize contextual communication system
   */
  initialize() {
    this.createContextualUI();
    this.bindEvents();
    this.startContextMonitoring();
    this.checkGhostAccountStatus();
  }

  /**
   * Create contextual UI components
   */
  createContextualUI() {
    // Create contextual widget container
    const widget = document.createElement('div');
    widget.id = 'contextual-widget';
    widget.className = 'contextual-widget';
    widget.style.display = 'none';
    widget.innerHTML = `
      <div class="widget-header">
        <div class="widget-icon">💡</div>
        <div class="widget-title">Smart Assistant</div>
        <button class="widget-close" onclick="contextualCommunication.hideWidget()">×</button>
      </div>
      
      <div class="widget-body">
        <!-- Ghost Account Alert -->
        <div class="ghost-account-alert" id="ghostAccountAlert" style="display: none;">
          <div class="alert-icon">👻</div>
          <div class="alert-content">
            <div class="alert-title">Complete Your Profile</div>
            <div class="alert-message">You're using a ghost account. Complete your profile to unlock all features!</div>
            <button class="alert-action" onclick="contextualCommunication.completeProfile()">Complete Now</button>
          </div>
        </div>
        
        <!-- Reminders Section -->
        <div class="reminders-section" id="remindersSection" style="display: none;">
          <h4 class="section-title">📅 Reminders</h4>
          <div class="reminders-list" id="remindersList"></div>
        </div>
        
        <!-- Suggestions Section -->
        <div class="suggestions-section" id="suggestionsSection" style="display: none;">
          <h4 class="section-title">✨ AI Suggestions</h4>
          <div class="suggestions-list" id="suggestionsList"></div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions" id="quickActions" style="display: none;">
          <h4 class="section-title">⚡ Quick Actions</h4>
          <div class="actions-grid" id="actionsGrid"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Create floating smart button
    const smartButton = document.createElement('button');
    smartButton.id = 'smart-assistant-button';
    smartButton.className = 'smart-assistant-button';
    smartButton.onclick = () => this.toggleWidget();
    smartButton.innerHTML = `
      <div class="smart-icon">💡</div>
      <div class="smart-badge" id="smartBadge" style="display: none;">!</div>
    `;
    
    document.body.appendChild(smartButton);
    
    this.injectStyles();
  }

  /**
   * Start monitoring context changes
   */
  startContextMonitoring() {
    // Monitor page changes
    this.detectPageContext();
    
    // Monitor user activity
    this.monitorUserActivity();
    
    // Check for deadlines
    this.checkDeadlines();
    
    // Refresh suggestions periodically
    setInterval(() => {
      this.refreshContextualSuggestions();
    }, 60000); // Every minute
  }

  /**
   * Detect current page context
   */
  detectPageContext() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    // Detect context based on URL
    if (path.includes('/offers')) {
      this.activeContext = 'offer';
      this.contextData.offerId = params.get('id') || path.split('/').pop();
    } else if (path.includes('/deals')) {
      this.activeContext = 'deal';
      this.contextData.dealId = params.get('id') || path.split('/').pop();
    } else if (path.includes('/dashboard')) {
      this.activeContext = 'dashboard';
    } else if (path.includes('/marketplace')) {
      this.activeContext = 'marketplace';
    } else if (path.includes('/profile')) {
      this.activeContext = 'profile';
    }
    
    // Load context-specific suggestions
    this.loadContextualSuggestions();
  }

  /**
   * Monitor user activity for smart suggestions
   */
  monitorUserActivity() {
    let inactivityTimer;
    let lastActivity = Date.now();
    
    const resetTimer = () => {
      lastActivity = Date.now();
      clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        const inactiveMinutes = Math.floor((Date.now() - lastActivity) / 60000);
        if (inactiveMinutes > 5) {
          this.showInactivitySuggestion();
        }
      }, 300000); // 5 minutes
    };
    
    // Track user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    resetTimer();
  }

  /**
   * Check for upcoming deadlines
   */
  async checkDeadlines() {
    try {
      // Check milestone deadlines
      const milestones = await this.fetchUpcomingMilestones();
      
      milestones.forEach(milestone => {
        const deadline = new Date(milestone.deadline);
        const now = new Date();
        const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
        
        if (hoursUntilDeadline < 24 && hoursUntilDeadline > 0) {
          this.addReminder({
            type: 'deadline',
            title: 'Milestone Deadline Approaching',
            message: `"${milestone.title}" is due in ${Math.round(hoursUntilDeadline)} hours`,
            priority: 'high',
            action: () => this.navigateToMilestone(milestone.dealId, milestone._id)
          });
        }
      });
      
      // Check payment schedules
      const payments = await this.fetchUpcomingPayments();
      
      payments.forEach(payment => {
        const paymentDate = new Date(payment.scheduledDate);
        const now = new Date();
        const daysUntilPayment = (paymentDate - now) / (1000 * 60 * 60 * 24);
        
        if (daysUntilPayment < 3 && daysUntilPayment > 0) {
          this.addReminder({
            type: 'payment',
            title: 'Upcoming Payment',
            message: `Payment of $${payment.amount} scheduled in ${Math.round(daysUntilPayment)} days`,
            priority: 'medium'
          });
        }
      });
      
    } catch (error) {
      // Silently handle errors
    }
  }

  /**
   * Check ghost account status
   */
  async checkGhostAccountStatus() {
    try {
      const user = window.authContext?.user;
      if (!user) return;
      
      // Check if user has incomplete profile
      const profileResponse = await window.axeesAPI.request('/profile-completion/status');
      
      if (profileResponse.success) {
        const completion = profileResponse.data.completionPercentage || 0;
        
        if (completion < 100) {
          this.ghostAccountStatus = {
            isGhost: true,
            completion: completion,
            missingFields: profileResponse.data.missingFields || []
          };
          
          this.showGhostAccountAlert();
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  }

  /**
   * Load contextual suggestions based on current context
   */
  async loadContextualSuggestions() {
    try {
      const response = await window.axeesAPI.request('/contextual/suggestions', {
        method: 'POST',
        body: JSON.stringify({
          context: this.activeContext,
          contextData: this.contextData
        })
      });
      
      if (response.success && response.suggestions) {
        this.suggestions = response.suggestions;
        this.renderSuggestions();
        
        // Show badge if there are important suggestions
        const hasImportant = this.suggestions.some(s => s.priority === 'high');
        this.updateSmartBadge(hasImportant);
      }
    } catch (error) {
      // Use fallback suggestions
      this.loadFallbackSuggestions();
    }
  }

  /**
   * Load fallback suggestions when API is unavailable
   */
  loadFallbackSuggestions() {
    const fallbackSuggestions = {
      offer: [
        {
          type: 'tip',
          title: 'Optimize Your Offer',
          message: 'Add more details about deliverables to increase acceptance rate',
          action: 'Edit Offer'
        },
        {
          type: 'insight',
          title: 'Similar Offers',
          message: 'Check out similar successful offers in your category',
          action: 'View Examples'
        }
      ],
      deal: [
        {
          type: 'reminder',
          title: 'Update Progress',
          message: 'Keep your client updated on milestone progress',
          action: 'Send Update'
        },
        {
          type: 'tip',
          title: 'Submit Proof Early',
          message: 'Submit proof of work 24 hours before deadline for faster approval',
          action: 'Submit Proof'
        }
      ],
      dashboard: [
        {
          type: 'insight',
          title: 'Performance Tip',
          message: 'Your response rate is below average. Try responding within 2 hours',
          action: 'View Stats'
        },
        {
          type: 'opportunity',
          title: 'New Opportunities',
          message: '5 new deals match your expertise',
          action: 'View Deals'
        }
      ],
      marketplace: [
        {
          type: 'tip',
          title: 'Search Tip',
          message: 'Use filters to find deals that match your skills',
          action: 'Show Filters'
        },
        {
          type: 'insight',
          title: 'Trending Categories',
          message: 'Social media marketing deals are trending this week',
          action: 'View Trending'
        }
      ],
      profile: [
        {
          type: 'reminder',
          title: 'Complete Your Profile',
          message: 'Add portfolio samples to increase visibility by 40%',
          action: 'Add Portfolio'
        },
        {
          type: 'tip',
          title: 'Verification Boost',
          message: 'Verify your email for a trust badge',
          action: 'Verify Email'
        }
      ]
    };
    
    this.suggestions = fallbackSuggestions[this.activeContext] || [];
    this.renderSuggestions();
  }

  /**
   * Show ghost account alert
   */
  showGhostAccountAlert() {
    const alert = document.getElementById('ghostAccountAlert');
    if (alert && this.ghostAccountStatus?.isGhost) {
      alert.style.display = 'flex';
      this.showWidget();
      this.updateSmartBadge(true);
    }
  }

  /**
   * Add a reminder
   */
  addReminder(reminder) {
    // Avoid duplicates
    const exists = this.reminders.find(r => 
      r.type === reminder.type && r.message === reminder.message
    );
    
    if (!exists) {
      this.reminders.push({
        id: Date.now().toString(),
        timestamp: new Date(),
        ...reminder
      });
      
      this.renderReminders();
      this.showNotification(reminder);
      
      if (reminder.priority === 'high') {
        this.showWidget();
      }
    }
  }

  /**
   * Render reminders
   */
  renderReminders() {
    const section = document.getElementById('remindersSection');
    const list = document.getElementById('remindersList');
    
    if (this.reminders.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    list.innerHTML = this.reminders.map(reminder => `
      <div class="reminder-item ${reminder.priority}" data-reminder-id="${reminder.id}">
        <div class="reminder-icon">${this.getReminderIcon(reminder.type)}</div>
        <div class="reminder-content">
          <div class="reminder-title">${reminder.title}</div>
          <div class="reminder-message">${reminder.message}</div>
          ${reminder.action ? `
            <button class="reminder-action" onclick="contextualCommunication.handleReminderAction('${reminder.id}')">
              Take Action
            </button>
          ` : ''}
        </div>
        <button class="reminder-dismiss" onclick="contextualCommunication.dismissReminder('${reminder.id}')">×</button>
      </div>
    `).join('');
  }

  /**
   * Render suggestions
   */
  renderSuggestions() {
    const section = document.getElementById('suggestionsSection');
    const list = document.getElementById('suggestionsList');
    
    if (this.suggestions.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    list.innerHTML = this.suggestions.map((suggestion, index) => `
      <div class="suggestion-item ${suggestion.type}">
        <div class="suggestion-icon">${this.getSuggestionIcon(suggestion.type)}</div>
        <div class="suggestion-content">
          <div class="suggestion-title">${suggestion.title}</div>
          <div class="suggestion-message">${suggestion.message}</div>
          ${suggestion.action ? `
            <button class="suggestion-action" onclick="contextualCommunication.handleSuggestionAction(${index})">
              ${suggestion.action}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Get reminder icon
   */
  getReminderIcon(type) {
    const icons = {
      deadline: '⏰',
      payment: '💰',
      document: '📄',
      message: '💬',
      alert: '⚠️'
    };
    return icons[type] || '📌';
  }

  /**
   * Get suggestion icon
   */
  getSuggestionIcon(type) {
    const icons = {
      tip: '💡',
      insight: '📊',
      reminder: '🔔',
      opportunity: '🎯',
      warning: '⚠️'
    };
    return icons[type] || '✨';
  }

  /**
   * Handle reminder action
   */
  handleReminderAction(reminderId) {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder && reminder.action) {
      reminder.action();
      this.dismissReminder(reminderId);
    }
  }

  /**
   * Handle suggestion action
   */
  handleSuggestionAction(index) {
    const suggestion = this.suggestions[index];
    if (!suggestion) return;
    
    // Handle different action types
    switch (suggestion.action) {
      case 'Edit Offer':
        window.location.href = `/offers/edit/${this.contextData.offerId}`;
        break;
      case 'View Examples':
        window.location.href = '/marketplace?filter=examples';
        break;
      case 'Send Update':
        if (window.chatBubble) {
          window.chatBubble.openChat();
        }
        break;
      case 'Submit Proof':
        if (window.submitProofForMilestone) {
          window.submitProofForMilestone(this.contextData.dealId, suggestion.milestoneId);
        }
        break;
      case 'View Stats':
        window.location.href = '/dashboard#stats';
        break;
      case 'View Deals':
        window.location.href = '/marketplace';
        break;
      case 'Add Portfolio':
        window.location.href = '/profile#portfolio';
        break;
      case 'Verify Email':
        window.location.href = '/profile#verification';
        break;
      default:
        // Custom action handler
        if (suggestion.actionHandler) {
          suggestion.actionHandler();
        }
    }
  }

  /**
   * Dismiss reminder
   */
  dismissReminder(reminderId) {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    this.renderReminders();
    
    // Hide widget if no more content
    if (this.reminders.length === 0 && this.suggestions.length === 0) {
      this.hideWidget();
    }
  }

  /**
   * Show inactivity suggestion
   */
  showInactivitySuggestion() {
    this.addReminder({
      type: 'alert',
      title: 'Still there?',
      message: 'You\'ve been inactive for a while. Don\'t forget to save your work!',
      priority: 'medium'
    });
  }

  /**
   * Show notification
   */
  showNotification(reminder) {
    // Use the notification system if available
    if (window.notificationSystem) {
      const notification = {
        _id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        message: reminder.message,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      document.dispatchEvent(new CustomEvent('app:notification', {
        detail: notification
      }));
    }
  }

  /**
   * Complete profile action
   */
  completeProfile() {
    if (window.profileCompletionWizard) {
      window.profileCompletionWizard.open();
    } else {
      window.location.href = '/profile';
    }
    this.hideWidget();
  }

  /**
   * Navigate to milestone
   */
  navigateToMilestone(dealId, milestoneId) {
    window.location.href = `/deals/${dealId}#milestone-${milestoneId}`;
  }

  /**
   * Fetch upcoming milestones
   */
  async fetchUpcomingMilestones() {
    try {
      const response = await window.axeesAPI.request('/contextual/milestones/upcoming');
      return response.success ? response.data : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch upcoming payments
   */
  async fetchUpcomingPayments() {
    try {
      const response = await window.axeesAPI.request('/contextual/payments/upcoming');
      return response.success ? response.data : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Toggle widget visibility
   */
  toggleWidget() {
    const widget = document.getElementById('contextual-widget');
    if (widget.style.display === 'none') {
      this.showWidget();
    } else {
      this.hideWidget();
    }
  }

  /**
   * Show widget
   */
  showWidget() {
    const widget = document.getElementById('contextual-widget');
    widget.style.display = 'block';
    widget.classList.add('show');
    this.updateSmartBadge(false);
  }

  /**
   * Hide widget
   */
  hideWidget() {
    const widget = document.getElementById('contextual-widget');
    widget.classList.remove('show');
    setTimeout(() => {
      widget.style.display = 'none';
    }, 300);
  }

  /**
   * Update smart badge
   */
  updateSmartBadge(show) {
    const badge = document.getElementById('smartBadge');
    badge.style.display = show ? 'block' : 'none';
  }

  /**
   * Refresh contextual suggestions
   */
  refreshContextualSuggestions() {
    this.detectPageContext();
    this.checkDeadlines();
    this.loadContextualSuggestions();
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Listen for context changes
    window.addEventListener('popstate', () => {
      this.detectPageContext();
    });
    
    // Listen for custom events
    document.addEventListener('milestone:updated', () => {
      this.checkDeadlines();
    });
    
    document.addEventListener('profile:updated', () => {
      this.checkGhostAccountStatus();
    });
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('contextual-communication-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'contextual-communication-styles';
    styles.textContent = `
      .smart-assistant-button {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #f97316);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 999;
      }

      .smart-assistant-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
      }

      .smart-icon {
        font-size: 24px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .smart-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 20px;
        height: 20px;
        background: #ef4444;
        border-radius: 50%;
        color: white;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounce 0.6s ease-in-out infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      .contextual-widget {
        position: fixed;
        bottom: 170px;
        right: 20px;
        width: 360px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 998;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s ease;
      }

      .contextual-widget.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .widget-header {
        background: linear-gradient(135deg, #f59e0b, #f97316);
        color: white;
        padding: 16px;
        border-radius: 16px 16px 0 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .widget-icon {
        font-size: 24px;
      }

      .widget-title {
        flex: 1;
        font-size: 18px;
        font-weight: 600;
      }

      .widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        opacity: 0.8;
      }

      .widget-close:hover {
        opacity: 1;
      }

      .widget-body {
        max-height: 500px;
        overflow-y: auto;
      }

      .ghost-account-alert {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 12px;
        padding: 16px;
        margin: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .alert-icon {
        font-size: 32px;
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;
      }

      .alert-title {
        font-weight: 600;
        color: #92400e;
        margin-bottom: 4px;
      }

      .alert-message {
        font-size: 14px;
        color: #78350f;
        margin-bottom: 12px;
      }

      .alert-action {
        background: #f59e0b;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }

      .alert-action:hover {
        background: #d97706;
      }

      .reminders-section,
      .suggestions-section,
      .quick-actions {
        padding: 16px;
        border-bottom: 1px solid #f3f4f6;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .reminder-item,
      .suggestion-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
        position: relative;
      }

      .reminder-item.high {
        background: #fee2e2;
        border: 1px solid #fecaca;
      }

      .reminder-item.medium {
        background: #fef3c7;
        border: 1px solid #fde68a;
      }

      .reminder-icon,
      .suggestion-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .reminder-content,
      .suggestion-content {
        flex: 1;
      }

      .reminder-title,
      .suggestion-title {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .reminder-message,
      .suggestion-message {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .reminder-action,
      .suggestion-action {
        background: #6366f1;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }

      .reminder-action:hover,
      .suggestion-action:hover {
        background: #4f46e5;
      }

      .reminder-dismiss {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
      }

      .reminder-dismiss:hover {
        color: #111827;
      }

      .suggestion-item.tip { background: #eff6ff; }
      .suggestion-item.insight { background: #f0fdf4; }
      .suggestion-item.opportunity { background: #fefce8; }
      .suggestion-item.warning { background: #fef2f2; }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .quick-action-btn {
        padding: 12px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .quick-action-btn:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      @media (max-width: 768px) {
        .contextual-widget {
          width: calc(100vw - 32px);
          right: 16px;
          bottom: 80px;
        }

        .smart-assistant-button {
          bottom: 20px;
          right: 16px;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize global contextual communication
window.contextualCommunication = new ContextualCommunication();