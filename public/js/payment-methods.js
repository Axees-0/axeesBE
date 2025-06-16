/**
 * Payment Methods Management Interface
 * Provides comprehensive payment method management for users
 */

class PaymentMethodsManager {
  constructor() {
    this.paymentMethods = [];
    this.isLoading = false;
    
    this.initialize();
  }

  initialize() {
    // Check if user is authenticated
    if (!window.authContext || !window.authContext.isAuthenticated) {
      return;
    }

    // Check if we're on a page that should show payment methods
    if (this.shouldInitialize()) {
      this.createPaymentMethodsInterface();
      this.loadPaymentMethods();
    }
  }

  shouldInitialize() {
    // Initialize on profile page or if there's a payment methods container
    return document.querySelector('#paymentMethodsContainer') || 
           document.querySelector('.payment-methods-section') ||
           window.location.pathname.includes('profile') ||
           window.location.pathname.includes('billing');
  }

  createPaymentMethodsInterface() {
    let container = document.querySelector('#paymentMethodsContainer');
    
    if (!container) {
      // Try to find a good place to insert the interface
      const profileContent = document.querySelector('.profile-content') || 
                           document.querySelector('.dashboard-content') ||
                           document.querySelector('.main-content');
      
      if (profileContent) {
        container = document.createElement('div');
        container.id = 'paymentMethodsContainer';
        profileContent.appendChild(container);
      } else {
        return; // Can't find a place to insert
      }
    }

    container.innerHTML = this.createInterfaceHTML();
    this.attachEventListeners();
    this.injectStyles();
  }

  createInterfaceHTML() {
    return `
      <div class="payment-methods-card">
        <div class="payment-methods-header">
          <div class="header-content">
            <h3>Payment Methods</h3>
            <p>Manage your saved payment methods for quick checkouts</p>
          </div>
          <button class="btn btn-primary" onclick="window.paymentMethodsManager.addPaymentMethod()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
            </svg>
            Add Payment Method
          </button>
        </div>

        <div class="payment-methods-content">
          <div class="payment-methods-list" id="paymentMethodsList">
            <div class="loading-state" id="loadingState">
              <div class="loading-spinner"></div>
              <span>Loading payment methods...</span>
            </div>
          </div>
        </div>

        <div class="payment-security-notice">
          <div class="security-icon">🔒</div>
          <div class="security-text">
            <strong>Your payment information is secure</strong>
            <p>We use industry-standard encryption and never store your full card details. All payment processing is handled securely by Stripe.</p>
          </div>
        </div>
      </div>
    `;
  }

