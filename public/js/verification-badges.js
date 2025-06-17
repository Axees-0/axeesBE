/**
 * Verification Badges System
 * Displays verification status badges throughout the UI
 */

class VerificationBadges {
  constructor() {
    this.verificationData = null;
    this.user = null;
    
    this.initialize();
  }

  /**
   * Initialize verification badges system
   */
  initialize() {
    this.injectStyles();
  }

  /**
   * Load verification data for user
   */
  async loadVerificationData(userId) {
    try {
      const response = await window.axeesAPI.getProfile();
      if (response.success) {
        this.verificationData = {
          email: response.user.emailVerified || false,
          phone: response.user.phoneVerified || false,
          identity: response.user.identityVerified || false,
          payment: response.user.paymentMethodVerified || false,
          profile: response.user.profileCompleted || false
        };
        return this.verificationData;
      }
    } catch (error) {
      console.error('Failed to load verification data:', error);
    }
    return null;
  }

  /**
   * Inject badge styles
   */
  injectStyles() {
    if (document.getElementById('verification-badges-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'verification-badges-styles';
    styles.textContent = `
      /* Verification Badge Styles */
      .verification-badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
      }

      .verification-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        transition: all 0.2s ease;
        cursor: help;
        position: relative;
      }

      .verification-badge.verified {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
      }

      .verification-badge.unverified {
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #e5e7eb;
      }

      .verification-badge.pending {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
      }

      .verification-badge:hover {
        transform: translateY(-1px);
      }

      .verification-badge.verified:hover {
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
      }

      .verification-badge.pending:hover {
        box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
      }

      .badge-icon {
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Large Badge Style */
      .verification-badge.large {
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 16px;
      }

      .verification-badge.large .badge-icon {
        width: 14px;
        height: 14px;
      }

      /* Mini Badge Style */
      .verification-badge.mini {
        padding: 2px 6px;
        font-size: 10px;
        border-radius: 8px;
        gap: 2px;
      }

      .verification-badge.mini .badge-icon {
        width: 10px;
        height: 10px;
      }

      /* Inline Badge Style */
      .verification-badge.inline {
        background: none;
        padding: 0;
        gap: 4px;
        color: inherit;
        font-size: inherit;
        text-transform: none;
        letter-spacing: normal;
      }

      .verification-badge.inline.verified {
        color: #10b981;
      }

      .verification-badge.inline.unverified {
        color: #6b7280;
      }

      .verification-badge.inline.pending {
        color: #f59e0b;
      }

      /* Profile Verification Score */
      .verification-score {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .verification-score-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: conic-gradient(#10b981 var(--score, 0%), #e5e7eb var(--score, 0%));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: #059669;
      }

      .verification-score-details {
        flex: 1;
      }

      .verification-score-title {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .verification-score-subtitle {
        font-size: 12px;
        color: #64748b;
      }

      /* Trust Level Indicator */
      .trust-level {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
      }

      .trust-level.high {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
      }

      .trust-level.medium {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
      }

      .trust-level.low {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
      }

      .trust-stars {
        display: flex;
        gap: 1px;
      }

      .trust-star {
        font-size: 10px;
      }

      /* Tooltip */
      .verification-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        z-index: 1000;
        margin-bottom: 5px;
      }

      .verification-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #1f2937;
      }

      .verification-badge:hover .verification-tooltip {
        opacity: 1;
      }

      /* Verification Status Panel */
      .verification-panel {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
      }

      .verification-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .verification-panel-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .verification-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .verification-item:last-child {
        border-bottom: none;
      }

      .verification-item-info {
        flex: 1;
      }

      .verification-item-title {
        font-weight: 500;
        color: #1e293b;
        margin-bottom: 2px;
      }

      .verification-item-description {
        font-size: 12px;
        color: #64748b;
      }

      .verification-item-action {
        margin-left: 12px;
      }

      .verify-btn {
        padding: 6px 12px;
        border: 1px solid #6366f1;
        background: white;
        color: #6366f1;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .verify-btn:hover {
        background: #6366f1;
        color: white;
      }

      .verify-btn.verified {
        background: #10b981;
        border-color: #10b981;
        color: white;
      }

      .verify-btn.verified:hover {
        background: #059669;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .verification-badges {
          gap: 4px;
        }
        
        .verification-badge {
          font-size: 10px;
          padding: 3px 6px;
        }
        
        .verification-panel {
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Render verification badges for a user
   */
  async renderBadges(containerId, userId = null, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const verificationData = await this.loadVerificationData(userId);
    if (!verificationData) {
      container.innerHTML = '';
      return;
    }

    const {
      size = 'normal', // mini, normal, large
      style = 'badge', // badge, inline, panel
      showAll = false, // show unverified badges too
      types = ['email', 'phone', 'identity', 'payment'] // which badges to show
    } = options;

    if (style === 'panel') {
      this.renderVerificationPanel(container, verificationData);
      return;
    }

    const badges = types
      .filter(type => showAll || verificationData[type])
      .map(type => this.createBadge(type, verificationData[type], size, style))
      .join('');

    container.innerHTML = `<div class="verification-badges">${badges}</div>`;
  }

  /**
   * Create a single verification badge
   */
  createBadge(type, isVerified, size = 'normal', style = 'badge') {
    const config = this.getBadgeConfig(type);
    const status = isVerified ? 'verified' : 'unverified';
    const sizeClass = size !== 'normal' ? size : '';
    const styleClass = style !== 'badge' ? style : '';
    
    const classNames = [
      'verification-badge',
      status,
      sizeClass,
      styleClass
    ].filter(Boolean).join(' ');

    return `
      <div class="${classNames}" title="${config.tooltip}">
        <div class="badge-icon">${config.icon}</div>
        <span>${config.label}</span>
        <div class="verification-tooltip">${config.tooltip}</div>
      </div>
    `;
  }

  /**
   * Get badge configuration for type
   */
  getBadgeConfig(type) {
    const configs = {
      email: {
        label: 'Email',
        icon: '✉️',
        tooltip: 'Email address verified'
      },
      phone: {
        label: 'Phone',
        icon: '📱',
        tooltip: 'Phone number verified'
      },
      identity: {
        label: 'ID',
        icon: '🆔',
        tooltip: 'Identity verified'
      },
      payment: {
        label: 'Payment',
        icon: '💳',
        tooltip: 'Payment method verified'
      },
      profile: {
        label: 'Profile',
        icon: '👤',
        tooltip: 'Profile completed'
      }
    };

    return configs[type] || {
      label: type,
      icon: '✓',
      tooltip: `${type} verified`
    };
  }

  /**
   * Render verification panel
   */
  renderVerificationPanel(container, verificationData) {
    const verifiedCount = Object.values(verificationData).filter(Boolean).length;
    const totalCount = Object.keys(verificationData).length;
    const percentage = Math.round((verifiedCount / totalCount) * 100);

    container.innerHTML = `
      <div class="verification-panel">
        <div class="verification-panel-header">
          <h3 class="verification-panel-title">Account Verification</h3>
          <div class="verification-score">
            <div class="verification-score-circle" style="--score: ${percentage}%">
              ${percentage}%
            </div>
            <div class="verification-score-details">
              <div class="verification-score-title">Trust Score</div>
              <div class="verification-score-subtitle">${verifiedCount} of ${totalCount} verified</div>
            </div>
          </div>
        </div>
        
        ${Object.entries(verificationData).map(([type, isVerified]) => 
          this.renderVerificationItem(type, isVerified)
        ).join('')}
      </div>
    `;
  }

  /**
   * Render individual verification item in panel
   */
  renderVerificationItem(type, isVerified) {
    const config = this.getBadgeConfig(type);
    const descriptions = {
      email: 'Verify your email to receive important notifications',
      phone: 'Add phone verification for account security',
      identity: 'Complete identity verification to build trust',
      payment: 'Add payment method for seamless transactions',
      profile: 'Complete your profile to unlock all features'
    };

    return `
      <div class="verification-item">
        <div class="verification-item-info">
          <div class="verification-item-title">${config.icon} ${config.label} Verification</div>
          <div class="verification-item-description">${descriptions[type] || config.tooltip}</div>
        </div>
        <div class="verification-item-action">
          <button class="verify-btn ${isVerified ? 'verified' : ''}" 
                  onclick="window.verificationBadges.startVerification('${type}')">
            ${isVerified ? 'Verified' : 'Verify'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render trust level indicator
   */
  renderTrustLevel(containerId, userId = null) {
    const container = document.getElementById(containerId);
    if (!container || !this.verificationData) return;

    const verifiedCount = Object.values(this.verificationData).filter(Boolean).length;
    const totalCount = Object.keys(this.verificationData).length;
    const percentage = (verifiedCount / totalCount) * 100;
    
    let level, stars, label;
    
    if (percentage >= 80) {
      level = 'high';
      stars = '★★★★★';
      label = 'Highly Trusted';
    } else if (percentage >= 60) {
      level = 'medium';
      stars = '★★★★☆';
      label = 'Trusted';
    } else if (percentage >= 40) {
      level = 'medium';
      stars = '★★★☆☆';
      label = 'Partially Verified';
    } else {
      level = 'low';
      stars = '★★☆☆☆';
      label = 'New User';
    }

    container.innerHTML = `
      <div class="trust-level ${level}" title="Trust level based on verification status">
        <div class="trust-stars">${stars}</div>
        <span>${label}</span>
      </div>
    `;
  }

  /**
   * Start verification process for a type
   */
  startVerification(type) {
    switch (type) {
      case 'email':
        this.verifyEmail();
        break;
      case 'phone':
        this.verifyPhone();
        break;
      case 'identity':
        this.verifyIdentity();
        break;
      case 'payment':
        this.verifyPayment();
        break;
      case 'profile':
        window.profileWizard?.open();
        break;
      default:
        console.warn(`Unknown verification type: ${type}`);
    }
  }

  /**
   * Start email verification
   */
  async verifyEmail() {
    try {
      const response = await window.axeesAPI.request('/auth/verify-email', {
        method: 'POST'
      });
      
      if (response.success) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      alert('Failed to send verification email: ' + error.message);
    }
  }

  /**
   * Start phone verification
   */
  async verifyPhone() {
    const phone = prompt('Enter your phone number:');
    if (!phone) return;

    try {
      const response = await window.axeesAPI.request('/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
      
      if (response.success) {
        const code = prompt('Enter the verification code sent to your phone:');
        if (code) {
          await this.confirmPhoneVerification(phone, code);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Phone verification failed:', error);
      alert('Failed to verify phone: ' + error.message);
    }
  }

  /**
   * Confirm phone verification
   */
  async confirmPhoneVerification(phone, code) {
    try {
      const response = await window.axeesAPI.request('/auth/verify-phone/confirm', {
        method: 'POST',
        body: JSON.stringify({ phone, code })
      });
      
      if (response.success) {
        alert('Phone verified successfully!');
        await this.refresh();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Phone verification confirmation failed:', error);
      alert('Failed to confirm phone verification: ' + error.message);
    }
  }

  /**
   * Start identity verification
   */
  verifyIdentity() {
    alert('Identity verification is coming soon! This will redirect to our verification partner.');
  }

  /**
   * Start payment verification
   */
  verifyPayment() {
    if (window.paymentModal) {
      window.paymentModal.open();
    } else {
      window.location.href = '/profile.html#payment-methods';
    }
  }

  /**
   * Refresh verification data
   */
  async refresh() {
    if (this.user?.id) {
      await this.loadVerificationData(this.user.id);
      // Re-render all badge containers
      document.querySelectorAll('[data-verification-badges]').forEach(container => {
        const options = JSON.parse(container.getAttribute('data-verification-options') || '{}');
        this.renderBadges(container.id, this.user.id, options);
      });
    }
  }

  /**
   * Get verification summary
   */
  getVerificationSummary() {
    if (!this.verificationData) return null;
    
    const verified = Object.values(this.verificationData).filter(Boolean).length;
    const total = Object.keys(this.verificationData).length;
    
    return {
      verified,
      total,
      percentage: Math.round((verified / total) * 100),
      isFullyVerified: verified === total
    };
  }
}

// Initialize global verification badges instance
window.verificationBadges = new VerificationBadges();

// Auto-render badges when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Auto-render containers with data-verification-badges attribute
  const containers = document.querySelectorAll('[data-verification-badges]');
  containers.forEach(container => {
    const options = JSON.parse(container.getAttribute('data-verification-options') || '{}');
    const userId = container.getAttribute('data-user-id');
    window.verificationBadges.renderBadges(container.id, userId, options);
  });
});