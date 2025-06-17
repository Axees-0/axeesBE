/**
 * Milestone Timeline Visualization
 * Visual representation of milestone progress and timeline
 */

class MilestoneTimeline {
  constructor(containerId) {
    this.containerId = containerId;
    this.milestones = [];
    this.dealId = null;
    
    this.initialize();
  }

  initialize() {
    this.injectStyles();
  }

  /**
   * Inject required styles
   */
  injectStyles() {
    if (document.getElementById('milestone-timeline-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'milestone-timeline-styles';
    styles.textContent = `
      .milestone-timeline {
        padding: 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .timeline-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .timeline-actions {
        display: flex;
        gap: 12px;
      }

      .timeline-view-toggle {
        display: flex;
        background: #f3f4f6;
        border-radius: 8px;
        padding: 2px;
      }

      .view-toggle-btn {
        padding: 6px 12px;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
      }

      .view-toggle-btn.active {
        background: white;
        color: #111827;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .timeline-progress-summary {
        background: linear-gradient(135deg, #6366f1, #ec4899);
        border-radius: 12px;
        padding: 20px;
        color: white;
        margin-bottom: 24px;
      }

      .progress-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }

      .progress-summary-item {
        text-align: center;
      }

      .progress-summary-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .progress-summary-label {
        font-size: 14px;
        opacity: 0.9;
      }

      .timeline-container {
        position: relative;
        padding: 20px 0;
      }

      /* Linear Timeline View */
      .timeline-linear {
        position: relative;
      }

      .timeline-line {
        position: absolute;
        left: 30px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e5e7eb;
      }

      .timeline-item {
        position: relative;
        padding-left: 60px;
        padding-bottom: 40px;
      }

      .timeline-item:last-child {
        padding-bottom: 0;
      }

      .timeline-marker {
        position: absolute;
        left: 20px;
        top: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s;
      }

      .timeline-item.completed .timeline-marker {
        background: #10b981;
        border-color: #10b981;
        color: white;
      }

      .timeline-item.in-progress .timeline-marker {
        background: #f59e0b;
        border-color: #f59e0b;
        color: white;
      }

      .timeline-item.paid .timeline-marker {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
      }

      .timeline-content {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        cursor: pointer;
        transition: all 0.2s;
      }

      .timeline-content:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .timeline-content::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 16px;
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-right: 8px solid #e5e7eb;
      }

      .timeline-content-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 12px;
      }

      .timeline-milestone-title {
        font-weight: 600;
        font-size: 16px;
        color: #111827;
        margin: 0;
      }

      .timeline-milestone-amount {
        font-weight: 600;
        color: #10b981;
        font-size: 16px;
      }

      .timeline-milestone-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #6b7280;
      }

      .timeline-milestone-description {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .timeline-milestone-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
      }

      .milestone-progress-bar {
        flex: 1;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }

      .milestone-progress-fill {
        height: 100%;
        background: linear-gradient(to right, #6366f1, #ec4899);
        transition: width 0.3s ease;
      }

      .milestone-progress-text {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        min-width: 40px;
      }

      /* Calendar View */
      .timeline-calendar {
        display: none;
      }

      .timeline-calendar.active {
        display: block;
      }

      .timeline-linear.hidden {
        display: none;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        margin-bottom: 24px;
      }

      .calendar-header-cell {
        text-align: center;
        font-weight: 600;
        font-size: 12px;
        color: #6b7280;
        padding: 8px 0;
      }

      .calendar-day {
        aspect-ratio: 1;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px;
        font-size: 12px;
        position: relative;
        background: white;
        transition: all 0.2s;
      }

      .calendar-day:hover {
        background: #f9fafb;
      }

      .calendar-day.other-month {
        color: #d1d5db;
      }

      .calendar-day.today {
        background: #f3f4f6;
        font-weight: 600;
      }

      .calendar-day.has-milestone {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.05);
      }

      .calendar-milestone-indicator {
        position: absolute;
        bottom: 4px;
        left: 4px;
        right: 4px;
        height: 4px;
        background: #6366f1;
        border-radius: 2px;
      }

      .calendar-milestone-indicator.completed {
        background: #10b981;
      }

      .calendar-milestone-indicator.in-progress {
        background: #f59e0b;
      }

      /* Milestone Details */
      .timeline-details {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .milestone-deliverables {
        margin-top: 12px;
      }

      .deliverable-item {
        display: flex;
        align-items: start;
        gap: 8px;
        padding: 8px 0;
        font-size: 14px;
        color: #4b5563;
      }

      .deliverable-check {
        width: 16px;
        height: 16px;
        border: 2px solid #d1d5db;
        border-radius: 4px;
        flex-shrink: 0;
        margin-top: 2px;
        position: relative;
      }

      .deliverable-item.completed .deliverable-check {
        background: #10b981;
        border-color: #10b981;
      }

      .deliverable-item.completed .deliverable-check::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: white;
        font-size: 12px;
      }

      /* Status badge */
      .milestone-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .milestone-status-badge.pending {
        background: #f3f4f6;
        color: #6b7280;
      }

      .milestone-status-badge.in-progress {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }

      .milestone-status-badge.completed {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }

      .milestone-status-badge.paid {
        background: rgba(99, 102, 241, 0.1);
        color: #6366f1;
      }

      /* Empty state */
      .timeline-empty {
        text-align: center;
        padding: 60px 20px;
      }

      .timeline-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .timeline-empty-text {
        color: #6b7280;
        font-size: 16px;
        margin-bottom: 16px;
      }

      @media (max-width: 640px) {
        .progress-summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .timeline-content-header {
          flex-direction: column;
          gap: 8px;
        }
        
        .timeline-milestone-meta {
          flex-direction: column;
          gap: 4px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Render timeline for a deal
   */
  async render(dealId) {
    this.dealId = dealId;
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading milestones...</div>';

    try {
      const response = await window.axeesAPI.getMilestones(dealId);
      if (response.success) {
        this.milestones = response.milestones || [];
        this.renderTimeline(container);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
      container.innerHTML = '<div class="error">Failed to load milestones</div>';
    }
  }

  /**
   * Render the complete timeline
   */
  renderTimeline(container) {
    const completedCount = this.milestones.filter(m => m.status === 'completed' || m.status === 'paid').length;
    const totalAmount = this.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const paidAmount = this.milestones
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    container.className = 'milestone-timeline';
    container.innerHTML = `
      <div class="timeline-header">
        <h3 class="timeline-title">Milestone Timeline</h3>
        <div class="timeline-actions">
          <div class="timeline-view-toggle">
            <button class="view-toggle-btn active" onclick="window.milestoneTimeline.switchView('linear')">Timeline</button>
            <button class="view-toggle-btn" onclick="window.milestoneTimeline.switchView('calendar')">Calendar</button>
          </div>
          <button class="btn btn-primary" onclick="window.milestoneManager.open('${this.dealId}')">
            Manage Milestones
          </button>
        </div>
      </div>

      <div class="timeline-progress-summary">
        <div class="progress-summary-grid">
          <div class="progress-summary-item">
            <div class="progress-summary-value">${this.milestones.length}</div>
            <div class="progress-summary-label">Total Milestones</div>
          </div>
          <div class="progress-summary-item">
            <div class="progress-summary-value">${completedCount}</div>
            <div class="progress-summary-label">Completed</div>
          </div>
          <div class="progress-summary-item">
            <div class="progress-summary-value">$${totalAmount.toLocaleString()}</div>
            <div class="progress-summary-label">Total Value</div>
          </div>
          <div class="progress-summary-item">
            <div class="progress-summary-value">$${paidAmount.toLocaleString()}</div>
            <div class="progress-summary-label">Paid Out</div>
          </div>
        </div>
      </div>

      <div class="timeline-container">
        ${this.milestones.length > 0 ? this.renderLinearTimeline() : this.renderEmptyState()}
        ${this.renderCalendarView()}
      </div>
    `;

    // Initialize calendar if needed
    this.initializeCalendar();
  }

  /**
   * Render linear timeline view
   */
  renderLinearTimeline() {
    return `
      <div class="timeline-linear">
        <div class="timeline-line"></div>
        ${this.milestones.map((milestone, index) => this.renderTimelineItem(milestone, index)).join('')}
      </div>
    `;
  }

  /**
   * Render single timeline item
   */
  renderTimelineItem(milestone, index) {
    const statusClass = milestone.status ? milestone.status.replace('_', '-') : 'pending';
    const progress = this.calculateMilestoneProgress(milestone);
    
    return `
      <div class="timeline-item ${statusClass}">
        <div class="timeline-marker">${this.getStatusIcon(milestone.status)}</div>
        <div class="timeline-content" onclick="window.milestoneTimeline.showDetails('${milestone._id}')">
          <div class="timeline-content-header">
            <h4 class="timeline-milestone-title">${milestone.title || `Milestone ${index + 1}`}</h4>
            <span class="timeline-milestone-amount">$${(milestone.amount || 0).toLocaleString()}</span>
          </div>
          
          <div class="timeline-milestone-meta">
            <span>📅 ${this.formatDate(milestone.dueDate)}</span>
            <span class="milestone-status-badge ${statusClass}">
              ${this.getStatusLabel(milestone.status)}
            </span>
          </div>
          
          <p class="timeline-milestone-description">${milestone.description || 'No description'}</p>
          
          <div class="timeline-milestone-progress">
            <div class="milestone-progress-bar">
              <div class="milestone-progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="milestone-progress-text">${progress}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render calendar view
   */
  renderCalendarView() {
    return `
      <div class="timeline-calendar" id="timeline-calendar">
        <!-- Calendar will be rendered here -->
      </div>
    `;
  }

  /**
   * Initialize calendar
   */
  initializeCalendar() {
    const calendarEl = document.getElementById('timeline-calendar');
    if (!calendarEl) return;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarEl.innerHTML = this.generateCalendarMonth(year, month);
  }

  /**
   * Generate calendar month
   */
  generateCalendarMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = `
      <h4 style="text-align: center; margin-bottom: 16px;">${monthNames[month]} ${year}</h4>
      <div class="calendar-grid">
        ${dayNames.map(day => `<div class="calendar-header-cell">${day}</div>`).join('')}
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-day other-month"></div>';
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const milestone = this.getMilestoneForDate(date);
      
      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${milestone ? 'has-milestone' : ''}">
          ${day}
          ${milestone ? `<div class="calendar-milestone-indicator ${milestone.status}"></div>` : ''}
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Get milestone for specific date
   */
  getMilestoneForDate(date) {
    return this.milestones.find(m => {
      if (!m.dueDate) return false;
      const milestoneDate = new Date(m.dueDate);
      return milestoneDate.toDateString() === date.toDateString();
    });
  }

  /**
   * Switch view between linear and calendar
   */
  switchView(view) {
    const linearView = document.querySelector('.timeline-linear');
    const calendarView = document.querySelector('.timeline-calendar');
    const toggleBtns = document.querySelectorAll('.view-toggle-btn');

    toggleBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase().includes(view)) {
        btn.classList.add('active');
      }
    });

    if (view === 'calendar') {
      linearView.classList.add('hidden');
      calendarView.classList.add('active');
    } else {
      linearView.classList.remove('hidden');
      calendarView.classList.remove('active');
    }
  }

  /**
   * Show milestone details
   */
  showDetails(milestoneId) {
    const milestone = this.milestones.find(m => m._id === milestoneId);
    if (!milestone) return;

    // For now, just console log - could open a modal or expand inline
    console.log('Milestone details:', milestone);
    
    // You could emit an event or open a modal here
    if (window.milestoneDetailModal) {
      window.milestoneDetailModal.show(milestone);
    }
  }

  /**
   * Calculate milestone progress
   */
  calculateMilestoneProgress(milestone) {
    switch (milestone.status) {
      case 'paid':
        return 100;
      case 'completed':
        return 90;
      case 'in_progress':
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    const icons = {
      'pending': '○',
      'in_progress': '◐',
      'completed': '✓',
      'paid': '✓'
    };
    return icons[status] || '○';
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
    return labels[status] || 'Pending';
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="timeline-empty">
        <div class="timeline-empty-icon">📋</div>
        <div class="timeline-empty-text">No milestones created yet</div>
        <button class="btn btn-primary" onclick="window.milestoneManager.open('${this.dealId}')">
          Create Milestones
        </button>
      </div>
    `;
  }
}

// Initialize global instance
window.milestoneTimeline = new MilestoneTimeline('milestone-timeline-container');