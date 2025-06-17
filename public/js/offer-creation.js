/**
 * Offer Creation System - Multi-step Form with Draft Saving
 * Provides comprehensive offer creation with real-time collaboration support
 */

class OfferCreationManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {};
    this.draftId = null;
    this.autoSaveInterval = null;
    this.validationErrors = {};
    this.isSubmitting = false;
    
    this.initialize();
  }

  async initialize() {
    // Check if user is authenticated marketer
    if (!window.authContext || !window.authContext.isAuthenticated) {
      return;
    }

    // Only allow marketers to create offers
    if (!window.authContext.isMarketer()) {
      return;
    }

    this.createOfferButton();
    this.setupAutoSave();
  }

  /**
   * Create the "Create Offer" button
   */
  createOfferButton() {
    const marketplace = document.querySelector('.search-section');
    if (!marketplace) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'offer-creation-trigger';
    buttonContainer.innerHTML = `
      <button class="btn btn-primary btn-create-offer" onclick="offerCreationManager.showOfferForm()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
        </svg>
        Create New Offer
      </button>
    `;

    // Add styles for the button
    if (!document.getElementById('offer-creation-styles')) {
      const styles = document.createElement('style');
      styles.id = 'offer-creation-styles';
      styles.textContent = `
        .offer-creation-trigger {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-create-offer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        
        .offer-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .offer-form-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .offer-form-header {
          padding: 24px 24px 0;
          border-bottom: 1px solid var(--gray-200);
          margin-bottom: 24px;
        }
        
        .offer-form-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }
        
        .offer-form-subtitle {
          color: var(--text-secondary);
          margin: 0 0 16px 0;
        }
        
        .step-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        
        .step {
          display: flex;
          align-items: center;
          flex: 1;
          position: relative;
        }
        
        .step:not(:last-child):after {
          content: '';
          position: absolute;
          top: 15px;
          left: calc(100% - 24px);
          width: calc(100% - 48px);
          height: 2px;
          background: var(--gray-200);
          z-index: 1;
        }
        
        .step.completed:not(:last-child):after {
          background: var(--primary-color);
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gray-200);
          color: var(--gray-600);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          margin-right: 8px;
          position: relative;
          z-index: 2;
        }
        
        .step.active .step-number {
          background: var(--primary-color);
          color: white;
        }
        
        .step.completed .step-number {
          background: var(--success);
          color: white;
        }
        
        .step-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .step.active .step-label {
          color: var(--primary-color);
        }
        
        .offer-form-body {
          padding: 0 24px 24px;
        }
        
        .form-step {
          display: none;
        }
        
        .form-step.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .platform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        
        .platform-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .platform-option:hover {
          border-color: var(--primary-color);
          background: rgba(99, 102, 241, 0.05);
        }
        
        .platform-option.selected {
          border-color: var(--primary-color);
          background: rgba(99, 102, 241, 0.1);
        }
        
        .platform-option input[type="checkbox"] {
          margin-right: 8px;
          width: auto;
        }
        
        .deliverable-list {
          margin-top: 12px;
        }
        
        .deliverable-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .deliverable-item input {
          flex: 1;
          margin: 0;
        }
        
        .remove-deliverable {
          background: var(--error);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .add-deliverable {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-top: 1px solid var(--gray-200);
          background: var(--gray-50);
        }
        
        .form-actions-left {
          display: flex;
          gap: 12px;
        }
        
        .form-actions-right {
          display: flex;
          gap: 12px;
        }
        
        .btn-secondary {
          background: var(--gray-100);
          color: var(--text-primary);
          border: 1px solid var(--gray-300);
        }
        
        .btn-secondary:hover {
          background: var(--gray-200);
        }
        
        .draft-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .draft-status.saving {
          color: var(--warning);
        }
        
        .draft-status.saved {
          color: var(--success);
        }
        
        .validation-error {
          color: var(--error);
          font-size: 12px;
          margin-top: 4px;
        }
        
        .input-error {
          border-color: var(--error) !important;
        }
        
        .email-preview {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }
        
        .email-preview h4 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .email-preview-content {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .platform-grid {
            grid-template-columns: 1fr;
          }
          
          .offer-form-container {
            max-width: 100%;
            margin: 10px;
          }
        }
        
        /* Trial Offer and Pricing Styles */
        .offer-type-badge {
          margin-top: 8px;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
        }
        
        .offer-type-badge.trial {
          background: linear-gradient(135deg, #fef3c7, #f59e0b);
          border: 1px solid #d97706;
        }
        
        .offer-type-badge.premium {
          background: linear-gradient(135deg, #ddd6fe, #8b5cf6);
          border: 1px solid #7c3aed;
        }
        
        .offer-type-badge.standard {
          background: linear-gradient(135deg, #e5e7eb, #6b7280);
          border: 1px solid #4b5563;
        }
        
        .badge-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .badge-content strong {
          display: block;
          margin-bottom: 4px;
          color: #1f2937;
        }
        
        .badge-content p {
          margin: 0;
          color: #374151;
          line-height: 1.4;
        }
        
        .pricing-breakdown {
          margin-top: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .pricing-card h4 {
          margin: 0 0 16px 0;
          padding: 16px 16px 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
        }
        
        .pricing-row {
          padding: 0 16px 16px;
        }
        
        .pricing-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .pricing-item:last-child {
          border-bottom: none;
        }
        
        .pricing-item.highlight {
          background: #fef3c7;
          margin: 0 -16px;
          padding: 8px 16px;
          border-bottom: 1px solid #f59e0b;
        }
        
        .pricing-item.total {
          font-weight: 600;
          font-size: 16px;
          color: #059669;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 2px solid #d1fae5;
        }
        
        .pricing-label {
          color: #374151;
        }
        
        .pricing-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        .pricing-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 8px 0;
        }
        
        .trial-info {
          background: #f9fafb;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        .trial-timeline {
          display: flex;
          gap: 16px;
          justify-content: space-between;
        }
        
        .timeline-item {
          flex: 1;
          text-align: center;
        }
        
        .timeline-step {
          display: inline-block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 600;
          line-height: 24px;
          margin-bottom: 8px;
        }
        
        .timeline-content strong {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .timeline-content p {
          margin: 0;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        @media (max-width: 768px) {
          .trial-timeline {
            flex-direction: column;
            gap: 12px;
          }
          
          .timeline-item {
            display: flex;
            align-items: center;
            text-align: left;
            gap: 12px;
          }
          
          .timeline-step {
            margin-bottom: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    marketplace.insertBefore(buttonContainer, marketplace.firstChild);
  }

  /**
   * Show the offer creation form modal
   */
  async showOfferForm() {
    // Check profile completion before allowing offer creation
    if (window.profileCompletionWidget && window.profileCompletionWidget.isProfileBlocked('create_offer')) {
      window.profileCompletionWidget.showBlockingMessage('create_offer');
      return;
    }

    this.resetForm();
    const modal = this.createFormModal();
    document.body.appendChild(modal);
    this.updateStepIndicator();
    this.loadExistingDraft();
  }

  /**
   * Create the form modal HTML
   */
  createFormModal() {
    const modal = document.createElement('div');
    modal.className = 'offer-form-modal';
    modal.innerHTML = `
      <div class="offer-form-container">
        <div class="offer-form-header">
          <h2 class="offer-form-title">Create New Offer</h2>
          <p class="offer-form-subtitle">Build a comprehensive collaboration proposal</p>
          
          <div class="step-indicator">
            <div class="step" data-step="1">
              <div class="step-number">1</div>
              <div class="step-label">Basic Info</div>
            </div>
            <div class="step" data-step="2">
              <div class="step-number">2</div>
              <div class="step-label">Platforms & Deliverables</div>
            </div>
            <div class="step" data-step="3">
              <div class="step-number">3</div>
              <div class="step-label">Terms & Timeline</div>
            </div>
            <div class="step" data-step="4">
              <div class="step-number">4</div>
              <div class="step-label">Review & Send</div>
            </div>
          </div>
        </div>
        
        <div class="offer-form-body">
          ${this.createStep1()}
          ${this.createStep2()}
          ${this.createStep3()}
          ${this.createStep4()}
        </div>
        
        <div class="form-actions">
          <div class="form-actions-left">
            <div class="draft-status" id="draftStatus">
              <svg width="16" height="16" viewBox="0 0 16 16" class="status-icon">
                <path fill="currentColor" d="M8 16A8 8 0 108 0a8 8 0 000 16zm-1.97-8.65l-2.42 2.42A1 1 0 115.54 6.83l3.71-3.71a1 1 0 011.42 1.42l-3.71 3.71 2.42 2.42a1 1 0 11-1.42 1.42L6.03 7.35z"/>
              </svg>
              <span id="draftStatusText">Auto-saving enabled</span>
            </div>
          </div>
          <div class="form-actions-right">
            <button type="button" class="btn btn-secondary" onclick="offerCreationManager.closeForm()">
              Cancel
            </button>
            <button type="button" class="btn btn-secondary" onclick="offerCreationManager.saveDraft()" id="saveDraftBtn">
              Save Draft
            </button>
            <button type="button" class="btn btn-secondary" onclick="offerCreationManager.previousStep()" id="prevBtn" style="display: none;">
              Previous
            </button>
            <button type="button" class="btn btn-primary" onclick="offerCreationManager.nextStep()" id="nextBtn">
              Next
            </button>
          </div>
        </div>
      </div>
    `;

    // Close modal when clicking backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeForm();
      }
    });

    return modal;
  }

  /**
   * Create Step 1: Basic Information
   */
  createStep1() {
    return `
      <div class="form-step active" data-step="1">
        <h3>Basic Offer Information</h3>
        
        <div class="form-group">
          <label for="offerName">Offer Title *</label>
          <input type="text" id="offerName" placeholder="e.g., Instagram Collaboration for Summer Campaign" required>
          <div class="validation-error" id="offerNameError"></div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" placeholder="Provide detailed information about this collaboration opportunity..."></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="creatorEmail">Creator Email *</label>
            <input type="email" id="creatorEmail" placeholder="creator@example.com" required>
            <div class="validation-error" id="creatorEmailError"></div>
          </div>
          
          <div class="form-group">
            <label for="offerType">Offer Type</label>
            <select id="offerType" onchange="offerCreationManager.handleOfferTypeChange()">
              <option value="standard">Standard Offer</option>
              <option value="trial">$1 Trial Offer</option>
              <option value="premium">Premium Collaboration</option>
            </select>
            <div class="offer-type-info" id="offerTypeInfo"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="proposedAmount">Proposed Amount (USD) *</label>
          <input type="number" id="proposedAmount" placeholder="500" min="1" step="0.01" required onchange="offerCreationManager.updatePricingBreakdown()">
          <div class="validation-error" id="proposedAmountError"></div>
        </div>
        
        <div class="pricing-breakdown" id="pricingBreakdown" style="display: none;">
          <div class="pricing-card">
            <h4>📋 Pricing Breakdown</h4>
            <div class="pricing-details" id="pricingDetails">
              <!-- Pricing breakdown will be inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create Step 2: Platforms & Deliverables
   */
  createStep2() {
    return `
      <div class="form-step" data-step="2">
        <h3>Platforms & Content Requirements</h3>
        
        <div class="form-group">
          <label>Select Platforms *</label>
          <div class="platform-grid">
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('instagram')">
              <input type="checkbox" id="platform-instagram" value="instagram">
              <label for="platform-instagram">📷 Instagram</label>
            </div>
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('tiktok')">
              <input type="checkbox" id="platform-tiktok" value="tiktok">
              <label for="platform-tiktok">🎵 TikTok</label>
            </div>
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('youtube')">
              <input type="checkbox" id="platform-youtube" value="youtube">
              <label for="platform-youtube">📺 YouTube</label>
            </div>
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('twitter')">
              <input type="checkbox" id="platform-twitter" value="twitter">
              <label for="platform-twitter">🐦 Twitter</label>
            </div>
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('facebook')">
              <input type="checkbox" id="platform-facebook" value="facebook">
              <label for="platform-facebook">👥 Facebook</label>
            </div>
            <div class="platform-option" onclick="offerCreationManager.togglePlatform('linkedin')">
              <input type="checkbox" id="platform-linkedin" value="linkedin">
              <label for="platform-linkedin">💼 LinkedIn</label>
            </div>
          </div>
          <div class="validation-error" id="platformsError"></div>
        </div>
        
        <div class="form-group">
          <label>Deliverables *</label>
          <div class="deliverable-list" id="deliverableList">
            <div class="deliverable-item">
              <input type="text" placeholder="e.g., 1 Instagram post with product showcase" required>
              <button type="button" class="remove-deliverable" onclick="offerCreationManager.removeDeliverable(this)">Remove</button>
            </div>
          </div>
          <button type="button" class="add-deliverable" onclick="offerCreationManager.addDeliverable()">
            + Add Deliverable
          </button>
          <div class="validation-error" id="deliverablesError"></div>
        </div>
      </div>
    `;
  }

  /**
   * Create Step 3: Terms & Timeline
   */
  createStep3() {
    return `
      <div class="form-step" data-step="3">
        <h3>Timeline & Requirements</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate">
          </div>
          
          <div class="form-group">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="desiredReviewDate">Content Review Date</label>
            <input type="date" id="desiredReviewDate">
          </div>
          
          <div class="form-group">
            <label for="desiredPostDate">Desired Post Date</label>
            <input type="date" id="desiredPostDate">
          </div>
        </div>
        
        <div class="form-group">
          <label for="priority">Priority Level</label>
          <select id="priority">
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea id="notes" placeholder="Any specific requirements, brand guidelines, or additional information..."></textarea>
        </div>
      </div>
    `;
  }

  /**
   * Create Step 4: Review & Send
   */
  createStep4() {
    return `
      <div class="form-step" data-step="4">
        <h3>Review & Send Offer</h3>
        
        <div id="offerSummary">
          <!-- Offer summary will be populated here -->
        </div>
        
        <div class="email-preview">
          <h4>Email Preview</h4>
          <div class="email-preview-content" id="emailPreviewContent">
            <!-- Email preview will be populated here -->
          </div>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="confirmTerms" style="width: auto; margin-right: 8px;">
            I confirm that all information is accurate and I have permission to send this offer
          </label>
          <div class="validation-error" id="confirmTermsError"></div>
        </div>
      </div>
    `;
  }

  /**
   * Handle platform selection
   */
  togglePlatform(platform) {
    const checkbox = document.getElementById(`platform-${platform}`);
    const option = checkbox.closest('.platform-option');
    
    checkbox.checked = !checkbox.checked;
    option.classList.toggle('selected', checkbox.checked);
    
    this.saveFormData();
  }

  /**
   * Add new deliverable input
   */
  addDeliverable() {
    const list = document.getElementById('deliverableList');
    const item = document.createElement('div');
    item.className = 'deliverable-item';
    item.innerHTML = `
      <input type="text" placeholder="e.g., 1 YouTube video featuring product review" required>
      <button type="button" class="remove-deliverable" onclick="offerCreationManager.removeDeliverable(this)">Remove</button>
    `;
    list.appendChild(item);
    this.saveFormData();
  }

  /**
   * Remove deliverable input
   */
  removeDeliverable(button) {
    const list = document.getElementById('deliverableList');
    if (list.children.length > 1) {
      button.closest('.deliverable-item').remove();
      this.saveFormData();
    }
  }

  /**
   * Navigate to next step
   */
  async nextStep() {
    if (this.isSubmitting) return;

    // Validate current step
    if (!this.validateCurrentStep()) {
      return;
    }

    this.saveFormData();

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showStep(this.currentStep);
      
      if (this.currentStep === 4) {
        this.generateOfferSummary();
        this.generateEmailPreview();
      }
    } else {
      // Submit the offer
      await this.submitOffer();
    }
    
    this.updateStepIndicator();
    this.updateNavigationButtons();
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateStepIndicator();
      this.updateNavigationButtons();
    }
  }

  /**
   * Show specific step
   */
  showStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });
    
    const targetStep = document.querySelector(`[data-step="${stepNumber}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
    }
  }

  /**
   * Update step indicator
   */
  updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      } else if (stepNumber === this.currentStep) {
        step.classList.add('active');
      }
    });
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
    nextBtn.textContent = this.currentStep === this.totalSteps ? 'Send Offer' : 'Next';
  }

  /**
   * Validate current step
   */
  validateCurrentStep() {
    this.clearValidationErrors();
    let isValid = true;

    switch (this.currentStep) {
      case 1:
        isValid = this.validateStep1();
        break;
      case 2:
        isValid = this.validateStep2();
        break;
      case 3:
        isValid = this.validateStep3();
        break;
      case 4:
        isValid = this.validateStep4();
        break;
    }

    return isValid;
  }

  /**
   * Validate Step 1
   */
  validateStep1() {
    let isValid = true;
    
    const offerName = document.getElementById('offerName').value.trim();
    if (!offerName) {
      this.showValidationError('offerNameError', 'Offer title is required');
      isValid = false;
    }
    
    const creatorEmail = document.getElementById('creatorEmail').value.trim();
    if (!creatorEmail) {
      this.showValidationError('creatorEmailError', 'Creator email is required');
      isValid = false;
    } else if (!this.isValidEmail(creatorEmail)) {
      this.showValidationError('creatorEmailError', 'Please enter a valid email address');
      isValid = false;
    }
    
    const proposedAmount = document.getElementById('proposedAmount').value;
    if (!proposedAmount || proposedAmount <= 0) {
      this.showValidationError('proposedAmountError', 'Please enter a valid amount');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Validate Step 2
   */
  validateStep2() {
    let isValid = true;
    
    const platforms = document.querySelectorAll('.platform-option input[type="checkbox"]:checked');
    if (platforms.length === 0) {
      this.showValidationError('platformsError', 'Please select at least one platform');
      isValid = false;
    }
    
    const deliverables = document.querySelectorAll('.deliverable-item input');
    let hasValidDeliverable = false;
    deliverables.forEach(input => {
      if (input.value.trim()) {
        hasValidDeliverable = true;
      }
    });
    
    if (!hasValidDeliverable) {
      this.showValidationError('deliverablesError', 'Please add at least one deliverable');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Validate Step 3
   */
  validateStep3() {
    let isValid = true;
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      this.showValidationError('endDate', 'End date must be after start date');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Validate Step 4
   */
  validateStep4() {
    let isValid = true;
    
    const confirmTerms = document.getElementById('confirmTerms').checked;
    if (!confirmTerms) {
      this.showValidationError('confirmTermsError', 'Please confirm the terms to send the offer');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Show validation error
   */
  showValidationError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      
      // Add error styling to input
      const inputId = elementId.replace('Error', '');
      const input = document.getElementById(inputId);
      if (input) {
        input.classList.add('input-error');
      }
    }
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors() {
    document.querySelectorAll('.validation-error').forEach(error => {
      error.textContent = '';
    });
    
    document.querySelectorAll('.input-error').forEach(input => {
      input.classList.remove('input-error');
    });
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Save form data to formData object
   */
  saveFormData() {
    // Basic info
    const offerName = document.getElementById('offerName')?.value || '';
    const description = document.getElementById('description')?.value || '';
    const creatorEmail = document.getElementById('creatorEmail')?.value || '';
    const offerType = document.getElementById('offerType')?.value || 'standard';
    const proposedAmount = document.getElementById('proposedAmount')?.value || '';

    // Platforms
    const platforms = Array.from(document.querySelectorAll('.platform-option input[type="checkbox"]:checked'))
      .map(input => input.value);

    // Deliverables
    const deliverables = Array.from(document.querySelectorAll('.deliverable-item input'))
      .map(input => input.value.trim())
      .filter(value => value);

    // Timeline
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const desiredReviewDate = document.getElementById('desiredReviewDate')?.value || '';
    const desiredPostDate = document.getElementById('desiredPostDate')?.value || '';
    const priority = document.getElementById('priority')?.value || 'medium';
    const notes = document.getElementById('notes')?.value || '';

    this.formData = {
      offerName,
      description,
      creatorEmail,
      offerType,
      proposedAmount: proposedAmount ? parseFloat(proposedAmount) : null,
      platforms,
      deliverables,
      startDate,
      endDate,
      desiredReviewDate,
      desiredPostDate,
      priority,
      notes
    };
  }

  /**
   * Auto-save functionality
   */
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (document.querySelector('.offer-form-modal')) {
        this.autoSaveDraft();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  /**
   * Auto-save draft
   */
  async autoSaveDraft() {
    if (!document.querySelector('.offer-form-modal')) return;
    
    this.saveFormData();
    
    if (Object.keys(this.formData).length > 0) {
      await this.saveDraftInternal(true);
    }
  }

  /**
   * Save draft manually
   */
  async saveDraft() {
    this.saveFormData();
    await this.saveDraftInternal(false);
  }

  /**
   * Internal save draft method
   */
  async saveDraftInternal(isAutoSave = false) {
    try {
      this.updateDraftStatus('saving', isAutoSave ? 'Auto-saving...' : 'Saving draft...');
      
      const draftData = {
        ...this.formData,
        currentStep: this.currentStep,
        lastSaved: new Date().toISOString()
      };

      const response = await window.axeesAPI.saveDraft(this.draftId, draftData);
      
      if (response.success && response.draftId) {
        this.draftId = response.draftId;
        this.updateDraftStatus('saved', isAutoSave ? 'Auto-saved' : 'Draft saved');
      }
      
    } catch (error) {
      this.updateDraftStatus('error', 'Failed to save draft');
    }
  }

  /**
   * Load existing draft
   */
  async loadExistingDraft() {
    try {
      // Try to load the most recent draft for this user
      const drafts = await window.axeesAPI.getOffers('status=draft&limit=1');
      
      if (drafts.success && drafts.offers && drafts.offers.length > 0) {
        const draft = drafts.offers[0];
        this.draftId = draft._id;
        this.populateFormFromData(draft);
        this.updateDraftStatus('saved', 'Draft loaded');
      }
    } catch (error) {
      // Silently fail - no existing draft
    }
  }

  /**
   * Populate form from saved data
   */
  populateFormFromData(data) {
    // Basic info
    if (data.offerName) document.getElementById('offerName').value = data.offerName;
    if (data.description) document.getElementById('description').value = data.description;
    if (data.creatorEmail) document.getElementById('creatorEmail').value = data.creatorEmail;
    if (data.offerType) document.getElementById('offerType').value = data.offerType;
    if (data.proposedAmount) document.getElementById('proposedAmount').value = data.proposedAmount;

    // Platforms
    if (data.platforms) {
      data.platforms.forEach(platform => {
        const checkbox = document.getElementById(`platform-${platform}`);
        if (checkbox) {
          checkbox.checked = true;
          checkbox.closest('.platform-option').classList.add('selected');
        }
      });
    }

    // Deliverables
    if (data.deliverables && data.deliverables.length > 0) {
      const list = document.getElementById('deliverableList');
      list.innerHTML = '';
      
      data.deliverables.forEach(deliverable => {
        const item = document.createElement('div');
        item.className = 'deliverable-item';
        item.innerHTML = `
          <input type="text" value="${deliverable}" required>
          <button type="button" class="remove-deliverable" onclick="offerCreationManager.removeDeliverable(this)">Remove</button>
        `;
        list.appendChild(item);
      });
    }

    // Timeline
    if (data.startDate) document.getElementById('startDate').value = data.startDate.split('T')[0];
    if (data.endDate) document.getElementById('endDate').value = data.endDate.split('T')[0];
    if (data.desiredReviewDate) document.getElementById('desiredReviewDate').value = data.desiredReviewDate.split('T')[0];
    if (data.desiredPostDate) document.getElementById('desiredPostDate').value = data.desiredPostDate.split('T')[0];
    if (data.priority) document.getElementById('priority').value = data.priority;
    if (data.notes) document.getElementById('notes').value = data.notes;

    // Restore step if saved
    if (data.currentStep) {
      this.currentStep = data.currentStep;
      this.showStep(this.currentStep);
      this.updateStepIndicator();
      this.updateNavigationButtons();
    }
  }

  /**
   * Update draft status indicator
   */
  updateDraftStatus(status, text) {
    const statusElement = document.getElementById('draftStatus');
    const statusText = document.getElementById('draftStatusText');
    
    if (statusElement && statusText) {
      statusElement.className = `draft-status ${status}`;
      statusText.textContent = text;
      
      // Clear status after 3 seconds for non-error states
      if (status !== 'error') {
        setTimeout(() => {
          statusElement.className = 'draft-status';
          statusText.textContent = 'Auto-saving enabled';
        }, 3000);
      }
    }
  }

  /**
   * Generate offer summary for review
   */
  generateOfferSummary() {
    this.saveFormData();
    
    const summary = document.getElementById('offerSummary');
    if (!summary) return;

    summary.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 16px 0; color: var(--text-primary);">Offer Summary</h4>
        
        <div style="display: grid; gap: 16px;">
          <div>
            <strong>Title:</strong> ${this.formData.offerName || 'N/A'}
          </div>
          
          <div>
            <strong>Creator:</strong> ${this.formData.creatorEmail || 'N/A'}
          </div>
          
          <div>
            <strong>Amount:</strong> $${this.formData.proposedAmount || '0'} USD
          </div>
          
          <div>
            <strong>Type:</strong> ${this.formData.offerType || 'standard'}
          </div>
          
          <div>
            <strong>Platforms:</strong> ${this.formData.platforms ? this.formData.platforms.join(', ') : 'None selected'}
          </div>
          
          <div>
            <strong>Deliverables:</strong>
            <ul style="margin: 4px 0 0 20px;">
              ${this.formData.deliverables ? this.formData.deliverables.map(d => `<li>${d}</li>`).join('') : '<li>No deliverables specified</li>'}
            </ul>
          </div>
          
          ${this.formData.startDate || this.formData.endDate ? `
            <div>
              <strong>Timeline:</strong> 
              ${this.formData.startDate ? `Start: ${new Date(this.formData.startDate).toLocaleDateString()}` : ''}
              ${this.formData.startDate && this.formData.endDate ? ' - ' : ''}
              ${this.formData.endDate ? `End: ${new Date(this.formData.endDate).toLocaleDateString()}` : ''}
            </div>
          ` : ''}
          
          ${this.formData.notes ? `
            <div>
              <strong>Notes:</strong> ${this.formData.notes}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate email preview
   */
  generateEmailPreview() {
    const preview = document.getElementById('emailPreviewContent');
    if (!preview) return;

    const user = window.authContext?.user;
    const brandName = user?.brandName || user?.userName || 'Your Brand';

    preview.innerHTML = `
      <p><strong>Subject:</strong> Collaboration Opportunity: ${this.formData.offerName}</p>
      
      <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 4px;">
        <p>Hi there!</p>
        
        <p>I hope this email finds you well. I'm reaching out from <strong>${brandName}</strong> with an exciting collaboration opportunity.</p>
        
        <p><strong>Collaboration Details:</strong></p>
        <ul>
          <li><strong>Project:</strong> ${this.formData.offerName}</li>
          <li><strong>Compensation:</strong> $${this.formData.proposedAmount} USD</li>
          <li><strong>Platforms:</strong> ${this.formData.platforms ? this.formData.platforms.join(', ') : 'TBD'}</li>
        </ul>
        
        ${this.formData.description ? `<p><strong>About this collaboration:</strong><br>${this.formData.description}</p>` : ''}
        
        <p>We'd love to work with you on this project. Please let me know if you're interested and we can discuss the details further.</p>
        
        <p>Best regards,<br>
        ${user?.userName || 'Your Name'}<br>
        ${brandName}</p>
      </div>
    `;
  }

  /**
   * Submit the offer
   */
  async submitOffer() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    try {
      this.saveFormData();
      
      // Update button state
      const nextBtn = document.getElementById('nextBtn');
      nextBtn.textContent = 'Sending...';
      nextBtn.disabled = true;
      
      // Create the offer
      const offerData = {
        ...this.formData,
        // Convert dates to proper format
        startDate: this.formData.startDate ? new Date(this.formData.startDate).toISOString() : null,
        endDate: this.formData.endDate ? new Date(this.formData.endDate).toISOString() : null,
        desiredReviewDate: this.formData.desiredReviewDate ? new Date(this.formData.desiredReviewDate).toISOString() : null,
        desiredPostDate: this.formData.desiredPostDate ? new Date(this.formData.desiredPostDate).toISOString() : null,
      };

      let response;
      
      if (this.formData.offerType === 'trial') {
        response = await window.axeesAPI.createTrialOffer(offerData);
      } else {
        response = await window.axeesAPI.createOffer(offerData);
      }
      
      if (response.success) {
        // Send the offer to creator with email verification and retry
        await this.sendOfferWithEmailVerification(response.offer._id, this.formData.creatorEmail);
        
        // Show success message
        this.showSuccessMessage();
        
        // Close form after delay
        setTimeout(() => {
          this.closeForm();
          // Refresh marketplace if on marketplace page
          if (window.location.pathname.includes('marketplace')) {
            window.location.reload();
          }
        }, 2000);
        
      } else {
        throw new Error(response.message || 'Failed to create offer');
      }
      
    } catch (error) {
      this.showErrorMessage(error.message || 'Failed to send offer. Please try again.');
      
      // Reset button state
      const nextBtn = document.getElementById('nextBtn');
      nextBtn.textContent = 'Send Offer';
      nextBtn.disabled = false;
      
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Send offer with email verification and retry handling
   */
  async sendOfferWithEmailVerification(offerId, email) {
    try {
      this.showEmailSendingStatus('Verifying email address...');
      
      // Setup retry attempt listener
      const retryListener = (event) => {
        const { attempt, maxRetries, delay, error } = event.detail;
        this.showEmailSendingStatus(`Attempt ${attempt} failed: ${error}. Retrying in ${Math.ceil(delay/1000)}s...`);
        
        setTimeout(() => {
          this.showEmailSendingStatus(`Sending attempt ${attempt + 1} of ${maxRetries}...`);
        }, delay);
      };
      
      window.addEventListener('email-retry-attempt', retryListener);
      
      try {
        const result = await window.axeesAPI.sendOfferWithRetry(offerId, email);
        
        this.showEmailSendingStatus(`✅ Offer sent successfully! ${result.emailVerified ? '(Email verified)' : ''}`);
        
        return result;
        
      } finally {
        window.removeEventListener('email-retry-attempt', retryListener);
      }
      
    } catch (error) {
      this.showEmailSendingStatus(`❌ Failed to send offer: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Show email sending status in the form
   */
  showEmailSendingStatus(message, type = 'info') {
    const statusElement = document.getElementById('emailSendingStatus');
    if (!statusElement) {
      // Create status element if it doesn't exist
      const formBody = document.querySelector('.offer-form-body');
      const statusDiv = document.createElement('div');
      statusDiv.id = 'emailSendingStatus';
      statusDiv.className = 'email-sending-status';
      formBody.appendChild(statusDiv);
    }
    
    const status = document.getElementById('emailSendingStatus');
    status.textContent = message;
    status.className = `email-sending-status ${type}`;
    status.style.display = 'block';
    
    // Add styles if not already added
    if (!document.getElementById('email-status-styles')) {
      const styles = document.createElement('style');
      styles.id = 'email-status-styles';
      styles.textContent = `
        .email-sending-status {
          padding: 12px 16px;
          margin: 16px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }
        
        .email-sending-status.info {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
        
        .email-sending-status.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        
        .email-sending-status.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  /**
   * Handle offer type change
   */
  handleOfferTypeChange() {
    const offerType = document.getElementById('offerType')?.value;
    const offerTypeInfo = document.getElementById('offerTypeInfo');
    
    if (!offerTypeInfo) return;

    switch(offerType) {
      case 'trial':
        offerTypeInfo.innerHTML = `
          <div class="offer-type-badge trial">
            <span class="badge-icon">💫</span>
            <div class="badge-content">
              <strong>$1 Trial Offer</strong>
              <p>Low-risk collaboration starter. Automatically converts to full amount after 7 days.</p>
            </div>
          </div>
        `;
        break;
      case 'premium':
        offerTypeInfo.innerHTML = `
          <div class="offer-type-badge premium">
            <span class="badge-icon">⭐</span>
            <div class="badge-content">
              <strong>Premium Collaboration</strong>
              <p>High-value partnership with extended deliverables and priority support.</p>
            </div>
          </div>
        `;
        break;
      default:
        offerTypeInfo.innerHTML = `
          <div class="offer-type-badge standard">
            <span class="badge-icon">📋</span>
            <div class="badge-content">
              <strong>Standard Offer</strong>
              <p>Regular collaboration offer with standard terms and timeline.</p>
            </div>
          </div>
        `;
    }
    
    this.updatePricingBreakdown();
  }

  /**
   * Update pricing breakdown based on offer type and amount
   */
  updatePricingBreakdown() {
    const offerType = document.getElementById('offerType')?.value;
    const proposedAmount = parseFloat(document.getElementById('proposedAmount')?.value) || 0;
    const pricingBreakdown = document.getElementById('pricingBreakdown');
    const pricingDetails = document.getElementById('pricingDetails');
    
    if (!pricingBreakdown || !pricingDetails || proposedAmount <= 0) {
      if (pricingBreakdown) pricingBreakdown.style.display = 'none';
      return;
    }

    if (offerType === 'trial') {
      pricingBreakdown.style.display = 'block';
      pricingDetails.innerHTML = `
        <div class="pricing-row trial-pricing">
          <div class="pricing-item highlight">
            <span class="pricing-label">Trial Amount</span>
            <span class="pricing-value">$1.00</span>
          </div>
          <div class="pricing-item">
            <span class="pricing-label">Full Amount (after trial)</span>
            <span class="pricing-value">$${proposedAmount.toFixed(2)}</span>
          </div>
          <div class="pricing-item">
            <span class="pricing-label">Trial Duration</span>
            <span class="pricing-value">7 days</span>
          </div>
          <div class="pricing-item">
            <span class="pricing-label">Platform Fee (10%)</span>
            <span class="pricing-value">$${(proposedAmount * 0.1).toFixed(2)}</span>
          </div>
          <div class="pricing-divider"></div>
          <div class="pricing-item total">
            <span class="pricing-label">Creator Receives (after conversion)</span>
            <span class="pricing-value">$${(proposedAmount * 0.9).toFixed(2)}</span>
          </div>
        </div>
        <div class="trial-info">
          <div class="trial-timeline">
            <div class="timeline-item">
              <span class="timeline-step">1</span>
              <div class="timeline-content">
                <strong>Trial Starts</strong>
                <p>Creator begins work for $1</p>
              </div>
            </div>
            <div class="timeline-item">
              <span class="timeline-step">2</span>
              <div class="timeline-content">
                <strong>Day 7</strong>
                <p>Automatic conversion to full amount</p>
              </div>
            </div>
            <div class="timeline-item">
              <span class="timeline-step">3</span>
              <div class="timeline-content">
                <strong>Payment Release</strong>
                <p>Creator receives payment upon completion</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      pricingBreakdown.style.display = 'block';
      pricingDetails.innerHTML = `
        <div class="pricing-row standard-pricing">
          <div class="pricing-item">
            <span class="pricing-label">Offer Amount</span>
            <span class="pricing-value">$${proposedAmount.toFixed(2)}</span>
          </div>
          <div class="pricing-item">
            <span class="pricing-label">Platform Fee (10%)</span>
            <span class="pricing-value">$${(proposedAmount * 0.1).toFixed(2)}</span>
          </div>
          <div class="pricing-divider"></div>
          <div class="pricing-item total">
            <span class="pricing-label">Creator Receives</span>
            <span class="pricing-value">$${(proposedAmount * 0.9).toFixed(2)}</span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    const formBody = document.querySelector('.offer-form-body');
    if (formBody) {
      formBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="color: var(--success); margin: 0 0 8px 0;">Offer Sent Successfully!</h3>
          <p style="color: var(--text-secondary); margin: 0;">The creator will receive your offer via email and can respond through the platform.</p>
        </div>
      `;
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    const formBody = document.querySelector('.offer-form-body');
    if (formBody) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.style.cssText = `
        background: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        border: 1px solid #fecaca;
      `;
      errorDiv.textContent = message;
      
      formBody.insertBefore(errorDiv, formBody.firstChild);
      
      // Remove error after 5 seconds
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    this.currentStep = 1;
    this.formData = {};
    this.draftId = null;
    this.validationErrors = {};
    this.isSubmitting = false;
  }

  /**
   * Close the form modal
   */
  closeForm() {
    const modal = document.querySelector('.offer-form-modal');
    if (modal) {
      modal.remove();
    }
    
    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Cleanup on page unload
   */
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

// Initialize the offer creation manager
window.offerCreationManager = new OfferCreationManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.offerCreationManager) {
    window.offerCreationManager.destroy();
  }
});