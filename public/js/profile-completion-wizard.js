/**
 * Profile Completion Wizard
 * Step-by-step profile completion interface with progress tracking
 */

class ProfileCompletionWizard {
  constructor() {
    this.userId = null;
    this.userType = null;
    this.completionData = null;
    this.currentStep = 0;
    this.steps = [];
    this.isOpen = false;
    
    this.initialize();
  }

  initialize() {
    this.createWizardModal();
    this.bindEvents();
  }

  /**
   * Create the wizard modal structure
   */
  createWizardModal() {
    if (document.getElementById('profile-completion-wizard')) return;

    const modal = document.createElement('div');
    modal.id = 'profile-completion-wizard';
    modal.className = 'wizard-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="wizard-modal-content">
        <div class="wizard-header">
          <h2>Complete Your Profile</h2>
          <button class="close-btn" onclick="window.profileWizard.close()">&times;</button>
        </div>
        
        <div class="wizard-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="wizard-progress-fill"></div>
          </div>
          <div class="progress-text">
            <span id="wizard-progress-text">0% Complete</span>
            <span id="wizard-step-indicator">Step 1 of 5</span>
          </div>
        </div>
        
        <div class="wizard-body">
          <div class="wizard-steps" id="wizard-steps-container">
            <!-- Steps will be dynamically populated -->
          </div>
        </div>
        
        <div class="wizard-footer">
          <button class="btn btn-secondary" id="wizard-prev-btn" onclick="window.profileWizard.previousStep()" disabled>
            Previous
          </button>
          <button class="btn btn-primary" id="wizard-next-btn" onclick="window.profileWizard.nextStep()">
            Next
          </button>
          <button class="btn btn-success" id="wizard-complete-btn" onclick="window.profileWizard.completeWizard()" style="display: none;">
            Complete Profile
          </button>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .wizard-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }

      .wizard-modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .wizard-header {
        padding: 24px 32px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }

      .wizard-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: white;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .wizard-progress {
        padding: 24px 32px;
        background: #f9fafb;
      }

      .progress-bar {
        background: #e5e7eb;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      }

      .progress-fill {
        background: linear-gradient(to right, #6366f1, #8b5cf6);
        height: 100%;
        transition: width 0.3s ease;
        width: 0%;
      }

      .progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
      }

      .wizard-body {
        padding: 32px;
        flex: 1;
        overflow-y: auto;
      }

      .wizard-step {
        display: none;
      }

      .wizard-step.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .step-content h3 {
        margin: 0 0 16px 0;
        color: #111827;
        font-size: 20px;
        font-weight: 600;
      }

      .step-content p {
        margin: 0 0 24px 0;
        color: #6b7280;
        line-height: 1.6;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .form-group.required label::after {
        content: ' *';
        color: #ef4444;
      }

      .completion-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 12px;
        border-left: 4px solid #d1d5db;
        transition: all 0.2s;
      }

      .completion-item.completed {
        background: #f0fdf4;
        border-left-color: #10b981;
      }

      .completion-item.completed .completion-icon {
        background: #10b981;
        color: white;
      }

      .completion-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #d1d5db;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
      }

      .completion-details {
        flex: 1;
      }

      .completion-title {
        font-weight: 500;
        color: #111827;
        margin-bottom: 2px;
      }

      .completion-description {
        font-size: 12px;
        color: #6b7280;
      }

      .wizard-footer {
        padding: 24px 32px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        background: #f9fafb;
      }

