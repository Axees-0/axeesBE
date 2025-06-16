/**
 * Navigation Controller - Manages navigation state based on authentication
 * Updates navigation elements consistently across all pages
 */

class NavigationController {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.unsubscribe = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  initialize() {
    // Subscribe to auth state changes
    this.unsubscribe = window.authContext.subscribe((authState) => {
      this.updateNavigation(authState);
      this.handleRouteProtection(authState);
    });
    
    // Add page-specific navigation highlights
    this.highlightCurrentPage();
  }
  
  /**
   * Update navigation based on auth state
   */
  updateNavigation(authState) {
    if (authState.isAuthenticated) {
      this.renderAuthenticatedNav(authState.user);
    } else {
      this.renderGuestNav();
    }
    
    // Update content visibility
    this.updateContentVisibility(authState.isAuthenticated);
  }
  
  /**
   * Render navigation for authenticated users
   */
  renderAuthenticatedNav(user) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const userType = user.userType === 'influencer' ? 'Creator' : 'Marketer';
    const displayName = user.userName || user.name || user.email?.split('@')[0] || 'User';
    const avatarInitial = displayName.charAt(0).toUpperCase();
    
    navActions.innerHTML = `
      <div class="nav-links">
        <a href="/dashboard.html" class="nav-link ${this.currentPage === 'dashboard' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
            <rect x="9" y="2" width="5" height="5" fill="currentColor"/>
            <rect x="2" y="9" width="5" height="5" fill="currentColor"/>
            <rect x="9" y="9" width="5" height="5" fill="currentColor"/>
          </svg>
          Dashboard
        </a>
        
        ${user.userType === 'marketer' ? `
          <a href="/offers.html" class="nav-link ${this.currentPage === 'offers' ? 'active' : ''}">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 3a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" fill="currentColor"/>
              <path d="M6 7h4v1H6V7zm0 2h4v1H6V9z" fill="white"/>
            </svg>
            My Offers
          </a>
        ` : `
          <a href="/deals.html" class="nav-link ${this.currentPage === 'deals' ? 'active' : ''}">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
            </svg>
            My Deals
          </a>
        `}
        
        <a href="/analytics.html" class="nav-link ${this.currentPage === 'analytics' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 13V7h2v6H2zM6 13V5h2v8H6zM10 13V9h2v4h-2zM14 13V3h-2v10h2z" fill="currentColor"/>
          </svg>
          Analytics
        </a>
      </div>
      
      <div class="user-dropdown">
        <button class="user-dropdown-toggle" onclick="navigationController.toggleUserMenu(event)">
          <div class="user-avatar">
            ${avatarInitial}
          </div>
          <div class="user-info">
            <span class="user-name">${displayName}</span>
            <span class="user-type">${userType}</span>
          </div>
          <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <div class="user-dropdown-menu" style="display: none;">
          <div class="dropdown-header">
            <div class="user-profile">
              <div class="user-avatar-large">
                ${avatarInitial}
              </div>
              <div class="user-details">
                <div class="user-name-full">${displayName}</div>
                <div class="user-email">${user.email || user.phone}</div>
                <div class="user-type-badge">${userType}</div>
              </div>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <a href="/profile.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" fill="currentColor"/>
            </svg>
            My Profile
          </a>
          
          <a href="/settings.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM6.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" fill="currentColor"/>
            </svg>
            Settings
          </a>
          
          ${user.userType === 'marketer' ? `
            <a href="/billing.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" fill="currentColor"/>
                <path d="M5 7h6v1H5V7z" fill="white"/>
              </svg>
              Billing & Payments
            </a>
          ` : ''}
          
          <div class="dropdown-divider"></div>
          
          <button class="dropdown-item dropdown-item-danger" onclick="authManager.logout()">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M10 12.5v-1a.5.5 0 01.5-.5h3.5v-6h-3.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H15v9h-4.5a.5.5 0 01-.5-.5z" fill="currentColor"/>
              <path d="M5.5 8.5l2.5 2.5v-1.5h4v-3h-4V5L5.5 7.5z" fill="currentColor"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    `;
    
