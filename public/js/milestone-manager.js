/**
 * Milestone Management Interface
 * Handles milestone creation, editing, and tracking with 4-milestone limit
 */

class MilestoneManager {
  constructor() {
    this.milestones = [];
    this.dealId = null;
    this.maxMilestones = 4;
    this.isEditing = false;
    this.currentEditIndex = null;
    
    this.initialize();
  }

  initialize() {
    this.createMilestoneModal();
    this.bindEvents();
  }

  /**
   * Create milestone management modal
   */
  createMilestoneModal() {
    if (document.getElementById('milestone-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'milestone-modal';
    modal.className = 'milestone-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="milestone-modal-content">
        <div class="milestone-modal-header">
          <h2>Manage Milestones</h2>
          <button class="close-btn" onclick="window.milestoneManager.close()">&times;</button>
        </div>
        
        <div class="milestone-modal-body">
          <div class="milestone-info">
            <p>Define up to 4 milestones for this deal. Each milestone should have clear deliverables and payment terms.</p>
          </div>
          
          <div class="milestones-container" id="milestones-container">
            <!-- Milestones will be dynamically added here -->
          </div>
          
          <button class="add-milestone-btn" id="add-milestone-btn" onclick="window.milestoneManager.addMilestone()">
            + Add Milestone
          </button>
        </div>
        
        <div class="milestone-modal-footer">
          <button class="btn btn-secondary" onclick="window.milestoneManager.close()">Cancel</button>
          <button class="btn btn-primary" onclick="window.milestoneManager.save()">Save Milestones</button>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .milestone-modal {
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
      }

      .milestone-modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }

      .milestone-modal-header {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .milestone-modal-header h2 {
        margin: 0;
        font-size: 24px;
        color: #111827;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: #f3f4f6;
        color: #111827;
      }

      .milestone-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .milestone-info {
        background: #f3f4f6;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .milestone-info p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }

      .milestones-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .milestone-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        position: relative;
      }

      .milestone-item.editing {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .milestone-number {
        background: #6366f1;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .milestone-actions {
        display: flex;
        gap: 8px;
      }

      .milestone-btn {
        background: none;
        border: none;
        padding: 6px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .milestone-btn:hover {
        background: #e5e7eb;
        color: #111827;
      }

      .milestone-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-group.full-width {
        grid-column: 1 / -1;
      }

      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .form-group input,
      .form-group textarea {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .form-group textarea {
        min-height: 80px;
        resize: vertical;
      }

      .milestone-display {
        display: none;
      }

      .milestone-item:not(.editing) .milestone-display {
        display: block;
      }

      .milestone-item.editing .milestone-form {
        display: grid;
      }

      .milestone-item:not(.editing) .milestone-form {
        display: none;
      }

      .milestone-title {
        font-weight: 600;
        font-size: 16px;
        color: #111827;
        margin-bottom: 8px;
      }

      .milestone-details {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      .milestone-detail {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #6b7280;
      }

      .milestone-detail-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .milestone-description {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.5;
      }

      .add-milestone-btn {
        width: 100%;
        padding: 12px;
        border: 2px dashed #d1d5db;
        background: none;
        border-radius: 8px;
        color: #6b7280;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 16px;
      }

      .add-milestone-btn:hover {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.05);
        color: #6366f1;
      }

      .add-milestone-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .milestone-modal-footer {
        padding: 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .milestone-progress {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .progress-title {
        font-weight: 600;
        color: #111827;
      }

      .progress-stats {
        font-size: 14px;
        color: #6b7280;
      }

      .progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(to right, #6366f1, #ec4899);
        transition: width 0.3s ease;
      }

      .error-message {
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
      }

      /* Payment Status Indicators */
      .milestone-detail .payment-status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 4px;
        cursor: help;
      }

      .payment-status-indicator.status-pending {
        background: #d1d5db;
        border: 1px solid #9ca3af;
      }

      .payment-status-indicator.status-in-progress {
        background: #f59e0b;
        border: 1px solid #d97706;
        animation: pulse-progress 2s infinite;
      }

      .payment-status-indicator.status-ready {
        background: #10b981;
        border: 1px solid #059669;
        animation: pulse-ready 2s infinite;
      }

      .payment-status-indicator.status-released {
        background: #6366f1;
        border: 1px solid #4f46e5;
      }

      .payment-status-indicator.status-paid {
        background: #059669;
        border: 1px solid #047857;
        box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
      }

      .payment-status-indicator.status-disputed {
        background: #ef4444;
        border: 1px solid #dc2626;
        animation: pulse-alert 1.5s infinite;
      }

      .payment-status-indicator.status-held {
        background: #f59e0b;
        border: 1px solid #d97706;
        animation: pulse-warning 2s infinite;
      }

      @keyframes pulse-progress {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes pulse-ready {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        50% { 
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3);
        }
      }

      @keyframes pulse-alert {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
        }
        50% { 
          transform: scale(1.2);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.5);
        }
      }

      @keyframes pulse-warning {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @media (max-width: 640px) {
        .milestone-form {
          grid-template-columns: 1fr;
        }
        
        .milestone-details {
          flex-direction: column;
          gap: 8px;
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
    const modal = document.getElementById('milestone-modal');
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
   * Open milestone manager for a deal
   */
  async open(dealId) {
    this.dealId = dealId;
    const modal = document.getElementById('milestone-modal');
    modal.style.display = 'flex';

    // Load existing milestones
    await this.loadMilestones();
  }

  /**
   * Load milestones from API
   */
  async loadMilestones() {
    try {
      const response = await window.axeesAPI.getMilestones(this.dealId);
      if (response.success) {
        this.milestones = response.milestones || [];
        this.renderMilestones();
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
      this.milestones = [];
      this.renderMilestones();
    }
  }

  /**
   * Render milestones
   */
  renderMilestones() {
    const container = document.getElementById('milestones-container');
    container.innerHTML = '';

    this.milestones.forEach((milestone, index) => {
      const milestoneEl = this.createMilestoneElement(milestone, index);
      container.appendChild(milestoneEl);
    });

    // Update add button state
    const addBtn = document.getElementById('add-milestone-btn');
    addBtn.disabled = this.milestones.length >= this.maxMilestones;
    if (this.milestones.length >= this.maxMilestones) {
      addBtn.textContent = `Maximum ${this.maxMilestones} milestones reached`;
    } else {
      addBtn.textContent = `+ Add Milestone (${this.milestones.length}/${this.maxMilestones})`;
    }

    // Update progress
    this.updateProgress();
  }

  /**
   * Create milestone element
   */
  createMilestoneElement(milestone, index) {
    const div = document.createElement('div');
    div.className = 'milestone-item';
    div.dataset.index = index;

    const isNew = !milestone._id;
    const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '';

    div.innerHTML = `
      <div class="milestone-header">
        <div class="milestone-number">${index + 1}</div>
        <div class="milestone-actions">
          <button class="milestone-btn" onclick="window.milestoneManager.editMilestone(${index})" title="Edit">
            ✏️
          </button>
          <button class="milestone-btn" onclick="window.milestoneManager.deleteMilestone(${index})" title="Delete">
            🗑️
          </button>
        </div>
      </div>

      <div class="milestone-display">
        <h3 class="milestone-title">${milestone.title || 'Untitled Milestone'}</h3>
        <div class="milestone-details">
          <div class="milestone-detail">
            <span class="milestone-detail-icon">💰</span>
            <span>$${milestone.amount || 0}</span>
          </div>
          <div class="milestone-detail">
            <span class="milestone-detail-icon">📅</span>
            <span>${milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}</span>
          </div>
          <div class="milestone-detail">
            <span class="milestone-detail-icon">📊</span>
            <span>${this.getStatusLabel(milestone.status)}</span>
          </div>
          <div class="milestone-detail">
            <span class="milestone-detail-icon">💳</span>
            <span>${this.getPaymentStatusLabel(milestone)}</span>
            <div class="payment-status-indicator ${this.getPaymentStatusClass(milestone)}" title="${this.getPaymentStatusTitle(milestone)}"></div>
          </div>
        </div>
        <p class="milestone-description">${milestone.description || 'No description provided'}</p>
      </div>

      <form class="milestone-form" onsubmit="return false;">
        <div class="form-group">
          <label>Title*</label>
          <input type="text" name="title" value="${milestone.title || ''}" placeholder="e.g., Initial Design Concepts" required>
        </div>
        
        <div class="form-group">
          <label>Amount ($)*</label>
          <input type="number" name="amount" value="${milestone.amount || ''}" placeholder="0" min="0" step="0.01" required>
        </div>
        
        <div class="form-group">
          <label>Due Date*</label>
          <input type="date" name="dueDate" value="${dueDate}" required>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <option value="pending" ${milestone.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in_progress" ${milestone.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${milestone.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="paid" ${milestone.status === 'paid' ? 'selected' : ''}>Paid</option>
          </select>
        </div>
        
        <div class="form-group full-width">
          <label>Description*</label>
          <textarea name="description" placeholder="Describe the deliverables and requirements for this milestone" required>${milestone.description || ''}</textarea>
        </div>
        
        <div class="form-group full-width">
          <label>Deliverables</label>
          <textarea name="deliverables" placeholder="List specific deliverables (one per line)">${milestone.deliverables ? milestone.deliverables.join('\n') : ''}</textarea>
        </div>
      </form>
    `;

    if (isNew || (this.isEditing && this.currentEditIndex === index)) {
      div.classList.add('editing');
    }

    return div;
  }

  /**
   * Add new milestone
   */
  addMilestone() {
    if (this.milestones.length >= this.maxMilestones) {
      alert(`You can only create up to ${this.maxMilestones} milestones per deal.`);
      return;
    }

    const newMilestone = {
      title: '',
      description: '',
      amount: 0,
      dueDate: null,
      status: 'pending',
      deliverables: []
    };

    this.milestones.push(newMilestone);
    this.isEditing = true;
    this.currentEditIndex = this.milestones.length - 1;
    this.renderMilestones();
  }

  /**
   * Edit milestone
   */
  editMilestone(index) {
    const items = document.querySelectorAll('.milestone-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('editing');
      } else {
        item.classList.remove('editing');
      }
    });
    
    this.isEditing = true;
    this.currentEditIndex = index;
  }

  /**
   * Delete milestone
   */
  deleteMilestone(index) {
    if (confirm('Are you sure you want to delete this milestone?')) {
      this.milestones.splice(index, 1);
      this.renderMilestones();
    }
  }

  /**
   * Save milestones
   */
  async save() {
    // Validate all milestones
    const items = document.querySelectorAll('.milestone-item');
    const updatedMilestones = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const form = item.querySelector('form');
      
      if (item.classList.contains('editing')) {
        // Get form data
        const formData = new FormData(form);
        
        // Validate required fields
        if (!formData.get('title') || !formData.get('amount') || !formData.get('dueDate') || !formData.get('description')) {
          alert(`Please fill in all required fields for milestone ${i + 1}`);
          return;
        }

        // Update milestone data
        this.milestones[i] = {
          ...this.milestones[i],
          title: formData.get('title'),
          amount: parseFloat(formData.get('amount')),
          dueDate: formData.get('dueDate'),
          status: formData.get('status'),
          description: formData.get('description'),
          deliverables: formData.get('deliverables').split('\n').filter(d => d.trim())
        };
      }
      
      updatedMilestones.push(this.milestones[i]);
    }

    // Save to API
    try {
      const response = await window.axeesAPI.updateMilestones(this.dealId, updatedMilestones);
      if (response.success) {
        this.showSuccess('Milestones saved successfully!');
        this.close();
      } else {
        throw new Error(response.message || 'Failed to save milestones');
      }
    } catch (error) {
      console.error('Failed to save milestones:', error);
      alert('Failed to save milestones. Please try again.');
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const completedCount = this.milestones.filter(m => m.status === 'completed' || m.status === 'paid').length;
    const totalAmount = this.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const completedAmount = this.milestones
      .filter(m => m.status === 'completed' || m.status === 'paid')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const progressPercent = this.milestones.length > 0 ? (completedCount / this.milestones.length) * 100 : 0;

    // Add progress display if not exists
    let progressEl = document.querySelector('.milestone-progress');
    if (!progressEl && this.milestones.length > 0) {
      progressEl = document.createElement('div');
      progressEl.className = 'milestone-progress';
      document.querySelector('.milestone-modal-body').appendChild(progressEl);
    }

    if (progressEl) {
      progressEl.innerHTML = `
        <div class="progress-header">
          <div class="progress-title">Overall Progress</div>
          <div class="progress-stats">${completedCount}/${this.milestones.length} completed • $${completedAmount.toLocaleString()} of $${totalAmount.toLocaleString()}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      `;
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    const labels = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'paid': 'Paid'
    };
    return labels[status] || status;
  }

  /**
   * Get payment status label for a milestone
   */
  getPaymentStatusLabel(milestone) {
    if (!milestone) return 'Unknown';
    
    if (milestone.status === 'paid') return 'Paid';
    if (milestone.status === 'completed' && milestone.paymentReleased) return 'Released';
    if (milestone.status === 'completed' && !milestone.paymentReleased) return 'Ready';
    if (milestone.status === 'in_progress') return 'Held';
    if (milestone.paymentDisputed) return 'Disputed';
    if (milestone.paymentHeld) return 'Held';
    
    return 'Pending';
  }

  /**
   * Get payment status CSS class for a milestone
   */
  getPaymentStatusClass(milestone) {
    if (!milestone) return 'status-pending';
    
    if (milestone.status === 'paid') return 'status-paid';
    if (milestone.status === 'completed' && milestone.paymentReleased) return 'status-released';
    if (milestone.status === 'completed' && !milestone.paymentReleased) return 'status-ready';
    if (milestone.status === 'in_progress') return 'status-in-progress';
    if (milestone.paymentDisputed) return 'status-disputed';
    if (milestone.paymentHeld) return 'status-held';
    
    return 'status-pending';
  }

  /**
   * Get payment status title text for a milestone
   */
  getPaymentStatusTitle(milestone) {
    if (!milestone) return 'Payment Status Unknown';
    
    if (milestone.status === 'paid') return 'Payment Complete - Milestone fully paid';
    if (milestone.status === 'completed' && milestone.paymentReleased) return 'Payment Released - Funds released to creator';
    if (milestone.status === 'completed' && !milestone.paymentReleased) return 'Payment Ready - Milestone completed, awaiting release';
    if (milestone.status === 'in_progress') return 'Payment Held - Work in progress';
    if (milestone.paymentDisputed) return 'Payment Disputed - Under review';
    if (milestone.paymentHeld) return 'Payment Held - Manual review required';
    
    return 'Payment Pending - Milestone not started';
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.showNotification) {
      window.showNotification(message, 'success');
    }
  }

  /**
   * Close modal
   */
  close() {
    const modal = document.getElementById('milestone-modal');
    modal.style.display = 'none';
    this.reset();
  }

  /**
   * Reset state
   */
  reset() {
    this.milestones = [];
    this.dealId = null;
    this.isEditing = false;
    this.currentEditIndex = null;
  }
}

// Initialize milestone manager
window.milestoneManager = new MilestoneManager();