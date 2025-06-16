/**
 * Authentication Integration for Axees Frontend
 * Handles login, signup, and session management
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.checkAuthStatus();
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
        this.updateUIForAuthenticatedUser();
      } catch (error) {
        // Token invalid or expired
        this.logout();
      }
    } else {
      this.updateUIForGuestUser();
    }
  }

  /**
   * Update UI elements based on authentication status
   */
  updateUIForAuthenticatedUser() {
    // Update navigation
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <div class="user-menu">
          <span class="user-name">${this.user.userName || this.user.email}</span>
          <button class="btn btn-secondary" onclick="authManager.logout()">Logout</button>
        </div>
      `;
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
            <label>Email</label>
            <input type="email" name="email" required>
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
   * Handle login form submission
   */
  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById('login-error');
    
    try {
      const formData = new FormData(form);
      const response = await axeesAPI.login(
        formData.get('email'),
        formData.get('password')
      );
      
      this.user = response.user;
      document.querySelector('.auth-modal').remove();
      this.updateUIForAuthenticatedUser();
      
    } catch (error) {
      errorEl.textContent = error.message || 'Login failed. Please try again.';
      errorEl.style.display = 'block';
    }
  }

  /**
   * Handle signup form submission
   */
  async handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const errorEl = document.getElementById('signup-error');
    
    try {
      const formData = new FormData(form);
      const userData = {
        userName: formData.get('userName'),
        email: formData.get('email'),
        password: formData.get('password'),
        accountType: formData.get('accountType')
      };
      
      const response = await axeesAPI.register(userData);
      
      this.user = response.user;
      document.querySelector('.auth-modal').remove();
      this.updateUIForAuthenticatedUser();
      
    } catch (error) {
      errorEl.textContent = error.message || 'Signup failed. Please try again.';
      errorEl.style.display = 'block';
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
   * Logout user
   */
  async logout() {
    await axeesAPI.logout();
    this.user = null;
    this.updateUIForGuestUser();
  }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});