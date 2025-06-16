/**
 * Wallet UI Component
 * Handles wallet functionality including balance display, funding, and transaction history
 */

class WalletManager {
  constructor() {
    this.isOpen = false;
    this.currentBalance = 0;
    this.transactions = [];
    this.fundingModal = null;
    
    this.initialize();
  }

  initialize() {
    // Check if user is authenticated
    if (!window.authContext || !window.authContext.isAuthenticated) {
      return;
    }

    this.loadWalletData();
    this.createWalletWidget();
  }

  async loadWalletData() {
    try {
      const balanceResponse = await window.axeesAPI.getWalletBalance();
      this.currentBalance = balanceResponse.success ? balanceResponse.data.balance : 0;
      
      const transactionsResponse = await window.axeesAPI.getTransactionHistory();
      this.transactions = transactionsResponse.success ? transactionsResponse.data.transactions : [];
      
      this.updateWalletDisplay();
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  }

  createWalletWidget() {
    const existingWidget = document.getElementById('walletWidget');
    if (existingWidget) {
      existingWidget.remove();
    }

    const widget = document.createElement('div');
    widget.id = 'walletWidget';
    widget.className = 'wallet-widget';
    widget.innerHTML = this.createWidgetHTML();

    // Find a good place to insert the widget (in the navigation or dashboard)
    const nav = document.querySelector('.user-nav') || document.querySelector('.navigation');
    if (nav) {
      nav.appendChild(widget);
    }

    this.attachEventListeners();
    this.injectStyles();
  }

  createWidgetHTML() {
    return `
      <div class="wallet-summary" onclick="window.walletManager.toggleWallet()">
        <div class="wallet-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
            <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="wallet-info">
          <span class="wallet-label">Wallet</span>
          <span class="wallet-balance" id="walletBalance">$${this.currentBalance.toFixed(2)}</span>
        </div>
        <div class="wallet-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 6.646a.5.5 0 01.708 0L8 9.293l2.646-2.647a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 010-.708z"/>
          </svg>
        </div>
      </div>
      
      <div class="wallet-dropdown" id="walletDropdown" style="display: none;">
        <div class="wallet-header">
          <div class="wallet-header-content">
            <h3>My Wallet</h3>
            <div class="wallet-current-balance">
              <span class="balance-label">Available Balance</span>
              <span class="balance-amount">$${this.currentBalance.toFixed(2)}</span>
            </div>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-primary btn-sm" onclick="window.walletManager.openFundModal()">
              Add Funds
            </button>
          </div>
        </div>
        
        <div class="wallet-stats">
          <div class="stat-item">
            <span class="stat-label">This Month</span>
            <span class="stat-value">$${this.calculateMonthlySpending().toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Spent</span>
            <span class="stat-value">$${this.calculateTotalSpending().toFixed(2)}</span>
          </div>
        </div>
        
        <div class="wallet-transactions">
          <div class="transactions-header">
            <h4>Recent Transactions</h4>
            <button class="btn-link" onclick="window.walletManager.showAllTransactions()">
              View All
            </button>
          </div>
          <div class="transactions-list" id="transactionsList">
            ${this.createTransactionsList(5)}
          </div>
        </div>
        
        <div class="auto-deduction-section">
          <div class="auto-deduction-header">
            <h4>Auto-Deduction Settings</h4>
            <label class="toggle-switch">
              <input type="checkbox" id="autoDeductionToggle" ${this.getAutoDeductionSetting() ? 'checked' : ''} 
                     onchange="window.walletManager.toggleAutoDeduction()">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="auto-deduction-description">
            Automatically deduct offer amounts from your wallet when creating offers.
            Ensures instant payment processing and faster offer acceptance.
          </p>
        </div>
      </div>
    `;
  }

  createTransactionsList(limit = null) {
    if (!this.transactions.length) {
      return `
        <div class="no-transactions">
          <div class="no-transactions-icon">💳</div>
          <p>No transactions yet</p>
          <small>Your transaction history will appear here</small>
        </div>
      `;
    }

    const displayTransactions = limit ? this.transactions.slice(0, limit) : this.transactions;
    
    return displayTransactions.map(transaction => `
      <div class="transaction-item ${transaction.type}">
        <div class="transaction-icon">
          ${this.getTransactionIcon(transaction.type)}
        </div>
        <div class="transaction-details">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-date">${this.formatDate(transaction.date)}</div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'credit' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
        </div>
      </div>
    `).join('');
  }

  getTransactionIcon(type) {
    const icons = {
      credit: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/></svg>',
      debit: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 8a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 014 8z"/></svg>',
      offer: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2.5 2.5 0 012.5 2.5V4h-5v-.5A2.5 2.5 0 018 1zm3.5 3v-.5a3.5 3.5 0 10-7 0V4H1v10a2 2 0 002 2h10a2 2 0 002-2V4h-3.5z"/></svg>',
      refund: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/></svg>'
    };
    return icons[type] || icons.debit;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  calculateMonthlySpending() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'debit' && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  calculateTotalSpending() {
    return this.transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  getAutoDeductionSetting() {
    return localStorage.getItem('walletAutoDeduction') === 'true';
  }

  toggleWallet() {
    const dropdown = document.getElementById('walletDropdown');
    if (!dropdown) return;

    this.isOpen = !this.isOpen;
    dropdown.style.display = this.isOpen ? 'block' : 'none';

    // Close when clicking outside
    if (this.isOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
      }, 100);
    }
  }

  handleOutsideClick(event) {
    const walletWidget = document.getElementById('walletWidget');
    if (walletWidget && !walletWidget.contains(event.target)) {
      this.toggleWallet();
    }
  }

  async openFundModal() {
    if (this.fundingModal) {
      this.fundingModal.open();
      return;
    }

    // Create funding modal
    const modalHTML = `
      <div class="fund-wallet-modal-overlay" id="fundWalletModalOverlay">
        <div class="fund-wallet-modal">
          <div class="fund-wallet-header">
            <h3>Add Funds to Wallet</h3>
            <button class="modal-close" onclick="window.walletManager.closeFundModal()">
              <span>&times;</span>
            </button>
          </div>
          
          <div class="fund-wallet-content">
            <div class="funding-amount-section">
              <label class="form-label">Amount to Add</label>
              <div class="amount-input-group">
                <span class="currency-symbol">$</span>
                <input type="number" id="fundingAmount" placeholder="0.00" min="10" max="5000" step="0.01">
              </div>
              <div class="amount-suggestions">
                <button class="amount-btn" onclick="window.walletManager.setFundingAmount(25)">$25</button>
                <button class="amount-btn" onclick="window.walletManager.setFundingAmount(50)">$50</button>
                <button class="amount-btn" onclick="window.walletManager.setFundingAmount(100)">$100</button>
                <button class="amount-btn" onclick="window.walletManager.setFundingAmount(250)">$250</button>
              </div>
            </div>
            
            <div class="payment-method-section">
              <label class="form-label">Payment Method</label>
              <div class="payment-methods-list" id="paymentMethodsList">
                <div class="loading-payment-methods">
                  <div class="loading-spinner"></div>
                  <span>Loading payment methods...</span>
                </div>
              </div>
              <button class="btn btn-outline add-payment-method" onclick="window.paymentModal.open()">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
                </svg>
                Add New Payment Method
              </button>
            </div>
            
            <div class="fund-wallet-actions">
              <button class="btn btn-secondary" onclick="window.walletManager.closeFundModal()">
                Cancel
              </button>
              <button class="btn btn-primary" id="fundWalletButton" onclick="window.walletManager.processFunding()">
                Add Funds
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.classList.add('modal-open');
    
    // Load payment methods
    this.loadPaymentMethods();
  }

  closeFundModal() {
    const modal = document.getElementById('fundWalletModalOverlay');
    if (modal) {
      modal.remove();
      document.body.classList.remove('modal-open');
    }
  }

  setFundingAmount(amount) {
    const input = document.getElementById('fundingAmount');
    if (input) {
      input.value = amount;
      input.focus();
    }
  }

  async loadPaymentMethods() {
    try {
      const response = await window.paymentModal.loadSavedPaymentMethods();
      const paymentMethodsList = document.getElementById('paymentMethodsList');
      
      if (!paymentMethodsList) return;

      if (response.length === 0) {
        paymentMethodsList.innerHTML = `
          <div class="no-payment-methods">
            <p>No payment methods found</p>
            <small>Add a payment method to fund your wallet</small>
          </div>
        `;
        return;
      }

      paymentMethodsList.innerHTML = response.map((method, index) => `
        <div class="payment-method-item" data-method-id="${method.id}">
          <div class="payment-method-info">
            <div class="payment-method-icon">
              ${this.getPaymentMethodIcon(method.brand)}
            </div>
            <div class="payment-method-details">
              <span class="payment-method-brand">${method.brand.toUpperCase()}</span>
              <span class="payment-method-last4">•••• ${method.last4}</span>
            </div>
          </div>
          <div class="payment-method-actions">
            <input type="radio" name="selectedPaymentMethod" value="${method.id}" ${index === 0 ? 'checked' : ''}>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Failed to load payment methods:', error);
      const paymentMethodsList = document.getElementById('paymentMethodsList');
      if (paymentMethodsList) {
        paymentMethodsList.innerHTML = `
          <div class="error-loading-methods">
            <p>Failed to load payment methods</p>
            <button class="btn btn-link" onclick="window.walletManager.loadPaymentMethods()">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  getPaymentMethodIcon(brand) {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      default: '💳'
    };
    return icons[brand?.toLowerCase()] || icons.default;
  }

  async processFunding() {
    const amount = parseFloat(document.getElementById('fundingAmount')?.value);
    const selectedMethod = document.querySelector('input[name="selectedPaymentMethod"]:checked')?.value;
    const button = document.getElementById('fundWalletButton');

    if (!amount || amount < 10) {
      alert('Please enter an amount of at least $10');
      return;
    }

    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    // Show loading state
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<div class="loading-spinner"></div> Processing...';

    try {
      const response = await window.axeesAPI.fundWallet({
        amount: amount,
        paymentMethodId: selectedMethod
      });

      if (response.success) {
        this.currentBalance += amount;
        this.updateWalletDisplay();
        this.closeFundModal();
        
        // Add transaction to local state
        this.transactions.unshift({
          id: Date.now(),
          type: 'credit',
          amount: amount,
          description: 'Wallet funding',
          date: new Date().toISOString()
        });
        
        this.showSuccessMessage(`Successfully added $${amount.toFixed(2)} to your wallet!`);
      } else {
        throw new Error(response.message || 'Failed to fund wallet');
      }
    } catch (error) {
      console.error('Failed to fund wallet:', error);
      alert('Failed to add funds. Please try again.');
    } finally {
      // Reset button state
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  async toggleAutoDeduction() {
    const toggle = document.getElementById('autoDeductionToggle');
    const enabled = toggle?.checked || false;
    
    localStorage.setItem('walletAutoDeduction', enabled.toString());
    
    this.showSuccessMessage(
      `Auto-deduction ${enabled ? 'enabled' : 'disabled'}. ${
        enabled 
          ? 'Offer amounts will be automatically deducted from your wallet.' 
          : 'You will need to manually process payments for offers.'
      }`
    );
  }

  updateWalletDisplay() {
    const balanceElement = document.getElementById('walletBalance');
    if (balanceElement) {
      balanceElement.textContent = `$${this.currentBalance.toFixed(2)}`;
    }

    // Update balance in dropdown if open
    const dropdownBalance = document.querySelector('.balance-amount');
    if (dropdownBalance) {
      dropdownBalance.textContent = `$${this.currentBalance.toFixed(2)}`;
    }
  }

  showAllTransactions() {
    // Create full transaction history modal
    const modalHTML = `
      <div class="transaction-history-modal-overlay" id="transactionHistoryModal">
        <div class="transaction-history-modal">
          <div class="transaction-history-header">
            <h3>Transaction History</h3>
            <button class="modal-close" onclick="document.getElementById('transactionHistoryModal').remove()">
              <span>&times;</span>
            </button>
          </div>
          <div class="transaction-history-content">
            ${this.createTransactionsList()}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  showSuccessMessage(message) {
    // Create and show success toast
    const toast = document.createElement('div');
    toast.className = 'wallet-toast success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  attachEventListeners() {
    // Close dropdown when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggleWallet();
      }
    });
  }