    this.addNavigationStyles();
  }
  
  /**
   * Render navigation for guest users
   */
  renderGuestNav() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    navActions.innerHTML = `
      <div class="auth-buttons">
        <button class="btn btn-secondary" onclick="authManager.showLoginModal()">
          Sign In
        </button>
        <button class="btn btn-primary" onclick="authManager.showSignupModal()">
          Get Started
        </button>
      </div>
    `;
  }
  
  /**
   * Update content visibility based on auth state
   */
  updateContentVisibility(isAuthenticated) {
    // Show/hide authenticated content
    document.querySelectorAll('[data-auth="true"]').forEach(el => {
      el.style.display = isAuthenticated ? '' : 'none';
    });
    
    // Show/hide guest content
    document.querySelectorAll('[data-auth="false"]').forEach(el => {
      el.style.display = isAuthenticated ? 'none' : '';
    });
    
    // Update page title based on auth state
    this.updatePageTitle(isAuthenticated);
  }
  
  /**
   * Handle route protection
   */
  handleRouteProtection(authState) {
    const protectedPages = ['dashboard', 'profile', 'analytics', 'offers', 'deals', 'settings', 'billing'];
    const publicPages = ['index', 'login', 'signup'];
    
    if (!authState.isAuthenticated && protectedPages.includes(this.currentPage)) {
      // Redirect to index for unauthenticated users on protected pages
      window.location.href = '/index.html';
    } else if (authState.isAuthenticated && (this.currentPage === 'index' || this.currentPage === 'login' || this.currentPage === 'signup')) {
      // Redirect to dashboard for authenticated users on public pages
      window.location.href = '/dashboard.html';
    }
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
      // Close any other open dropdowns
      document.querySelectorAll('.user-dropdown-menu').forEach(m => {
        m.style.display = 'none';
      });
      document.querySelectorAll('.user-dropdown-toggle').forEach(t => {
        t.classList.remove('active');
      });
      
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
   * Get current page name from URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    return page;
  }
  
  /**
   * Highlight current page in navigation
   */
  highlightCurrentPage() {
    setTimeout(() => {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      const currentLink = document.querySelector(`.nav-link[href*="${this.currentPage}"]`);
      if (currentLink) {
        currentLink.classList.add('active');
      }
    }, 100);
  }
  
  /**
   * Update page title based on auth state
   */
  updatePageTitle(isAuthenticated) {
    const titleElement = document.querySelector('title');
    if (!titleElement) return;
    
    const currentTitle = titleElement.textContent;
    const baseTitles = {
      'index': 'Axees - Creator-Brand Collaboration Platform',
      'dashboard': 'Dashboard - Axees',
      'offers': 'My Offers - Axees',
      'deals': 'My Deals - Axees',
      'analytics': 'Analytics - Axees',
      'profile': 'My Profile - Axees',
      'settings': 'Settings - Axees',
      'billing': 'Billing - Axees'
    };
    
    const newTitle = baseTitles[this.currentPage] || currentTitle;
    if (titleElement.textContent !== newTitle) {
      titleElement.textContent = newTitle;
    }
  }
  
  /**
   * Add navigation styles
   */
  addNavigationStyles() {
    if (document.getElementById('navigation-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'navigation-styles';
    styles.textContent = `
      .nav-links {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 24px;
      }
      
      .nav-link {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .nav-link:hover {
        color: var(--text-primary);
        background: var(--gray-50);
      }
      
      .nav-link.active {
        color: var(--primary-color);
        background: var(--gray-50);
      }
      
      .nav-link svg {
        opacity: 0.7;
      }
      
      .nav-link.active svg {
        opacity: 1;
      }
      
      .auth-buttons {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        min-width: 0;
      }
      
      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
      }
      
      .user-type {
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
      }
      
      .user-avatar-large {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
      }
      
      .user-details {
        flex: 1;
        min-width: 0;
      }
      
      .user-name-full {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }
      
      .user-email {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      
      .user-type-badge {
        display: inline-block;
        font-size: 11px;
        color: var(--primary-color);
        background: rgba(99, 102, 241, 0.1);
        padding: 2px 6px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .dropdown-item-danger {
        color: var(--error) !important;
      }
      
      .dropdown-item-danger:hover {
        background: #fef2f2 !important;
      }
      
      @media (max-width: 768px) {
        .nav-links {
          display: none;
        }
        
        .user-info {
          display: none;
        }
        
        .user-dropdown-toggle {
          padding: 6px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Initialize navigation controller
window.navigationController = new NavigationController();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationController;
}