/**
 * Proof Submission Modal - Milestone Evidence Upload System
 * Integrates with drag-drop-upload component for file management
 */

class ProofSubmissionModal {
  constructor() {
    this.isOpen = false;
    this.currentDeal = null;
    this.currentMilestone = null;
    this.uploadComponent = null;
    this.submitInProgress = false;
    
    this.initialize();
  }

  /**
   * Initialize the proof submission system
   */
  initialize() {
    this.createModalStructure();
    this.bindEvents();
  }

  /**
   * Show proof submission modal for a specific milestone
   */
  async showModal(dealId, milestoneId, milestoneTitle = 'Milestone') {
    if (this.isOpen) return;
    
    try {
      // Fetch deal and milestone details
      const dealResponse = await window.axeesAPI.request(`/marketer/deals/${dealId}`);
      if (!dealResponse.success) {
        throw new Error('Failed to load deal details');
      }
      
      this.currentDeal = dealResponse.deal;
      this.currentMilestone = this.currentDeal.milestones?.find(m => m._id === milestoneId);
      
      if (!this.currentMilestone) {
        throw new Error('Milestone not found');
      }

      this.populateModalContent();
      this.initializeUploadComponent();
      this.showModalElement();
      
      this.isOpen = true;
      
    } catch (error) {
      console.error('Failed to open proof submission modal:', error);
      this.showError('Failed to load submission details: ' + error.message);
    }
  }

