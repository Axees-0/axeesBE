/**
 * Proof Payment Integration - Automated Payment Release on Proof Approval
 * Connects proof approval workflow with payment release triggers
 */

class ProofPaymentIntegration {
  constructor() {
    this.pendingReleases = new Map();
    this.processingReleases = new Set();
    this.releaseCallbacks = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the proof-payment integration system
   */
  initialize() {
    this.setupEventListeners();
    this.initializePaymentReleaseMonitoring();
  }

  /**
   * Setup event listeners for proof approvals
   */
  setupEventListeners() {
    // Listen for proof approval events
    document.addEventListener('proof-approved', this.handleProofApproval.bind(this));
    document.addEventListener('proof-rejected', this.handleProofRejection.bind(this));
    document.addEventListener('proof-changes-requested', this.handleChangesRequested.bind(this));
    
    // Listen for payment release events
    document.addEventListener('payment-release-completed', this.handlePaymentReleaseCompleted.bind(this));
    document.addEventListener('payment-release-failed', this.handlePaymentReleaseFailed.bind(this));
  }

  /**
   * Handle proof approval and trigger payment release
   */
  async handleProofApproval(event) {
    const { submissionId, dealId, milestoneId, amount } = event.detail;
    
    try {
      // Check if payment release is already in progress
      if (this.processingReleases.has(milestoneId)) {
        return;
      }

      // Mark as processing
      this.processingReleases.add(milestoneId);

      // Trigger automatic payment release
      await this.triggerPaymentRelease(dealId, milestoneId, {
        reason: 'proof_approved',
        submissionId: submissionId,
        approvedAt: new Date().toISOString()
      });

    } catch (error) {
      this.processingReleases.delete(milestoneId);
      
      // Show error notification
      this.showNotification(
        'Proof approved but payment release failed. Please check payment settings.',
        'warning'
      );
    }
  }

  /**
   * Handle proof rejection
   */
  async handleProofRejection(event) {
    const { submissionId, dealId, milestoneId } = event.detail;
    
    console.log('Proof rejected, payment remains on hold:', { submissionId, dealId, milestoneId });
    
    // Log rejection for audit trail
    await this.logPaymentHold(dealId, milestoneId, {
      reason: 'proof_rejected',
      submissionId: submissionId,
      rejectedAt: new Date().toISOString()
    });

    // Notify relevant parties
    this.showNotification(
      'Proof rejected. Payment will remain on hold until approved proof is submitted.',
      'info'
    );
  }

  /**
   * Handle changes requested
   */
  async handleChangesRequested(event) {
    const { submissionId, dealId, milestoneId } = event.detail;
    
    console.log('Changes requested for proof, payment remains on hold:', { submissionId, dealId, milestoneId });
    
    // Log changes request for audit trail
    await this.logPaymentHold(dealId, milestoneId, {
      reason: 'changes_requested',
      submissionId: submissionId,
      changesRequestedAt: new Date().toISOString()
    });

    // Notify relevant parties
    this.showNotification(
      'Changes requested for proof. Payment will remain on hold until revised proof is approved.',
      'info'
    );
  }

  /**
   * Trigger payment release for a milestone
   */
  async triggerPaymentRelease(dealId, milestoneId, metadata = {}) {
    try {
      console.log('Triggering payment release:', { dealId, milestoneId, metadata });

      // Show processing notification
      this.showPaymentReleaseStatus(milestoneId, 'processing', 'Processing payment release...');

      // Call payment release API
      const response = await window.axeesAPI.request('/milestone-payments/release', {
        method: 'POST',
        body: JSON.stringify({
          dealId: dealId,
          milestoneId: milestoneId,
          releaseType: 'automatic',
          trigger: 'proof_approval',
          metadata: metadata
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Payment release failed');
      }

      console.log('Payment release initiated successfully:', response);

      // Update status
      this.showPaymentReleaseStatus(milestoneId, 'initiated', 'Payment release initiated...');

      // Store release information
      this.pendingReleases.set(milestoneId, {
        dealId,
        milestoneId,
        releaseId: response.releaseId,
        initiatedAt: new Date().toISOString(),
        metadata
      });

      // Monitor release progress
      this.monitorPaymentRelease(response.releaseId, milestoneId);

      return response;

    } catch (error) {
      console.error('Payment release trigger failed:', error);
      this.showPaymentReleaseStatus(milestoneId, 'error', 'Payment release failed: ' + error.message);
      throw error;
    }
  }

  /**
   * Monitor payment release progress
   */
  async monitorPaymentRelease(releaseId, milestoneId) {
    const maxAttempts = 30; // Monitor for up to 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        
        const response = await window.axeesAPI.request(`/milestone-payments/release/${releaseId}/status`);
        
        if (response.success) {
          const status = response.status;
          
          console.log(`Payment release status check ${attempts}:`, status);
          
          switch (status.state) {
            case 'completed':
              this.handlePaymentReleaseSuccess(milestoneId, status);
              return true; // Stop monitoring
              
            case 'failed':
              this.handlePaymentReleaseFailure(milestoneId, status);
              return true; // Stop monitoring
              
            case 'processing':
            case 'pending':
              this.showPaymentReleaseStatus(milestoneId, 'processing', 
                `Payment processing... (${status.progress || 0}%)`);
              break;
              
            default:
              console.log('Unknown payment release status:', status.state);
          }
        }
        
        // Continue monitoring if not completed and under max attempts
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          // Timeout reached
          this.showPaymentReleaseStatus(milestoneId, 'timeout', 
            'Payment release monitoring timeout. Please check payment status manually.');
          this.processingReleases.delete(milestoneId);
        }
        
      } catch (error) {
        console.error('Error monitoring payment release:', error);
        
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Retry after 10 seconds
        } else {
          this.showPaymentReleaseStatus(milestoneId, 'error', 
            'Unable to monitor payment status. Please check manually.');
          this.processingReleases.delete(milestoneId);
        }
      }
    };

    // Start monitoring
    setTimeout(checkStatus, 5000); // Initial check after 5 seconds
  }

