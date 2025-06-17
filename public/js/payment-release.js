/**
 * Payment Release Manager
 * Handles milestone payment releases with manual override controls
 */

class PaymentReleaseManager {
  constructor() {
    this.currentDeal = null;
    this.currentMilestone = null;
    this.isProcessing = false;
    
    this.initialize();
  }

  initialize() {
    this.createPaymentReleaseModal();
    this.setupEventListeners();
  }

  /**
   * Create payment release modal
   */
  createPaymentReleaseModal() {
    if (document.getElementById('payment-release-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'payment-release-modal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content payment-release-content">
        <div class="modal-header">
          <h2>Payment Release Control</h2>
          <button class="close-btn" onclick="window.paymentReleaseManager.close()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="release-info">
            <div class="info-section">
              <h3>Deal Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Deal Title:</label>
                  <span id="release-deal-title">-</span>
                </div>
                <div class="info-item">
                  <label>Marketer:</label>
                  <span id="release-marketer">-</span>
                </div>
                <div class="info-item">
                  <label>Creator:</label>
                  <span id="release-creator">-</span>
                </div>
                <div class="info-item">
                  <label>Total Escrowed:</label>
                  <span id="release-total-escrowed">-</span>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Milestone Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>Milestone:</label>
                  <span id="release-milestone-title">-</span>
                </div>
                <div class="info-item">
                  <label>Amount:</label>
                  <span id="release-milestone-amount">-</span>
                </div>
                <div class="info-item">
                  <label>Due Date:</label>
                  <span id="release-milestone-date">-</span>
                </div>
                <div class="info-item">
                  <label>Status:</label>
                  <span id="release-milestone-status">-</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="release-controls">
            <div class="control-section">
              <h3>Release Options</h3>
              
              <div class="release-type-selector">
                <label class="radio-option">
                  <input type="radio" name="releaseType" value="automatic" checked>
                  <span class="radio-label">Automatic Release</span>
                  <p class="radio-description">Release payment when milestone is marked complete by creator</p>
                </label>
                
                <label class="radio-option">
                  <input type="radio" name="releaseType" value="manual">
                  <span class="radio-label">Manual Review Required</span>
                  <p class="radio-description">Hold payment for manual approval by marketer</p>
                </label>
                
                <label class="radio-option">
                  <input type="radio" name="releaseType" value="immediate">
                  <span class="radio-label">Immediate Release</span>
                  <p class="radio-description">Release payment immediately (override protection)</p>
                </label>
                
                <label class="radio-option">
                  <input type="radio" name="releaseType" value="partial">
                  <span class="radio-label">Partial Release</span>
                  <p class="radio-description">Release a portion of the milestone payment</p>
                </label>
              </div>
              
              <div class="partial-amount-input" id="partial-amount-section" style="display: none;">
                <label for="partial-amount">Partial Amount ($):</label>
                <input type="number" id="partial-amount" min="0" step="0.01" placeholder="Enter amount to release">
                <p class="input-hint">Enter the amount to release now. Remaining funds will be held in escrow.</p>
              </div>
              
              <div class="release-reason">
                <label for="release-reason">Reason for Release Action:</label>
                <textarea id="release-reason" rows="3" placeholder="Provide a reason for this payment action (required for manual overrides)"></textarea>
              </div>
            </div>
            
            <div class="control-section">
              <h3>Security Verification</h3>
              <div class="security-checks">
                <label class="checkbox-option">
                  <input type="checkbox" id="verify-completion">
                  <span class="checkbox-label">I have verified milestone completion</span>
                </label>
                
                <label class="checkbox-option">
                  <input type="checkbox" id="verify-quality">
                  <span class="checkbox-label">I confirm work meets quality standards</span>
                </label>
                
                <label class="checkbox-option" id="admin-override-section" style="display: none;">
                  <input type="checkbox" id="admin-override">
                  <span class="checkbox-label">Admin override (bypasses normal flow)</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="release-schedule">
            <h3>Automatic Release Schedule</h3>
            <div id="automatic-release-schedule">
              <!-- Automatic release schedule will be populated here -->
            </div>
          </div>
          
          <div class="payment-history">
            <h3>Payment History</h3>
            <div id="payment-history-list">
              <!-- Payment history will be populated here -->
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.paymentReleaseManager.close()">
            Cancel
          </button>
          <button class="btn btn-primary" onclick="window.paymentReleaseManager.processPayment()" id="process-payment-btn">
            Process Payment
          </button>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .payment-release-content {
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .release-info {
        margin-bottom: 32px;
      }

      .info-section {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--gray-50);
        border-radius: 8px;
      }

      .info-section h3 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .info-item span {
        font-weight: 600;
        color: var(--text-primary);
      }

      .control-section {
        margin-bottom: 32px;
        padding: 20px;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
      }

      .control-section h3 {
        margin: 0 0 20px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .release-type-selector {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 20px;
      }

      .radio-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border: 2px solid var(--gray-200);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .radio-option:hover {
        border-color: var(--primary-color);
      }

      .radio-option input[type="radio"] {
        margin: 2px 0 0 0;
      }

      .radio-option input[type="radio"]:checked + .radio-label {
        color: var(--primary-color);
        font-weight: 600;
      }

      .radio-option:has(input[type="radio"]:checked) {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.05);
      }

      .radio-label {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .radio-description {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
      }

      .partial-amount-input {
        margin-bottom: 20px;
        padding: 16px;
        background: var(--gray-50);
        border-radius: 8px;
      }

      .partial-amount-input label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .partial-amount-input input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--gray-300);
        border-radius: 6px;
        font-size: 14px;
      }

      .input-hint {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .release-reason label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .release-reason textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--gray-300);
        border-radius: 6px;
        font-size: 14px;
        resize: vertical;
      }

      .security-checks {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .checkbox-option {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .checkbox-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .release-schedule {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--gray-200);
      }

      .release-schedule h3 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .schedule-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        margin-bottom: 8px;
        background: var(--gray-50);
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
      }

      .schedule-details {
        flex: 1;
      }

      .schedule-type {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .schedule-date {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .schedule-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background: var(--success);
        color: white;
      }

      .schedule-status.pending {
        background: var(--warning);
      }

      .payment-history {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--gray-200);
      }

      .payment-history h3 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }

      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--gray-100);
      }

      .history-item:last-child {
        border-bottom: none;
      }

      .history-details {
        flex: 1;
      }

      .history-action {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .history-meta {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .history-amount {
        font-weight: 600;
        color: var(--success);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 24px;
        border-top: 1px solid var(--gray-200);
        background: var(--gray-50);
      }

      @media (max-width: 768px) {
        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(modal);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close on backdrop click
    const modal = document.getElementById('payment-release-modal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Release type change handler
    document.addEventListener('change', (e) => {
      if (e.target.name === 'releaseType') {
        this.handleReleaseTypeChange(e.target.value);
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        this.close();
      }
    });
  }

  /**
   * Open payment release modal for a milestone
   */
  async open(dealId, milestoneId) {
    try {
      // Load deal and milestone data
      const dealResponse = await window.axeesAPI.getDealById(dealId);
      if (!dealResponse.success) {
        alert('Failed to load deal information');
        return;
      }

      this.currentDeal = dealResponse.deal;
      this.currentMilestone = this.currentDeal.milestones.find(m => m._id === milestoneId);

      if (!this.currentMilestone) {
        alert('Milestone not found');
        return;
      }

      // Populate modal with data
      this.populateModalData();
      
      // Load payment history and automatic release schedule
      await Promise.all([
        this.loadPaymentHistory(),
        this.loadAutomaticReleaseSchedule()
      ]);

      // Show modal
      const modal = document.getElementById('payment-release-modal');
      modal.style.display = 'block';

    } catch (error) {
      console.error('Failed to open payment release modal:', error);
      alert('Failed to load payment information');
    }
  }

  /**
   * Populate modal with deal and milestone data
   */
  populateModalData() {
    document.getElementById('release-deal-title').textContent = 
      this.currentDeal.dealName || this.currentDeal.title || 'Untitled Deal';
    
    document.getElementById('release-marketer').textContent = 
      this.currentDeal.marketerName || 'Unknown Marketer';
    
    document.getElementById('release-creator').textContent = 
      this.currentDeal.creatorName || 'Unknown Creator';
    
    document.getElementById('release-total-escrowed').textContent = 
      `$${(this.currentDeal.paymentInfo?.totalEscrowed || 0).toLocaleString()}`;
    
    document.getElementById('release-milestone-title').textContent = 
      this.currentMilestone.title || 'Untitled Milestone';
    
    document.getElementById('release-milestone-amount').textContent = 
      `$${(this.currentMilestone.amount || 0).toLocaleString()}`;
    
    document.getElementById('release-milestone-date').textContent = 
      this.currentMilestone.dueDate ? new Date(this.currentMilestone.dueDate).toLocaleDateString() : 'No due date';
    
    document.getElementById('release-milestone-status').textContent = 
      this.formatStatus(this.currentMilestone.status);

    // Show admin override if user has admin privileges
    if (window.authContext?.user?.role === 'admin') {
      document.getElementById('admin-override-section').style.display = 'flex';
    }

    // Set max partial amount
    const partialAmountInput = document.getElementById('partial-amount');
    partialAmountInput.max = this.currentMilestone.amount || 0;
  }

  /**
   * Load payment history for the milestone
   */
  async loadPaymentHistory() {
    try {
      const response = await window.axeesAPI.getPaymentHistory(this.currentDeal._id, this.currentMilestone._id);
      const historyContainer = document.getElementById('payment-history-list');

      if (response.success && response.history && response.history.length > 0) {
        historyContainer.innerHTML = response.history.map(item => `
          <div class="history-item">
            <div class="history-details">
              <div class="history-action">${item.action}</div>
              <div class="history-meta">
                ${new Date(item.timestamp).toLocaleDateString()} • ${item.performedBy || 'System'}
                ${item.reason ? ` • ${item.reason}` : ''}
              </div>
            </div>
            <div class="history-amount">$${item.amount.toLocaleString()}</div>
          </div>
        `).join('');
      } else {
        historyContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No payment history available</p>';
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
      document.getElementById('payment-history-list').innerHTML = 
        '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Failed to load payment history</p>';
    }
  }

  /**
   * Load automatic release schedule for the deal
   */
  async loadAutomaticReleaseSchedule() {
    try {
      const response = await window.axeesAPI.getAutomaticReleaseSchedule(this.currentDeal._id);
      const scheduleContainer = document.getElementById('automatic-release-schedule');

      if (response.success && response.schedule && response.schedule.length > 0) {
        scheduleContainer.innerHTML = response.schedule.map(item => {
          const statusClass = item.status === 'active' ? '' : 'pending';
          const releaseDate = new Date(item.releaseDate).toLocaleDateString();
          const releaseTime = new Date(item.releaseDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          
          return `
            <div class="schedule-item">
              <div class="schedule-details">
                <div class="schedule-type">${item.type || 'Automatic Release'}</div>
                <div class="schedule-date">${releaseDate} at ${releaseTime}</div>
              </div>
              <div class="schedule-status ${statusClass}">${item.status || 'pending'}</div>
            </div>
          `;
        }).join('');
      } else {
        scheduleContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No automatic release schedule configured</p>';
      }
    } catch (error) {
      console.error('Failed to load automatic release schedule:', error);
      document.getElementById('automatic-release-schedule').innerHTML = 
        '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Failed to load release schedule</p>';
    }
  }

  /**
   * Handle release type change
   */
  handleReleaseTypeChange(releaseType) {
    const partialSection = document.getElementById('partial-amount-section');
    partialSection.style.display = releaseType === 'partial' ? 'block' : 'none';

    // Update button text based on release type
    const button = document.getElementById('process-payment-btn');
    const buttonText = {
      'automatic': 'Enable Automatic Release',
      'manual': 'Require Manual Review',
      'immediate': 'Release Payment Now',
      'partial': 'Release Partial Payment'
    };
    
    button.textContent = buttonText[releaseType] || 'Process Payment';
  }

  /**
   * Process payment release
   */
  async processPayment() {
    if (this.isProcessing) return;

    // Validate form
    const releaseType = document.querySelector('input[name="releaseType"]:checked').value;
    const reason = document.getElementById('release-reason').value;
    const verifyCompletion = document.getElementById('verify-completion').checked;
    const verifyQuality = document.getElementById('verify-quality').checked;

    // Validation
    if (releaseType === 'immediate' && !reason.trim()) {
      alert('Please provide a reason for immediate release');
      return;
    }

    if ((releaseType === 'immediate' || releaseType === 'manual') && (!verifyCompletion || !verifyQuality)) {
      alert('Please verify milestone completion and quality before proceeding');
      return;
    }

    if (releaseType === 'partial') {
      const partialAmount = parseFloat(document.getElementById('partial-amount').value);
      if (!partialAmount || partialAmount <= 0 || partialAmount > this.currentMilestone.amount) {
        alert('Please enter a valid partial amount');
        return;
      }
    }

    this.isProcessing = true;
    const button = document.getElementById('process-payment-btn');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
      const paymentData = {
        dealId: this.currentDeal._id,
        milestoneId: this.currentMilestone._id,
        releaseType,
        reason: reason.trim(),
        amount: releaseType === 'partial' ? parseFloat(document.getElementById('partial-amount').value) : this.currentMilestone.amount,
        adminOverride: document.getElementById('admin-override')?.checked || false
      };

      const response = await window.axeesAPI.processPaymentRelease(paymentData);

      if (response.success) {
        alert('Payment processed successfully!');
        this.close();
        
        // Refresh the page or update UI
        if (window.dealManager) {
          window.dealManager.loadDeals();
        }
        if (window.milestoneManager) {
          window.milestoneManager.refresh();
        }
      } else {
        throw new Error(response.message || 'Payment processing failed');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Failed to process payment: ' + error.message);
    } finally {
      this.isProcessing = false;
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  /**
   * Close modal
   */
  close() {
    const modal = document.getElementById('payment-release-modal');
    modal.style.display = 'none';
    
    // Reset form
    document.querySelector('input[name="releaseType"][value="automatic"]').checked = true;
    document.getElementById('partial-amount-section').style.display = 'none';
    document.getElementById('release-reason').value = '';
    document.getElementById('verify-completion').checked = false;
    document.getElementById('verify-quality').checked = false;
    if (document.getElementById('admin-override')) {
      document.getElementById('admin-override').checked = false;
    }
  }

  /**
   * Helper methods
   */
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'paid': 'Paid',
      'overdue': 'Overdue'
    };
    return statusMap[status] || status;
  }
}

// Helper function to add payment release button to milestone cards
window.addPaymentReleaseButton = function(dealId, milestoneId, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const button = document.createElement('button');
  button.className = 'btn btn-secondary payment-release-btn';
  button.innerHTML = '💰 Manage Payment';
  button.onclick = () => window.paymentReleaseManager.open(dealId, milestoneId);
  
  container.appendChild(button);
};

// Initialize payment release manager
window.paymentReleaseManager = new PaymentReleaseManager();