  injectStyles() {
    if (document.getElementById('wallet-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'wallet-styles';
    styles.textContent = `
      .wallet-widget {
        position: relative;
        display: inline-block;
      }
      
      .wallet-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #e5e7eb;
        background: white;
      }
      
      .wallet-summary:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }
      
      .wallet-icon {
        color: #6b7280;
      }
      
      .wallet-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .wallet-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
      
      .wallet-balance {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .wallet-arrow {
        color: #9ca3af;
        transition: transform 0.2s;
      }
      
      .wallet-widget.open .wallet-arrow {
        transform: rotate(180deg);
      }
      
      .wallet-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 320px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        margin-top: 4px;
      }
      
      .wallet-header {
        padding: 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .wallet-header-content h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .wallet-current-balance {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .balance-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
      
      .balance-amount {
        font-size: 24px;
        font-weight: 700;
        color: #059669;
      }
      
      .wallet-actions {
        margin-top: 16px;
      }
      
      .wallet-stats {
        display: flex;
        gap: 16px;
        padding: 16px 20px;
        background: #f9fafb;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .stat-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
      
      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .wallet-transactions {
        padding: 20px;
      }
      
      .transactions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .transactions-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .btn-link {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 12px;
        cursor: pointer;
        text-decoration: none;
      }
      
      .btn-link:hover {
        text-decoration: underline;
      }
      
      .transactions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .transaction-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }
      
      .transaction-item:hover {
        background: #f9fafb;
      }
      
      .transaction-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      
      .transaction-item.credit .transaction-icon {
        background: #d1fae5;
        color: #059669;
      }
      
      .transaction-item.debit .transaction-icon {
        background: #fee2e2;
        color: #dc2626;
      }
      
      .transaction-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .transaction-description {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }
      
      .transaction-date {
        font-size: 12px;
        color: #6b7280;
      }
      
      .transaction-amount {
        font-size: 14px;
        font-weight: 600;
      }
      
      .transaction-amount.credit {
        color: #059669;
      }
      
      .transaction-amount.debit {
        color: #dc2626;
      }
      
      .no-transactions {
        text-align: center;
        padding: 24px;
        color: #6b7280;
      }
      
      .no-transactions-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .auto-deduction-section {
        padding: 20px;
        border-top: 1px solid #f3f4f6;
        background: #f9fafb;
      }
      
      .auto-deduction-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .auto-deduction-header h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }
      
      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .toggle-slider {
        background-color: #3b82f6;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }
      
      .auto-deduction-description {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
        margin: 0;
      }
      
      /* Fund Modal Styles */
      .fund-wallet-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      
      .fund-wallet-modal {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .fund-wallet-header {
        padding: 24px 24px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 24px;
      }
      
      .fund-wallet-content {
        padding: 0 24px 24px;
      }
      
      .funding-amount-section {
        margin-bottom: 24px;
      }
      
      .amount-input-group {
        position: relative;
        margin-bottom: 12px;
      }
      
      .currency-symbol {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
        font-weight: 500;
      }
      
      .amount-input-group input {
        width: 100%;
        padding: 12px 12px 12px 28px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
      }
      
      .amount-suggestions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .amount-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }
      
      .amount-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      
      .payment-method-section {
        margin-bottom: 24px;
      }
      
      .payment-methods-list {
        margin-bottom: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .payment-method-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .payment-method-item:last-child {
        border-bottom: none;
      }
      
      .payment-method-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .payment-method-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .payment-method-brand {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }
      
      .payment-method-last4 {
        font-size: 14px;
        color: #6b7280;
      }
      
      .add-payment-method {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        justify-content: center;
      }
      
      .fund-wallet-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .wallet-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 10001;
      }
      
      .wallet-toast.show {
        transform: translateX(0);
      }
      
      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #f3f4f6;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize wallet manager
window.walletManager = new WalletManager();