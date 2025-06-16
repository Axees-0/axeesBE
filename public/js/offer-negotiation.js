/**
 * Offer Negotiation & Comparison System
 * Provides side-by-side comparison view and negotiation workflow
 */

class OfferNegotiationManager {
  constructor() {
    this.currentOffer = null;
    this.comparisonData = null;
    this.negotiationHistory = [];
    this.offerComments = [];
    this.isLoading = false;
    
    this.initialize();
  }

  initialize() {
    // Check if user is authenticated
    if (!window.authContext || !window.authContext.isAuthenticated) {
      return;
    }

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for offer interactions
   */
  setupEventListeners() {
    // Listen for offer clicks in marketplace
    document.addEventListener('click', (e) => {
      const offerCard = e.target.closest('.deal-card');
      if (offerCard && offerCard.dataset.offerId) {
        const offerId = offerCard.dataset.offerId;
        this.showOfferDetails(offerId);
      }
    });
  }

  /**
   * Show detailed offer view with negotiation options
   */
  async showOfferDetails(offerId) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      // Get offer details and comparison data
      const [offerResponse, comparisonResponse] = await Promise.all([
        window.axeesAPI.getOffer(offerId),
        window.axeesAPI.getOfferComparison(offerId)
      ]);

      this.currentOffer = offerResponse.offer;
      this.comparisonData = comparisonResponse.comparison;
      
      this.showNegotiationModal();
      
    } catch (error) {
      this.showError('Failed to load offer details: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create and show the negotiation modal
   */
  showNegotiationModal() {
    if (!this.currentOffer) return;

    const modal = this.createNegotiationModal();
    document.body.appendChild(modal);
    
    this.loadNegotiationHistory();
    this.updateComparisonView();
  }

  /**
   * Create the negotiation modal HTML
   */
  createNegotiationModal() {
    const modal = document.createElement('div');
    modal.className = 'negotiation-modal';
    modal.innerHTML = `
      <div class="negotiation-modal-backdrop" onclick="offerNegotiationManager.closeModal()"></div>
      <div class="negotiation-modal-container">
        ${this.createModalHeader()}
        ${this.createModalBody()}
        ${this.createModalFooter()}
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('negotiation-styles')) {
      this.addNegotiationStyles();
    }

    return modal;
  }

  /**
   * Create modal header
   */
  createModalHeader() {
    const offer = this.currentOffer;
    const user = window.authContext?.user;
    const isMarketer = window.authContext?.isMarketer();
    
    return `
      <div class="negotiation-header">
        <div class="negotiation-title-section">
          <h2 class="negotiation-title">${offer.offerName}</h2>
          <div class="negotiation-meta">
            <span class="offer-status status-${offer.status?.toLowerCase()}">${offer.status || 'Draft'}</span>
            <span class="offer-type">${this.formatOfferType(offer.offerType)}</span>
            <span class="offer-amount">$${offer.proposedAmount} USD</span>
          </div>
        </div>
        
        <div class="negotiation-actions-header">
          <button class="btn btn-secondary" onclick="offerNegotiationManager.viewHistory()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
            </svg>
            History
          </button>
          <button class="btn btn-secondary" onclick="offerNegotiationManager.closeModal()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create modal body with comparison view
   */
  createModalBody() {
    return `
      <div class="negotiation-body">
        <div class="negotiation-tabs">
          <button class="tab-button active" onclick="offerNegotiationManager.switchTab('comparison')">
            Comparison View
          </button>
          <button class="tab-button" onclick="offerNegotiationManager.switchTab('timeline')">
            Negotiation Timeline
          </button>
          <button class="tab-button" onclick="offerNegotiationManager.switchTab('details')">
            Offer Details
          </button>
          <button class="tab-button" onclick="offerNegotiationManager.switchTab('versions')">
            Version History
          </button>
        </div>
        
        <div class="tab-content">
          <div class="tab-panel active" id="comparison-panel">
            ${this.createComparisonView()}
          </div>
          
          <div class="tab-panel" id="timeline-panel">
            ${this.createTimelineView()}
          </div>
          
          <div class="tab-panel" id="details-panel">
            ${this.createDetailsView()}
          </div>
          
          <div class="tab-panel" id="versions-panel">
            ${this.createVersionsView()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create comparison view
   */
  createComparisonView() {
    const offer = this.currentOffer;
    const comparison = this.comparisonData;
    
    return `
      <div class="comparison-container">
        <div class="comparison-header">
          <h3>Offer Comparison</h3>
          <p>Compare original offer with latest terms</p>
        </div>
        
        <div class="comparison-grid">
          <div class="comparison-column">
            <h4>Original Offer</h4>
            <div class="comparison-card">
              ${this.createOfferCard(offer, 'original')}
            </div>
          </div>
          
          <div class="comparison-divider">
            <div class="comparison-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 12l-8-8v5H2v6h4v5l8-8z"/>
              </svg>
            </div>
          </div>
          
          <div class="comparison-column">
            <h4>Current Terms</h4>
            <div class="comparison-card">
              ${this.createOfferCard(this.getLatestTerms(), 'current')}
            </div>
          </div>
        </div>
        
        ${this.createDiffHighlights()}
      </div>
    `;
  }

  /**
   * Create timeline view
   */
  createTimelineView() {
    return `
      <div class="timeline-container">
        <div class="timeline-header">
          <h3>Negotiation Timeline</h3>
          <p>Track all offer changes, responses, and comments</p>
        </div>
        
        <div class="comment-input-section">
          <div class="comment-form">
            <textarea 
              id="commentInput" 
              placeholder="Add a comment to the negotiation..." 
              rows="3"
              maxlength="500"
            ></textarea>
            <div class="comment-actions">
              <span class="comment-counter">
                <span id="commentCharCount">0</span>/500
              </span>
              <button 
                class="btn btn-primary btn-sm" 
                onclick="offerNegotiationManager.addComment()"
                id="addCommentBtn"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
        
        <div class="timeline-content" id="timelineContent">
          <div class="timeline-loading">
            <div class="loading-spinner"></div>
            <p>Loading negotiation history and comments...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create details view
   */
  createDetailsView() {
    const offer = this.currentOffer;
    
    return `
      <div class="details-container">
        <div class="details-grid">
          <div class="detail-section">
            <h4>Collaboration Details</h4>
            <div class="detail-item">
              <label>Platforms:</label>
              <div class="platform-tags">
                ${offer.platforms ? offer.platforms.map(p => `<span class="platform-tag">${p}</span>`).join('') : 'Not specified'}
              </div>
            </div>
            
            <div class="detail-item">
              <label>Deliverables:</label>
              <ul class="deliverable-list">
                ${offer.deliverables ? offer.deliverables.map(d => `<li>${d}</li>`).join('') : '<li>Not specified</li>'}
              </ul>
            </div>
            
            ${offer.description ? `
              <div class="detail-item">
                <label>Description:</label>
                <p>${offer.description}</p>
              </div>
            ` : ''}
          </div>
          
          <div class="detail-section">
            <h4>Timeline & Logistics</h4>
            
            ${offer.startDate ? `
              <div class="detail-item">
                <label>Start Date:</label>
                <span>${new Date(offer.startDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            
            ${offer.endDate ? `
              <div class="detail-item">
                <label>End Date:</label>
                <span>${new Date(offer.endDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            
            ${offer.desiredReviewDate ? `
              <div class="detail-item">
                <label>Review Date:</label>
                <span>${new Date(offer.desiredReviewDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            
            ${offer.desiredPostDate ? `
              <div class="detail-item">
                <label>Post Date:</label>
                <span>${new Date(offer.desiredPostDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            
            <div class="detail-item">
              <label>Priority:</label>
              <span class="priority-${offer.priority}">${this.formatPriority(offer.priority)}</span>
            </div>
          </div>
        </div>
        
        ${offer.notes ? `
          <div class="detail-section">
            <h4>Additional Notes</h4>
            <div class="notes-content">
              ${offer.notes}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Create versions view
   */
  createVersionsView() {
    return `
      <div class="versions-container">
        <div class="versions-header">
          <h3>Version History</h3>
          <p>Track all changes and revert to previous versions</p>
          <button class="btn btn-secondary" onclick="offerNegotiationManager.refreshVersions()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Refresh
          </button>
        </div>
        
        <div class="versions-content" id="versionsContent">
          <div class="versions-loading">
            <div class="loading-spinner"></div>
            <p>Loading version history...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create modal footer with action buttons
   */
  createModalFooter() {
    const user = window.authContext?.user;
    const isMarketer = window.authContext?.isMarketer();
    const offer = this.currentOffer;
    
    // Determine available actions based on user role and offer status
    const canNegotiate = offer.status !== 'accepted' && offer.status !== 'rejected';
    const canAccept = !isMarketer && canNegotiate;
    const canCounter = canNegotiate;
    
    return `
      <div class="negotiation-footer">
        <div class="footer-left">
          <div class="negotiation-stats">
            <span>Rounds: ${offer.counters?.length || 0}</span>
            <span>Last Activity: ${this.formatLastActivity()}</span>
          </div>
        </div>
        
        <div class="footer-right">
          ${canAccept ? `
            <button class="btn btn-success" onclick="offerNegotiationManager.acceptOffer()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
              Accept Offer
            </button>
          ` : ''}
          
          ${canCounter ? `
            <button class="btn btn-primary" onclick="offerNegotiationManager.showCounterForm()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Counter Offer
            </button>
          ` : ''}
          
          ${canNegotiate ? `
            <button class="btn btn-danger" onclick="offerNegotiationManager.rejectOffer()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
              Reject
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create offer card for comparison
   */
  createOfferCard(offer, type) {
    if (!offer) return '<p>No data available</p>';
    
    return `
      <div class="offer-card-content">
        <div class="offer-card-amount">
          <span class="amount-value">$${offer.proposedAmount || offer.counterAmount || 0}</span>
          <span class="amount-currency">USD</span>
        </div>
        
        <div class="offer-card-details">
          <div class="detail-row">
            <span class="detail-label">Platforms:</span>
            <span class="detail-value">${(offer.platforms || []).join(', ') || 'Not specified'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Deliverables:</span>
            <span class="detail-value">${(offer.deliverables || []).length} items</span>
          </div>
          
          ${offer.desiredPostDate ? `
            <div class="detail-row">
              <span class="detail-label">Post Date:</span>
              <span class="detail-value">${new Date(offer.desiredPostDate).toLocaleDateString()}</span>
            </div>
          ` : ''}
          
          ${offer.notes || offer.counterNotes ? `
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">${(offer.notes || offer.counterNotes || '').substring(0, 100)}${(offer.notes || offer.counterNotes || '').length > 100 ? '...' : ''}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create diff highlights
   */
  createDiffHighlights() {
    const original = this.currentOffer;
    const current = this.getLatestTerms();
    const diffs = this.calculateDifferences(original, current);
    
    if (diffs.length === 0) {
      return '<div class="no-changes">No changes from original offer</div>';
    }
    
    return `
      <div class="diff-highlights">
        <h4>Changes Made</h4>
        <div class="diff-list">
          ${diffs.map(diff => `
            <div class="diff-item">
              <div class="diff-field">${diff.field}</div>
              <div class="diff-change">
                <span class="diff-old">${diff.oldValue}</span>
                <span class="diff-arrow">→</span>
                <span class="diff-new">${diff.newValue}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get latest terms from counters or original offer
   */
  getLatestTerms() {
    const offer = this.currentOffer;
    
    if (offer.counters && offer.counters.length > 0) {
      const latestCounter = offer.counters[offer.counters.length - 1];
      return {
        proposedAmount: latestCounter.counterAmount,
        platforms: offer.platforms, // Usually platforms don't change in counters
        deliverables: latestCounter.deliverables || offer.deliverables,
        desiredPostDate: latestCounter.counterPostDate || offer.desiredPostDate,
        desiredReviewDate: latestCounter.counterReviewDate || offer.desiredReviewDate,
        notes: latestCounter.notes
      };
    }
    
    return offer;
  }

  /**
   * Calculate differences between original and current terms
   */
  calculateDifferences(original, current) {
    const diffs = [];
    
    if (original.proposedAmount !== current.proposedAmount) {
      diffs.push({
        field: 'Amount',
        oldValue: `$${original.proposedAmount}`,
        newValue: `$${current.proposedAmount}`
      });
    }
    
    if (original.desiredPostDate !== current.desiredPostDate) {
      diffs.push({
        field: 'Post Date',
        oldValue: original.desiredPostDate ? new Date(original.desiredPostDate).toLocaleDateString() : 'Not set',
        newValue: current.desiredPostDate ? new Date(current.desiredPostDate).toLocaleDateString() : 'Not set'
      });
    }
    
    if (original.notes !== current.notes) {
      diffs.push({
        field: 'Notes',
        oldValue: (original.notes || 'None').substring(0, 50) + '...',
        newValue: (current.notes || 'None').substring(0, 50) + '...'
      });
    }
    
    return diffs;
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[onclick*="${tabName}"]`).classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'timeline') {
      this.loadTimelineData();
      this.setupCommentInput();
    } else if (tabName === 'versions') {
      this.loadVersionData();
    }
  }

  /**
   * Load negotiation history for timeline
   */
  async loadNegotiationHistory() {
    try {
      const response = await window.axeesAPI.getOfferHistory(this.currentOffer._id);
      this.negotiationHistory = response.history || [];
    } catch (error) {
      this.negotiationHistory = [];
    }
  }

  /**
   * Load timeline data (both history and comments)
   */
  async loadTimelineData() {
    const timelineContent = document.getElementById('timelineContent');
    if (!timelineContent) return;
    
    await Promise.all([
      this.loadNegotiationHistory(),
      this.loadOfferComments()
    ]);
    
    const timelineItems = this.createCombinedTimeline();
    
    if (timelineItems.length === 0) {
      timelineContent.innerHTML = `
        <div class="timeline-empty">
          <p>No negotiation history or comments yet</p>
          <p>Add a comment to start the conversation!</p>
        </div>
      `;
      return;
    }
    
    timelineContent.innerHTML = `
      <div class="timeline-list">
        ${timelineItems.join('')}
      </div>
    `;
  }

  /**
   * Load offer comments
   */
  async loadOfferComments() {
    try {
      const response = await window.axeesAPI.getOfferComments(this.currentOffer._id);
      this.offerComments = response.comments || [];
    } catch (error) {
      this.offerComments = [];
    }
  }

  /**
   * Create combined timeline with history and comments
   */
  createCombinedTimeline() {
    const allItems = [];
    
    // Add negotiation history items
    this.negotiationHistory.forEach(item => {
      allItems.push({
        type: 'history',
        timestamp: new Date(item.timestamp),
        data: item
      });
    });
    
    // Add comment items
    this.offerComments.forEach(comment => {
      allItems.push({
        type: 'comment',
        timestamp: new Date(comment.createdAt),
        data: comment
      });
    });
    
    // Sort by timestamp (most recent first)
    allItems.sort((a, b) => b.timestamp - a.timestamp);
    
    // Convert to HTML
    return allItems.map(item => {
      if (item.type === 'history') {
        return this.createHistoryTimelineItem(item.data);
      } else {
        return this.createCommentTimelineItem(item.data);
      }
    });
  }

  /**
   * Create history timeline item
   */
  createHistoryTimelineItem(item) {
    return `
      <div class="timeline-item history-item">
        <div class="timeline-marker history-marker"></div>
        <div class="timeline-content-item">
          <div class="timeline-header">
            <span class="timeline-user">${item.userRole}</span>
            <span class="timeline-action">made changes</span>
            <span class="timeline-date">${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="timeline-changes">
            ${item.changes.map(change => `
              <div class="timeline-change">
                <strong>${change.field}:</strong> ${change.oldValue} → ${change.newValue}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create comment timeline item
   */
  createCommentTimelineItem(comment) {
    const currentUser = window.authContext?.user;
    const isOwnComment = currentUser && comment.userId === currentUser.id;
    
    return `
      <div class="timeline-item comment-item">
        <div class="timeline-marker comment-marker"></div>
        <div class="timeline-content-item comment-content">
          <div class="timeline-header">
            <div class="comment-author">
              <div class="comment-avatar">${(comment.userName || 'U').charAt(0).toUpperCase()}</div>
              <span class="timeline-user">${comment.userName || 'Unknown User'}</span>
            </div>
            <span class="timeline-date">${new Date(comment.createdAt).toLocaleDateString()} ${new Date(comment.createdAt).toLocaleTimeString()}</span>
            ${isOwnComment ? `
              <div class="comment-actions">
                <button class="btn-icon" onclick="offerNegotiationManager.editComment('${comment._id}')" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M8.854 1.854a.5.5 0 0 0-.708 0L1.5 8.5a.5.5 0 0 0-.146.354v2.793a.5.5 0 0 0 .5.5h2.793a.5.5 0 0 0 .354-.146l6.646-6.646a.5.5 0 0 0 0-.708l-2.793-2.793zm-1.207.707l2.439 2.439L4.5 10.586H2.914V9l5.732-5.732z"/>
                  </svg>
                </button>
                <button class="btn-icon btn-danger" onclick="offerNegotiationManager.deleteComment('${comment._id}')" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M5.5 0a.5.5 0 0 1 .5.5V1h3V.5a.5.5 0 0 1 1 0V1h1a.5.5 0 0 1 0 1h-1v10a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V2H0a.5.5 0 0 1 0-1h1V.5a.5.5 0 0 1 1 0V1h3zm-.5 2v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2H5z"/>
                  </svg>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="comment-text">${this.escapeHtml(comment.comment)}</div>
          ${comment.editedAt ? `<div class="comment-edited">Edited ${new Date(comment.editedAt).toLocaleDateString()}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Setup comment input functionality
   */
  setupCommentInput() {
    const commentInput = document.getElementById('commentInput');
    const charCount = document.getElementById('commentCharCount');
    const addBtn = document.getElementById('addCommentBtn');
    
    if (!commentInput || !charCount || !addBtn) return;
    
    // Character counter
    commentInput.addEventListener('input', () => {
      const count = commentInput.value.length;
      charCount.textContent = count;
      addBtn.disabled = count === 0 || count > 500;
      
      if (count > 450) {
        charCount.style.color = 'var(--error)';
      } else if (count > 400) {
        charCount.style.color = 'var(--warning)';
      } else {
        charCount.style.color = 'var(--text-secondary)';
      }
    });
    
    // Enter key to submit (Ctrl+Enter or Cmd+Enter)
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.addComment();
      }
    });
  }

  /**
   * Add a new comment
   */
  async addComment() {
    const commentInput = document.getElementById('commentInput');
    const addBtn = document.getElementById('addCommentBtn');
    
    if (!commentInput || !commentInput.value.trim()) return;
    
    const comment = commentInput.value.trim();
    
    try {
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';
      
      const response = await window.axeesAPI.addOfferComment(this.currentOffer._id, comment);
      
      if (response.success) {
        // Clear input
        commentInput.value = '';
        document.getElementById('commentCharCount').textContent = '0';
        
        // Reload timeline
        await this.loadTimelineData();
        
        this.showSuccess('Comment added successfully');
      }
      
    } catch (error) {
      this.showError('Failed to add comment: ' + error.message);
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = 'Add Comment';
    }
  }

  /**
   * Edit a comment
   */
  async editComment(commentId) {
    const comment = this.offerComments.find(c => c._id === commentId);
    if (!comment) return;
    
    const newText = prompt('Edit your comment:', comment.comment);
    if (newText === null || newText.trim() === comment.comment) return;
    
    if (newText.trim().length === 0) {
      this.showError('Comment cannot be empty');
      return;
    }
    
    if (newText.length > 500) {
      this.showError('Comment is too long (max 500 characters)');
      return;
    }
    
    try {
      const response = await window.axeesAPI.updateOfferComment(this.currentOffer._id, commentId, newText.trim());
      
      if (response.success) {
        await this.loadTimelineData();
        this.showSuccess('Comment updated successfully');
      }
      
    } catch (error) {
      this.showError('Failed to update comment: ' + error.message);
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await window.axeesAPI.deleteOfferComment(this.currentOffer._id, commentId);
      
      if (response.success) {
        await this.loadTimelineData();
        this.showSuccess('Comment deleted successfully');
      }
      
    } catch (error) {
      this.showError('Failed to delete comment: ' + error.message);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Load version data
   */
  async loadVersionData() {
    const versionsContent = document.getElementById('versionsContent');
    if (!versionsContent) return;
    
    try {
      const response = await window.axeesAPI.getOfferVersions(this.currentOffer._id);
      const versions = response.versions || [];
      
      if (versions.length === 0) {
        versionsContent.innerHTML = `
          <div class="versions-empty">
            <p>No version history available</p>
          </div>
        `;
        return;
      }
      
      const versionsHTML = versions.map((version, index) => `
        <div class="version-item ${index === 0 ? 'current-version' : ''}">
          <div class="version-header">
            <div class="version-info">
              <span class="version-number">Version ${version.version}</span>
              <span class="version-user">${version.userRole}</span>
              <span class="version-date">${new Date(version.timestamp).toLocaleDateString()} ${new Date(version.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="version-actions">
              ${index === 0 ? '<span class="current-badge">Current</span>' : `
                <button class="btn btn-sm btn-secondary" onclick="offerNegotiationManager.viewVersionDiff(${version.version})">
                  View Changes
                </button>
                <button class="btn btn-sm btn-primary" onclick="offerNegotiationManager.revertToVersion(${version.version})">
                  Revert
                </button>
              `}
            </div>
          </div>
          <div class="version-changes">
            ${version.changes.map(change => `
              <div class="version-change">
                <span class="change-field">${change.field}:</span>
                <span class="change-description">${this.formatVersionChange(change)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
      
      versionsContent.innerHTML = `
        <div class="versions-list">
          ${versionsHTML}
        </div>
      `;
      
    } catch (error) {
      versionsContent.innerHTML = `
        <div class="versions-error">
          <p>Failed to load version history</p>
          <button class="btn btn-secondary" onclick="offerNegotiationManager.loadVersionData()">Try Again</button>
        </div>
      `;
    }
  }

  /**
   * Refresh versions data
   */
  async refreshVersions() {
    await this.loadVersionData();
  }

  /**
   * View version diff
   */
  async viewVersionDiff(version) {
    try {
      const response = await window.axeesAPI.getOfferVersions(this.currentOffer._id);
      const versions = response.versions || [];
      const selectedVersion = versions.find(v => v.version === version);
      const currentVersion = versions[0];
      
      if (!selectedVersion) return;
      
      this.showVersionDiffModal(selectedVersion, currentVersion);
      
    } catch (error) {
      this.showError('Failed to load version details');
    }
  }

  /**
   * Show version diff modal
   */
  showVersionDiffModal(oldVersion, currentVersion) {
    const modal = document.createElement('div');
    modal.className = 'version-diff-modal';
    modal.innerHTML = `
      <div class="version-diff-backdrop" onclick="this.closest('.version-diff-modal').remove()"></div>
      <div class="version-diff-container">
        <div class="version-diff-header">
          <h3>Version Comparison</h3>
          <p>Comparing Version ${oldVersion.version} with Current Version</p>
          <button onclick="this.closest('.version-diff-modal').remove()">×</button>
        </div>
        
        <div class="version-diff-body">
          <div class="diff-grid">
            <div class="diff-column">
              <h4>Version ${oldVersion.version}</h4>
              <div class="diff-content">
                ${this.formatVersionDetails(oldVersion)}
              </div>
            </div>
            
            <div class="diff-column">
              <h4>Current Version</h4>
              <div class="diff-content">
                ${this.formatVersionDetails(currentVersion)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="version-diff-footer">
          <button class="btn btn-secondary" onclick="this.closest('.version-diff-modal').remove()">Close</button>
          <button class="btn btn-primary" onclick="offerNegotiationManager.revertToVersion(${oldVersion.version}); this.closest('.version-diff-modal').remove();">
            Revert to Version ${oldVersion.version}
          </button>
        </div>
      </div>
    `;
    
    this.addVersionDiffStyles();
    document.body.appendChild(modal);
  }

  /**
   * Revert to specific version
   */
  async revertToVersion(version) {
    try {
      const confirmation = confirm(`Are you sure you want to revert to Version ${version}? This will undo all changes made after that version.`);
      if (!confirmation) return;
      
      const response = await window.axeesAPI.revertToVersion(this.currentOffer._id, version);
      
      if (response.success) {
        this.showSuccess(`Successfully reverted to Version ${version}`);
        
        // Refresh the offer data
        setTimeout(() => {
          this.showOfferDetails(this.currentOffer._id);
        }, 1500);
      }
      
    } catch (error) {
      this.showError('Failed to revert to version: ' + error.message);
    }
  }

  /**
   * Format version change for display
   */
  formatVersionChange(change) {
    if (change.oldValue === undefined || change.oldValue === null) {
      return `Set to "${change.newValue}"`;
    }
    if (change.newValue === undefined || change.newValue === null) {
      return `Removed "${change.oldValue}"`;
    }
    return `Changed from "${change.oldValue}" to "${change.newValue}"`;
  }

  /**
   * Format version details for diff view
   */
  formatVersionDetails(version) {
    return version.changes.map(change => `
      <div class="detail-item">
        <label>${change.field}:</label>
        <span>${change.newValue || 'Not set'}</span>
      </div>
    `).join('');
  }

  /**
   * Accept offer
   */
  async acceptOffer() {
    try {
      const confirmation = confirm('Are you sure you want to accept this offer? This will create a deal and begin the collaboration.');
      if (!confirmation) return;
      
      const response = await window.axeesAPI.acceptOffer(this.currentOffer._id, this.getLatestTerms());
      
      if (response.success) {
        this.showSuccess('Offer accepted successfully! A deal has been created.');
        this.closeModal();
        // Redirect to deals page or refresh
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      }
      
    } catch (error) {
      this.showError('Failed to accept offer: ' + error.message);
    }
  }

  /**
   * Reject offer
   */
  async rejectOffer() {
    const reason = prompt('Please provide a reason for rejecting this offer (optional):');
    
    try {
      const response = await window.axeesAPI.rejectOffer(this.currentOffer._id, reason);
      
      if (response.success) {
        this.showSuccess('Offer rejected.');
        this.closeModal();
      }
      
    } catch (error) {
      this.showError('Failed to reject offer: ' + error.message);
    }
  }

  /**
   * Show counter offer form
   */
  showCounterForm() {
    const current = this.getLatestTerms();
    
    const counterModal = document.createElement('div');
    counterModal.className = 'counter-modal';
    counterModal.innerHTML = `
      <div class="counter-modal-backdrop" onclick="this.remove()"></div>
      <div class="counter-modal-container">
        <div class="counter-modal-header">
          <h3>Counter Offer</h3>
          <button onclick="this.closest('.counter-modal').remove()">×</button>
        </div>
        
        <div class="counter-modal-body">
          <div class="form-group">
            <label>Proposed Amount (USD)</label>
            <input type="number" id="counterAmount" value="${current.proposedAmount}" min="1" step="0.01">
          </div>
          
          <div class="form-group">
            <label>Review Date</label>
            <input type="date" id="counterReviewDate" value="${current.desiredReviewDate ? current.desiredReviewDate.split('T')[0] : ''}">
          </div>
          
          <div class="form-group">
            <label>Post Date</label>
            <input type="date" id="counterPostDate" value="${current.desiredPostDate ? current.desiredPostDate.split('T')[0] : ''}">
          </div>
          
          <div class="form-group">
            <label>Notes/Changes</label>
            <textarea id="counterNotes" placeholder="Explain your counter-offer terms..." rows="4"></textarea>
          </div>
        </div>
        
        <div class="counter-modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.counter-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="offerNegotiationManager.submitCounter()">Submit Counter</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(counterModal);
  }

  /**
   * Submit counter offer
   */
  async submitCounter() {
    try {
      const counterData = {
        counterAmount: parseFloat(document.getElementById('counterAmount').value),
        counterReviewDate: document.getElementById('counterReviewDate').value || null,
        counterPostDate: document.getElementById('counterPostDate').value || null,
        notes: document.getElementById('counterNotes').value,
        counterBy: window.authContext?.isMarketer() ? 'Marketer' : 'Creator'
      };
      
      const response = await window.axeesAPI.counterOffer(this.currentOffer._id, counterData);
      
      if (response.success) {
        document.querySelector('.counter-modal').remove();
        this.showSuccess('Counter offer submitted successfully!');
        
        // Refresh the offer data
        this.showOfferDetails(this.currentOffer._id);
      }
      
    } catch (error) {
      this.showError('Failed to submit counter offer: ' + error.message);
    }
  }

  /**
   * View offer history
   */
  viewHistory() {
    this.switchTab('timeline');
  }

  /**
   * Update comparison view
   */
  updateComparisonView() {
    // This would refresh the comparison data
    // Implementation depends on real-time requirements
  }

  /**
   * Helper methods
   */
  formatOfferType(type) {
    const types = {
      'standard': 'Standard',
      'trial': '$1 Trial',
      'premium': 'Premium'
    };
    return types[type] || 'Standard';
  }

  formatPriority(priority) {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
  }

  formatLastActivity() {
    const offer = this.currentOffer;
    const lastActivity = offer.negotiationMetrics?.lastActivity || offer.updatedAt;
    
    if (!lastActivity) return 'No activity';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Utility methods
   */
  showSuccess(message) {
    // Create temporary success notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10001;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10001;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

  closeModal() {
    const modal = document.querySelector('.negotiation-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Add CSS styles for negotiation components
   */
  addNegotiationStyles() {
    const styles = document.createElement('style');
    styles.id = 'negotiation-styles';
    styles.textContent = `
      .negotiation-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      
      .negotiation-modal-container {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 1200px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }
      
      .negotiation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
      }
      
      .negotiation-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }
      
      .negotiation-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .offer-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-draft { background: var(--gray-100); color: var(--gray-700); }
      .status-sent { background: #dbeafe; color: #1e40af; }
      .status-received { background: #fef3c7; color: #92400e; }
      .status-accepted { background: #d1fae5; color: #065f46; }
      .status-rejected { background: #fee2e2; color: #991b1b; }
      
      .offer-type, .offer-amount {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .negotiation-actions-header {
        display: flex;
        gap: 8px;
      }
      
      .negotiation-body {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .negotiation-tabs {
        display: flex;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
      }
      
      .tab-button {
        padding: 16px 24px;
        border: none;
        background: none;
        color: var(--text-secondary);
        font-weight: 500;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
      }
      
      .tab-button.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        background: white;
      }
      
      .tab-content {
        flex: 1;
        overflow-y: auto;
      }
      
      .tab-panel {
        display: none;
        padding: 24px;
      }
      
      .tab-panel.active {
        display: block;
      }
      
      .comparison-container {
        max-width: 100%;
      }
      
      .comparison-header {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .comparison-header h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }
      
      .comparison-grid {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 24px;
        align-items: start;
        margin-bottom: 32px;
      }
      
      .comparison-column h4 {
        text-align: center;
        margin: 0 0 16px 0;
        color: var(--text-primary);
      }
      
      .comparison-card {
        border: 2px solid var(--gray-200);
        border-radius: 12px;
        padding: 24px;
        background: white;
      }
      
      .comparison-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 0;
      }
      
      .comparison-arrow {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .offer-card-content {
        text-align: center;
      }
      
      .offer-card-amount {
        margin-bottom: 24px;
      }
      
      .amount-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--primary-color);
      }
      
      .amount-currency {
        font-size: 16px;
        color: var(--text-secondary);
        margin-left: 4px;
      }
      
      .offer-card-details {
        text-align: left;
      }
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--gray-100);
      }
      
      .detail-label {
        font-weight: 500;
        color: var(--text-secondary);
      }
      
      .detail-value {
        color: var(--text-primary);
        text-align: right;
        max-width: 60%;
      }
      
      .diff-highlights {
        background: var(--gray-50);
        border-radius: 12px;
        padding: 24px;
      }
      
      .diff-highlights h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
      }
      
      .diff-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border-radius: 8px;
        border: 1px solid var(--gray-200);
      }
      
      .diff-field {
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .diff-change {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .diff-old {
        color: var(--error);
        text-decoration: line-through;
      }
      
      .diff-new {
        color: var(--success);
        font-weight: 500;
      }
      
      .diff-arrow {
        color: var(--text-secondary);
      }
      
      .negotiation-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        border-top: 1px solid var(--gray-200);
        background: var(--gray-50);
      }
      
      .negotiation-stats {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: var(--text-secondary);
      }
      
      .footer-right {
        display: flex;
        gap: 12px;
      }
      
      .timeline-container {
        max-width: 800px;
        margin: 0 auto;
      }
      
      .timeline-item {
        display: flex;
        margin-bottom: 24px;
      }
      
      .timeline-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--primary-color);
        margin-right: 16px;
        margin-top: 6px;
        flex-shrink: 0;
      }
      
      .timeline-content-item {
        flex: 1;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
      }
      
      .timeline-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .timeline-user {
        font-weight: 600;
        color: var(--primary-color);
      }
      
      .timeline-date {
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .comment-input-section {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--gray-50);
        border-radius: 12px;
        border: 1px solid var(--gray-200);
      }
      
      .comment-form textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--gray-300);
        border-radius: 8px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .comment-form textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
      
      .comment-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
      }
      
      .comment-counter {
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .comment-item {
        border-left: 3px solid var(--info);
      }
      
      .history-item {
        border-left: 3px solid var(--primary-color);
      }
      
      .comment-marker {
        background: var(--info);
      }
      
      .history-marker {
        background: var(--primary-color);
      }
      
      .comment-content {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      
      .comment-author {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .comment-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--info);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }
      
      .comment-text {
        margin: 12px 0;
        line-height: 1.5;
        color: var(--text-primary);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .comment-edited {
        font-size: 12px;
        color: var(--text-muted);
        font-style: italic;
        margin-top: 8px;
      }
      
      .comment-actions {
        display: flex;
        gap: 4px;
      }
      
      .btn-icon {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .btn-icon:hover {
        background: var(--gray-100);
        color: var(--text-primary);
      }
      
      .btn-icon.btn-danger:hover {
        background: #fee2e2;
        color: var(--error);
      }
      
      .timeline-action {
        color: var(--text-muted);
        font-size: 14px;
        margin: 0 8px;
      }
      
      .timeline-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
      }
      
      .timeline-empty p:first-child {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
      }
      
      .timeline-empty p:last-child {
        font-size: 14px;
        margin: 0;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 24px;
      }
      
      .detail-section h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 18px;
      }
      
      .detail-item {
        margin-bottom: 16px;
      }
      
      .detail-item label {
        display: block;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      
      .platform-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .platform-tag {
        background: var(--primary-color);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .counter-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
      }
      
      .counter-modal-container {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .counter-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .counter-modal-body {
        padding: 24px;
      }
      
      .counter-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid var(--gray-200);
      }
      
      @media (max-width: 1024px) {
        .comparison-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .comparison-divider {
          order: 2;
        }
        
        .comparison-arrow {
          transform: rotate(90deg);
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .negotiation-modal {
          padding: 10px;
        }
        
        .negotiation-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        
        .negotiation-meta {
          justify-content: flex-start;
        }
        
        .negotiation-footer {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }
        
        .footer-right {
          justify-content: center;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Add version diff styles
   */
  addVersionDiffStyles() {
    if (document.getElementById('version-diff-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'version-diff-styles';
    styles.textContent = `
      .versions-container {
        max-width: 100%;
      }
      
      .versions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .versions-header h3 {
        margin: 0 0 4px 0;
        color: var(--text-primary);
      }
      
      .versions-header p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .versions-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .version-item {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        background: white;
      }
      
      .version-item.current-version {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.05);
      }
      
      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .version-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .version-number {
        font-weight: 600;
        color: var(--primary-color);
      }
      
      .version-user {
        padding: 2px 8px;
        background: var(--gray-100);
        border-radius: 12px;
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .version-date {
        font-size: 12px;
        color: var(--text-muted);
      }
      
      .version-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .current-badge {
        padding: 4px 8px;
        background: var(--success);
        color: white;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .version-changes {
        border-top: 1px solid var(--gray-100);
        padding-top: 12px;
      }
      
      .version-change {
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .change-field {
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .change-description {
        color: var(--text-secondary);
        margin-left: 8px;
      }
      
      .versions-empty,
      .versions-error {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
      }
      
      .versions-loading {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
      }
      
      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--gray-200);
        border-top: 2px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 12px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .version-diff-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }
      
      .version-diff-container {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 1000px;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .version-diff-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .version-diff-header h3 {
        margin: 0 0 4px 0;
        color: var(--text-primary);
      }
      
      .version-diff-header p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .version-diff-header button {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
      }
      
      .version-diff-body {
        padding: 24px;
      }
      
      .diff-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      
      .diff-column h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 18px;
      }
      
      .diff-content {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        background: var(--gray-50);
      }
      
      .version-diff-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid var(--gray-200);
      }
      
      @media (max-width: 768px) {
        .diff-grid {
          grid-template-columns: 1fr;
        }
        
        .version-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        
        .version-actions {
          align-self: flex-end;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize the offer negotiation manager
window.offerNegotiationManager = new OfferNegotiationManager();