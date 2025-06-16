/**
 * Authentication Integration for Axees Frontend
 * Handles login, signup, and session management
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.tokenExpiryTimer = null;
    this.tokenRefreshTimer = null;
    this.checkAuthStatus();
    this.setupTokenManagement();
  }

  /**
   * Check if user is authenticated on page load
   */
  async checkAuthStatus() {
    const token = localStorage.getItem('axees_token');
    
    if (token) {
      try {
        // Verify token and get user profile
        const response = await axeesAPI.getProfile();
        this.user = response.user;
        this.updateAuthContext(response.user, token);
        this.updateUIForAuthenticatedUser();
      } catch (error) {
        // Token invalid or expired
        this.logout();
      }
    } else {
      this.updateAuthContext(null, null);
      this.updateUIForGuestUser();
    }
  }

  /**
   * Update AuthContext with new state
   */
  updateAuthContext(user, token) {
    if (window.authContext) {
      window.authContext.updateState({
        user: user,
        token: token,
        isAuthenticated: !!user
      });
    }
    
    // Also dispatch custom event for backward compatibility
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: {
        user: user,
        token: token,
        isAuthenticated: !!user
      }
    }));
  }

  /**
   * Update UI elements based on authentication status
   */
  updateUIForAuthenticatedUser() {
    // Update navigation
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <div class="user-dropdown">
          <button class="user-dropdown-toggle" onclick="authManager.toggleUserMenu(event)">
            <div class="user-avatar">
              ${this.user.userName ? this.user.userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span class="user-name">${this.user.userName || this.user.email.split('@')[0]}</span>
            <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <div class="user-dropdown-menu" style="display: none;">
            <div class="dropdown-header">
              <div class="user-info">
                <div class="user-name-full">${this.user.userName || 'User'}</div>
                <div class="user-email">${this.user.email}</div>
                <div class="user-type">${this.user.userType === 'influencer' ? 'Creator' : 'Marketer'}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="/profile.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" fill="currentColor"/>
              </svg>
              My Profile
            </a>
            <a href="/dashboard.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
                <rect x="9" y="2" width="5" height="5" fill="currentColor"/>
                <rect x="2" y="9" width="5" height="5" fill="currentColor"/>
                <rect x="9" y="9" width="5" height="5" fill="currentColor"/>
              </svg>
              Dashboard
            </a>
            <a href="/settings.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM6.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" fill="currentColor"/>
              </svg>
              Settings
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-item" onclick="authManager.logout()">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M10 12.5v-1a.5.5 0 01.5-.5h3.5v-6h-3.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H15v9h-4.5a.5.5 0 01-.5-.5z" fill="currentColor"/>
                <path d="M5.5 8.5l2.5 2.5v-1.5h4v-3h-4V5L5.5 7.5z" fill="currentColor"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      `;
      
      // Add styles for dropdown if not already added
      if (!document.getElementById('user-dropdown-styles')) {
        const styles = document.createElement('style');
        styles.id = 'user-dropdown-styles';
        styles.textContent = `
          .user-dropdown {
            position: relative;
          }
          
          .user-dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: transparent;
            border: 1px solid var(--gray-300);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .user-dropdown-toggle:hover {
            background: var(--gray-50);
            border-color: var(--gray-400);
          }
          
          .user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }
          
          .dropdown-arrow {
            transition: transform 0.2s ease;
          }
          
          .user-dropdown-toggle.active .dropdown-arrow {
            transform: rotate(180deg);
          }
          
          .user-dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            min-width: 240px;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          
          .dropdown-header {
            padding: 12px 16px;
          }
          
          .user-info {
            text-align: left;
          }
          
          .user-name-full {
            font-weight: 600;
            color: var(--text-primary);
          }
          
          .user-email {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }
          
          .user-type {
            font-size: 0.75rem;
            color: var(--primary-color);
            text-transform: uppercase;
            margin-top: 4px;
          }
          
          .dropdown-divider {
            height: 1px;
            background: var(--gray-200);
            margin: 4px 0;
          }
          
          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            color: var(--text-primary);
            text-decoration: none;
            transition: background 0.2s ease;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
            font-size: 0.875rem;
          }
          
          .dropdown-item:hover {
            background: var(--gray-50);
          }
          
          .dropdown-item svg {
            opacity: 0.6;
          }
          
          .logout-item {
            color: var(--error);
          }
          
          .logout-item:hover {
            background: #fef2f2;
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          .modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
            justify-content: flex-end;
          }
          
          .token-expiry-modal .auth-modal-content {
            max-width: 400px;
          }
          
          .token-expiry-modal h3 {
            margin: 0 0 12px 0;
            color: var(--text-primary);
          }
          
          .token-expiry-modal p {
            margin: 0;
            color: var(--text-secondary);
          }
        `;
        document.head.appendChild(styles);
      }
    }

    // Show authenticated content
    document.querySelectorAll('[data-auth="true"]').forEach(el => {
      el.style.display = '';
    });

    // Hide guest content
    document.querySelectorAll('[data-auth="false"]').forEach(el => {
      el.style.display = 'none';
    });

    // Redirect from index to dashboard if on landing page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      window.location.href = '/dashboard.html';
    }
  }

  updateUIForGuestUser() {
    // Update navigation
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <button class="btn btn-secondary" onclick="authManager.showLoginModal()">Sign In</button>
        <button class="btn btn-primary" onclick="authManager.showSignupModal()">Get Started</button>
      `;
    }

    // Hide authenticated content
    document.querySelectorAll('[data-auth="true"]').forEach(el => {
      el.style.display = 'none';
    });

    // Show guest content
    document.querySelectorAll('[data-auth="false"]').forEach(el => {
      el.style.display = '';
    });

    // Redirect from protected pages to index
    const protectedPages = ['/dashboard.html', '/profile.html', '/analytics.html'];
    if (protectedPages.includes(window.location.pathname)) {
      window.location.href = '/index.html';
    }
  }

  /**
   * Show login modal
   */
  showLoginModal() {
    const modal = this.createAuthModal('login');
    document.body.appendChild(modal);
  }

  /**
   * Show signup modal
   */
  showSignupModal() {
    const modal = this.createAuthModal('signup');
    document.body.appendChild(modal);
  }

  /**
   * Create authentication modal
   */
  createAuthModal(type) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="auth-modal-content">
        <h2>${type === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <form id="${type}-form" onsubmit="authManager.handle${type.charAt(0).toUpperCase() + type.slice(1)}(event)">
          ${type === 'signup' ? `
            <div class="form-group">
              <label>Username</label>
              <input type="text" name="userName" required>
            </div>
          ` : ''}
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="+1234567890" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          ${type === 'signup' ? `
            <div class="form-group">
              <label>Account Type</label>
              <select name="accountType" required>
                <option value="influencer">Creator/Influencer</option>
                <option value="marketer">Brand/Marketer</option>
              </select>
            </div>
          ` : ''}
          <div class="form-error" id="${type}-error" style="display: none;"></div>
          <button type="submit" class="btn btn-primary btn-block">
            ${type === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <p class="auth-switch">
            ${type === 'login' 
              ? `Don't have an account? <a href="#" onclick="authManager.switchToSignup()">Sign up</a>`
              : `Already have an account? <a href="#" onclick="authManager.switchToLogin()">Sign in</a>`
            }
          </p>
        </form>
      </div>
    `;

    // Add styles
    const styles = `
      <style>
        .auth-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .auth-modal-content {
          position: relative;
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .auth-modal h2 {
          margin: 0 0 1.5rem 0;
          color: var(--text-primary);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.25rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--gray-300);
          border-radius: 0.375rem;
          font-size: 1rem;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        
        .btn-block {
          width: 100%;
          margin-top: 1rem;
        }
        
        .form-error {
          background: #fee;
          color: var(--error);
          padding: 0.5rem;
          border-radius: 0.375rem;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        
        .auth-switch {
          text-align: center;
          margin-top: 1rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .auth-switch a {
          color: var(--primary-color);
          text-decoration: none;
        }
      </style>
    `;

    if (!document.querySelector('#auth-modal-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'auth-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
    }

    return modal;
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(event) {
    event.stopPropagation();
    const toggle = event.currentTarget;
    const menu = toggle.nextElementSibling;
    const isOpen = menu.style.display !== 'none';
    
    if (isOpen) {
      menu.style.display = 'none';
      toggle.classList.remove('active');
    } else {
      menu.style.display = 'block';
      toggle.classList.add('active');
      
      // Close on outside click
      const closeHandler = (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
          toggle.classList.remove('active');
          document.removeEventListener('click', closeHandler);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 0);
    }
  }

  /**
   * Handle login form submission
   */
  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById('login-error');
    
    try {
      const formData = new FormData(form);
      const response = await axeesAPI.login(
        formData.get('phone'),
        formData.get('password')
      );
      
      this.user = response.user;
      const token = localStorage.getItem('axees_token');
      this.updateAuthContext(response.user, token);
      document.querySelector('.auth-modal').remove();
      this.updateUIForAuthenticatedUser();
      this.setupTokenManagement(); // Set up token management after login
      
    } catch (error) {
      errorEl.textContent = error.message || 'Login failed. Please try again.';
      errorEl.style.display = 'block';
    }
  }

  /**
   * Handle signup form submission (start registration)
   */
  async handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById('signup-error');
    
    try {
      const formData = new FormData(form);
      const phone = formData.get('phone');
      const userType = formData.get('accountType');
      
      // Start registration process with OTP
      const response = await axeesAPI.startRegistration(phone, userType);
      
      // Store signup data for OTP verification
      this.pendingSignup = {
        phone: phone,
        userName: formData.get('userName'),
        password: formData.get('password'),
        userType: userType
      };
      
      // Replace signup modal with OTP verification modal
      document.querySelector('.auth-modal').remove();
      this.showOtpModal(phone, 'signup');
      
    } catch (error) {
      errorEl.textContent = error.message || 'Signup failed. Please try again.';
      errorEl.style.display = 'block';
    }
  }

  /**
   * Show OTP verification modal
   */
  showOtpModal(phone, type = 'signup') {
    const modal = this.createOtpModal(phone, type);
    document.body.appendChild(modal);
  }

  /**
   * Create OTP verification modal
   */
  createOtpModal(phone, type) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal otp-modal';
    modal.innerHTML = `
      <div class="auth-modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="auth-modal-content">
        <h2>Verify Your Phone</h2>
        <p>We've sent a verification code to <strong>${phone}</strong></p>
        <form id="otp-form" onsubmit="authManager.handleOtpVerification(event, '${type}')">
          <div class="form-group">
            <label>Verification Code</label>
            <input type="text" name="code" maxlength="4" pattern="[0-9]{4}" placeholder="Enter 4-digit code" required>
          </div>
          <div class="form-error" id="otp-error" style="display: none;"></div>
          <button type="submit" class="btn btn-primary btn-block">
            Verify Code
          </button>
          <div class="otp-actions">
            <button type="button" class="btn btn-secondary" onclick="authManager.resendOtp('${phone}')">
              Resend Code
            </button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.auth-modal').remove()">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;

    // Add OTP-specific styles
    if (!document.querySelector('#otp-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'otp-modal-styles';
      styles.textContent = `
        .otp-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          justify-content: center;
        }
        
        .otp-actions .btn {
          flex: 1;
        }
        
        .otp-modal input[name="code"] {
          text-align: center;
          font-size: 18px;
          letter-spacing: 4px;
          font-weight: 600;
        }
      `;
      document.head.appendChild(styles);
    }

    return modal;
  }

  /**
   * Handle OTP verification
   */
  async handleOtpVerification(event, type) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById('otp-error');
    
    try {
      const formData = new FormData(form);
      const code = formData.get('code');
      
      if (type === 'signup' && this.pendingSignup) {
        // Complete registration with OTP verification
        const response = await axeesAPI.verifyOtp(this.pendingSignup.phone, code);
        
        this.user = response.user;
        const token = localStorage.getItem('axees_token');
        this.updateAuthContext(response.user, token);
        document.querySelector('.auth-modal').remove();
        this.updateUIForAuthenticatedUser();
        this.setupTokenManagement();
        
        // Clear pending signup data
        this.pendingSignup = null;
      }
      
    } catch (error) {
      errorEl.textContent = error.message || 'Verification failed. Please try again.';
      errorEl.style.display = 'block';
    }
  }

  /**
   * Resend OTP code
   */
  async resendOtp(phone) {
    try {
      await axeesAPI.resendOtp(phone);
      this.showNotification('Verification code resent successfully', 'success');
    } catch (error) {
      this.showNotification('Failed to resend code: ' + error.message, 'error');
    }
  }

  /**
   * Switch between login and signup modals
   */
  switchToSignup() {
    document.querySelector('.auth-modal').remove();
    this.showSignupModal();
  }

  switchToLogin() {
    document.querySelector('.auth-modal').remove();
    this.showLoginModal();
  }

  /**
   * Setup token expiry and refresh management
   */
  setupTokenManagement() {
    // Clear any existing timers
    this.clearTokenTimers();
    
    const token = localStorage.getItem('axees_token');
    if (!token) return;
    
    try {
      // Decode token to get expiry time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      if (timeUntilExpiry <= 0) {
        // Token already expired
        this.handleTokenExpiry();
        return;
      }
      
      // Set up auto-logout 1 minute before token expires
      const autoLogoutTime = timeUntilExpiry - 60000; // 1 minute before expiry
      if (autoLogoutTime > 0) {
        this.tokenExpiryTimer = setTimeout(() => {
          this.showTokenExpiryWarning();
        }, autoLogoutTime);
      }
      
      // Set up token refresh at 30 minutes (halfway through token lifetime)
      const refreshTime = Math.min(30 * 60 * 1000, timeUntilExpiry / 2);
      this.tokenRefreshTimer = setTimeout(() => {
        this.attemptTokenRefresh();
      }, refreshTime);
      
    } catch (error) {
      this.handleTokenExpiry();
    }
  }
  
  /**
   * Clear token management timers
   */
  clearTokenTimers() {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
  
  /**
   * Show warning before token expires
   */
  showTokenExpiryWarning() {
    const modal = document.createElement('div');
    modal.className = 'token-expiry-modal';
    modal.innerHTML = `
      <div class="auth-modal-backdrop"></div>
      <div class="auth-modal-content">
        <h3>Session Expiring Soon</h3>
        <p>Your session will expire in 1 minute. Would you like to stay logged in?</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="authManager.refreshSession()">Stay Logged In</button>
          <button class="btn btn-secondary" onclick="authManager.logout()">Logout</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Auto logout after 1 minute if no action taken
    this.tokenExpiryTimer = setTimeout(() => {
      this.handleTokenExpiry();
    }, 60000);
  }
  
  /**
   * Attempt to refresh the user session
   */
  async refreshSession() {
    // Remove warning modal
    const modal = document.querySelector('.token-expiry-modal');
    if (modal) modal.remove();
    
    try {
      // Re-authenticate by fetching user profile
      const response = await axeesAPI.getProfile();
      if (response.user) {
        this.user = response.user;
        this.setupTokenManagement();
        this.showNotification('Session refreshed successfully', 'success');
      }
    } catch (error) {
      this.handleTokenExpiry();
    }
  }
  
  /**
   * Attempt automatic token refresh
   */
  async attemptTokenRefresh() {
    try {
      // Silently refresh by fetching user profile
      const response = await axeesAPI.getProfile();
      if (response.user) {
        this.user = response.user;
        this.setupTokenManagement();
      }
    } catch (error) {
      // Don't logout immediately on refresh failure, wait for expiry
    }
  }
  
  /**
   * Handle token expiry
   */
  handleTokenExpiry() {
    this.clearTokenTimers();
    this.showNotification('Your session has expired. Please login again.', 'error');
    this.logout();
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Logout user
   */
  async logout() {
    this.clearTokenTimers();
    await axeesAPI.logout();
    this.user = null;
    this.updateAuthContext(null, null);
    this.updateUIForGuestUser();
  }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});