  /**
   * Handle successful payment release
   */
  handlePaymentReleaseSuccess(milestoneId, statusData) {
    console.log('Payment release completed successfully:', { milestoneId, statusData });
    
    // Remove from processing set
    this.processingReleases.delete(milestoneId);
    
    // Remove from pending releases
    const releaseInfo = this.pendingReleases.get(milestoneId);
    this.pendingReleases.delete(milestoneId);
    
    // Show success notification
    this.showPaymentReleaseStatus(milestoneId, 'success', 
      `✅ Payment released successfully! Amount: $${statusData.amount || 'N/A'}`);
    
    // Trigger success event
    document.dispatchEvent(new CustomEvent('payment-release-completed', {
      detail: {
        milestoneId,
        dealId: releaseInfo?.dealId,
        amount: statusData.amount,
        releaseId: statusData.releaseId,
        completedAt: statusData.completedAt || new Date().toISOString()
      }
    }));
    
    // Update UI components
    this.updatePaymentStatusInUI(milestoneId, 'released', statusData);
    
    // Show user notification
    this.showNotification(
      `Payment of $${statusData.amount || 'N/A'} has been released for milestone completion!`,
      'success'
    );
  }

  /**
   * Handle failed payment release
   */
  handlePaymentReleaseFailure(milestoneId, statusData) {
    console.error('Payment release failed:', { milestoneId, statusData });
    
    // Remove from processing set
    this.processingReleases.delete(milestoneId);
    
    // Remove from pending releases
    const releaseInfo = this.pendingReleases.get(milestoneId);
    this.pendingReleases.delete(milestoneId);
    
    // Show error notification
    this.showPaymentReleaseStatus(milestoneId, 'error', 
      `❌ Payment release failed: ${statusData.error || 'Unknown error'}`);
    
    // Trigger failure event
    document.dispatchEvent(new CustomEvent('payment-release-failed', {
      detail: {
        milestoneId,
        dealId: releaseInfo?.dealId,
        error: statusData.error,
        failedAt: statusData.failedAt || new Date().toISOString()
      }
    }));
    
    // Show user notification with action
    this.showNotification(
      `Payment release failed: ${statusData.error || 'Unknown error'}. Please check payment settings or contact support.`,
      'error',
      {
        action: 'retry',
        callback: () => this.retryPaymentRelease(releaseInfo?.dealId, milestoneId)
      }
    );
  }

