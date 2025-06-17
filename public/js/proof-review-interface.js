/**
 * Proof Review Interface - Marketer Approval Workflow
 * Allows marketers to review, approve, and reject submitted proofs
 */

class ProofReviewInterface {
  constructor() {
    this.currentProofSubmission = null;
    this.isReviewModalOpen = false;
    this.processingAction = false;
    
    this.initialize();
  }

  /**
   * Initialize the proof review system
   */
  initialize() {
    this.createReviewModal();
    this.bindEvents();
  }

  /**
   * Show proof review modal for a specific submission
   */
  async showReviewModal(submissionId) {
    if (this.isReviewModalOpen) return;
    
    try {
      // Fetch proof submission details
      const response = await window.axeesAPI.request(`/proof-submissions/${submissionId}`);
      if (!response.success) {
        throw new Error('Failed to load proof submission');
      }
      
      this.currentProofSubmission = response.submission;
      
      this.populateReviewModal();
      this.showModalElement();
      
      this.isReviewModalOpen = true;
      
    } catch (error) {
      console.error('Failed to open proof review modal:', error);
      this.showError('Failed to load proof submission: ' + error.message);
    }
  }

  /**
   * Create the review modal HTML structure
   */
  createReviewModal() {
    const modal = document.createElement('div');
    modal.id = 'proof-review-modal';
    modal.className = 'proof-review-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="proof-review-overlay" onclick="proofReviewInterface.closeReviewModal()"></div>
      <div class="proof-review-container">
        <div class="proof-review-header">
          <div class="review-header-content">
            <h2 class="review-modal-title">Review Milestone Proof</h2>
            <p class="review-modal-subtitle">Evaluate submitted work and provide feedback</p>
          </div>
          <button class="review-modal-close" onclick="proofReviewInterface.closeReviewModal()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        <div class="proof-review-body">
          <!-- Submission Details -->
          <div class="submission-details-section">
            <div class="details-header">
              <div class="submission-icon">📋</div>
              <div class="submission-meta">
                <h3 class="submission-title" id="submissionTitle">Loading...</h3>
                <div class="submission-info">
                  <span class="creator-name" id="creatorName">Loading...</span>
                  <span class="submission-date" id="submissionDate">Loading...</span>
                  <span class="submission-status" id="submissionStatus">pending</span>
                </div>
              </div>
              <div class="milestone-amount" id="reviewMilestoneAmount">$0</div>
            </div>
            
            <div class="milestone-context" id="milestoneContext">
              Loading milestone details...
            </div>
          </div>

          <!-- Submitted Files Gallery -->
          <div class="submitted-files-section">
            <h4 class="section-title">Submitted Proof Files</h4>
            <div class="files-gallery" id="submittedFilesGallery">
              <!-- Files will be populated here -->
            </div>
          </div>

          <!-- Creator Notes -->
          <div class="creator-notes-section" id="creatorNotesSection" style="display: none;">
            <h4 class="section-title">Creator Notes</h4>
            <div class="creator-notes-content" id="creatorNotes">
              <!-- Notes will be populated here -->
            </div>
          </div>

          <!-- Review Actions -->
          <div class="review-actions-section">
            <h4 class="section-title">Review Decision</h4>
            
            <div class="review-options">
              <div class="review-option" onclick="proofReviewInterface.selectReviewOption('approve')">
                <input type="radio" name="reviewDecision" value="approve" id="reviewApprove">
                <label for="reviewApprove" class="review-option-label approve">
                  <div class="option-icon">✅</div>
                  <div class="option-content">
                    <strong>Approve</strong>
                    <p>Work meets requirements and milestone is complete</p>
                  </div>
                </label>
              </div>

              <div class="review-option" onclick="proofReviewInterface.selectReviewOption('request_changes')">
                <input type="radio" name="reviewDecision" value="request_changes" id="reviewChanges">
                <label for="reviewChanges" class="review-option-label changes">
                  <div class="option-icon">🔄</div>
                  <div class="option-content">
                    <strong>Request Changes</strong>
                    <p>Work needs modifications or additional elements</p>
                  </div>
                </label>
              </div>

              <div class="review-option" onclick="proofReviewInterface.selectReviewOption('reject')">
                <input type="radio" name="reviewDecision" value="reject" id="reviewReject">
                <label for="reviewReject" class="review-option-label reject">
                  <div class="option-icon">❌</div>
                  <div class="option-content">
                    <strong>Reject</strong>
                    <p>Work does not meet requirements</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Feedback Section -->
          <div class="feedback-section">
            <label for="reviewFeedback" class="feedback-label">
              Feedback & Comments <span class="required-indicator" id="feedbackRequired" style="display: none;">*</span>
            </label>
            <textarea 
              id="reviewFeedback" 
              class="review-feedback-textarea"
              placeholder="Provide detailed feedback about the submitted work..."
              rows="4"
            ></textarea>
            <div class="feedback-hint" id="feedbackHint">
              Constructive feedback helps creators improve their work and understand your requirements better.
            </div>
          </div>

          <!-- Review Status -->
          <div class="review-status" id="reviewStatus" style="display: none;">
            <div class="status-icon" id="reviewStatusIcon">⏳</div>
            <div class="status-text" id="reviewStatusText">Processing review...</div>
          </div>
        </div>

        <div class="proof-review-footer">
          <div class="footer-info">
            <div class="review-impact" id="reviewImpact">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm-1-5.586L4.707 8.121a1 1 0 00-1.414 1.414L6.586 12.828a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L7 10.586z"/>
              </svg>
              <span>Your review will determine milestone completion and payment release</span>
            </div>
          </div>
          <div class="footer-actions">
            <button type="button" class="btn btn-secondary" onclick="proofReviewInterface.closeReviewModal()">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" id="submitReviewBtn" onclick="proofReviewInterface.submitReview()" disabled>
              Submit Review
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    if (!document.getElementById('proof-review-styles')) {
      const styles = document.createElement('style');
      styles.id = 'proof-review-styles';
      styles.textContent = `
        .proof-review-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .proof-review-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        .proof-review-container {
          position: relative;
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: reviewModalSlideIn 0.3s ease-out;
        }

        @keyframes reviewModalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .proof-review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 24px 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .review-modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .review-modal-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .review-modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .review-modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .proof-review-body {
          padding: 0 24px 24px;
        }

        .submission-details-section {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .details-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .submission-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .submission-meta {
          flex: 1;
          min-width: 0;
        }

        .submission-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .submission-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 14px;
          color: #6b7280;
        }

        .creator-name {
          font-weight: 500;
          color: #374151;
        }

        .submission-date {
          color: #6b7280;
        }

        .submission-status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          background: #fef3c7;
          color: #92400e;
        }

        .submission-status.approved {
          background: #d1fae5;
          color: #065f46;
        }

        .submission-status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .milestone-context {
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 14px;
          line-height: 1.6;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
        }

        .submitted-files-section {
          margin-bottom: 24px;
        }

        .files-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }

        .file-preview-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .file-preview-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .file-preview-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 24px;
        }

        .file-preview-info {
          padding: 8px 12px;
          background: white;
        }

        .file-name {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 11px;
          color: #6b7280;
        }

        .creator-notes-section {
          margin-bottom: 24px;
        }

        .creator-notes-content {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          color: #374151;
          font-size: 14px;
          line-height: 1.6;
        }

        .review-actions-section {
          margin-bottom: 24px;
        }

        .review-options {
          display: grid;
          gap: 12px;
        }

        .review-option {
          cursor: pointer;
        }

        .review-option input[type="radio"] {
          display: none;
        }

        .review-option-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .review-option-label:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .review-option input[type="radio"]:checked + .review-option-label {
          border-color: #6366f1;
          background: #f0f9ff;
        }

        .review-option-label.approve input[type="radio"]:checked + .review-option-label,
        .review-option input[type="radio"]:checked + .review-option-label.approve {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .review-option-label.changes input[type="radio"]:checked + .review-option-label,
        .review-option input[type="radio"]:checked + .review-option-label.changes {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .review-option-label.reject input[type="radio"]:checked + .review-option-label,
        .review-option input[type="radio"]:checked + .review-option-label.reject {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .option-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .option-content {
          flex: 1;
        }

        .option-content strong {
          display: block;
          font-size: 16px;
          margin-bottom: 4px;
          color: #111827;
        }

        .option-content p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.4;
        }

        .feedback-section {
          margin-bottom: 24px;
        }

        .feedback-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .required-indicator {
          color: #ef4444;
        }

        .review-feedback-textarea {
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

        .review-feedback-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .feedback-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .review-status {
          background: #dbeafe;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-status.success {
          background: #d1fae5;
          border-color: #a7f3d0;
          color: #065f46;
        }

        .review-status.error {
          background: #fee2e2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .proof-review-footer {
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

        .review-impact {
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

        /* File Lightbox */
        .file-lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 2200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .lightbox-content {
          max-width: 90%;
          max-height: 90%;
          position: relative;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
        }

        .lightbox-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
        }

        @media (max-width: 768px) {
          .proof-review-container {
            max-width: 100%;
            margin: 10px;
            max-height: calc(100vh - 20px);
          }

          .details-header {
            flex-direction: column;
            align-items: stretch;
          }

          .submission-info {
            flex-direction: column;
            gap: 4px;
          }

          .files-gallery {
            grid-template-columns: repeat(2, 1fr);
          }

          .proof-review-footer {
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
   * Populate review modal with submission data
   */
  populateReviewModal() {
    if (!this.currentProofSubmission) return;

    const submission = this.currentProofSubmission;
    
    // Update submission details
    document.getElementById('submissionTitle').textContent = submission.milestone?.title || 'Milestone Proof';
    document.getElementById('creatorName').textContent = submission.creator?.userName || 'Unknown Creator';
    
    const submissionDate = new Date(submission.createdAt);
    document.getElementById('submissionDate').textContent = `Submitted ${submissionDate.toLocaleDateString()}`;
    
    const statusElement = document.getElementById('submissionStatus');
    statusElement.textContent = submission.status || 'pending';
    statusElement.className = `submission-status ${submission.status || 'pending'}`;

    // Update milestone amount
    const amountElement = document.getElementById('reviewMilestoneAmount');
    amountElement.textContent = `$${submission.milestone?.amount || 0}`;

    // Update milestone context
    const contextElement = document.getElementById('milestoneContext');
    contextElement.textContent = submission.milestone?.description || 'No milestone description available.';

    // Populate files gallery
    this.populateFilesGallery(submission.files || []);

    // Show creator notes if available
    if (submission.description && submission.description.trim()) {
      const notesSection = document.getElementById('creatorNotesSection');
      const notesContent = document.getElementById('creatorNotes');
      notesSection.style.display = 'block';
      notesContent.textContent = submission.description;
    }

    // Reset form state
    this.resetReviewForm();
  }

  /**
   * Populate files gallery
   */
  populateFilesGallery(files) {
    const gallery = document.getElementById('submittedFilesGallery');
    if (!gallery) return;

    if (files.length === 0) {
      gallery.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No files submitted</p>';
      return;
    }

    gallery.innerHTML = files.map(file => {
      const isImage = file.mimetype?.startsWith('image/');
      const fileIcon = this.getFileIcon(file.mimetype);
      
      return `
        <div class="file-preview-card" onclick="proofReviewInterface.showFilePreview('${file.url}', '${file.originalName}', '${file.mimetype}')">
          <div class="file-preview-image">
            ${isImage ? `<img src="${file.url}" alt="${file.originalName}" style="width: 100%; height: 100%; object-fit: cover;">` : fileIcon}
          </div>
          <div class="file-preview-info">
            <div class="file-name" title="${file.originalName}">${file.originalName}</div>
            <div class="file-size">${this.formatFileSize(file.size || 0)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimetype) {
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('video')) return '🎥';
    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📝';
    if (mimetype?.includes('text')) return '📄';
    return '📎';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Show file preview in lightbox
   */
  showFilePreview(url, filename, mimetype) {
    if (mimetype?.startsWith('image/')) {
      const lightbox = document.createElement('div');
      lightbox.className = 'file-lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close" onclick="this.closest('.file-lightbox').remove()">×</button>
          <img src="${url}" alt="${filename}" class="lightbox-image">
        </div>
      `;
      
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          lightbox.remove();
        }
      });
      
      document.body.appendChild(lightbox);
    } else {
      // For non-image files, open in new tab
      window.open(url, '_blank');
    }
  }

  /**
   * Select review option and update UI
   */
  selectReviewOption(decision) {
    const radio = document.getElementById(`review${decision.charAt(0).toUpperCase() + decision.slice(1).replace('_', '')}`);
    if (radio) {
      radio.checked = true;
    }

    // Update feedback requirement
    const feedbackRequired = document.getElementById('feedbackRequired');
    const feedbackHint = document.getElementById('feedbackHint');
    
    if (decision === 'request_changes' || decision === 'reject') {
      feedbackRequired.style.display = 'inline';
      feedbackHint.textContent = 'Please provide specific feedback explaining what needs to be changed or why the work was rejected.';
    } else {
      feedbackRequired.style.display = 'none';
      feedbackHint.textContent = 'Constructive feedback helps creators improve their work and understand your requirements better.';
    }

    // Enable submit button
    this.updateSubmitButton();
  }

  /**
   * Update submit button state
   */
  updateSubmitButton() {
    const submitBtn = document.getElementById('submitReviewBtn');
    const selectedOption = document.querySelector('input[name="reviewDecision"]:checked');
    const feedback = document.getElementById('reviewFeedback').value.trim();
    
    const requiresFeedback = selectedOption && (selectedOption.value === 'request_changes' || selectedOption.value === 'reject');
    const isValid = selectedOption && (!requiresFeedback || feedback.length > 0);
    
    submitBtn.disabled = !isValid;
  }

  /**
   * Submit review decision
   */
  async submitReview() {
    if (this.processingAction) return;
    
    try {
      this.processingAction = true;
      this.updateReviewStatus('progress', 'Submitting review...');

      const selectedOption = document.querySelector('input[name="reviewDecision"]:checked');
      const feedback = document.getElementById('reviewFeedback').value.trim();
      
      if (!selectedOption) {
        throw new Error('Please select a review decision');
      }

      const requiresFeedback = selectedOption.value === 'request_changes' || selectedOption.value === 'reject';
      if (requiresFeedback && !feedback) {
        throw new Error('Feedback is required for this decision');
      }

      // Submit review
      const reviewData = {
        status: selectedOption.value,
        feedback: feedback,
        reviewedAt: new Date().toISOString()
      };

      const response = await window.axeesAPI.request(`/proof-submissions/${this.currentProofSubmission._id}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit review');
      }

      // Show success
      this.updateReviewStatus('success', '✅ Review submitted successfully!');

      // Close modal after delay
      setTimeout(() => {
        this.closeReviewModal();
        
        // Trigger refresh of proof listings if available
        if (window.proofListManager) {
          window.proofListManager.refresh();
        }
        
        // Show success notification
        if (window.showNotification) {
          const actionText = selectedOption.value === 'approve' ? 'approved' : 
                           selectedOption.value === 'request_changes' ? 'marked for changes' : 'rejected';
          window.showNotification(`Proof ${actionText} successfully!`, 'success');
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to submit review:', error);
      this.updateReviewStatus('error', '❌ ' + error.message);
    } finally {
      this.processingAction = false;
    }
  }

  /**
   * Update review status display
   */
  updateReviewStatus(type, message) {
    const statusElement = document.getElementById('reviewStatus');
    const iconElement = document.getElementById('reviewStatusIcon');
    const textElement = document.getElementById('reviewStatusText');

    if (statusElement && iconElement && textElement) {
      statusElement.style.display = 'flex';
      statusElement.className = `review-status ${type}`;
      
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
   * Reset review form
   */
  resetReviewForm() {
    // Clear radio buttons
    document.querySelectorAll('input[name="reviewDecision"]').forEach(radio => {
      radio.checked = false;
    });

    // Clear feedback
    document.getElementById('reviewFeedback').value = '';

    // Hide required indicator
    document.getElementById('feedbackRequired').style.display = 'none';

    // Reset feedback hint
    document.getElementById('feedbackHint').textContent = 'Constructive feedback helps creators improve their work and understand your requirements better.';

    // Disable submit button
    document.getElementById('submitReviewBtn').disabled = true;

    // Hide status
    document.getElementById('reviewStatus').style.display = 'none';
  }

  /**
   * Show modal element
   */
  showModalElement() {
    const modal = document.getElementById('proof-review-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close review modal
   */
  closeReviewModal() {
    if (!this.isReviewModalOpen) return;
    
    const modal = document.getElementById('proof-review-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    this.currentProofSubmission = null;
    this.processingAction = false;
    this.isReviewModalOpen = false;
  }

  /**
   * Bind keyboard events
   */
  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isReviewModalOpen) {
        this.closeReviewModal();
      }
    });

    // Listen for feedback textarea changes
    document.addEventListener('input', (e) => {
      if (e.target.id === 'reviewFeedback') {
        this.updateSubmitButton();
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

// Initialize global proof review interface
window.proofReviewInterface = new ProofReviewInterface();

// Utility function to open proof review from anywhere
window.reviewProofSubmission = function(submissionId) {
  window.proofReviewInterface.showReviewModal(submissionId);
};