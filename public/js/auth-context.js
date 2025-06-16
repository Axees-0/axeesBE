/**
 * AuthContext - Centralized Authentication State Management
 * Provides a global context for authentication state across all pages
 */

class AuthContext {
  constructor() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    this.isLoading = true;
    this.listeners = new Set();
    
    // Initialize from localStorage
    this.initializeFromStorage();
    
    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'axees_token' || e.key === 'axees_user') {
        this.initializeFromStorage();
      }
    });
    
    // Listen for auth state changes from authManager
    window.addEventListener('auth-state-changed', (e) => {
      this.updateState(e.detail);
    });
  }
  
  /**
   * Initialize state from localStorage
   */
  initializeFromStorage() {
    const token = localStorage.getItem('axees_token');
    const userStr = localStorage.getItem('axees_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.updateState({ user, token, isAuthenticated: true });
      } catch (error) {
        this.clearAuth();
      }
    } else {
      this.updateState({ user: null, token: null, isAuthenticated: false });
    }
    
    this.isLoading = false;
  }
  
  /**
   * Update authentication state
   */
  updateState(state) {
    const hasChanged = 
      this.user !== state.user || 
      this.token !== state.token || 
      this.isAuthenticated !== state.isAuthenticated;
    
    if (hasChanged) {
      this.user = state.user;
      this.token = state.token;
      this.isAuthenticated = state.isAuthenticated;
      
      // Persist to localStorage
      if (state.token) {
        localStorage.setItem('axees_token', state.token);
        localStorage.setItem('axees_user', JSON.stringify(state.user));
      } else {
        localStorage.removeItem('axees_token');
        localStorage.removeItem('axees_user');
      }
      
      // Notify all listeners
      this.notifyListeners();
    }
  }
  
  /**
   * Clear authentication state
   */
  clearAuth() {
    this.updateState({ user: null, token: null, isAuthenticated: false });
  }
  
  /**
   * Subscribe to auth state changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.getState());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Get current auth state
   */
  getState() {
    return {
      user: this.user,
      token: this.token,
      isAuthenticated: this.isAuthenticated,
      isLoading: this.isLoading
    };
  }
  
  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        // Silently handle listener errors to prevent breaking other listeners
      }
    });
  }
  
  /**
   * Check if user has a specific role
   */
  hasRole(role) {
    if (!this.user) return false;
    return this.user.userType === role;
  }
  
  /**
   * Check if user is a marketer
   */
  isMarketer() {
    return this.hasRole('marketer');
  }
  
  /**
   * Check if user is an influencer/creator
   */
  isInfluencer() {
    return this.hasRole('influencer');
  }
  
  /**
   * Get user display name
   */
  getDisplayName() {
    if (!this.user) return 'Guest';
    return this.user.userName || this.user.name || this.user.email?.split('@')[0] || 'User';
  }
  
  /**
   * Get user avatar initial
   */
  getAvatarInitial() {
    const name = this.getDisplayName();
    return name.charAt(0).toUpperCase();
  }
}

// Create global instance
window.authContext = new AuthContext();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthContext;
}