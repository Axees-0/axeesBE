/**
 * Deal Creation UI for Marketers
 * Allows marketers to create new deals from existing offers
 */

class DealCreationManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.dealData = {
      offerId: null,
      creatorId: null,
      milestones: [],
      terms: {},
      startDate: null,
      endDate: null
    };
    
    this.initialize();
  }

  initialize() {
    this.createDealCreationModal();
    this.bindEvents();
  }

  /**
   * Create deal creation modal
   */
  createDealCreationModal() {
    if (document.getElementById('deal-creation-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'deal-creation-modal';
    modal.className = 'modal deal-creation-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content deal-creation-content">
        <div class="modal-header">
          <h2>Create New Deal</h2>
          <button class="close-btn" onclick="window.dealCreationManager.close()">&times;</button>
        </div>
        
        <div class="deal-creation-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="deal-progress-fill" style="width: 33.33%"></div>
          </div>
          <div class="progress-steps">
            <div class="progress-step active" data-step="1">
              <span class="step-number">1</span>
              <span class="step-label">Select Offer</span>
            </div>
            <div class="progress-step" data-step="2">
              <span class="step-number">2</span>
              <span class="step-label">Choose Creator</span>
            </div>
            <div class="progress-step" data-step="3">
              <span class="step-number">3</span>
              <span class="step-label">Set Terms</span>
            </div>
          </div>
        </div>
        
        <div class="modal-body">
          <!-- Step 1: Select Offer -->
          <div class="creation-step" id="step-1">
            <h3>Select an Offer</h3>
            <p class="step-description">Choose from your existing offers or create a new one</p>
            
            <div class="offers-grid" id="marketer-offers-grid">
              <div class="loading-spinner">Loading your offers...</div>
            </div>
            
            <div class="step-actions">
              <button class="btn btn-secondary" onclick="window.location.href='marketplace.html'">
                Create New Offer
              </button>
              <button class="btn btn-primary" onclick="window.dealCreationManager.nextStep()" disabled id="step-1-next">
                Next: Choose Creator
              </button>
            </div>
          </div>
          
          <!-- Step 2: Choose Creator -->
          <div class="creation-step" id="step-2" style="display: none;">
            <h3>Choose a Creator</h3>
            <p class="step-description">Select a creator who has shown interest or search for new creators</p>
            
            <div class="creator-search">
              <input type="text" class="search-input" placeholder="Search creators by name or category..." 
                     id="creator-search-input" onkeyup="window.dealCreationManager.searchCreators(event)">
            </div>
            
            <div class="creators-section">
              <h4>Interested Creators</h4>
              <div class="creators-grid" id="interested-creators-grid">
                <p class="empty-message">No creators have shown interest yet</p>
              </div>
              
              <h4>Suggested Creators</h4>
              <div class="creators-grid" id="suggested-creators-grid">
                <div class="loading-spinner">Loading creator suggestions...</div>
              </div>
            </div>
            
            <div class="step-actions">
              <button class="btn btn-secondary" onclick="window.dealCreationManager.previousStep()">
                Back
              </button>
              <button class="btn btn-primary" onclick="window.dealCreationManager.nextStep()" disabled id="step-2-next">
                Next: Set Terms
              </button>
            </div>
          </div>
          
          <!-- Step 3: Set Terms -->
          <div class="creation-step" id="step-3" style="display: none;">
            <h3>Set Deal Terms</h3>
            <p class="step-description">Define milestones, timeline, and payment terms</p>
            
            <div class="terms-form">
              <div class="selected-summary">
                <div class="summary-item">
                  <label>Offer:</label>
                  <span id="selected-offer-name">-</span>
                </div>
                <div class="summary-item">
                  <label>Creator:</label>
                  <span id="selected-creator-name">-</span>
                </div>
                <div class="summary-item">
                  <label>Total Budget:</label>
                  <span id="selected-budget">-</span>
                </div>
              </div>
              
              <div class="form-section">
                <h4>Timeline</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" id="deal-start-date" min="${new Date().toISOString().split('T')[0]}" 
                           onchange="window.dealCreationManager.updateTimeline()">
                  </div>
                  <div class="form-group">
                    <label>End Date</label>
                    <input type="date" id="deal-end-date" min="${new Date().toISOString().split('T')[0]}"
                           onchange="window.dealCreationManager.updateTimeline()">
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <h4>Milestones</h4>
                <p class="section-hint">Define up to 4 milestones for this deal</p>
                
                <div class="milestone-template-selector">
                  <label>Use Template:</label>
                  <select id="milestone-template" onchange="window.dealCreationManager.applyMilestoneTemplate()">
                    <option value="custom">Custom</option>
                    <option value="equal_split">Equal Split</option>
                    <option value="front_loaded">Front Loaded (40/30/20/10)</option>
                    <option value="back_loaded">Back Loaded (10/20/30/40)</option>
                  </select>
                </div>
                
                <div id="milestone-creator-container">
                  <!-- Milestones will be dynamically added here -->
                </div>
                
                <button class="btn btn-secondary" onclick="window.dealCreationManager.addMilestone()" 
                        id="add-milestone-btn">+ Add Milestone</button>
              </div>
              
              <div class="form-section">
                <h4>Additional Terms</h4>
                <textarea id="additional-terms" rows="4" 
                          placeholder="Any additional terms or requirements..."></textarea>
              </div>
            </div>
            
            <div class="step-actions">
              <button class="btn btn-secondary" onclick="window.dealCreationManager.previousStep()">
                Back
              </button>
              <button class="btn btn-primary" onclick="window.dealCreationManager.createDeal()" id="create-deal-btn">
                Create Deal
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .deal-creation-modal .modal-content {
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .deal-creation-progress {
        padding: 20px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .progress-bar {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(to right, #6366f1, #ec4899);
        transition: width 0.3s ease;
      }

      .progress-steps {
        display: flex;
        justify-content: space-between;
      }

      .progress-step {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #9ca3af;
        font-size: 14px;
      }

      .progress-step.active {
        color: #6366f1;
      }

      .progress-step.completed {
        color: #10b981;
      }

      .step-number {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid currentColor;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
      }

      .progress-step.completed .step-number {
        background: currentColor;
        color: white;
      }

      .creation-step {
        padding: 20px;
      }

      .creation-step h3 {
        margin: 0 0 8px 0;
        color: #111827;
      }

      .step-description {
        color: #6b7280;
        margin-bottom: 24px;
      }

      .offers-grid,
      .creators-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
        max-height: 300px;
        overflow-y: auto;
      }

      .offer-card,
      .creator-card {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .offer-card:hover,
      .creator-card:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .offer-card.selected,
      .creator-card.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.05);
      }

      .offer-card h4,
      .creator-card h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
      }

      .offer-meta,
      .creator-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        font-size: 14px;
        color: #6b7280;
      }

      .creator-search {
        margin-bottom: 24px;
      }

      .search-input {
        width: 100%;
        padding: 10px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
      }

      .creators-section h4 {
        margin: 24px 0 12px 0;
        color: #374151;
        font-size: 16px;
      }

      .empty-message {
        grid-column: 1 / -1;
        text-align: center;
        color: #9ca3af;
        padding: 40px;
      }

      .terms-form {
        margin-top: 24px;
      }

      .selected-summary {
        background: #f3f4f6;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
        display: flex;
        gap: 24px;
      }

      .summary-item {
        flex: 1;
      }

      .summary-item label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .summary-item span {
        font-weight: 600;
        color: #111827;
      }

      .form-section {
        margin-bottom: 32px;
      }

      .form-section h4 {
        margin: 0 0 12px 0;
        color: #111827;
      }

      .section-hint {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }

      .milestone-template-selector {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .milestone-template-selector label {
        font-weight: 500;
        color: #374151;
      }

      .milestone-template-selector select {
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }

      .milestone-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
      }

      .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .milestone-number {
        background: #6366f1;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }

      .remove-milestone {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 14px;
      }

      .milestone-fields {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 12px;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .loading-spinner {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #6b7280;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
        
        .milestone-fields {
          grid-template-columns: 1fr;
        }
        
        .selected-summary {
          flex-direction: column;
          gap: 12px;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(modal);
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Close on backdrop click
    const modal = document.getElementById('deal-creation-modal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
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
   * Open deal creation modal
   */
  open() {
    // Check if user is a marketer
    if (!window.authContext?.isAuthenticated) {
      window.authManager.showAuthModal('login');
      return;
    }

    if (window.authContext.user.userType !== 'Marketer') {
      alert('Only marketers can create deals');
      return;
    }

    const modal = document.getElementById('deal-creation-modal');
    modal.style.display = 'block';
    
    // Reset state
    this.currentStep = 1;
    this.dealData = {
      offerId: null,
      creatorId: null,
      milestones: [],
      terms: {},
      startDate: null,
      endDate: null
    };
    
    // Load marketer's offers
    this.loadMarketerOffers();
  }

  /**
   * Close modal
   */
  close() {
    const modal = document.getElementById('deal-creation-modal');
    modal.style.display = 'none';
  }

  /**
   * Navigate to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      // Hide current step
      document.getElementById(`step-${this.currentStep}`).style.display = 'none';
      
      // Update progress
      this.currentStep++;
      this.updateProgress();
      
      // Show next step
      document.getElementById(`step-${this.currentStep}`).style.display = 'block';
      
      // Load data for next step
      if (this.currentStep === 2) {
        this.loadCreators();
      } else if (this.currentStep === 3) {
        this.setupTermsForm();
      }
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      // Hide current step
      document.getElementById(`step-${this.currentStep}`).style.display = 'none';
      
      // Update progress
      this.currentStep--;
      this.updateProgress();
      
      // Show previous step
      document.getElementById(`step-${this.currentStep}`).style.display = 'block';
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    const progressFill = document.getElementById('deal-progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Update progress bar width
    const progress = (this.currentStep / this.totalSteps) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Update step indicators
    progressSteps.forEach((step, index) => {
      const stepNum = index + 1;
      if (stepNum < this.currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (stepNum === this.currentStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }

  /**
   * Load marketer's offers
   */
  async loadMarketerOffers() {
    const grid = document.getElementById('marketer-offers-grid');
    
    try {
      const response = await window.axeesAPI.getOffers({ 
        marketerId: window.authContext.user.id 
      });
      
      if (response.success && response.offers) {
        const activeOffers = response.offers.filter(offer => 
          offer.status === 'active' || offer.status === 'published'
        );
        
        if (activeOffers.length === 0) {
          grid.innerHTML = '<p class="empty-message">No active offers found. Create an offer first.</p>';
          return;
        }
        
        grid.innerHTML = activeOffers.map(offer => `
          <div class="offer-card" data-offer-id="${offer._id}" onclick="window.dealCreationManager.selectOffer('${offer._id}')">
            <h4>${offer.offerName || 'Untitled Offer'}</h4>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">
              ${this.truncateText(offer.description || 'No description', 100)}
            </p>
            <div class="offer-meta">
              <span>Budget: $${(offer.proposedAmount || 0).toLocaleString()}</span>
              <span>${offer.category || 'General'}</span>
            </div>
          </div>
        `).join('');
        
        // Store offers for later use
        this.offers = activeOffers;
      }
    } catch (error) {
      console.error('Failed to load offers:', error);
      grid.innerHTML = '<p class="empty-message">Failed to load offers. Please try again.</p>';
    }
  }

  /**
   * Select an offer
   */
  selectOffer(offerId) {
    // Update UI
    document.querySelectorAll('.offer-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.offerId === offerId);
    });
    
    // Store selection
    this.dealData.offerId = offerId;
    this.selectedOffer = this.offers.find(o => o._id === offerId);
    
    // Enable next button
    document.getElementById('step-1-next').disabled = false;
  }

  /**
   * Load creators
   */
  async loadCreators() {
    const interestedGrid = document.getElementById('interested-creators-grid');
    const suggestedGrid = document.getElementById('suggested-creators-grid');
    
    try {
      // For now, just show suggested creators
      // In a real implementation, you'd fetch creators who have shown interest in this offer
      const response = await window.axeesAPI.searchCreators({
        category: this.selectedOffer?.category,
        limit: 10
      });
      
      if (response.success && response.creators) {
        suggestedGrid.innerHTML = response.creators.map(creator => `
          <div class="creator-card" data-creator-id="${creator._id}" 
               onclick="window.dealCreationManager.selectCreator('${creator._id}')">
            <h4>${creator.userName || creator.name || 'Unknown Creator'}</h4>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">
              ${creator.bio || 'No bio available'}
            </p>
            <div class="creator-meta">
              <span>⭐ ${creator.rating || '4.5'}</span>
              <span>👥 ${this.formatFollowers(creator.followers || 0)}</span>
            </div>
          </div>
        `).join('');
        
        // Store creators for later use
        this.creators = response.creators;
      } else {
        // Fallback to mock data
        this.loadMockCreators();
      }
    } catch (error) {
      console.error('Failed to load creators:', error);
      // Fallback to mock data
      this.loadMockCreators();
    }
  }

  /**
   * Load mock creators
   */
  loadMockCreators() {
    const suggestedGrid = document.getElementById('suggested-creators-grid');
    const mockCreators = [
      { _id: '1', userName: 'Sarah Johnson', bio: 'Fashion & Lifestyle Influencer', rating: 4.8, followers: 125000 },
      { _id: '2', userName: 'Mike Chen', bio: 'Tech Reviewer & Content Creator', rating: 4.9, followers: 98000 },
      { _id: '3', userName: 'Emma Davis', bio: 'Beauty & Wellness Expert', rating: 4.7, followers: 156000 },
      { _id: '4', userName: 'Alex Rivera', bio: 'Fitness Coach & Motivator', rating: 4.6, followers: 87000 }
    ];
    
    suggestedGrid.innerHTML = mockCreators.map(creator => `
      <div class="creator-card" data-creator-id="${creator._id}" 
           onclick="window.dealCreationManager.selectCreator('${creator._id}')">
        <h4>${creator.userName}</h4>
        <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">${creator.bio}</p>
        <div class="creator-meta">
          <span>⭐ ${creator.rating}</span>
          <span>👥 ${this.formatFollowers(creator.followers)}</span>
        </div>
      </div>
    `).join('');
    
    this.creators = mockCreators;
  }

  /**
   * Search creators
   */
  async searchCreators(event) {
    const query = event.target.value;
    if (query.length < 2) return;
    
    // Implement creator search
    // For now, just filter the existing creators
    const filtered = this.creators.filter(creator => 
      creator.userName?.toLowerCase().includes(query.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(query.toLowerCase())
    );
    
    const suggestedGrid = document.getElementById('suggested-creators-grid');
    if (filtered.length === 0) {
      suggestedGrid.innerHTML = '<p class="empty-message">No creators found matching your search</p>';
    } else {
      suggestedGrid.innerHTML = filtered.map(creator => `
        <div class="creator-card" data-creator-id="${creator._id}" 
             onclick="window.dealCreationManager.selectCreator('${creator._id}')">
          <h4>${creator.userName || creator.name}</h4>
          <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">${creator.bio || 'No bio available'}</p>
          <div class="creator-meta">
            <span>⭐ ${creator.rating || '4.5'}</span>
            <span>👥 ${this.formatFollowers(creator.followers || 0)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  /**
   * Select a creator
   */
  selectCreator(creatorId) {
    // Update UI
    document.querySelectorAll('.creator-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.creatorId === creatorId);
    });
    
    // Store selection
    this.dealData.creatorId = creatorId;
    this.selectedCreator = this.creators.find(c => c._id === creatorId);
    
    // Enable next button
    document.getElementById('step-2-next').disabled = false;
  }

  /**
   * Setup terms form
   */
  setupTermsForm() {
    // Update summary
    document.getElementById('selected-offer-name').textContent = this.selectedOffer?.offerName || 'Unknown Offer';
    document.getElementById('selected-creator-name').textContent = this.selectedCreator?.userName || 'Unknown Creator';
    document.getElementById('selected-budget').textContent = `$${(this.selectedOffer?.proposedAmount || 0).toLocaleString()}`;
    
    // Set default dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    document.getElementById('deal-start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('deal-end-date').value = endDate.toISOString().split('T')[0];
    
    // Add default milestones
    this.addMilestone();
    this.addMilestone();
  }

  /**
   * Add milestone
   */
  addMilestone() {
    if (this.dealData.milestones.length >= 4) {
      alert('Maximum 4 milestones allowed');
      return;
    }
    
    const container = document.getElementById('milestone-creator-container');
    const index = this.dealData.milestones.length;
    
    const milestone = {
      title: '',
      description: '',
      amount: 0,
      percentage: 25,
      dueDate: null
    };
    
    this.dealData.milestones.push(milestone);
    
    const milestoneEl = document.createElement('div');
    milestoneEl.className = 'milestone-item';
    milestoneEl.dataset.index = index;
    
    milestoneEl.innerHTML = `
      <div class="milestone-header">
        <span class="milestone-number">${index + 1}</span>
        <button class="remove-milestone" onclick="window.dealCreationManager.removeMilestone(${index})">Remove</button>
      </div>
      <div class="milestone-fields">
        <div class="form-group">
          <input type="text" placeholder="Milestone title" 
                 onchange="window.dealCreationManager.updateMilestone(${index}, 'title', this.value)">
        </div>
        <div class="form-group">
          <input type="number" placeholder="Percentage" min="0" max="100" value="25"
                 onchange="window.dealCreationManager.updateMilestone(${index}, 'percentage', this.value)">
        </div>
        <div class="form-group">
          <input type="date" min="${new Date().toISOString().split('T')[0]}"
                 onchange="window.dealCreationManager.updateMilestone(${index}, 'dueDate', this.value)">
        </div>
      </div>
    `;
    
    container.appendChild(milestoneEl);
    
    // Update button state
    if (this.dealData.milestones.length >= 4) {
      document.getElementById('add-milestone-btn').disabled = true;
    }
    
    // Recalculate percentages
    this.recalculatePercentages();
  }

  /**
   * Remove milestone
   */
  removeMilestone(index) {
    this.dealData.milestones.splice(index, 1);
    
    // Rebuild milestones
    const container = document.getElementById('milestone-creator-container');
    container.innerHTML = '';
    
    const milestones = [...this.dealData.milestones];
    this.dealData.milestones = [];
    
    milestones.forEach(() => this.addMilestone());
    
    // Update button state
    document.getElementById('add-milestone-btn').disabled = false;
  }

  /**
   * Update milestone data
   */
  updateMilestone(index, field, value) {
    if (this.dealData.milestones[index]) {
      this.dealData.milestones[index][field] = value;
      
      if (field === 'percentage') {
        this.validatePercentages();
      }
    }
  }

  /**
   * Apply milestone template
   */
  applyMilestoneTemplate() {
    const template = document.getElementById('milestone-template').value;
    
    if (template === 'custom') return;
    
    const templates = {
      equal_split: [50, 50],
      front_loaded: [40, 30, 20, 10],
      back_loaded: [10, 20, 30, 40]
    };
    
    const percentages = templates[template];
    if (!percentages) return;
    
    // Clear existing milestones
    const container = document.getElementById('milestone-creator-container');
    container.innerHTML = '';
    this.dealData.milestones = [];
    
    // Add milestones with template percentages
    percentages.forEach((percentage, index) => {
      this.addMilestone();
      const inputs = container.querySelectorAll(`[data-index="${index}"] input[type="number"]`);
      if (inputs[0]) {
        inputs[0].value = percentage;
        this.updateMilestone(index, 'percentage', percentage);
      }
    });
  }

  /**
   * Update timeline
   */
  updateTimeline() {
    const startDate = document.getElementById('deal-start-date').value;
    const endDate = document.getElementById('deal-end-date').value;
    
    if (startDate && endDate) {
      this.dealData.startDate = startDate;
      this.dealData.endDate = endDate;
      
      // Update milestone due dates if needed
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end - start;
      const milestoneGap = duration / (this.dealData.milestones.length || 1);
      
      // Auto-suggest milestone dates
      this.dealData.milestones.forEach((milestone, index) => {
        const milestoneDate = new Date(start.getTime() + (milestoneGap * (index + 1)));
        const dateInput = document.querySelector(`[data-index="${index}"] input[type="date"]`);
        if (dateInput && !dateInput.value) {
          dateInput.value = milestoneDate.toISOString().split('T')[0];
          milestone.dueDate = dateInput.value;
        }
      });
    }
  }

  /**
   * Create deal
   */
  async createDeal() {
    // Validate form
    if (!this.validateDealForm()) {
      return;
    }
    
    const btn = document.getElementById('create-deal-btn');
    btn.disabled = true;
    btn.textContent = 'Creating Deal...';
    
    try {
      const dealData = {
        offerId: this.dealData.offerId,
        creatorId: this.dealData.creatorId,
        marketerId: window.authContext.user.id,
        proposedAmount: this.selectedOffer.proposedAmount,
        milestones: this.dealData.milestones.map(m => ({
          title: m.title,
          description: m.description || '',
          amount: (m.percentage / 100) * this.selectedOffer.proposedAmount,
          percentage: m.percentage,
          dueDate: m.dueDate,
          status: 'pending'
        })),
        startDate: this.dealData.startDate,
        endDate: this.dealData.endDate,
        additionalTerms: document.getElementById('additional-terms').value,
        status: 'pending'
      };
      
      const response = await window.axeesAPI.createDeal(dealData);
      
      if (response.success) {
        alert('Deal created successfully! The creator will be notified.');
        this.close();
        
        // Redirect to deal management or refresh marketplace
        if (window.marketplaceManager) {
          window.marketplaceManager.loadDeals();
        }
      } else {
        throw new Error(response.message || 'Failed to create deal');
      }
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert('Failed to create deal. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Deal';
    }
  }

  /**
   * Validate deal form
   */
  validateDealForm() {
    // Check milestones
    if (this.dealData.milestones.length === 0) {
      alert('Please add at least one milestone');
      return false;
    }
    
    // Validate milestone data
    for (let i = 0; i < this.dealData.milestones.length; i++) {
      const milestone = this.dealData.milestones[i];
      if (!milestone.title) {
        alert(`Please enter a title for milestone ${i + 1}`);
        return false;
      }
      if (!milestone.dueDate) {
        alert(`Please set a due date for milestone ${i + 1}`);
        return false;
      }
    }
    
    // Validate percentages
    const totalPercentage = this.dealData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert(`Milestone percentages must total 100%. Current total: ${totalPercentage}%`);
      return false;
    }
    
    return true;
  }

  /**
   * Helper methods
   */
  truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  formatFollowers(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  }

  recalculatePercentages() {
    const count = this.dealData.milestones.length;
    if (count === 0) return;
    
    const equalPercentage = Math.floor(100 / count);
    const remainder = 100 - (equalPercentage * count);
    
    this.dealData.milestones.forEach((milestone, index) => {
      milestone.percentage = equalPercentage + (index === count - 1 ? remainder : 0);
      const input = document.querySelector(`[data-index="${index}"] input[type="number"]`);
      if (input) {
        input.value = milestone.percentage;
      }
    });
  }

  validatePercentages() {
    const total = this.dealData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
    const btn = document.getElementById('create-deal-btn');
    
    if (Math.abs(total - 100) > 0.01) {
      btn.textContent = `Create Deal (Total: ${total}% - must be 100%)`;
      btn.disabled = true;
    } else {
      btn.textContent = 'Create Deal';
      btn.disabled = false;
    }
  }
}

// Initialize deal creation manager
window.dealCreationManager = new DealCreationManager();