  /**
   * Create the modal HTML structure
   */
  createModalStructure() {
    const modal = document.createElement('div');
    modal.id = 'proof-submission-modal';
    modal.className = 'proof-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="proof-modal-overlay" onclick="proofSubmissionModal.closeModal()"></div>
      <div class="proof-modal-container">
        <div class="proof-modal-header">
          <div class="proof-modal-title-section">
            <h2 class="proof-modal-title">Submit Milestone Proof</h2>
            <p class="proof-modal-subtitle" id="proofModalSubtitle">Upload evidence of completed work</p>
          </div>
          <button class="proof-modal-close" onclick="proofSubmissionModal.closeModal()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        <div class="proof-modal-body">
          <!-- Milestone Info -->
          <div class="milestone-info-section">
            <div class="milestone-header">
              <div class="milestone-icon">🎯</div>
              <div class="milestone-details">
                <h3 class="milestone-title" id="milestoneTitle">Loading...</h3>
                <div class="milestone-meta">
                  <span class="deal-title" id="dealTitle">Loading...</span>
                  <span class="milestone-deadline" id="milestoneDeadline"></span>
                </div>
              </div>
              <div class="milestone-amount" id="milestoneAmount">$0</div>
            </div>
            
            <div class="milestone-description" id="milestoneDescription">
              Loading milestone details...
            </div>
          </div>

          <!-- Upload Section -->
          <div class="upload-section">
            <h4 class="upload-section-title">Upload Proof of Work</h4>
            <p class="upload-section-subtitle">
              Provide evidence that demonstrates completion of this milestone. 
              Accepted formats: Images, Videos, PDFs, Documents
            </p>
            
            <div id="proof-upload-container">
              <!-- Drag-drop upload component will be initialized here -->
            </div>
          </div>

          <!-- Submission Notes -->
          <div class="submission-notes-section">
            <label for="submissionNotes" class="notes-label">
              Additional Notes (Optional)
            </label>
            <textarea 
              id="submissionNotes" 
              class="submission-notes-textarea"
              placeholder="Provide any additional context, explanations, or details about your submitted work..."
              rows="4"
            ></textarea>
          </div>

          <!-- Submission Status -->
          <div class="submission-status" id="submissionStatus" style="display: none;">
            <div class="status-icon" id="statusIcon">⏳</div>
            <div class="status-text" id="statusText">Preparing submission...</div>
          </div>
        </div>

        <div class="proof-modal-footer">
          <div class="footer-info">
            <div class="submission-info">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm-1-5.586L4.707 8.121a1 1 0 00-1.414 1.414L6.586 12.828a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L7 10.586z"/>
              </svg>
              <span>Submitted proofs will be reviewed within 24-48 hours</span>
            </div>
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-secondary" onclick="proofSubmissionModal.closeModal()">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" id="submitProofBtn" onclick="proofSubmissionModal.submitProof()">
              Submit Proof
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    if (!document.getElementById('proof-submission-styles')) {
      const styles = document.createElement('style');
      styles.id = 'proof-submission-styles';
      styles.textContent = `
        .proof-modal {
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

        .proof-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }

        .proof-modal-container {
          position: relative;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .proof-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 24px 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .proof-modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .proof-modal-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .proof-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .proof-modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .proof-modal-body {
          padding: 0 24px 24px;
        }

        .milestone-info-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .milestone-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .milestone-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .milestone-details {
          flex: 1;
          min-width: 0;
        }

        .milestone-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .milestone-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 14px;
          color: #6b7280;
        }

        .deal-title {
          font-weight: 500;
        }

        .milestone-deadline {
          color: #f59e0b;
          font-weight: 500;
        }

        .milestone-amount {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          flex-shrink: 0;
        }

        .milestone-description {
          color: #374151;
          font-size: 14px;
          line-height: 1.6;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .upload-section {
          margin-bottom: 24px;
        }

        .upload-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .upload-section-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .submission-notes-section {
          margin-bottom: 24px;
        }

        .notes-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .submission-notes-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }

        .submission-notes-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .submission-status {
          background: #dbeafe;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .submission-status.success {
          background: #d1fae5;
          border-color: #a7f3d0;
          color: #065f46;
        }

        .submission-status.error {
          background: #fee2e2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .status-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .status-text {
          font-size: 14px;
          font-weight: 500;
        }

        .proof-modal-footer {
          border-top: 1px solid #e5e7eb;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }

        .footer-info {
          flex: 1;
        }

        .submission-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 768px) {
          .proof-modal-container {
            max-width: 100%;
            margin: 10px;
            max-height: calc(100vh - 20px);
          }

          .milestone-header {
            flex-direction: column;
            align-items: stretch;
          }

          .milestone-amount {
            text-align: right;
            margin-top: 8px;
          }

          .proof-modal-footer {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .footer-actions {
            order: -1;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
  }

  /**
   * Populate modal content with deal and milestone data
   */
  populateModalContent() {
    if (!this.currentDeal || !this.currentMilestone) return;

    // Update modal subtitle
    const subtitle = document.getElementById('proofModalSubtitle');
    subtitle.textContent = `Submit evidence for "${this.currentMilestone.title}"`;

    // Update milestone details
    document.getElementById('milestoneTitle').textContent = this.currentMilestone.title;
    document.getElementById('dealTitle').textContent = this.currentDeal.offerName || 'Deal';
    
    const amount = document.getElementById('milestoneAmount');
    amount.textContent = `$${this.currentMilestone.amount || 0}`;

    // Format and display deadline
    const deadline = document.getElementById('milestoneDeadline');
    if (this.currentMilestone.deadline) {
      const deadlineDate = new Date(this.currentMilestone.deadline);
      deadline.textContent = `Due: ${deadlineDate.toLocaleDateString()}`;
    } else {
      deadline.textContent = 'No deadline set';
    }

    // Update description
    const description = document.getElementById('milestoneDescription');
    description.textContent = this.currentMilestone.description || 'No description provided.';
  }

  /**
   * Initialize the drag-drop upload component
   */
  initializeUploadComponent() {
    if (this.uploadComponent) {
      this.uploadComponent.destroy();
    }

    // Initialize drag-drop upload with proof-specific settings
    this.uploadComponent = new DragDropUpload('proof-upload-container', {
      maxFiles: 5,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'video/mp4', 'video/webm', 'video/quicktime'
      ],
      category: 'proof',
      showPreview: true,
      enableProgress: true,
      onUploadStart: (files) => {
        // Proof upload started
      },
      onUploadProgress: (progress) => {
        this.updateSubmissionStatus('progress', `Uploading files... ${Math.round(progress)}%`);
      },
      onUploadComplete: (files) => {
        this.hideSubmissionStatus();
      },
      onUploadError: (error) => {
        this.showSubmissionError('File upload failed: ' + error.message);
      }
    });
  }

  /**
   * Submit proof for milestone
   */
  async submitProof() {
    if (this.submitInProgress) return;
    
    try {
      this.submitInProgress = true;
      this.updateSubmitButtonState(true);

      // Get uploaded files
      const uploadedFiles = this.uploadComponent?.files || [];
      if (uploadedFiles.length === 0) {
        throw new Error('Please upload at least one proof file');
      }

      // Get submission notes
      const notes = document.getElementById('submissionNotes').value.trim();

      // Show uploading status
      this.updateSubmissionStatus('progress', 'Uploading files...');

      // Upload files first
      await this.uploadComponent.uploadFiles();

      // Show submission status
      this.updateSubmissionStatus('progress', 'Submitting proof...');

      // Prepare submission data
      const submissionData = {
        dealId: this.currentDeal._id,
        milestoneId: this.currentMilestone._id,
        description: notes,
        files: this.uploadComponent.files.map(file => ({
          originalName: file.name,
          size: file.size,
          type: file.type
        }))
      };

      // Submit proof
      const response = await window.axeesAPI.request('/proof-submissions', {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit proof');
      }

      // Show success
      this.updateSubmissionStatus('success', '✅ Proof submitted successfully!');

      // Close modal after delay
      setTimeout(() => {
        this.closeModal();
        
        // Trigger refresh of milestone view if available
        if (window.milestoneManager) {
          window.milestoneManager.refresh();
        }
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification('Proof submitted successfully! It will be reviewed within 24-48 hours.', 'success');
        }
      }, 2000);

    } catch (error) {
      this.showSubmissionError(error.message);
      this.updateSubmitButtonState(false);
    } finally {
      this.submitInProgress = false;
    }
  }

  /**
   * Update submission status display
   */
  updateSubmissionStatus(type, message) {
    const statusElement = document.getElementById('submissionStatus');
    const iconElement = document.getElementById('statusIcon');
    const textElement = document.getElementById('statusText');

    if (statusElement && iconElement && textElement) {
      statusElement.style.display = 'flex';
      statusElement.className = `submission-status ${type}`;
      
      switch (type) {
        case 'progress':
          iconElement.textContent = '⏳';
          break;
        case 'success':
          iconElement.textContent = '✅';
          break;
        case 'error':
          iconElement.textContent = '❌';
          break;
      }
      
      textElement.textContent = message;
    }
  }

  /**
   * Hide submission status
   */
  hideSubmissionStatus() {
    const statusElement = document.getElementById('submissionStatus');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Show submission error
   */
  showSubmissionError(message) {
    this.updateSubmissionStatus('error', '❌ ' + message);
  }

  /**
   * Update submit button state
   */
  updateSubmitButtonState(disabled) {
    const submitBtn = document.getElementById('submitProofBtn');
    if (submitBtn) {
      submitBtn.disabled = disabled;
      submitBtn.textContent = disabled ? 'Submitting...' : 'Submit Proof';
    }
  }

  /**
   * Show the modal element
   */
  showModalElement() {
    const modal = document.getElementById('proof-submission-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    if (!this.isOpen) return;
    
    const modal = document.getElementById('proof-submission-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    // Cleanup
    if (this.uploadComponent) {
      this.uploadComponent.destroy();
      this.uploadComponent = null;
    }

    this.currentDeal = null;
    this.currentMilestone = null;
    this.submitInProgress = false;
    this.isOpen = false;
    
    // Clear form
    const notesTextarea = document.getElementById('submissionNotes');
    if (notesTextarea) {
      notesTextarea.value = '';
    }
    
    this.hideSubmissionStatus();
    this.updateSubmitButtonState(false);
  }

  /**
   * Bind keyboard events
   */
  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }
}

// Initialize global proof submission modal
window.proofSubmissionModal = new ProofSubmissionModal();

// Utility function to open proof submission from anywhere
window.submitProofForMilestone = function(dealId, milestoneId, milestoneTitle) {
  window.proofSubmissionModal.showModal(dealId, milestoneId, milestoneTitle);
};