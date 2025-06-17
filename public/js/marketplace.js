/**
 * Marketplace Manager - Connects marketplace to real backend API
 * Replaces static mock data with dynamic deal loading
 */

class MarketplaceManager {
  constructor() {
    this.deals = [];
    this.filteredDeals = [];
    this.filters = {
      search: '',
      category: '',
      budget: '',
      duration: '',
      sort: 'newest'
    };
    this.isLoading = false;
    
    this.initialize();
  }

  async initialize() {
    // Check authentication
    if (!window.authContext || !window.authContext.isAuthenticated) {
      // Allow viewing but not interaction for unauthenticated users
    }

    // Load deals from API
    await this.loadDeals();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Load deals from backend API
   */
  async loadDeals() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();

    try {
      const response = await window.axeesAPI.getDeals();
      
      if (response.success) {
        this.deals = response.deals || [];
        this.applyFilters();
      } else {
        console.error('Failed to load deals:', response.message);
        this.showErrorState();
      }
    } catch (error) {
      console.error('Error loading deals:', error);
      this.showErrorState();
      // Fallback to mock data if API fails
      this.loadMockData();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply filters and render deals
   */
  applyFilters() {
    // Start with all deals
    this.filteredDeals = [...this.deals];

    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      this.filteredDeals = this.filteredDeals.filter(deal => 
        deal.title?.toLowerCase().includes(searchLower) ||
        deal.description?.toLowerCase().includes(searchLower) ||
        deal.brandName?.toLowerCase().includes(searchLower) ||
        deal.marketerName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (this.filters.category) {
      this.filteredDeals = this.filteredDeals.filter(deal => 
        deal.category === this.filters.category
      );
    }

    // Apply budget filter
    if (this.filters.budget) {
      const [min, max] = this.parseBudgetRange(this.filters.budget);
      this.filteredDeals = this.filteredDeals.filter(deal => {
        const amount = deal.proposedAmount || deal.amount || 0;
        if (max === null) return amount >= min;
        return amount >= min && amount <= max;
      });
    }

    // Apply duration filter
    if (this.filters.duration) {
      this.filteredDeals = this.filteredDeals.filter(deal => 
        this.matchDuration(deal, this.filters.duration)
      );
    }

    // Apply sorting
    this.sortDeals();

    // Render the filtered deals
    this.renderDeals();
  }

  /**
   * Sort deals based on selected criteria
   */
  sortDeals() {
    switch (this.filters.sort) {
      case 'newest':
        this.filteredDeals.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case 'budget-high':
        this.filteredDeals.sort((a, b) => 
          (b.proposedAmount || b.amount || 0) - (a.proposedAmount || a.amount || 0)
        );
        break;
      case 'budget-low':
        this.filteredDeals.sort((a, b) => 
          (a.proposedAmount || a.amount || 0) - (b.proposedAmount || b.amount || 0)
        );
        break;
      case 'deadline':
        this.filteredDeals.sort((a, b) => {
          const aDeadline = this.getEarliestDeadline(a);
          const bDeadline = this.getEarliestDeadline(b);
          if (!aDeadline) return 1;
          if (!bDeadline) return -1;
          return new Date(aDeadline) - new Date(bDeadline);
        });
        break;
    }
  }

  /**
   * Render deals to the DOM
   */
  renderDeals() {
    const dealsGrid = document.getElementById('dealsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!dealsGrid) return;

    if (this.filteredDeals.length === 0) {
      dealsGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    dealsGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    dealsGrid.innerHTML = this.filteredDeals.map(deal => this.renderDealCard(deal)).join('');

    // Trigger animations
    this.animateCards();
  }

  /**
   * Render individual deal card
   */
  renderDealCard(deal) {
    const isUserMarketer = window.authContext?.user?.userType === 'Marketer';
    const isOwnDeal = deal.marketerId === window.authContext?.user?.id;
    const amount = deal.proposedAmount || deal.amount || 0;
    const milestoneCount = deal.milestones?.length || 0;
    const status = this.getDealStatus(deal);

    return `
      <div class="deal-card ${deal.featured ? 'featured-deal' : ''}" data-deal-id="${deal._id}" onclick="window.marketplaceManager.showDealDetails('${deal._id}')">
        <div class="deal-header">
          <div class="deal-brand">
            <div class="brand-logo">${this.getBrandInitials(deal)}</div>
            <div class="brand-info">
              <h3 class="brand-name">
                ${deal.brandName || deal.marketerName || 'Unknown Brand'}
                ${deal.marketerVerified ? '<span class="verified-badge">✓</span>' : ''}
              </h3>
              <div class="deal-meta">
                ${deal.category ? `<span class="category-badge">${this.formatCategory(deal.category)}</span>` : ''}
                ${status ? `<span class="status-badge ${status.toLowerCase()}">${status}</span>` : ''}
              </div>
            </div>
          </div>
          ${isOwnDeal ? '<div class="own-deal-badge">Your Deal</div>' : ''}
        </div>
        
        <div class="deal-body">
          <h4 class="deal-title">${deal.offerName || deal.title || 'Untitled Deal'}</h4>
          <p class="deal-description">${this.truncateText(deal.description || deal.offerDescription || 'No description available', 150)}</p>
          
          ${deal.requirements ? `
            <div class="deal-requirements">
              <h5>Requirements:</h5>
              <ul>
                ${deal.requirements.slice(0, 3).map(req => `<li>${req}</li>`).join('')}
                ${deal.requirements.length > 3 ? `<li class="more-items">+${deal.requirements.length - 3} more</li>` : ''}
              </ul>
            </div>
          ` : ''}
          
          ${milestoneCount > 0 ? `
            <div class="milestone-preview">
              <span class="milestone-icon">🎯</span>
              <span class="milestone-text">${milestoneCount} milestone${milestoneCount > 1 ? 's' : ''}</span>
              <div class="milestone-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${this.calculateProgress(deal)}%"></div>
                </div>
                ${this.renderPaymentStatusIndicators(deal.milestones || [])}
              </div>
            </div>
          ` : ''}
          
          <div class="deal-tags">
            ${this.renderTags(deal).map(tag => `<span class="deal-tag">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="deal-footer">
          <div class="deal-payment">
            <span class="payment-label">Budget</span>
            <span class="payment-amount">$${amount.toLocaleString()}</span>
            ${deal.offerType === 'trial' ? '<span class="trial-badge">$1 Trial</span>' : ''}
          </div>
          
          <div class="deal-deadline">
            <span class="deadline-label">Timeline</span>
            <span class="deadline-value">${this.formatTimeline(deal)}</span>
          </div>
          
          ${!isUserMarketer ? `
            <button class="btn btn-primary" onclick="event.stopPropagation(); window.marketplaceManager.applyToDeal('${deal._id}')">
              Apply Now
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Show deal details modal
   */
  async showDealDetails(dealId) {
    const deal = this.deals.find(d => d._id === dealId);
    if (!deal) return;

    // Create modal if not exists
    if (!document.getElementById('deal-detail-modal')) {
      this.createDealDetailModal();
    }

    // Load full deal details from API
    try {
      const response = await window.axeesAPI.getDealById(dealId);
      if (response.success) {
        this.displayDealDetails(response.deal);
      } else {
        this.displayDealDetails(deal); // Fallback to cached data
      }
    } catch (error) {
      console.error('Failed to load deal details:', error);
      this.displayDealDetails(deal); // Fallback to cached data
    }
  }

  /**
   * Create deal detail modal
   */
  createDealDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'deal-detail-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content deal-detail-content">
        <div class="modal-header">
          <h2 id="deal-detail-title">Deal Details</h2>
          <button class="close-btn" onclick="window.marketplaceManager.closeDealDetails()">&times;</button>
        </div>
        <div class="modal-body" id="deal-detail-body">
          <!-- Deal details will be populated here -->
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Display deal details in modal
   */
  displayDealDetails(deal) {
    const modal = document.getElementById('deal-detail-modal');
    const titleEl = document.getElementById('deal-detail-title');
    const bodyEl = document.getElementById('deal-detail-body');

    titleEl.textContent = deal.offerName || deal.title || 'Deal Details';

    bodyEl.innerHTML = `
      <div class="deal-detail-header">
        <div class="brand-section">
          <div class="brand-logo-large">${this.getBrandInitials(deal)}</div>
          <div class="brand-details">
            <h3>${deal.brandName || deal.marketerName || 'Unknown Brand'}</h3>
            <p>${deal.brandDescription || 'No brand description'}</p>
          </div>
        </div>
      </div>

      <div class="deal-detail-section">
        <h4>Campaign Overview</h4>
        <p>${deal.description || deal.offerDescription || 'No description available'}</p>
      </div>

      ${deal.requirements && deal.requirements.length > 0 ? `
        <div class="deal-detail-section">
          <h4>Requirements</h4>
          <ul class="requirements-list">
            ${deal.requirements.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${deal.milestones && deal.milestones.length > 0 ? `
        <div class="deal-detail-section">
          <h4>Milestones</h4>
          <div id="milestone-timeline-container"></div>
        </div>
      ` : ''}

      <div class="deal-detail-section">
        <h4>Payment Details</h4>
        <div class="payment-details">
          <div class="payment-item">
            <span>Total Budget:</span>
            <strong>$${(deal.proposedAmount || deal.amount || 0).toLocaleString()}</strong>
          </div>
          ${deal.offerType === 'trial' ? `
            <div class="payment-item">
              <span>Trial Period:</span>
              <strong>$1 for 7 days</strong>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="deal-detail-actions">
        ${window.authContext?.user?.userType !== 'Marketer' ? `
          <button class="btn btn-primary" onclick="window.marketplaceManager.applyToDeal('${deal._id}')">
            Apply to This Deal
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="window.marketplaceManager.closeDealDetails()">
          Close
        </button>
      </div>
    `;

    // Load milestone timeline if deal has milestones
    if (deal.milestones && deal.milestones.length > 0 && window.milestoneTimeline) {
      setTimeout(() => {
        window.milestoneTimeline.render(deal._id);
      }, 100);
    }

    modal.style.display = 'block';
  }

  /**
   * Close deal details modal
   */
  closeDealDetails() {
    const modal = document.getElementById('deal-detail-modal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * Apply to deal
   */
  async applyToDeal(dealId) {
    if (!window.authContext || !window.authContext.isAuthenticated) {
      window.authManager.showAuthModal('login');
      return;
    }

    // TODO: Implement deal application logic
    alert('Deal application feature coming soon!');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.applyFilters();
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.applyFilters();
      });
    }

    // Budget filter
    const budgetFilter = document.getElementById('budgetFilter');
    if (budgetFilter) {
      budgetFilter.addEventListener('change', (e) => {
        this.filters.budget = e.target.value;
        this.applyFilters();
      });
    }

    // Duration filter
    const durationFilter = document.getElementById('durationFilter');
    if (durationFilter) {
      durationFilter.addEventListener('change', (e) => {
        this.filters.duration = e.target.value;
        this.applyFilters();
      });
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.applyFilters();
      });
    }
  }

  /**
   * Helper methods
   */
  getBrandInitials(deal) {
    const name = deal.brandName || deal.marketerName || 'Unknown';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  }

  formatCategory(category) {
    const categoryMap = {
      'fashion': 'Fashion & Style',
      'tech': 'Technology',
      'beauty': 'Beauty',
      'fitness': 'Health & Fitness',
      'lifestyle': 'Lifestyle',
      'food': 'Food & Beverage'
    };
    return categoryMap[category] || category;
  }

  getDealStatus(deal) {
    if (deal.status) {
      const statusMap = {
        'active': 'Active',
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      };
      return statusMap[deal.status] || deal.status;
    }
    return null;
  }

  truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  renderTags(deal) {
    const tags = [];
    if (deal.socialPlatforms) {
      tags.push(...deal.socialPlatforms);
    }
    if (deal.contentTypes) {
      tags.push(...deal.contentTypes);
    }
    return tags.slice(0, 3);
  }

  calculateProgress(deal) {
    if (!deal.milestones || deal.milestones.length === 0) return 0;
    const completed = deal.milestones.filter(m => m.status === 'completed' || m.status === 'paid').length;
    return Math.round((completed / deal.milestones.length) * 100);
  }

  /**
   * Render payment status indicators for milestones
   */
  renderPaymentStatusIndicators(milestones) {
    if (!milestones || milestones.length === 0) return '';
    
    const indicators = milestones.map((milestone, index) => {
      const paymentStatus = this.getPaymentStatus(milestone);
      const statusClass = this.getPaymentStatusClass(paymentStatus);
      const statusTitle = this.getPaymentStatusTitle(paymentStatus);
      
      return `<div class="payment-status-indicator ${statusClass}" title="${statusTitle}" data-milestone-index="${index}"></div>`;
    }).join('');
    
    return `<div class="payment-status-indicators">${indicators}</div>`;
  }

  /**
   * Get payment status for a milestone
   */
  getPaymentStatus(milestone) {
    if (!milestone) return 'pending';
    
    // Determine payment status based on milestone status and payment info
    if (milestone.status === 'paid') return 'paid';
    if (milestone.status === 'completed' && milestone.paymentReleased) return 'released';
    if (milestone.status === 'completed' && !milestone.paymentReleased) return 'ready_for_release';
    if (milestone.status === 'in_progress') return 'in_progress';
    if (milestone.paymentDisputed) return 'disputed';
    if (milestone.paymentHeld) return 'held';
    
    return 'pending';
  }

  /**
   * Get CSS class for payment status
   */
  getPaymentStatusClass(status) {
    const statusClasses = {
      'pending': 'status-pending',
      'in_progress': 'status-in-progress', 
      'ready_for_release': 'status-ready',
      'released': 'status-released',
      'paid': 'status-paid',
      'disputed': 'status-disputed',
      'held': 'status-held'
    };
    
    return statusClasses[status] || 'status-pending';
  }

  /**
   * Get title text for payment status
   */
  getPaymentStatusTitle(status) {
    const statusTitles = {
      'pending': 'Payment Pending - Milestone not started',
      'in_progress': 'Payment Held - Work in progress',
      'ready_for_release': 'Payment Ready - Milestone completed, awaiting release',
      'released': 'Payment Released - Funds released to creator',
      'paid': 'Payment Complete - Milestone fully paid',
      'disputed': 'Payment Disputed - Under review',
      'held': 'Payment Held - Manual review required'
    };
    
    return statusTitles[status] || 'Payment Status Unknown';
  }

  formatTimeline(deal) {
    if (deal.estimatedDuration) {
      return deal.estimatedDuration;
    }
    if (deal.milestones && deal.milestones.length > 0) {
      const lastMilestone = deal.milestones[deal.milestones.length - 1];
      if (lastMilestone.dueDate) {
        const days = Math.ceil((new Date(lastMilestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return `${days} days`;
      }
    }
    return 'Flexible';
  }

  getEarliestDeadline(deal) {
    if (deal.milestones && deal.milestones.length > 0) {
      const dates = deal.milestones
        .map(m => m.dueDate)
        .filter(d => d && new Date(d) > new Date());
      if (dates.length > 0) {
        return dates.sort()[0];
      }
    }
    return null;
  }

  parseBudgetRange(budget) {
    const ranges = {
      '0-500': [0, 500],
      '500-1000': [500, 1000],
      '1000-2500': [1000, 2500],
      '2500-5000': [2500, 5000],
      '5000+': [5000, null]
    };
    return ranges[budget] || [0, null];
  }

  matchDuration(deal, duration) {
    // TODO: Implement duration matching logic
    return true;
  }

  /**
   * UI State methods
   */
  showLoadingState() {
    const dealsGrid = document.getElementById('dealsGrid');
    if (dealsGrid) {
      dealsGrid.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading amazing deals for you...</p>
        </div>
      `;
    }
  }

  showErrorState() {
    const dealsGrid = document.getElementById('dealsGrid');
    if (dealsGrid) {
      dealsGrid.innerHTML = `
        <div class="error-state">
          <p>Unable to load deals. Please try again later.</p>
          <button class="btn btn-primary" onclick="window.marketplaceManager.loadDeals()">Retry</button>
        </div>
      `;
    }
  }

  animateCards() {
    // Trigger card animations
    if (window.observeCards) {
      setTimeout(window.observeCards, 100);
    }
  }

  /**
   * Load mock data as fallback
   */
  loadMockData() {
    // Use the existing dealsData if available
    if (window.dealsData) {
      this.deals = window.dealsData;
      this.applyFilters();
    }
  }
}

// Global functions for onclick handlers
window.searchDeals = function() {
  if (window.marketplaceManager) {
    window.marketplaceManager.applyFilters();
  }
};

window.filterDeals = function() {
  if (window.marketplaceManager) {
    window.marketplaceManager.applyFilters();
  }
};

window.sortDeals = function() {
  if (window.marketplaceManager) {
    window.marketplaceManager.applyFilters();
  }
};

window.clearFilters = function() {
  if (window.marketplaceManager) {
    window.marketplaceManager.filters = {
      search: '',
      category: '',
      budget: '',
      duration: '',
      sort: 'newest'
    };
    // Reset form inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('budgetFilter').value = '';
    document.getElementById('durationFilter').value = '';
    document.getElementById('sortFilter').value = 'newest';
    
    window.marketplaceManager.applyFilters();
  }
};

// Initialize marketplace manager
window.marketplaceManager = new MarketplaceManager();