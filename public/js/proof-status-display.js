/**
 * Proof Status Display - Integration with Milestone and Deal Management UI
 * Shows proof submission status and actions within existing milestone interfaces
 */

class ProofStatusDisplay {
  constructor() {
    this.proofStatuses = new Map();
    this.refreshIntervals = new Map();
    
    this.initialize();
  }

  /**
   * Initialize proof status display system
   */
  initialize() {
    this.setupEventListeners();
    this.injectStyles();
    this.startAutoRefresh();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for milestone updates
    document.addEventListener('milestone-updated', this.handleMilestoneUpdate.bind(this));
    document.addEventListener('milestone-payment-updated', this.handlePaymentUpdate.bind(this));
    
    // Listen for proof events
    document.addEventListener('proof-submitted', this.handleProofSubmitted.bind(this));
    document.addEventListener('proof-approved', this.handleProofApproved.bind(this));
    document.addEventListener('proof-rejected', this.handleProofRejected.bind(this));
    document.addEventListener('proof-changes-requested', this.handleChangesRequested.bind(this));
  }

  /**
   * Add proof status display to milestone element
   */
  addProofStatusToMilestone(milestoneElement, milestoneId, dealId) {
    if (!milestoneElement || !milestoneId) return;

    // Check if proof status already exists
    if (milestoneElement.querySelector('.proof-status-container')) {
      this.updateProofStatus(milestoneId);
      return;
    }

    // Create proof status container
    const proofStatusContainer = document.createElement('div');
    proofStatusContainer.className = 'proof-status-container';
    proofStatusContainer.setAttribute('data-milestone-id', milestoneId);
    proofStatusContainer.setAttribute('data-deal-id', dealId);

    proofStatusContainer.innerHTML = `
      <div class="proof-status-header">
        <span class="proof-status-label">Proof Status</span>
        <div class="proof-status-actions" id="proofActions-${milestoneId}">
          <!-- Actions will be populated based on status -->
        </div>
      </div>
      <div class="proof-status-content" id="proofStatus-${milestoneId}">
        <div class="proof-status-loading">
          <div class="loading-spinner"></div>
          <span>Loading proof status...</span>
        </div>
      </div>
    `;

    // Find the best place to insert proof status
    const milestoneContent = milestoneElement.querySelector('.milestone-content') || 
                             milestoneElement.querySelector('.milestone-body') || 
                             milestoneElement;
    
    milestoneContent.appendChild(proofStatusContainer);

    // Load proof status
    this.loadProofStatus(milestoneId, dealId);
  }

  /**
   * Load proof status for a milestone
   */
  async loadProofStatus(milestoneId, dealId) {
    try {
      const response = await window.axeesAPI.request(`/proof-submissions/milestone/${milestoneId}`);
      
      if (response.success) {
        this.proofStatuses.set(milestoneId, response.submissions || []);
        this.renderProofStatus(milestoneId, dealId, response.submissions || []);
      } else {
        this.renderEmptyProofStatus(milestoneId, dealId);
      }
      
    } catch (error) {
      console.error('Failed to load proof status:', error);
      this.renderErrorProofStatus(milestoneId, error.message);
    }
  }

  /**
   * Render proof status based on submissions
   */
  renderProofStatus(milestoneId, dealId, submissions) {
    const contentElement = document.getElementById(`proofStatus-${milestoneId}`);
    const actionsElement = document.getElementById(`proofActions-${milestoneId}`);
    
    if (!contentElement) return;

    if (submissions.length === 0) {
      this.renderEmptyProofStatus(milestoneId, dealId);
      return;
    }

    // Get the latest submission
    const latestSubmission = submissions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    // Render based on latest submission status
    switch (latestSubmission.status) {
      case 'pending':
        this.renderPendingProofStatus(contentElement, actionsElement, latestSubmission, milestoneId, dealId);
        break;
      case 'approved':
        this.renderApprovedProofStatus(contentElement, actionsElement, latestSubmission, milestoneId, dealId);
        break;
      case 'rejected':
        this.renderRejectedProofStatus(contentElement, actionsElement, latestSubmission, milestoneId, dealId);
        break;
      case 'changes_requested':
        this.renderChangesRequestedStatus(contentElement, actionsElement, latestSubmission, milestoneId, dealId);
        break;
      default:
        this.renderEmptyProofStatus(milestoneId, dealId);
    }

    // Show submission history if multiple submissions
    if (submissions.length > 1) {
      this.addSubmissionHistory(contentElement, submissions);
    }
  }

