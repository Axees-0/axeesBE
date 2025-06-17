/**
 * Proof Gallery Component - Visual Media Preview and Management
 * Displays proof submissions in a gallery format with filtering and preview capabilities
 */

class ProofGallery {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      dealId: null,
      milestoneId: null,
      showFilters: true,
      showPagination: true,
      itemsPerPage: 12,
      viewMode: 'grid', // 'grid' or 'list'
      allowFullscreen: true,
      enableSearch: true,
      groupByMilestone: false,
      ...options
    };
    
    this.proofSubmissions = [];
    this.filteredSubmissions = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.activeFilters = {
      status: 'all',
      fileType: 'all',
      milestone: 'all',
      dateRange: 'all'
    };
    this.searchQuery = '';
    this.isLoading = false;
    
    this.initialize();
  }

  /**
   * Initialize the proof gallery
   */
  initialize() {
    this.createGalleryStructure();
    this.bindEvents();
    this.loadProofSubmissions();
  }

  /**
   * Create the gallery HTML structure
   */
  createGalleryStructure() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Gallery container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="proof-gallery">
        ${this.options.showFilters ? this.createFiltersHTML() : ''}
        
        <div class="gallery-header">
          <div class="gallery-info">
            <h3 class="gallery-title">Proof Submissions</h3>
            <div class="gallery-count" id="galleryCount">Loading...</div>
          </div>
          <div class="gallery-controls">
            <div class="view-controls">
              <button class="view-btn ${this.options.viewMode === 'grid' ? 'active' : ''}" 
                      onclick="proofGallery_${this.containerId}.setViewMode('grid')" title="Grid View">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 3a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V3zM7 3a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V3zM13 3a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V3zM1 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V9zM7 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V9zM13 9a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V9z"/>
                </svg>
              </button>
              <button class="view-btn ${this.options.viewMode === 'list' ? 'active' : ''}" 
                      onclick="proofGallery_${this.containerId}.setViewMode('list')" title="List View">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z"/>
                </svg>
              </button>
            </div>
            ${this.options.enableSearch ? `
              <div class="search-controls">
                <input type="text" class="gallery-search" placeholder="Search proofs..." 
                       oninput="proofGallery_${this.containerId}.handleSearch(event)">
              </div>
            ` : ''}
          </div>
        </div>

        <div class="gallery-content" id="galleryContent-${this.containerId}">
          <div class="gallery-loading">
            <div class="loading-spinner"></div>
            <span>Loading proof submissions...</span>
          </div>
        </div>

        ${this.options.showPagination ? `
          <div class="gallery-pagination" id="galleryPagination-${this.containerId}" style="display: none;">
            <!-- Pagination will be rendered here -->
          </div>
        ` : ''}
      </div>
    `;

    this.injectStyles();
    
    // Store global reference
    window[`proofGallery_${this.containerId}`] = this;
  }

  /**
   * Create filters HTML
   */
  createFiltersHTML() {
    return `
      <div class="gallery-filters">
        <div class="filter-group">
          <label>Status:</label>
          <select class="filter-select" onchange="proofGallery_${this.containerId}.handleFilterChange('status', this.value)">
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>

        <div class="filter-group">
          <label>File Type:</label>
          <select class="filter-select" onchange="proofGallery_${this.containerId}.handleFilterChange('fileType', this.value)">
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
        </div>

        ${!this.options.milestoneId ? `
          <div class="filter-group">
            <label>Milestone:</label>
            <select class="filter-select" id="milestoneFilter-${this.containerId}" 
                    onchange="proofGallery_${this.containerId}.handleFilterChange('milestone', this.value)">
              <option value="all">All Milestones</option>
            </select>
          </div>
        ` : ''}

        <div class="filter-group">
          <label>Date:</label>
          <select class="filter-select" onchange="proofGallery_${this.containerId}.handleFilterChange('dateRange', this.value)">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>

        <button class="filter-clear-btn" onclick="proofGallery_${this.containerId}.clearFilters()">
          Clear Filters
        </button>
      </div>
    `;
  }

  /**
   * Load proof submissions
   */
  async loadProofSubmissions() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading();

    try {
      let endpoint = '/proof-submissions';
      const params = new URLSearchParams();

      if (this.options.dealId) {
        params.append('dealId', this.options.dealId);
      }
      
      if (this.options.milestoneId) {
        params.append('milestoneId', this.options.milestoneId);
      }

      if (params.toString()) {
        endpoint += '?' + params.toString();
      }

      const response = await window.axeesAPI.request(endpoint);
      
      if (response.success) {
        this.proofSubmissions = response.submissions || [];
        this.populateMilestoneFilter();
        this.applyFilters();
        this.renderGallery();
      } else {
        throw new Error(response.message || 'Failed to load proof submissions');
      }

    } catch (error) {
      console.error('Failed to load proof submissions:', error);
      this.showError('Failed to load proof submissions: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Populate milestone filter dropdown
   */
  populateMilestoneFilter() {
    if (this.options.milestoneId) return;

    const filterSelect = document.getElementById(`milestoneFilter-${this.containerId}`);
    if (!filterSelect) return;

    // Get unique milestones from submissions
    const milestones = new Map();
    this.proofSubmissions.forEach(submission => {
      if (submission.milestone) {
        milestones.set(submission.milestone._id, submission.milestone);
      }
    });

    // Clear existing options (except "All Milestones")
    filterSelect.innerHTML = '<option value="all">All Milestones</option>';

    // Add milestone options
    milestones.forEach((milestone, id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = milestone.title || `Milestone ${id.slice(-4)}`;
      filterSelect.appendChild(option);
    });
  }

  /**
   * Apply filters to submissions
   */
  applyFilters() {
    let filtered = [...this.proofSubmissions];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(submission => 
        submission.description?.toLowerCase().includes(query) ||
        submission.milestone?.title?.toLowerCase().includes(query) ||
        submission.creator?.userName?.toLowerCase().includes(query) ||
        submission.files?.some(file => file.originalName?.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (this.activeFilters.status !== 'all') {
      filtered = filtered.filter(submission => submission.status === this.activeFilters.status);
    }

    // Apply file type filter
    if (this.activeFilters.fileType !== 'all') {
      filtered = filtered.filter(submission => {
        return submission.files?.some(file => {
          const type = file.mimetype || '';
          switch (this.activeFilters.fileType) {
            case 'image': return type.startsWith('image/');
            case 'video': return type.startsWith('video/');
            case 'document': return type.includes('pdf') || type.includes('document') || type.includes('text');
            default: return true;
          }
        });
      });
    }

    // Apply milestone filter
    if (this.activeFilters.milestone !== 'all') {
      filtered = filtered.filter(submission => submission.milestone?._id === this.activeFilters.milestone);
    }

    // Apply date range filter
    if (this.activeFilters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (this.activeFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(submission => 
        new Date(submission.createdAt) >= filterDate
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    this.filteredSubmissions = filtered;
    this.calculatePagination();
    this.updateGalleryCount();
  }

  /**
   * Calculate pagination
   */
  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredSubmissions.length / this.options.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
  }

  /**
   * Update gallery count display
   */
  updateGalleryCount() {
    const countElement = document.getElementById('galleryCount');
    if (countElement) {
      const total = this.filteredSubmissions.length;
      const showing = Math.min(this.options.itemsPerPage, total - (this.currentPage - 1) * this.options.itemsPerPage);
      const start = total > 0 ? (this.currentPage - 1) * this.options.itemsPerPage + 1 : 0;
      const end = start + showing - 1;
      
      if (total === 0) {
        countElement.textContent = 'No submissions found';
      } else if (this.options.showPagination && this.totalPages > 1) {
        countElement.textContent = `Showing ${start}-${end} of ${total} submissions`;
      } else {
        countElement.textContent = `${total} submission${total !== 1 ? 's' : ''}`;
      }
    }
  }

  /**
   * Render the gallery
   */
  renderGallery() {
    const contentElement = document.getElementById(`galleryContent-${this.containerId}`);
    if (!contentElement) return;

    if (this.filteredSubmissions.length === 0) {
      this.showEmptyState();
      this.hidePagination();
      return;
    }

    // Get submissions for current page
    const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
    const endIndex = startIndex + this.options.itemsPerPage;
    const pageSubmissions = this.filteredSubmissions.slice(startIndex, endIndex);

    // Render submissions
    if (this.options.viewMode === 'grid') {
      this.renderGridView(contentElement, pageSubmissions);
    } else {
      this.renderListView(contentElement, pageSubmissions);
    }

    // Update pagination
    if (this.options.showPagination) {
      this.renderPagination();
    }
  }

  /**
   * Render grid view
   */
  renderGridView(contentElement, submissions) {
    contentElement.innerHTML = `
      <div class="gallery-grid">
        ${submissions.map(submission => this.createGridItem(submission)).join('')}
      </div>
    `;
  }

  /**
   * Render list view
   */
  renderListView(contentElement, submissions) {
    contentElement.innerHTML = `
      <div class="gallery-list">
        ${submissions.map(submission => this.createListItem(submission)).join('')}
      </div>
    `;
  }

  /**
   * Create grid item HTML
   */
  createGridItem(submission) {
    const firstFile = submission.files?.[0];
    const isImage = firstFile?.mimetype?.startsWith('image/');
    const statusClass = submission.status || 'pending';
    
    return `
      <div class="gallery-item grid-item" onclick="proofGallery_${this.containerId}.viewSubmission('${submission._id}')">
        <div class="item-preview">
          ${isImage ? `
            <img src="${firstFile.url}" alt="${firstFile.originalName}" class="preview-image">
          ` : `
            <div class="preview-placeholder">
              <div class="file-icon">${this.getFileIcon(firstFile?.mimetype)}</div>
              <div class="file-count">${submission.files?.length || 0} file${submission.files?.length !== 1 ? 's' : ''}</div>
            </div>
          `}
          <div class="item-overlay">
            <div class="overlay-content">
              <button class="preview-btn">👁️ View</button>
            </div>
          </div>
        </div>
        
        <div class="item-info">
          <div class="item-status ${statusClass}">${this.getStatusLabel(submission.status)}</div>
          <div class="item-title">${submission.milestone?.title || 'Proof Submission'}</div>
          <div class="item-meta">
            <span class="creator">${submission.creator?.userName || 'Unknown'}</span>
            <span class="date">${new Date(submission.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create list item HTML
   */
  createListItem(submission) {
    const firstFile = submission.files?.[0];
    const isImage = firstFile?.mimetype?.startsWith('image/');
    const statusClass = submission.status || 'pending';
    
    return `
      <div class="gallery-item list-item" onclick="proofGallery_${this.containerId}.viewSubmission('${submission._id}')">
        <div class="list-preview">
          ${isImage ? `
            <img src="${firstFile.url}" alt="${firstFile.originalName}" class="preview-image">
          ` : `
            <div class="preview-placeholder">
              <div class="file-icon">${this.getFileIcon(firstFile?.mimetype)}</div>
            </div>
          `}
        </div>
        
        <div class="list-content">
          <div class="list-header">
            <div class="list-title">${submission.milestone?.title || 'Proof Submission'}</div>
            <div class="list-status ${statusClass}">${this.getStatusLabel(submission.status)}</div>
          </div>
          
          <div class="list-details">
            <div class="detail-row">
              <span class="label">Creator:</span>
              <span class="value">${submission.creator?.userName || 'Unknown'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Submitted:</span>
              <span class="value">${new Date(submission.createdAt).toLocaleString()}</span>
            </div>
            ${submission.reviewedAt ? `
              <div class="detail-row">
                <span class="label">Reviewed:</span>
                <span class="value">${new Date(submission.reviewedAt).toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Files:</span>
              <span class="value">${submission.files?.length || 0} file${submission.files?.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          ${submission.description ? `
            <div class="list-description">${submission.description.substring(0, 150)}${submission.description.length > 150 ? '...' : ''}</div>
          ` : ''}
        </div>
        
        <div class="list-actions">
          <button class="action-btn primary">👁️ View</button>
          ${window.authContext?.isMarketer() && submission.status === 'pending' ? `
            <button class="action-btn secondary" onclick="event.stopPropagation(); reviewProofSubmission('${submission._id}')">📋 Review</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimetype) {
    if (!mimetype) return '📎';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('video')) return '🎥';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('document')) return '📝';
    if (mimetype.includes('text')) return '📄';
    return '📎';
  }

  /**
   * Get status label
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
   * Render pagination
   */
  renderPagination() {
    const paginationElement = document.getElementById(`galleryPagination-${this.containerId}`);
    if (!paginationElement || this.totalPages <= 1) {
      this.hidePagination();
      return;
    }

    const pages = [];
    const showPages = 5; // Number of page buttons to show
    
    let startPage = Math.max(1, this.currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(this.totalPages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    // Previous button
    if (this.currentPage > 1) {
      pages.push(`<button class="page-btn" onclick="proofGallery_${this.containerId}.goToPage(${this.currentPage - 1})">‹</button>`);
    }

    // First page
    if (startPage > 1) {
      pages.push(`<button class="page-btn" onclick="proofGallery_${this.containerId}.goToPage(1)">1</button>`);
      if (startPage > 2) {
        pages.push(`<span class="page-ellipsis">...</span>`);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      pages.push(`<button class="page-btn ${activeClass}" onclick="proofGallery_${this.containerId}.goToPage(${i})">${i}</button>`);
    }

    // Last page
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push(`<span class="page-ellipsis">...</span>`);
      }
      pages.push(`<button class="page-btn" onclick="proofGallery_${this.containerId}.goToPage(${this.totalPages})">${this.totalPages}</button>`);
    }

    // Next button
    if (this.currentPage < this.totalPages) {
      pages.push(`<button class="page-btn" onclick="proofGallery_${this.containerId}.goToPage(${this.currentPage + 1})">›</button>`);
    }

    paginationElement.innerHTML = `
      <div class="pagination-controls">
        ${pages.join('')}
      </div>
    `;
    
    paginationElement.style.display = 'block';
  }

  /**
   * Hide pagination
   */
  hidePagination() {
    const paginationElement = document.getElementById(`galleryPagination-${this.containerId}`);
    if (paginationElement) {
      paginationElement.style.display = 'none';
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.renderGallery();
    }
  }

  /**
   * Set view mode (grid or list)
   */
  setViewMode(mode) {
    if (this.options.viewMode === mode) return;
    
    this.options.viewMode = mode;
    
    // Update view buttons
    document.querySelectorAll(`#${this.containerId} .view-btn`).forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`#${this.containerId} .view-btn[onclick*="${mode}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Re-render gallery
    this.renderGallery();
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(filterType, value) {
    this.activeFilters[filterType] = value;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
    this.renderGallery();
  }

  /**
   * Handle search
   */
  handleSearch(event) {
    this.searchQuery = event.target.value.trim();
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
    this.renderGallery();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.activeFilters = {
      status: 'all',
      fileType: 'all',
      milestone: 'all',
      dateRange: 'all'
    };
    this.searchQuery = '';
    this.currentPage = 1;
    
    // Reset form controls
    document.querySelectorAll(`#${this.containerId} .filter-select`).forEach(select => {
      select.value = 'all';
    });
    
    const searchInput = document.querySelector(`#${this.containerId} .gallery-search`);
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.applyFilters();
    this.renderGallery();
  }

  /**
   * View submission details
   */
  viewSubmission(submissionId) {
    // Use existing proof status display modal or proof review interface
    if (window.proofStatusDisplay) {
      window.proofStatusDisplay.viewSubmissionDetails(submissionId);
    } else if (window.proofReviewInterface && window.authContext?.isMarketer()) {
      window.proofReviewInterface.showReviewModal(submissionId);
    } else {
      // Fallback: open submission in new tab or show basic modal
      console.log('Viewing submission:', submissionId);
      if (window.showNotification) {
        window.showNotification('Submission viewer not available', 'info');
      }
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    const contentElement = document.getElementById(`galleryContent-${this.containerId}`);
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="gallery-loading">
          <div class="loading-spinner"></div>
          <span>Loading proof submissions...</span>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    const contentElement = document.getElementById(`galleryContent-${this.containerId}`);
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="gallery-empty">
          <div class="empty-icon">📭</div>
          <h4>No proof submissions found</h4>
          <p>No submissions match your current filters. Try adjusting your search or clearing filters.</p>
          ${Object.values(this.activeFilters).some(v => v !== 'all') || this.searchQuery ? `
            <button class="btn btn-primary" onclick="proofGallery_${this.containerId}.clearFilters()">
              Clear Filters
            </button>
          ` : ''}
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    const contentElement = document.getElementById(`galleryContent-${this.containerId}`);
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="gallery-error">
          <div class="error-icon">⚠️</div>
          <h4>Error Loading Submissions</h4>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="proofGallery_${this.containerId}.loadProofSubmissions()">
            Retry
          </button>
        </div>
      `;
    }
  }

  /**
   * Refresh gallery data
   */
  refresh() {
    this.loadProofSubmissions();
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Listen for proof events to refresh gallery
    document.addEventListener('proof-submitted', () => {
      setTimeout(() => this.refresh(), 1000);
    });
    
    document.addEventListener('proof-approved', () => {
      setTimeout(() => this.refresh(), 1000);
    });
    
    document.addEventListener('proof-rejected', () => {
      setTimeout(() => this.refresh(), 1000);
    });
    
    document.addEventListener('proof-changes-requested', () => {
      setTimeout(() => this.refresh(), 1000);
    });
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('proof-gallery-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'proof-gallery-styles';
    styles.textContent = `
      .proof-gallery {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .gallery-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 20px;
        align-items: end;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 140px;
      }

      .filter-group label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }

      .filter-select {
        padding: 6px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        background: white;
      }

      .filter-clear-btn {
        padding: 6px 12px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        white-space: nowrap;
      }

      .filter-clear-btn:hover {
        background: #dc2626;
      }

      .gallery-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .gallery-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .gallery-count {
        font-size: 14px;
        color: #6b7280;
      }

      .gallery-controls {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .view-controls {
        display: flex;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
      }

      .view-btn {
        padding: 8px 10px;
        background: white;
        border: none;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s ease;
      }

      .view-btn:hover {
        background: #f3f4f6;
      }

      .view-btn.active {
        background: #6366f1;
        color: white;
      }

      .search-controls {
        position: relative;
      }

      .gallery-search {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        width: 200px;
        font-size: 14px;
      }

      .gallery-search:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
      }

      .gallery-content {
        min-height: 200px;
      }

      .gallery-loading,
      .gallery-empty,
      .gallery-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        color: #6b7280;
      }

      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 12px;
      }

      .empty-icon,
      .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .gallery-empty h4,
      .gallery-error h4 {
        margin: 0 0 8px 0;
        color: #374151;
      }

      .gallery-empty p,
      .gallery-error p {
        margin: 0 0 16px 0;
        color: #6b7280;
      }

      /* Grid View */
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
      }

      .grid-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .grid-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .item-preview {
        position: relative;
        height: 180px;
        overflow: hidden;
        background: #f3f4f6;
      }

      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .preview-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6b7280;
      }

      .file-icon {
        font-size: 48px;
        margin-bottom: 8px;
      }

      .file-count {
        font-size: 14px;
        font-weight: 500;
      }

      .item-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .grid-item:hover .item-overlay {
        opacity: 1;
      }

      .preview-btn {
        padding: 8px 16px;
        background: white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
      }

      .item-info {
        padding: 16px;
      }

      .item-status {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;
        margin-bottom: 8px;
        display: inline-block;
      }

      .item-status.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .item-status.approved {
        background: #d1fae5;
        color: #065f46;
      }

      .item-status.rejected {
        background: #fee2e2;
        color: #991b1b;
      }

      .item-status.changes_requested {
        background: #e0e7ff;
        color: #3730a3;
      }

      .item-title {
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .item-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #6b7280;
      }

      /* List View */
      .gallery-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .list-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .list-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .list-preview {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        overflow: hidden;
        border-radius: 6px;
        background: #f3f4f6;
      }

      .list-preview .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .list-preview .preview-placeholder {
        height: 100%;
      }

      .list-preview .file-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .list-content {
        flex: 1;
        min-width: 0;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .list-title {
        font-weight: 600;
        color: #111827;
        font-size: 16px;
      }

      .list-status {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 500;
      }

      .list-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 4px 16px;
        margin-bottom: 8px;
      }

      .detail-row {
        font-size: 12px;
        display: flex;
        gap: 4px;
      }

      .detail-row .label {
        color: #6b7280;
        font-weight: 500;
      }

      .detail-row .value {
        color: #374151;
      }

      .list-description {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.4;
      }

      .list-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
      }

      .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
      }

      .action-btn.primary {
        background: #6366f1;
        color: white;
      }

      .action-btn.secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      /* Pagination */
      .gallery-pagination {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }

      .pagination-controls {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .page-btn {
        padding: 8px 12px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
        transition: all 0.2s ease;
      }

      .page-btn:hover {
        background: #f3f4f6;
      }

      .page-btn.active {
        background: #6366f1;
        color: white;
        border-color: #6366f1;
      }

      .page-ellipsis {
        padding: 8px 4px;
        color: #6b7280;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: #6366f1;
        color: white;
      }

      .btn-primary:hover {
        background: #4f46e5;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media (max-width: 768px) {
        .gallery-filters {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-group {
          min-width: auto;
        }

        .gallery-header {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .gallery-controls {
          justify-content: space-between;
        }

        .gallery-search {
          width: 150px;
        }

        .gallery-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .list-item {
          flex-direction: column;
          align-items: stretch;
        }

        .list-header {
          order: -1;
        }

        .list-actions {
          flex-direction: row;
          justify-content: space-between;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// Export for global use
window.ProofGallery = ProofGallery;