  /**
   * Retry payment release
   */
  async retryPaymentRelease(dealId, milestoneId) {
    if (!dealId || !milestoneId) {
      console.error('Cannot retry payment release: missing dealId or milestoneId');
      return;
    }

    try {
      await this.triggerPaymentRelease(dealId, milestoneId, {
        reason: 'manual_retry',
        retriedAt: new Date().toISOString()
      });
    } catch (error) {
      this.showNotification('Payment release retry failed: ' + error.message, 'error');
    }
  }

  /**
   * Log payment hold for audit trail
   */
  async logPaymentHold(dealId, milestoneId, metadata) {
    try {
      await window.axeesAPI.request('/milestone-payments/hold', {
        method: 'POST',
        body: JSON.stringify({
          dealId,
          milestoneId,
          reason: metadata.reason,
          metadata
        })
      });
      
      console.log('Payment hold logged:', { dealId, milestoneId, metadata });
      
    } catch (error) {
      console.error('Failed to log payment hold:', error);
    }
  }

  /**
   * Show payment release status
   */
  showPaymentReleaseStatus(milestoneId, status, message) {
    // Find status elements in the UI
    const statusElements = document.querySelectorAll(`[data-milestone-id="${milestoneId}"] .payment-status`);
    
    statusElements.forEach(element => {
      element.className = `payment-status ${status}`;
      element.textContent = message;
      
      // Add visual indicators
      switch (status) {
        case 'processing':
          element.style.color = '#f59e0b';
          element.style.backgroundColor = '#fffbeb';
          break;
        case 'success':
          element.style.color = '#059669';
          element.style.backgroundColor = '#ecfdf5';
          break;
        case 'error':
          element.style.color = '#dc2626';
          element.style.backgroundColor = '#fef2f2';
          break;
        case 'timeout':
          element.style.color = '#6b7280';
          element.style.backgroundColor = '#f9fafb';
          break;
      }
    });

    // Also update any milestone cards or components
    this.updateMilestonePaymentStatus(milestoneId, status, message);
  }

  /**
   * Update milestone payment status in UI components
   */
  updateMilestonePaymentStatus(milestoneId, status, message) {
    // Update milestone cards
    const milestoneCards = document.querySelectorAll(`[data-milestone="${milestoneId}"]`);
    
    milestoneCards.forEach(card => {
      const statusElement = card.querySelector('.milestone-payment-status');
      if (statusElement) {
        statusElement.className = `milestone-payment-status ${status}`;
        statusElement.textContent = message;
      }
    });

    // Update milestone management interface if available
    if (window.milestoneManager) {
      window.milestoneManager.updatePaymentStatus(milestoneId, status, message);
    }
  }

  /**
   * Update payment status in various UI components
   */
  updatePaymentStatusInUI(milestoneId, status, statusData) {
    // Update dashboard if available
    if (window.dashboardManager) {
      window.dashboardManager.updateMilestonePaymentStatus(milestoneId, status, statusData);
    }

    // Update deal management if available
    if (window.dealManager) {
      window.dealManager.updateMilestonePaymentStatus(milestoneId, status, statusData);
    }

    // Update marketplace if available
    if (window.marketplaceManager) {
      window.marketplaceManager.updateMilestonePaymentStatus(milestoneId, status, statusData);
    }

    // Refresh any milestone displays
    const milestoneElements = document.querySelectorAll(`[data-milestone-id="${milestoneId}"]`);
    milestoneElements.forEach(element => {
      element.dispatchEvent(new CustomEvent('milestone-payment-updated', {
        detail: { status, statusData }
      }));
    });
  }