  /**
   * Render empty proof status (no submissions)
   */
  renderEmptyProofStatus(milestoneId, dealId) {
    const contentElement = document.getElementById(`proofStatus-${milestoneId}`);
    const actionsElement = document.getElementById(`proofActions-${milestoneId}`);
    
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="proof-status-empty">
        <div class="status-icon empty">📝</div>
        <div class="status-text">
          <strong>No proof submitted</strong>
          <p>Upload evidence when milestone work is complete</p>
        </div>
      </div>
    `;

    // Add submit button for creators
    if (window.authContext && !window.authContext.isMarketer()) {
      actionsElement.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="submitProofForMilestone('${dealId}', '${milestoneId}')">
          📤 Submit Proof
        </button>
      `;
    } else {
      actionsElement.innerHTML = `
        <span class="action-note">Waiting for creator to submit proof</span>
      `;
    }
  }

  /**
   * Render pending proof status
   */
  renderPendingProofStatus(contentElement, actionsElement, submission, milestoneId, dealId) {
    const submittedDate = new Date(submission.createdAt).toLocaleDateString();
    
    contentElement.innerHTML = `
      <div class="proof-status-pending">
        <div class="status-icon pending">⏳</div>
        <div class="status-text">
          <strong>Proof under review</strong>
          <p>Submitted on ${submittedDate}</p>
          ${submission.files ? `<div class="file-count">${submission.files.length} file(s) submitted</div>` : ''}
        </div>
      </div>
    `;

    // Add actions based on user role
    if (window.authContext && window.authContext.isMarketer()) {
      actionsElement.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="reviewProofSubmission('${submission._id}')">
          👁️ Review Proof
        </button>
      `;
    } else {
      actionsElement.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
          👁️ View Submission
        </button>
      `;
    }
  }

  /**
   * Render approved proof status
   */
  renderApprovedProofStatus(contentElement, actionsElement, submission, milestoneId, dealId) {
    const approvedDate = submission.reviewedAt ? 
      new Date(submission.reviewedAt).toLocaleDateString() : 'Recently';
    
    contentElement.innerHTML = `
      <div class="proof-status-approved">
        <div class="status-icon approved">✅</div>
        <div class="status-text">
          <strong>Proof approved</strong>
          <p>Approved on ${approvedDate}</p>
          <div class="payment-status" id="paymentStatus-${milestoneId}">
            Processing payment release...
          </div>
        </div>
      </div>
    `;

    // Add view actions
    actionsElement.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
        👁️ View Proof
      </button>
    `;

    // Check payment release status
    this.checkPaymentReleaseStatus(milestoneId);
  }

  /**
   * Render rejected proof status
   */
  renderRejectedProofStatus(contentElement, actionsElement, submission, milestoneId, dealId) {
    const rejectedDate = submission.reviewedAt ? 
      new Date(submission.reviewedAt).toLocaleDateString() : 'Recently';
    
    contentElement.innerHTML = `
      <div class="proof-status-rejected">
        <div class="status-icon rejected">❌</div>
        <div class="status-text">
          <strong>Proof rejected</strong>
          <p>Rejected on ${rejectedDate}</p>
          ${submission.feedback ? `<div class="feedback-preview">"${submission.feedback.substring(0, 100)}..."</div>` : ''}
        </div>
      </div>
    `;

    // Add actions based on user role
    if (window.authContext && window.authContext.isMarketer()) {
      actionsElement.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
          👁️ View Details
        </button>
      `;
    } else {
      actionsElement.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="submitProofForMilestone('${dealId}', '${milestoneId}')">
          📤 Resubmit Proof
        </button>
        <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
          👁️ View Feedback
        </button>
      `;
    }
  }

  /**
   * Render changes requested status
   */
  renderChangesRequestedStatus(contentElement, actionsElement, submission, milestoneId, dealId) {
    const requestedDate = submission.reviewedAt ? 
      new Date(submission.reviewedAt).toLocaleDateString() : 'Recently';
    
    contentElement.innerHTML = `
      <div class="proof-status-changes">
        <div class="status-icon changes">🔄</div>
        <div class="status-text">
          <strong>Changes requested</strong>
          <p>Feedback provided on ${requestedDate}</p>
          ${submission.feedback ? `<div class="feedback-preview">"${submission.feedback.substring(0, 100)}..."</div>` : ''}
        </div>
      </div>
    `;

    // Add actions based on user role
    if (window.authContext && window.authContext.isMarketer()) {
      actionsElement.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
          👁️ View Details
        </button>
      `;
    } else {
      actionsElement.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="submitProofForMilestone('${dealId}', '${milestoneId}')">
          📤 Submit Revised Proof
        </button>
        <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.viewSubmissionDetails('${submission._id}')">
          👁️ View Feedback
        </button>
      `;
    }
  }

  /**
   * Render error proof status
   */
  renderErrorProofStatus(milestoneId, errorMessage) {
    const contentElement = document.getElementById(`proofStatus-${milestoneId}`);
    const actionsElement = document.getElementById(`proofActions-${milestoneId}`);
    
    if (!contentElement) return;

    contentElement.innerHTML = `
      <div class="proof-status-error">
        <div class="status-icon error">⚠️</div>
        <div class="status-text">
          <strong>Error loading proof status</strong>
          <p>${errorMessage}</p>
        </div>
      </div>
    `;

    actionsElement.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="proofStatusDisplay.loadProofStatus('${milestoneId}')">
        🔄 Retry
      </button>
    `;
  }

  /**
   * Add submission history
   */
  addSubmissionHistory(contentElement, submissions) {
    const historyContainer = document.createElement('div');
    historyContainer.className = 'proof-submission-history';
    
    historyContainer.innerHTML = `
      <div class="history-header">
        <span class="history-label">Previous submissions (${submissions.length - 1})</span>
        <button class="btn btn-link btn-sm history-toggle" onclick="proofStatusDisplay.toggleHistory(this)">
          Show
        </button>
      </div>
      <div class="history-content" style="display: none;">
        ${submissions.slice(1).map(submission => `
          <div class="history-item">
            <div class="history-status ${submission.status}">${this.getStatusLabel(submission.status)}</div>
            <div class="history-date">${new Date(submission.createdAt).toLocaleDateString()}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    contentElement.appendChild(historyContainer);
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status) {
    const labels = {
      'pending': '⏳ Pending',
      'approved': '✅ Approved',
      'rejected': '❌ Rejected',
      'changes_requested': '🔄 Changes Requested'
    };
    return labels[status] || status;
  }

  /**
   * Toggle submission history
   */
  toggleHistory(button) {
    const historyContent = button.closest('.proof-submission-history').querySelector('.history-content');
    const isVisible = historyContent.style.display !== 'none';
    
    historyContent.style.display = isVisible ? 'none' : 'block';
    button.textContent = isVisible ? 'Show' : 'Hide';
  }

  /**
   * View submission details
   */
  async viewSubmissionDetails(submissionId) {
    try {
      const response = await window.axeesAPI.request(`/proof-submissions/${submissionId}`);
      
      if (response.success) {
        this.showSubmissionModal(response.submission);
      } else {
        throw new Error(response.message || 'Failed to load submission');
      }
      
    } catch (error) {
      console.error('Failed to load submission details:', error);
      if (window.showNotification) {
        window.showNotification('Failed to load submission details: ' + error.message, 'error');
      }
    }
  }

  /**
   * Show submission details in modal
   */
  showSubmissionModal(submission) {
    const modal = document.createElement('div');
    modal.className = 'submission-modal';
    modal.innerHTML = `
      <div class="submission-modal-overlay" onclick="this.closest('.submission-modal').remove()"></div>
      <div class="submission-modal-container">
        <div class="submission-modal-header">
          <h3>Proof Submission Details</h3>
          <button onclick="this.closest('.submission-modal').remove()">&times;</button>
        </div>
        <div class="submission-modal-body">
          <div class="submission-info">
            <div class="info-item">
              <strong>Status:</strong> ${this.getStatusLabel(submission.status)}
            </div>
            <div class="info-item">
              <strong>Submitted:</strong> ${new Date(submission.createdAt).toLocaleString()}
            </div>
            ${submission.reviewedAt ? `
              <div class="info-item">
                <strong>Reviewed:</strong> ${new Date(submission.reviewedAt).toLocaleString()}
              </div>
            ` : ''}
          </div>
          
          ${submission.description ? `
            <div class="submission-description">
              <strong>Description:</strong>
              <p>${submission.description}</p>
            </div>
          ` : ''}
          
          ${submission.feedback ? `
            <div class="submission-feedback">
              <strong>Feedback:</strong>
              <p>${submission.feedback}</p>
            </div>
          ` : ''}
          
          ${submission.files && submission.files.length > 0 ? `
            <div class="submission-files">
              <strong>Files:</strong>
              <div class="files-grid">
                ${submission.files.map(file => `
                  <div class="file-item" onclick="window.open('${file.url}', '_blank')">
                    <div class="file-icon">${this.getFileIcon(file.mimetype)}</div>
                    <div class="file-name">${file.originalName}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimetype) {
    if (mimetype?.includes('image')) return '🖼️';
    if (mimetype?.includes('video')) return '🎥';
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('document')) return '📝';
    return '📎';
  }

  /**
   * Check payment release status
   */
  async checkPaymentReleaseStatus(milestoneId) {
    const statusElement = document.getElementById(`paymentStatus-${milestoneId}`);
    if (!statusElement) return;

    try {
      // Check if payment integration is available
      if (window.proofPaymentIntegration) {
        const releaseStatus = window.proofPaymentIntegration.getPaymentReleaseStatus(milestoneId);
        
        if (releaseStatus.status === 'processing') {
          statusElement.textContent = 'Processing payment release...';
          statusElement.className = 'payment-status processing';
        } else {
          // Check actual payment status
          const response = await window.axeesAPI.request(`/milestone-payments/status/${milestoneId}`);
          
          if (response.success) {
            const status = response.status;
            
            switch (status.state) {
              case 'released':
                statusElement.textContent = `✅ Payment released: $${status.amount}`;
                statusElement.className = 'payment-status released';
                break;
              case 'pending':
                statusElement.textContent = 'Payment release pending...';
                statusElement.className = 'payment-status pending';
                break;
              case 'failed':
                statusElement.textContent = '❌ Payment release failed';
                statusElement.className = 'payment-status failed';
                break;
              default:
                statusElement.textContent = 'Checking payment status...';
                statusElement.className = 'payment-status checking';
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      statusElement.textContent = 'Payment status unavailable';
      statusElement.className = 'payment-status error';
    }
  }

  /**
   * Update proof status for a milestone
   */
  async updateProofStatus(milestoneId) {
    const container = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
    if (!container) return;

    const dealId = container.getAttribute('data-deal-id');
    await this.loadProofStatus(milestoneId, dealId);
  }

  /**
   * Handle milestone update events
   */
  handleMilestoneUpdate(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      this.updateProofStatus(milestoneId);
    }
  }

  /**
   * Handle payment update events
   */
  handlePaymentUpdate(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      this.checkPaymentReleaseStatus(milestoneId);
    }
  }

  /**
   * Handle proof submission events
   */
  handleProofSubmitted(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      setTimeout(() => this.updateProofStatus(milestoneId), 1000);
    }
  }

  /**
   * Handle proof approval events
   */
  handleProofApproved(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      setTimeout(() => this.updateProofStatus(milestoneId), 1000);
    }
  }

  /**
   * Handle proof rejection events
   */
  handleProofRejected(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      setTimeout(() => this.updateProofStatus(milestoneId), 1000);
    }
  }

  /**
   * Handle changes requested events
   */
  handleChangesRequested(event) {
    const { milestoneId } = event.detail;
    if (milestoneId) {
      setTimeout(() => this.updateProofStatus(milestoneId), 1000);
    }
  }

  /**
   * Start auto-refresh for pending statuses
   */
  startAutoRefresh() {
    setInterval(() => {
      document.querySelectorAll('.proof-status-pending, .proof-status-approved').forEach(element => {
        const container = element.closest('[data-milestone-id]');
        if (container) {
          const milestoneId = container.getAttribute('data-milestone-id');
          this.updateProofStatus(milestoneId);
        }
      });
    }, 30000); // Refresh every 30 seconds
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('proof-status-display-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'proof-status-display-styles';
    styles.textContent = `
      .proof-status-container {
        margin-top: 16px;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }

      .proof-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .proof-status-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .proof-status-actions {
        display: flex;
        gap: 8px;
      }

      .proof-status-content {
        min-height: 60px;
      }

      .proof-status-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 14px;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .proof-status-empty,
      .proof-status-pending,
      .proof-status-approved,
      .proof-status-rejected,
      .proof-status-changes,
      .proof-status-error {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .status-icon {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .status-text {
        flex: 1;
        min-width: 0;
      }

      .status-text strong {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
        color: #111827;
      }

      .status-text p {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }

      .file-count {
        font-size: 12px;
        color: #4b5563;
        margin-top: 4px;
      }

      .feedback-preview {
        font-size: 12px;
        color: #374151;
        background: white;
        padding: 8px;
        border-radius: 4px;
        margin-top: 4px;
        font-style: italic;
      }

      .payment-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        margin-top: 4px;
        display: inline-block;
      }

      .payment-status.processing {
        background: #fef3c7;
        color: #92400e;
      }

      .payment-status.released {
        background: #d1fae5;
        color: #065f46;
      }

      .payment-status.pending {
        background: #e0e7ff;
        color: #3730a3;
      }

      .payment-status.failed {
        background: #fee2e2;
        color: #991b1b;
      }

      .proof-submission-history {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .history-label {
        font-size: 12px;
        color: #6b7280;
      }

      .history-toggle {
        font-size: 12px;
        padding: 2px 6px;
        color: #6366f1;
        background: none;
        border: none;
        cursor: pointer;
      }

      .history-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        padding: 4px 8px;
        background: white;
        border-radius: 4px;
      }

      .history-status {
        font-weight: 500;
      }

      .history-status.approved {
        color: #059669;
      }

      .history-status.rejected {
        color: #dc2626;
      }

      .history-status.changes_requested {
        color: #d97706;
      }

      .history-date {
        color: #6b7280;
      }

      .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
      }

      .btn-link {
        background: none;
        color: #6366f1;
        border: none;
        cursor: pointer;
      }

      .action-note {
        font-size: 12px;
        color: #6b7280;
        font-style: italic;
      }

      /* Submission Modal */
      .submission-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .submission-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
      }

      .submission-modal-container {
        position: relative;
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .submission-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .submission-modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: #111827;
      }

      .submission-modal-header button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
      }

      .submission-modal-body {
        padding: 20px;
      }

      .submission-info {
        margin-bottom: 16px;
      }

      .info-item {
        margin-bottom: 8px;
        font-size: 14px;
      }

      .submission-description,
      .submission-feedback {
        margin-bottom: 16px;
      }

      .submission-description p,
      .submission-feedback p {
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        margin: 8px 0 0 0;
        font-size: 14px;
        line-height: 1.5;
      }

      .files-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 8px;
      }

      .file-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: #f8fafc;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .file-item:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      .file-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .file-name {
        font-size: 12px;
        color: #374151;
        text-align: center;
        word-break: break-word;
      }

      @media (max-width: 768px) {
        .proof-status-header {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }

        .proof-status-actions {
          justify-content: flex-end;
        }

        .files-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Initialize proof status for all visible milestones
   */
  initializeAllMilestones() {
    document.querySelectorAll('[data-milestone-id]').forEach(element => {
      const milestoneId = element.getAttribute('data-milestone-id');
      const dealId = element.getAttribute('data-deal-id');
      
      if (milestoneId && dealId) {
        this.addProofStatusToMilestone(element, milestoneId, dealId);
      }
    });
  }
}

// Initialize global proof status display
window.proofStatusDisplay = new ProofStatusDisplay();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.proofStatusDisplay.initializeAllMilestones();
});

// Utility function to add proof status to milestone
window.addProofStatusToMilestone = function(milestoneElement, milestoneId, dealId) {
  window.proofStatusDisplay.addProofStatusToMilestone(milestoneElement, milestoneId, dealId);
};