  async loadPaymentMethods() {
    this.isLoading = true;
    this.showLoadingState();

    try {
      const response = await window.paymentModal.loadSavedPaymentMethods();
      this.paymentMethods = response || [];
      this.renderPaymentMethods();
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  renderPaymentMethods() {
    const listContainer = document.getElementById('paymentMethodsList');
    if (!listContainer) return;

    if (this.paymentMethods.length === 0) {
      listContainer.innerHTML = this.createEmptyState();
      return;
    }

    listContainer.innerHTML = `
      <div class="payment-methods-grid">
        ${this.paymentMethods.map((method, index) => this.createPaymentMethodCard(method, index)).join('')}
      </div>
    `;
  }

  createPaymentMethodCard(method, index) {
    const isDefault = method.isDefault || index === 0;
    
    return `
      <div class="payment-method-card ${isDefault ? 'default' : ''}" data-method-id="${method.id}">
        <div class="payment-method-header">
          <div class="payment-method-brand">
            <div class="brand-icon">
              ${this.getBrandIcon(method.brand)}
            </div>
            <span class="brand-name">${method.brand.toUpperCase()}</span>
          </div>
          <div class="payment-method-actions">
            <button class="btn-icon" onclick="window.paymentMethodsManager.showMethodActions('${method.id}')" 
                    title="More actions">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="payment-method-details">
          <div class="card-number">
            <span class="dots">•••• •••• •••• </span>
            <span class="last-four">${method.last4}</span>
          </div>
          <div class="card-expiry">
            Expires ${method.exp_month}/${method.exp_year}
          </div>
        </div>

        <div class="payment-method-footer">
          <div class="payment-method-status">
            ${isDefault ? `
              <span class="status-badge default">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M10 4.5L5.5 9 2 5.5l1-1 2.5 2.5L9 3.5l1 1z"/>
                </svg>
                Default
              </span>
            ` : ''}
            <span class="added-date">Added ${this.formatAddedDate(method.created)}</span>
          </div>
          
          ${!isDefault ? `
            <button class="btn btn-link btn-sm" 
                    onclick="window.paymentMethodsManager.setAsDefault('${method.id}')">
              Set as Default
            </button>
          ` : ''}
        </div>

        <div class="method-actions-dropdown" id="methodActions_${method.id}" style="display: none;">
          <div class="actions-list">
            ${!isDefault ? `
              <button class="action-item" onclick="window.paymentMethodsManager.setAsDefault('${method.id}')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
                </svg>
                Set as Default
              </button>
            ` : ''}
            <button class="action-item" onclick="window.paymentMethodsManager.editPaymentMethod('${method.id}')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708L8.5 11.207l-3 1.5a.5.5 0 01-.65-.65l1.5-3L13.707.854a.5.5 0 01.439-.146z"/>
              </svg>
              Update Billing Info
            </button>
            <button class="action-item danger" onclick="window.paymentMethodsManager.deletePaymentMethod('${method.id}')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H5a1 1 0 011-1h4a1 1 0 011 1h2.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" opacity="0.3">
            <path d="M8 8a4 4 0 00-4 4v2h40v-2a4 4 0 00-4-4H8z"/>
            <path fill-rule="evenodd" d="M44 18H4v18a4 4 0 004 4h32a4 4 0 004-4V18zM12 26a2 2 0 012-2h4a2 2 0 110 4h-4a2 2 0 01-2-2zm14-2a2 2 0 100 4h4a2 2 0 100-4h-4z"/>
          </svg>
        </div>
        <h4>No Payment Methods</h4>
        <p>You haven't added any payment methods yet. Add one to get started with quick and secure payments.</p>
        <button class="btn btn-primary" onclick="window.paymentMethodsManager.addPaymentMethod()">
          Add Your First Payment Method
        </button>
      </div>
    `;
  }

  showLoadingState() {
    const listContainer = document.getElementById('paymentMethodsList');
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <span>Loading payment methods...</span>
        </div>
      `;
    }
  }

  showErrorState() {
    const listContainer = document.getElementById('paymentMethodsList');
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h4>Failed to Load Payment Methods</h4>
          <p>We couldn't load your payment methods. Please try again.</p>
          <button class="btn btn-outline" onclick="window.paymentMethodsManager.loadPaymentMethods()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  getBrandIcon(brand) {
    const icons = {
      visa: `<svg width="24" height="16" viewBox="0 0 24 16" fill="#1434CB">
        <path d="M6.5 2L9.5 14h-2L5 2h1.5zm7 0l-1.5 8.5L10.5 2H9l2.5 12h1.5L15.5 2H13z"/>
      </svg>`,
      mastercard: `<svg width="24" height="16" viewBox="0 0 24 16">
        <circle cx="7" cy="8" r="6" fill="#EB001B"/>
        <circle cx="17" cy="8" r="6" fill="#F79E1B"/>
        <path d="M12 4.5a6 6 0 000 7" fill="#FF5F00"/>
      </svg>`,
      amex: `<svg width="24" height="16" viewBox="0 0 24 16" fill="#006FCF">
        <rect width="24" height="16" rx="2" fill="#006FCF"/>
        <text x="12" y="11" text-anchor="middle" fill="white" font-size="6" font-weight="bold">AMEX</text>
      </svg>`,
      discover: `<svg width="24" height="16" viewBox="0 0 24 16" fill="#FF6000">
        <rect width="24" height="16" rx="2" fill="#FF6000"/>
        <circle cx="20" cy="8" r="8" fill="#FF9500"/>
      </svg>`
    };
    
    return icons[brand?.toLowerCase()] || `
      <svg width="24" height="16" viewBox="0 0 24 16" fill="#6B7280">
        <rect width="24" height="16" rx="2" fill="#E5E7EB"/>
        <text x="12" y="11" text-anchor="middle" fill="#6B7280" font-size="8">💳</text>
      </svg>
    `;
  }

  formatAddedDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp * 1000); // Stripe timestamps are in seconds
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  addPaymentMethod() {
    if (window.paymentModal) {
      window.paymentModal.open({
        onSuccess: (result) => {
          this.loadPaymentMethods(); // Refresh the list
          this.showSuccessMessage('Payment method added successfully!');
        },
        onError: (error) => {
          console.error('Payment method addition failed:', error);
        }
      });
    }
  }

  async setAsDefault(paymentMethodId) {
    try {
      const success = await window.paymentModal.setDefaultPaymentMethod(paymentMethodId);
      
      if (success) {
        this.loadPaymentMethods(); // Refresh the list
        this.showSuccessMessage('Default payment method updated successfully!');
      } else {
        throw new Error('Failed to update default payment method');
      }
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      this.showErrorMessage('Failed to update default payment method. Please try again.');
    }
  }

  async deletePaymentMethod(paymentMethodId) {
    // Find the payment method
    const method = this.paymentMethods.find(m => m.id === paymentMethodId);
    if (!method) return;

    const isDefault = method.isDefault || this.paymentMethods[0]?.id === paymentMethodId;
    
    // Show confirmation dialog
    const confirmMessage = isDefault 
      ? 'This is your default payment method. Are you sure you want to remove it? You\'ll need to set a new default after deletion.'
      : `Are you sure you want to remove this ${method.brand} card ending in ${method.last4}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const success = await window.paymentModal.deletePaymentMethod(paymentMethodId);
      
      if (success) {
        this.loadPaymentMethods(); // Refresh the list
        this.showSuccessMessage('Payment method removed successfully!');
      } else {
        throw new Error('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      this.showErrorMessage('Failed to remove payment method. Please try again.');
    }
  }

  editPaymentMethod(paymentMethodId) {
    // For now, just show an info message since editing requires customer portal
    this.showInfoMessage('To update billing information, please contact support or add a new payment method.');
  }

  showMethodActions(methodId) {
    // Hide all other dropdowns
    document.querySelectorAll('.method-actions-dropdown').forEach(dropdown => {
      if (dropdown.id !== `methodActions_${methodId}`) {
        dropdown.style.display = 'none';
      }
    });

    // Toggle the clicked dropdown
    const dropdown = document.getElementById(`methodActions_${methodId}`);
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }

    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.payment-method-card')) {
          dropdown.style.display = 'none';
        }
      }, { once: true });
    }, 100);
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
  }

  showErrorMessage(message) {
    this.showToast(message, 'error');
  }

  showInfoMessage(message) {
    this.showToast(message, 'info');
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `payment-toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">
          ${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}
        </span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  attachEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.payment-method-card')) {
        document.querySelectorAll('.method-actions-dropdown').forEach(dropdown => {
          dropdown.style.display = 'none';
        });
      }
    });
  }

  injectStyles() {
    if (document.getElementById('payment-methods-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'payment-methods-styles';
    styles.textContent = `
      .payment-methods-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 24px;
        overflow: hidden;
      }
      
      .payment-methods-header {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      
      .header-content h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .header-content p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }
      
      .payment-methods-content {
        padding: 24px;
      }
      
      .payment-methods-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      
      .payment-method-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        position: relative;
        transition: all 0.2s;
        background: white;
      }
      
      .payment-method-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .payment-method-card.default {
        border-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
      }
      
      .payment-method-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .payment-method-brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .brand-name {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }
      
      .btn-icon {
        background: none;
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
      }
      
      .btn-icon:hover {
        background: #f3f4f6;
        color: #374151;
      }
      
      .payment-method-details {
        margin-bottom: 16px;
      }
      
      .card-number {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .dots {
        color: #9ca3af;
      }
      
      .card-expiry {
        font-size: 12px;
        color: #6b7280;
      }
      
      .payment-method-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .payment-method-status {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .status-badge.default {
        background: #dbeafe;
        color: #1d4ed8;
      }
      
      .added-date {
        font-size: 11px;
        color: #9ca3af;
      }
      
      .method-actions-dropdown {
        position: absolute;
        top: 50px;
        right: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 100;
        min-width: 180px;
      }
      
      .actions-list {
        padding: 8px 0;
      }
      
      .action-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
        transition: background 0.2s;
      }
      
      .action-item:hover {
        background: #f3f4f6;
      }
      
      .action-item.danger {
        color: #dc2626;
      }
      
      .action-item.danger:hover {
        background: #fef2f2;
      }
      
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #6b7280;
      }
      
      .empty-state-icon {
        margin-bottom: 16px;
        color: #d1d5db;
      }
      
      .empty-state h4 {
        margin: 0 0 8px 0;
        color: #374151;
        font-size: 18px;
        font-weight: 600;
      }
      
      .empty-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        line-height: 1.5;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 24px;
        text-align: center;
        color: #6b7280;
      }
      
      .error-state {
        color: #dc2626;
      }
      
      .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .error-state h4 {
        margin: 0 0 8px 0;
        color: #dc2626;
        font-size: 18px;
        font-weight: 600;
      }
      
      .payment-security-notice {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 20px 24px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
      }
      
      .security-icon {
        font-size: 20px;
        color: #059669;
        margin-top: 2px;
      }
      
      .security-text strong {
        display: block;
        color: #374151;
        margin-bottom: 4px;
        font-size: 14px;
      }
      
      .security-text p {
        margin: 0;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .payment-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 10001;
        max-width: 350px;
      }
      
      .payment-toast.success {
        background: #059669;
        color: white;
      }
      
      .payment-toast.error {
        background: #dc2626;
        color: white;
      }
      
      .payment-toast.info {
        background: #3b82f6;
        color: white;
      }
      
      .payment-toast.show {
        transform: translateX(0);
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .toast-icon {
        font-weight: bold;
        font-size: 16px;
      }
      
      .toast-message {
        font-size: 14px;
        line-height: 1.4;
      }
      
      @media (max-width: 768px) {
        .payment-methods-grid {
          grid-template-columns: 1fr;
        }
        
        .payment-methods-header {
          flex-direction: column;
          gap: 16px;
        }
        
        .payment-method-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize payment methods manager
window.paymentMethodsManager = new PaymentMethodsManager();