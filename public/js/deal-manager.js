/**
 * Deal Manager - Comprehensive deal management interface
 * Handles CRUD operations, filtering, sorting, and status management
 */

class DealManager {
  constructor() {
    this.deals = [];
    this.filteredDeals = [];
    this.filters = {
      search: '',
      status: '',
      category: '',
      dateRange: '',
      sort: 'newest'
    };
    this.isLoading = false;
    this.currentUser = null;
    
    this.initialize();
  }

  async initialize() {
    // Check authentication
    if (!window.authContext || !window.authContext.isAuthenticated) {
      window.location.href = 'index.html';
      return;
    }

    this.currentUser = window.authContext.user;
    
    // Setup UI based on user type
    this.setupUserInterface();
    
    // Load deals
    await this.loadDeals();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup user interface based on user type
   */
  setupUserInterface() {
    const createDealBtn = document.getElementById('create-deal-btn');
    
    // Only show create deal button for marketers
    if (this.currentUser.userType !== 'Marketer') {
      createDealBtn.style.display = 'none';
    }
    
    // Update page title based on user type
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    if (this.currentUser.userType === 'Marketer') {
      pageTitle.textContent = 'Deal Management';
      pageSubtitle.textContent = 'Manage your collaborations and track progress';
    } else {
      pageTitle.textContent = 'My Collaborations';
      pageSubtitle.textContent = 'Track your active deals and milestones';
    }
  }

  /**
   * Load deals from API
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
        this.updateDealsCount();
      } else {
        console.error('Failed to load deals:', response.message);
        this.showErrorState('Failed to load deals');
      }
    } catch (error) {
      console.error('Error loading deals:', error);
      this.showErrorState('Error connecting to server');
      
      // Fallback to mock data for development
      this.loadMockData();
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
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
        deal.dealName?.toLowerCase().includes(searchLower) ||
        deal.title?.toLowerCase().includes(searchLower) ||
        deal.description?.toLowerCase().includes(searchLower) ||
        deal.brandName?.toLowerCase().includes(searchLower) ||
        deal.marketerName?.toLowerCase().includes(searchLower) ||
        deal.creatorName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.filters.status) {
      this.filteredDeals = this.filteredDeals.filter(deal => 
        deal.status === this.filters.status
      );
    }

    // Apply category filter
    if (this.filters.category) {
      this.filteredDeals = this.filteredDeals.filter(deal => 
        deal.category === this.filters.category
      );
    }

    // Apply date range filter
    if (this.filters.dateRange) {
      const cutoffDate = this.calculateCutoffDate(this.filters.dateRange);
      this.filteredDeals = this.filteredDeals.filter(deal => 
        new Date(deal.createdAt) >= cutoffDate
      );
    }

    // Apply sorting
    this.sortDeals();

    // Render the filtered deals
    this.renderDeals();
    this.updateDealsCount();
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
      case 'oldest':
        this.filteredDeals.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case 'amount-high':
        this.filteredDeals.sort((a, b) => 
          (b.paymentInfo?.paymentAmount || b.proposedAmount || 0) - 
          (a.paymentInfo?.paymentAmount || a.proposedAmount || 0)
        );
        break;
      case 'amount-low':
        this.filteredDeals.sort((a, b) => 
          (a.paymentInfo?.paymentAmount || a.proposedAmount || 0) - 
          (b.paymentInfo?.paymentAmount || b.proposedAmount || 0)
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
   * Render deals table
   */
  renderDeals() {
    const tableBody = document.getElementById('deals-table-body');
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('deals-table');
    
    if (this.filteredDeals.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tableBody.innerHTML = this.filteredDeals.map(deal => this.renderDealRow(deal)).join('');
  }

  /**
   * Render individual deal row
   */
  renderDealRow(deal) {
    const isUserMarketer = this.currentUser.userType === 'Marketer';
    const isOwnDeal = (isUserMarketer && deal.marketerId === this.currentUser.id) ||
                     (!isUserMarketer && deal.creatorId === this.currentUser.id);
    
    const amount = deal.paymentInfo?.paymentAmount || deal.proposedAmount || 0;
    const progress = this.calculateProgress(deal);
    const partnerName = isUserMarketer ? 
      (deal.creatorName || deal.creatorId) : 
      (deal.brandName || deal.marketerName || deal.marketerId);

    return `
      <tr onclick="window.dealManager.showDealDetails('${deal._id}')" style="cursor: pointer;">
        <td>
          <div class="deal-title">${deal.dealName || deal.title || 'Untitled Deal'}</div>
          <div class="deal-brand">${deal.category ? this.formatCategory(deal.category) : 'General'}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${partnerName || 'Unknown'}</div>
          <div style="font-size: var(--text-sm); color: var(--text-secondary);">
            ${isUserMarketer ? 'Creator' : 'Brand'}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--success);">$${amount.toLocaleString()}</div>
          ${deal.offerType === 'trial' ? '<div class="trial-badge">$1 Trial</div>' : ''}
        </td>
        <td>
          <span class="status-badge ${deal.status || 'pending'}">${this.formatStatus(deal.status)}</span>
        </td>
        <td>
          <div class="milestone-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${this.formatDate(deal.createdAt)}</div>
          <div style="font-size: var(--text-sm); color: var(--text-secondary);">
            ${this.formatTimeAgo(deal.createdAt)}
          </div>
        </td>
        <td onclick="event.stopPropagation();">
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.dealManager.showDealDetails('${deal._id}')" title="View Details">
              👁️
            </button>
            ${isOwnDeal ? `
              <button class="btn-icon" onclick="window.dealManager.editDeal('${deal._id}')" title="Edit Deal">
                ✏️
              </button>
            ` : ''}
            ${deal.milestones && deal.milestones.length > 0 ? `
              <button class="btn-icon" onclick="window.milestoneManager.open('${deal._id}')" title="Manage Milestones">
                🎯
              </button>
            ` : ''}
            ${isUserMarketer && deal.status === 'active' ? `
              <button class="btn-icon" onclick="window.paymentReleaseManager.open('${deal._id}', '${deal.milestones?.[0]?._id}')" title="Payment Controls">
                💰
              </button>
            ` : ''}
            <button class="btn-icon" data-qr-action="generate-deal" data-deal-id="${deal._id}" title="Generate QR Code">
              📱
            </button>
            <button class="btn-icon" data-agreement-action="view-deal" data-deal-id="${deal._id}" title="View Agreement">
              📋
            </button>
            <button class="btn-icon" onclick="window.dealManager.showMenu('${deal._id}', event)" title="More Options">
              ⋮
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Show deal details modal
   */
  async showDealDetails(dealId) {
    const deal = this.deals.find(d => d._id === dealId);
    if (!deal) return;

    // Use marketplace manager's detail modal if available
    if (window.marketplaceManager) {
      window.marketplaceManager.showDealDetails(dealId);
    } else {
      // Fallback to basic alert
      alert(`Deal Details:\n\nTitle: ${deal.dealName || deal.title}\nAmount: $${(deal.paymentInfo?.paymentAmount || deal.proposedAmount || 0).toLocaleString()}\nStatus: ${this.formatStatus(deal.status)}\n\nDetailed modal implementation coming soon!`);
    }
  }

  /**
   * Edit deal
   */
  editDeal(dealId) {
    // TODO: Implement deal editing
    alert('Deal editing feature coming soon!');
  }

  /**
   * Show context menu for deal
   */
  showMenu(dealId, event) {
    event.stopPropagation();
    
    const deal = this.deals.find(d => d._id === dealId);
    if (!deal) return;

    const isUserMarketer = this.currentUser.userType === 'Marketer';
    const isOwnDeal = (isUserMarketer && deal.marketerId === this.currentUser.id) ||
                     (!isUserMarketer && deal.creatorId === this.currentUser.id);

    // Create simple context menu
    const actions = [];
    
    actions.push('View Details');
    
    if (isOwnDeal) {
      actions.push('Edit Deal');
      if (deal.status === 'active') {
        actions.push('Pause Deal');
      } else if (deal.status === 'paused') {
        actions.push('Resume Deal');
      }
      if (deal.status !== 'completed' && deal.status !== 'cancelled') {
        actions.push('Cancel Deal');
      }
    }
    
    actions.push('Export Data');
    actions.push('Contact Support');

    const choice = prompt(`Choose action for "${deal.dealName || deal.title}":\n\n${actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}\n\nEnter number (1-${actions.length}):`);
    
    if (choice && !isNaN(choice)) {
      const actionIndex = parseInt(choice) - 1;
      if (actionIndex >= 0 && actionIndex < actions.length) {
        this.handleMenuAction(dealId, actions[actionIndex]);
      }
    }
  }

  /**
   * Handle menu action
   */
  async handleMenuAction(dealId, action) {
    const deal = this.deals.find(d => d._id === dealId);
    
    switch (action) {
      case 'View Details':
        this.showDealDetails(dealId);
        break;
      case 'Edit Deal':
        this.editDeal(dealId);
        break;
      case 'Pause Deal':
        await this.updateDealStatus(dealId, 'paused');
        break;
      case 'Resume Deal':
        await this.updateDealStatus(dealId, 'active');
        break;
      case 'Cancel Deal':
        if (confirm('Are you sure you want to cancel this deal? This action cannot be undone.')) {
          await this.updateDealStatus(dealId, 'cancelled');
        }
        break;
      case 'Export Data':
        this.exportDealData(deal);
        break;
      case 'Contact Support':
        window.open(`mailto:support@axees.io?subject=Support Request - Deal ${deal.dealName || deal.title}`, '_blank');
        break;
    }
  }

  /**
   * Update deal status
   */
  async updateDealStatus(dealId, newStatus) {
    try {
      const response = await window.axeesAPI.updateDealStatus(dealId, newStatus);
      
      if (response.success) {
        // Update local data
        const dealIndex = this.deals.findIndex(d => d._id === dealId);
        if (dealIndex !== -1) {
          this.deals[dealIndex].status = newStatus;
          this.applyFilters();
        }
        
        alert(`Deal status updated to ${this.formatStatus(newStatus)}`);
      } else {
        throw new Error(response.message || 'Failed to update deal status');
      }
    } catch (error) {
      console.error('Error updating deal status:', error);
      alert('Failed to update deal status: ' + error.message);
    }
  }

  /**
   * Export deals data
   */
  exportDeals() {
    const csvData = this.convertToCSV(this.filteredDeals);
    this.downloadCSV(csvData, 'deals-export.csv');
  }

  /**
   * Export single deal data
   */
  exportDealData(deal) {
    const csvData = this.convertToCSV([deal]);
    this.downloadCSV(csvData, `deal-${deal._id}.csv`);
  }

  /**
   * Convert deals to CSV
   */
  convertToCSV(deals) {
    const headers = ['Deal Title', 'Partner', 'Amount', 'Status', 'Progress', 'Created Date', 'Category'];
    const rows = deals.map(deal => {
      const isUserMarketer = this.currentUser.userType === 'Marketer';
      const partnerName = isUserMarketer ? 
        (deal.creatorName || deal.creatorId) : 
        (deal.brandName || deal.marketerName || deal.marketerId);
      
      return [
        deal.dealName || deal.title || 'Untitled Deal',
        partnerName || 'Unknown',
        deal.paymentInfo?.paymentAmount || deal.proposedAmount || 0,
        this.formatStatus(deal.status),
        `${this.calculateProgress(deal)}%`,
        new Date(deal.createdAt).toLocaleDateString(),
        this.formatCategory(deal.category) || 'General'
      ];
    });
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
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

    // Filter selects
    ['statusFilter', 'categoryFilter', 'dateFilter', 'sortFilter'].forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterKey = filterId.replace('Filter', '').replace('sort', 'sort');
          this.filters[filterKey === 'date' ? 'dateRange' : filterKey] = e.target.value;
          this.applyFilters();
        });
      }
    });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      category: '',
      dateRange: '',
      sort: 'newest'
    };
    
    // Reset form inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('sortFilter').value = 'newest';
    
    this.applyFilters();
  }

  /**
   * Refresh deals data
   */
  async refresh() {
    await this.loadDeals();
  }

  /**
   * Helper methods
   */
  calculateProgress(deal) {
    if (!deal.milestones || deal.milestones.length === 0) return 0;
    const completed = deal.milestones.filter(m => 
      m.status === 'completed' || m.status === 'paid'
    ).length;
    return Math.round((completed / deal.milestones.length) * 100);
  }

  getEarliestDeadline(deal) {
    if (!deal.milestones || deal.milestones.length === 0) return null;
    const futureDates = deal.milestones
      .map(m => m.dueDate)
      .filter(date => date && new Date(date) > new Date())
      .sort();
    return futureDates.length > 0 ? futureDates[0] : null;
  }

  calculateCutoffDate(range) {
    const now = new Date();
    switch (range) {
      case '7days':
        return new Date(now.setDate(now.getDate() - 7));
      case '30days':
        return new Date(now.setDate(now.getDate() - 30));
      case '3months':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0);
    }
  }

  formatStatus(status) {
    const statusMap = {
      'active': 'Active',
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'paused': 'Paused'
    };
    return statusMap[status] || status || 'Unknown';
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

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  updateDealsCount() {
    const countElement = document.getElementById('deals-count');
    if (countElement) {
      const total = this.deals.length;
      const filtered = this.filteredDeals.length;
      countElement.textContent = filtered === total ? 
        `${total} deal${total !== 1 ? 's' : ''}` :
        `${filtered} of ${total} deals`;
    }
  }

  /**
   * UI State methods
   */
  showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const table = document.getElementById('deals-table');
    const emptyState = document.getElementById('empty-state');
    
    if (loadingState) loadingState.style.display = 'block';
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
  }

  hideLoadingState() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.style.display = 'none';
  }

  showErrorState(message) {
    const tableBody = document.getElementById('deals-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: var(--space-16); color: var(--text-secondary);">
            <div style="font-size: var(--text-lg); margin-bottom: var(--space-2);">⚠️</div>
            <div style="font-weight: 500; margin-bottom: var(--space-2);">Unable to load deals</div>
            <div style="font-size: var(--text-sm);">${message}</div>
            <button class="btn btn-primary" onclick="window.dealManager.refresh()" style="margin-top: var(--space-4);">
              Try Again
            </button>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Load mock data for development
   */
  loadMockData() {
    this.deals = [
      {
        _id: '1',
        dealName: 'Summer Fashion Campaign',
        brandName: 'StyleCo',
        creatorName: 'Sarah Johnson',
        proposedAmount: 2500,
        status: 'active',
        category: 'fashion',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        milestones: [
          { _id: 'm1', status: 'completed' },
          { _id: 'm2', status: 'active' },
          { _id: 'm3', status: 'pending' }
        ],
        marketerId: this.currentUser.userType === 'Marketer' ? this.currentUser.id : 'marketer1'
      },
      {
        _id: '2',
        dealName: 'Tech Product Review',
        brandName: 'TechFlow',
        creatorName: 'Mike Chen',
        proposedAmount: 1800,
        status: 'pending',
        category: 'tech',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        milestones: [
          { _id: 'm4', status: 'pending' },
          { _id: 'm5', status: 'pending' }
        ],
        marketerId: this.currentUser.userType === 'Marketer' ? this.currentUser.id : 'marketer2'
      }
    ];
    
    this.applyFilters();
  }
}

// Initialize deal manager
window.dealManager = new DealManager();