      .btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-size: 14px;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #e5e7eb;
      }

      .btn-primary {
        background: #6366f1;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #4f46e5;
      }

      .btn-success {
        background: #10b981;
        color: white;
      }

      .btn-success:hover:not(:disabled) {
        background: #059669;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .wizard-modal-content {
          width: 95%;
          margin: 20px;
        }
        
        .wizard-header,
        .wizard-progress,
        .wizard-body,
        .wizard-footer {
          padding: 16px 20px;
        }
        
        .wizard-footer {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(modal);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Close on backdrop click
    const modal = document.getElementById('profile-completion-wizard');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Open the wizard for a specific user
   */
  async open(userId = null) {
    this.userId = userId || window.authContext?.user?.id;
    if (!this.userId) {
      console.error('No user ID provided for profile wizard');
      return;
    }

    this.userType = window.authContext?.user?.userType;
    if (!this.userType) {
      console.error('No user type available');
      return;
    }

    try {
      // Load completion data
      await this.loadCompletionData();
      
      // Generate steps based on user type and completion status
      this.generateSteps();
      
      // Render steps
      this.renderSteps();
      
      // Show modal
      const modal = document.getElementById('profile-completion-wizard');
      modal.style.display = 'flex';
      this.isOpen = true;
      
      // Update progress
      this.updateProgress();
      
    } catch (error) {
      console.error('Failed to open profile wizard:', error);
      alert('Failed to load profile completion data');
    }
  }

  /**
   * Load completion data from API
   */
  async loadCompletionData() {
    const response = await window.axeesAPI.request(`/profile-completion/${this.userId}`);
    if (response.success) {
      this.completionData = response.data;
    } else {
      throw new Error(response.message || 'Failed to load completion data');
    }
  }

  /**
   * Generate steps based on user type and completion status
   */
  generateSteps() {
    const incompleteSteps = this.completionData.incompleteSteps || [];
    const recommendations = this.completionData.recommendations || [];
    
    this.steps = [];
    
    // Group steps by category
    const categories = {
      'Basic Information': [],
      'Profile Details': [],
      'Verification': [],
      'Financial Setup': [],
      'Preferences': []
    };
    
    incompleteSteps.forEach(step => {
      const category = this.getCategoryForStep(step.step);
      if (categories[category]) {
        categories[category].push(step);
      }
    });
    
    // Create steps for each non-empty category
    Object.entries(categories).forEach(([category, steps]) => {
      if (steps.length > 0) {
        this.steps.push({
          title: category,
          description: this.getCategoryDescription(category),
          items: steps,
          category: category.toLowerCase().replace(' ', '_')
        });
      }
    });
    
    // Add final step
    if (this.steps.length > 0) {
      this.steps.push({
        title: 'Complete Your Profile',
        description: 'Congratulations! You\'re almost done. Review your profile and complete the setup.',
        items: [],
        category: 'completion'
      });
    }
  }

  /**
   * Get category for a step
   */
  getCategoryForStep(stepName) {
    const categoryMap = {
      'profile_picture': 'Basic Information',
      'display_name': 'Basic Information',
      'bio': 'Profile Details',
      'location': 'Profile Details',
      'website': 'Profile Details',
      'social_links': 'Profile Details',
      'portfolio': 'Profile Details',
      'skills': 'Profile Details',
      'experience': 'Profile Details',
      'email_verification': 'Verification',
      'phone_verification': 'Verification',
      'identity_verification': 'Verification',
      'payment_method': 'Financial Setup',
      'tax_information': 'Financial Setup',
      'notification_preferences': 'Preferences',
      'privacy_settings': 'Preferences'
    };
    
    return categoryMap[stepName] || 'Profile Details';
  }

  /**
   * Get description for category
   */
  getCategoryDescription(category) {
    const descriptions = {
      'Basic Information': 'Let\'s start with the basics. Add your profile picture and display name.',
      'Profile Details': 'Tell us more about yourself and your professional background.',
      'Verification': 'Verify your account to build trust and unlock all features.',
      'Financial Setup': 'Set up payment methods and tax information for seamless transactions.',
      'Preferences': 'Customize your experience with notification and privacy preferences.'
    };
    
    return descriptions[category] || 'Complete the following items to improve your profile.';
  }

  /**
   * Render wizard steps
   */
  renderSteps() {
    const container = document.getElementById('wizard-steps-container');
    container.innerHTML = '';
    
    this.steps.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.className = `wizard-step ${index === this.currentStep ? 'active' : ''}`;
      stepElement.innerHTML = this.renderStepContent(step, index);
      container.appendChild(stepElement);
    });
  }

  /**
   * Render content for a specific step
   */
  renderStepContent(step, index) {
    if (step.category === 'completion') {
      return `
        <div class="step-content">
          <h3>${step.title}</h3>
          <p>${step.description}</p>
          <div class="completion-summary">
            <div class="completion-score">
              <div class="score-circle">
                <span class="score-percentage">${Math.round(this.completionData.completionPercentage)}%</span>
                <span class="score-label">Complete</span>
              </div>
            </div>
            <div class="completion-benefits">
              <h4>Benefits of a Complete Profile:</h4>
              <ul>
                <li>✅ Access to all platform features</li>
                <li>✅ Higher visibility in marketplace</li>
                <li>✅ Increased trust from ${this.userType === 'Creator' ? 'marketers' : 'creators'}</li>
                <li>✅ Faster deal approvals and payments</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="step-content">
        <h3>${step.title}</h3>
        <p>${step.description}</p>
        <div class="completion-items">
          ${step.items.map(item => `
            <div class="completion-item">
              <div class="completion-icon">
                ${item.completed ? '✓' : (step.items.indexOf(item) + 1)}
              </div>
              <div class="completion-details">
                <div class="completion-title">${this.getStepDisplayName(item.step)}</div>
                <div class="completion-description">${item.description || this.getStepDescription(item.step)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get display name for step
   */
  getStepDisplayName(stepName) {
    const names = {
      'profile_picture': 'Profile Picture',
      'display_name': 'Display Name',
      'bio': 'Bio/Description',
      'location': 'Location',
      'website': 'Website',
      'social_links': 'Social Media Links',
      'portfolio': 'Portfolio/Samples',
      'skills': 'Skills & Expertise',
      'experience': 'Work Experience',
      'email_verification': 'Email Verification',
      'phone_verification': 'Phone Verification',
      'identity_verification': 'Identity Verification',
      'payment_method': 'Payment Method',
      'tax_information': 'Tax Information',
      'notification_preferences': 'Notification Settings',
      'privacy_settings': 'Privacy Settings'
    };
    
    return names[stepName] || stepName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get description for step
   */
  getStepDescription(stepName) {
    const descriptions = {
      'profile_picture': 'Add a professional profile photo',
      'display_name': 'Choose how others will see your name',
      'bio': 'Write a compelling description of your work',
      'location': 'Add your location for better matching',
      'website': 'Link to your professional website',
      'social_links': 'Connect your social media profiles',
      'portfolio': 'Showcase your best work samples',
      'skills': 'List your key skills and expertise',
      'experience': 'Add your professional background',
      'email_verification': 'Verify your email address',
      'phone_verification': 'Verify your phone number',
      'identity_verification': 'Complete identity verification',
      'payment_method': 'Add a payment method',
      'tax_information': 'Complete tax documentation',
      'notification_preferences': 'Set up your notifications',
      'privacy_settings': 'Configure privacy settings'
    };
    
    return descriptions[stepName] || 'Complete this profile section';
  }

  /**
   * Navigate to next step
   */
  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.renderSteps();
      this.updateProgress();
      this.updateButtons();
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderSteps();
      this.updateProgress();
      this.updateButtons();
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progressFill = document.getElementById('wizard-progress-fill');
    const progressText = document.getElementById('wizard-progress-text');
    const stepIndicator = document.getElementById('wizard-step-indicator');
    
    const percentage = this.completionData?.completionPercentage || 0;
    const stepProgress = ((this.currentStep + 1) / this.steps.length) * 100;
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${Math.round(percentage)}% Complete`;
    stepIndicator.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
  }

  /**
   * Update button states
   */
  updateButtons() {
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const completeBtn = document.getElementById('wizard-complete-btn');
    
    prevBtn.disabled = this.currentStep === 0;
    
    if (this.currentStep === this.steps.length - 1) {
      nextBtn.style.display = 'none';
      completeBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      completeBtn.style.display = 'none';
    }
  }

  /**
   * Complete wizard
   */
  async completeWizard() {
    try {
      // Mark wizard as seen
      await window.axeesAPI.request(`/profile-completion/${this.userId}/step`, {
        method: 'POST',
        body: JSON.stringify({
          step: 'wizard_completed',
          completed: true
        })
      });
      
      this.close();
      
      // Show success message
      this.showCompletionMessage();
      
      // Refresh profile data
      if (window.authContext && window.authContext.refreshProfile) {
        await window.authContext.refreshProfile();
      }
      
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      alert('Failed to save completion status');
    }
  }

  /**
   * Show completion success message
   */
  showCompletionMessage() {
    if (window.showNotification) {
      window.showNotification('Profile wizard completed! Visit your profile page to continue improving your profile.', 'success');
    } else {
      alert('Profile wizard completed!');
    }
  }

  /**
   * Close wizard
   */
  close() {
    const modal = document.getElementById('profile-completion-wizard');
    modal.style.display = 'none';
    this.isOpen = false;
    this.currentStep = 0;
  }

  /**
   * Open profile page for editing
   */
  openProfileEditor() {
    this.close();
    window.location.href = '/profile.html';
  }
}

// Initialize global wizard instance
window.profileWizard = new ProfileCompletionWizard();