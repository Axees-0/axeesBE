/**
 * Profile Completion Widget
 * Displays completion status and progress throughout the UI
 */

class ProfileCompletionWidget {
  constructor() {
    this.completionData = null;
    this.user = null;
    this.refreshInterval = null;
  }

  /**
   * Initialize widget with user data
   */
  async initialize(userId = null) {
    this.user = window.authContext?.user;
    if (!this.user && !userId) {
      console.warn('No user data available for profile completion widget');
      return;
    }

    try {
      await this.loadCompletionData(userId || this.user.id);
      this.injectStyles();
      
      // Auto-refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        this.refresh();
      }, 30000);
      
    } catch (error) {
      console.error('Failed to initialize profile completion widget:', error);
    }
  }

  /**
   * Load completion data from API
   */
  async loadCompletionData(userId) {
    try {
      const response = await window.axeesAPI.request(`/profile-completion/${userId}`);
      if (response.success) {
        this.completionData = response.data;
        this.updateAllWidgets();
      }
    } catch (error) {
      console.error('Failed to load completion data:', error);
    }
  }

  /**
   * Inject widget styles
   */
  injectStyles() {
    if (document.getElementById('profile-completion-widget-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'profile-completion-widget-styles';
    styles.textContent = `
      /* Profile Completion Widget Styles */
      .profile-completion-widget {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        margin-bottom: 24px;
        transition: all 0.3s ease;
      }

      .profile-completion-widget:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      }

      .profile-completion-widget::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        transform: translate(30px, -30px);
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        position: relative;
        z-index: 2;
      }

      .widget-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .widget-percentage {
        font-size: 24px;
        font-weight: 700;
        color: #fff;
      }

      .widget-progress {
        position: relative;
        z-index: 2;
        margin-bottom: 16px;
      }

      .widget-progress-bar {
        background: rgba(255, 255, 255, 0.2);
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .widget-progress-fill {
        background: #fff;
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      }

      .widget-status-text {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 16px;
      }

      .widget-actions {
        display: flex;
        gap: 12px;
        position: relative;
        z-index: 2;
      }

      .widget-btn {
        padding: 8px 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .widget-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-1px);
      }

      .widget-btn.primary {
        background: #fff;
        color: #667eea;
        border-color: #fff;
      }

      .widget-btn.primary:hover {
        background: #f8fafc;
        transform: translateY(-1px);
      }

      /* Mini Widget for Navigation */
      .profile-completion-mini {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 20px;
        font-size: 12px;
        color: #6366f1;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid rgba(99, 102, 241, 0.2);
      }

      .profile-completion-mini:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
      }

      .mini-progress-circle {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: conic-gradient(#6366f1 var(--progress, 0%), #e5e7eb var(--progress, 0%));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 600;
        color: #6366f1;
      }

      /* Notification Badge */
      .completion-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        z-index: 10001;
        max-width: 300px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .completion-notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      }

      .completion-notification.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .notification-message {
        font-size: 14px;
        opacity: 0.9;
        line-height: 1.4;
      }

      /* Progress Ring */
      .progress-ring {
        width: 60px;
        height: 60px;
        position: relative;
      }

      .progress-ring svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .progress-ring circle {
        fill: none;
        stroke-width: 4;
      }

      .progress-ring .background {
        stroke: rgba(255, 255, 255, 0.3);
      }

      .progress-ring .progress {
        stroke: #fff;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
      }

      .progress-ring .percentage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        font-weight: 600;
        color: #fff;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .profile-completion-widget {
          padding: 16px;
        }
        
        .widget-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        
        .widget-actions {
          flex-direction: column;
        }
        
        .completion-notification {
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Render main completion widget
   */
  renderWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.completionData) return;

    const percentage = Math.round(this.completionData.completionPercentage || 0);
    const incomplete = this.completionData.incompleteSteps?.length || 0;
    
    container.innerHTML = `
      <div class="profile-completion-widget">
        <div class="widget-header">
          <h3 class="widget-title">Profile Completion</h3>
          <div class="widget-percentage">${percentage}%</div>
        </div>
        
        <div class="widget-progress">
          <div class="widget-progress-bar">
            <div class="widget-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="widget-status-text">
            ${this.getStatusMessage(percentage, incomplete)}
          </div>
        </div>
        
        <div class="widget-actions">
          ${percentage < 100 ? `
            <button class="widget-btn primary" onclick="window.profileWizard.open()">
              Complete Profile
            </button>
          ` : ''}
          <button class="widget-btn" onclick="window.location.href='/profile.html'">
            View Profile
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render mini widget for navigation
   */
  renderMiniWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.completionData) return;

    const percentage = Math.round(this.completionData.completionPercentage || 0);
    
    container.innerHTML = `
      <div class="profile-completion-mini" onclick="window.profileWizard.open()" title="Complete your profile">
        <div class="mini-progress-circle" style="--progress: ${percentage}%">
          ${percentage}%
        </div>
        <span>Profile</span>
      </div>
    `;
  }

  /**
   * Render progress ring
   */
  renderProgressRing(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.completionData) return;

    const percentage = Math.round(this.completionData.completionPercentage || 0);
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    container.innerHTML = `
      <div class="progress-ring">
        <svg>
          <circle class="background" cx="30" cy="30" r="${radius}"></circle>
          <circle class="progress" cx="30" cy="30" r="${radius}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="percentage">${percentage}%</div>
      </div>
    `;
  }

  /**
   * Get status message based on completion
   */
  getStatusMessage(percentage, incomplete) {
    if (percentage >= 100) {
      return 'Congratulations! Your profile is complete.';
    } else if (percentage >= 80) {
      return `Almost there! ${incomplete} items remaining.`;
    } else if (percentage >= 50) {
      return `Good progress! ${incomplete} items to complete.`;
    } else {
      return `Let's get started! ${incomplete} items to complete.`;
    }
  }

  /**
   * Show completion notification
   */
  showNotification(type = 'info', title, message, duration = 5000) {
    // Remove existing notification
    const existing = document.querySelector('.completion-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `completion-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    `;

    notification.onclick = () => {
      if (type === 'warning') {
        window.profileWizard.open();
      }
      notification.remove();
    };

    document.body.appendChild(notification);

    // Auto-remove notification
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  /**
   * Check if user should see completion prompt
   */
  shouldShowPrompt() {
    if (!this.completionData) return false;
    
    const percentage = this.completionData.completionPercentage || 0;
    const lastPrompt = localStorage.getItem('profile_completion_last_prompt');
    const now = Date.now();
    const daysSincePrompt = lastPrompt ? (now - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24) : 999;
    
    // Show prompt if completion < 80% and haven't shown in 3 days
    return percentage < 80 && daysSincePrompt >= 3;
  }

  /**
   * Show completion prompt if needed
   */
  showCompletionPrompt() {
    if (!this.shouldShowPrompt()) return;
    
    const percentage = Math.round(this.completionData.completionPercentage || 0);
    const incomplete = this.completionData.incompleteSteps?.length || 0;
    
    this.showNotification(
      'warning',
      'Complete Your Profile',
      `Your profile is ${percentage}% complete. Complete ${incomplete} more items to unlock all features.`
    );
    
    localStorage.setItem('profile_completion_last_prompt', Date.now().toString());
  }

  /**
   * Update all widget instances
   */
  updateAllWidgets() {
    // Update any existing widgets
    const widgets = document.querySelectorAll('[data-profile-widget]');
    widgets.forEach(widget => {
      const type = widget.getAttribute('data-profile-widget');
      const id = widget.id;
      
      if (id && type) {
        switch (type) {
          case 'main':
            this.renderWidget(id);
            break;
          case 'mini':
            this.renderMiniWidget(id);
            break;
          case 'ring':
            this.renderProgressRing(id);
            break;
        }
      }
    });
  }

  /**
   * Refresh completion data
   */
  async refresh() {
    if (this.user?.id) {
      await this.loadCompletionData(this.user.id);
    }
  }

  /**
   * Check if profile blocks certain actions
   */
  isProfileBlocked(action = 'general') {
    if (!this.completionData) return false;
    
    const percentage = this.completionData.completionPercentage || 0;
    const thresholds = {
      'create_offer': 60,
      'apply_deal': 40,
      'general': 30
    };
    
    return percentage < (thresholds[action] || thresholds.general);
  }

  /**
   * Show blocking message
   */
  showBlockingMessage(action = 'general') {
    const percentage = Math.round(this.completionData?.completionPercentage || 0);
    const messages = {
      'create_offer': `Complete your profile (currently ${percentage}%) to create offers. A complete profile builds trust with creators.`,
      'apply_deal': `Complete your profile (currently ${percentage}%) to apply for deals. Marketers prefer working with verified creators.`,
      'general': `Complete your profile (currently ${percentage}%) to access all features.`
    };
    
    const message = messages[action] || messages.general;
    
    if (confirm(message + ' Would you like to complete your profile now?')) {
      window.profileWizard.open();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Initialize global widget instance
window.profileCompletionWidget = new ProfileCompletionWidget();

// Auto-initialize when auth context is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth context
  const checkAuth = () => {
    if (window.authContext?.user) {
      window.profileCompletionWidget.initialize();
    } else {
      setTimeout(checkAuth, 100);
    }
  };
  
  checkAuth();
});