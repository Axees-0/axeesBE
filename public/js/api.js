/**
 * Axees Frontend API Integration Layer
 * Centralized API client for all backend communications
 */

class AxeesAPI {
  constructor() {
    // Configure based on environment
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8080/api' 
      : '/api';
    
    // Get stored auth token
    this.token = localStorage.getItem('axees_token');
    
    // Loading state management
    this.loadingRequests = new Map();
    
    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000, // Start with 1 second
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    };
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('axees_token', token);
  }

  /**
   * Remove authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('axees_token');
  }

  /**
   * Check if any requests are loading
   */
  isLoading() {
    return this.loadingRequests.size > 0;
  }

  /**
   * Get loading state for specific endpoint
   */
  isEndpointLoading(endpoint) {
    return this.loadingRequests.has(endpoint);
  }

  /**
   * Set loading state
   */
  setLoading(endpoint, isLoading) {
    if (isLoading) {
      this.loadingRequests.set(endpoint, true);
    } else {
      this.loadingRequests.delete(endpoint);
    }
    
    // Dispatch custom event for loading state changes
    window.dispatchEvent(new CustomEvent('axees-loading-change', {
      detail: { 
        endpoint, 
        isLoading,
        totalLoading: this.loadingRequests.size
      }
    }));
  }

  /**
   * Sleep function for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make authenticated API request with retry logic
   */
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Set loading state
    this.setLoading(endpoint, true);
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    };

    // Add auth token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/index.html';
        throw new Error('Unauthorized');
      }

      // Check if we should retry
      if (this.retryConfig.retryableStatuses.includes(response.status) && 
          retryCount < this.retryConfig.maxRetries) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount);
        // Request failed, retrying after delay
        
        await this.sleep(delay);
        return this.request(endpoint, options, retryCount + 1);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      // Clear loading state on success
      this.setLoading(endpoint, false);
      return data;
      
    } catch (error) {
      // Network error or other fetch errors
      if (retryCount < this.retryConfig.maxRetries && 
          error.name === 'TypeError' && error.message.includes('fetch')) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount);
        // Network error, retrying after delay
        
        await this.sleep(delay);
        return this.request(endpoint, options, retryCount + 1);
      }
      
      // Clear loading state on error
      this.setLoading(endpoint, false);
      // API request failed after all retries
      throw error;
    }
  }

  /**
   * Authentication APIs
   */
  async login(phone, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async startRegistration(phone, userType) {
    const response = await this.request('/auth/register/start', {
      method: 'POST',
      body: JSON.stringify({ phone, userType })
    });
    
    return response;
  }

  async verifyOtp(phone, code, deviceToken = null) {
    const response = await this.request('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, deviceToken })
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async resendOtp(phone) {
    const response = await this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    
    return response;
  }

  async getProfile() {
    const response = await this.request('/profile', {
      method: 'GET'
    });
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      // Logout request failed, continuing with local cleanup
    } finally {
      this.removeToken();
    }
  }


  /**
   * User Profile APIs
   */
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(updates) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async getProfileCompletion() {
    return this.request('/profile/completion');
  }

  /**
   * Offer Management APIs
   */
  async createOffer(offerData) {
    return this.request('/offers/create', {
      method: 'POST',
      body: JSON.stringify(offerData)
    });
  }

  async getOffers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/offers${params ? '?' + params : ''}`);
  }

  async getOfferById(id) {
    return this.request(`/offers/${id}`);
  }

  async updateOffer(id, updates) {
    return this.request(`/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async negotiateOffer(id, counterOffer) {
    return this.request(`/offers/${id}/negotiate`, {
      method: 'POST',
      body: JSON.stringify(counterOffer)
    });
  }

  /**
   * Real-time Collaboration APIs
   */
  async startEditingSession(offerId, section) {
    return this.request('/offers/collaboration/start', {
      method: 'POST',
      body: JSON.stringify({ offerId, section })
    });
  }

  async getActiveEditors(offerId) {
    return this.request(`/offers/collaboration/${offerId}/editors`);
  }

  /**
   * Payment APIs
   */
  async getPaymentMethods() {
    return this.request('/payments/methods');
  }

  async addPaymentMethod(paymentMethodId) {
    return this.request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId })
    });
  }

  async createTrialOffer(offerData) {
    return this.request('/offers/trial', {
      method: 'POST',
      body: JSON.stringify(offerData)
    });
  }

  async getWalletBalance() {
    return this.request('/payments/wallet/balance');
  }

  async fundWallet(amount) {
    return this.request('/payments/wallet/fund', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  /**
   * Deal Management APIs
   */
  async getDeals() {
    return this.request('/deals');
  }

  async getDealById(id) {
    return this.request(`/deals/${id}`);
  }

  async getDealDashboard() {
    return this.request('/deals/dashboard');
  }

  async updateMilestones(dealId, milestones) {
    return this.request(`/deals/${dealId}/milestones`, {
      method: 'PUT',
      body: JSON.stringify({ milestones })
    });
  }

  /**
   * File Upload APIs
   */
  async uploadFile(file, type = 'document') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/uploads', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async submitProof(dealId, proofData) {
    return this.request(`/deals/${dealId}/proof`, {
      method: 'POST',
      body: JSON.stringify(proofData)
    });
  }

  /**
   * Chat/Messaging APIs
   */
  async sendMessage(roomId, message) {
    return this.request(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getChatMessages(roomId, limit = 50) {
    return this.request(`/chat/rooms/${roomId}/messages?limit=${limit}`);
  }

  /**
   * Notification APIs
   */
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  /**
   * Calendar APIs
   */
  async getCalendarEvents() {
    return this.request('/calendar/events');
  }

  /**
   * Search/Discovery APIs
   */
  async searchCreators(query) {
    return this.request('/find/creators', {
      method: 'POST',
      body: JSON.stringify(query)
    });
  }

  /**
   * QR Code APIs
   */
  async generateQRCode(data) {
    return this.request('/qrcode/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async scanQRCode(qrData) {
    return this.request('/qrcode/scan', {
      method: 'POST',
      body: JSON.stringify({ qrData })
    });
  }

  /**
   * Admin APIs
   */
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(filters) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/admin/users${params ? '?' + params : ''}`);
  }
}

// Create global instance
window.axeesAPI = new AxeesAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AxeesAPI;
}