  /**
   * Initialize payment release monitoring for existing pending releases
   */
  async initializePaymentReleaseMonitoring() {
    try {
      // Get any pending payment releases on page load
      const response = await window.axeesAPI.request('/milestone-payments/pending');
      
      if (response.success && response.pendingReleases) {
        response.pendingReleases.forEach(release => {
          if (release.status === 'processing' || release.status === 'pending') {
            this.processingReleases.add(release.milestoneId);
            this.pendingReleases.set(release.milestoneId, release);
            
            // Resume monitoring
            this.monitorPaymentRelease(release.releaseId, release.milestoneId);
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to initialize payment release monitoring:', error);
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info', options = {}) {
    if (window.showNotification) {
      window.showNotification(message, type, options);
    } else {
      // Fallback notification
      console.log(`${type.toUpperCase()}: ${message}`);
      
      if (type === 'error') {
        alert(`Error: ${message}`);
      }
    }
  }

  /**
   * Get payment release status for a milestone
   */
  getPaymentReleaseStatus(milestoneId) {
    if (this.processingReleases.has(milestoneId)) {
      return {
        status: 'processing',
        pending: this.pendingReleases.get(milestoneId)
      };
    }
    
    return {
      status: 'idle',
      pending: null
    };
  }

  /**
   * Cancel payment release monitoring
   */
  cancelPaymentReleaseMonitoring(milestoneId) {
    this.processingReleases.delete(milestoneId);
    this.pendingReleases.delete(milestoneId);
    
    // Clear any callbacks
    if (this.releaseCallbacks.has(milestoneId)) {
      clearTimeout(this.releaseCallbacks.get(milestoneId));
      this.releaseCallbacks.delete(milestoneId);
    }
  }

  /**
   * Manual payment release trigger (for admin override)
   */
  async manualPaymentRelease(dealId, milestoneId, reason = 'manual_override') {
    try {
      await this.triggerPaymentRelease(dealId, milestoneId, {
        reason: reason,
        manualOverride: true,
        overrideAt: new Date().toISOString()
      });
      
      this.showNotification('Manual payment release initiated', 'info');
      
    } catch (error) {
      console.error('Manual payment release failed:', error);
      this.showNotification('Manual payment release failed: ' + error.message, 'error');
    }
  }

  /**
   * Get integration status and statistics
   */
  getIntegrationStatus() {
    return {
      processingReleases: Array.from(this.processingReleases),
      pendingReleases: Array.from(this.pendingReleases.keys()),
      totalProcessing: this.processingReleases.size,
      totalPending: this.pendingReleases.size
    };
  }
}

// Initialize global proof-payment integration
window.proofPaymentIntegration = new ProofPaymentIntegration();

// Utility functions for triggering events from other components

/**
 * Trigger proof approval event
 */
window.triggerProofApproval = function(submissionId, dealId, milestoneId, amount) {
  document.dispatchEvent(new CustomEvent('proof-approved', {
    detail: { submissionId, dealId, milestoneId, amount }
  }));
};

/**
 * Trigger proof rejection event
 */
window.triggerProofRejection = function(submissionId, dealId, milestoneId) {
  document.dispatchEvent(new CustomEvent('proof-rejected', {
    detail: { submissionId, dealId, milestoneId }
  }));
};

/**
 * Trigger changes requested event
 */
window.triggerChangesRequested = function(submissionId, dealId, milestoneId) {
  document.dispatchEvent(new CustomEvent('proof-changes-requested', {
    detail: { submissionId, dealId, milestoneId }
  }));
};

/**
 * Manual payment release (for admin/marketer override)
 */
window.manualPaymentRelease = function(dealId, milestoneId, reason = 'manual_override') {
  return window.proofPaymentIntegration.manualPaymentRelease(dealId, milestoneId, reason);
};