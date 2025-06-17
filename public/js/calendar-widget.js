/**
 * Calendar Widget Component
 * Reusable calendar for milestone dates and other date-based features
 */

class CalendarWidget {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      showWeekNumbers: false,
      allowSelection: true,
      multiSelect: false,
      minDate: null,
      maxDate: null,
      highlightToday: true,
      showNavigation: true,
      allowEventCreation: true,
      allowEventEditing: true,
      showPaymentSchedules: true,
      onDateSelect: null,
      onMonthChange: null,
      onEventCreate: null,
      onEventEdit: null,
      ...options
    };
    
    this.currentDate = new Date();
    this.selectedDates = [];
    this.events = new Map(); // date string -> event data
    
    this.initialize();
  }

  initialize() {
    this.injectStyles();
    this.render();
    this.bindEvents();
    
    // Load payment schedules if enabled
    if (this.options.showPaymentSchedules) {
      this.loadPaymentSchedules();
    }
  }

  /**
   * Inject required styles
   */
  injectStyles() {
    if (document.getElementById('calendar-widget-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'calendar-widget-styles';
    styles.textContent = `
      .calendar-widget {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .calendar-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .calendar-nav {
        display: flex;
        gap: 8px;
      }

      .calendar-nav-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .calendar-nav-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      .calendar-nav-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }

      .calendar-weekday {
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        padding: 8px 0;
        text-transform: uppercase;
      }

      .calendar-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.2s;
        min-height: 40px;
      }

      .calendar-cell:hover:not(.disabled):not(.selected) {
        background: #f3f4f6;
      }

      .calendar-cell.other-month {
        color: #d1d5db;
      }

      .calendar-cell.today {
        font-weight: 600;
        border-color: #6366f1;
        color: #6366f1;
      }

      .calendar-cell.selected {
        background: #6366f1;
        color: white;
        font-weight: 600;
      }

      .calendar-cell.disabled {
        color: #e5e7eb;
        cursor: not-allowed;
      }

      .calendar-cell.has-event {
        font-weight: 600;
      }

      .calendar-event-indicator {
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 2px;
      }

      .event-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #6366f1;
      }

      .event-dot.milestone {
        background: #10b981;
      }

      .event-dot.deadline {
        background: #ef4444;
      }

      .event-dot.meeting {
        background: #f59e0b;
      }

      .event-dot.payment {
        background: #10b981;
      }

      .calendar-month-selector {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .month-year-select {
        padding: 6px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        color: #111827;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .month-year-select:hover {
        border-color: #d1d5db;
      }

      .month-year-select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      /* Mini Calendar View */
      .calendar-widget.mini {
        padding: 12px;
      }

      .calendar-widget.mini .calendar-header {
        margin-bottom: 12px;
      }

      .calendar-widget.mini .calendar-title {
        font-size: 14px;
      }

      .calendar-widget.mini .calendar-nav-btn {
        width: 24px;
        height: 24px;
        font-size: 12px;
      }

      .calendar-widget.mini .calendar-cell {
        font-size: 12px;
        min-height: 28px;
      }

      .calendar-widget.mini .calendar-weekday {
        font-size: 10px;
        padding: 4px 0;
      }

      /* Event Tooltip */
      .calendar-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .calendar-tooltip.visible {
        opacity: 1;
      }

      .calendar-tooltip::before {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #1f2937;
      }

      /* Week Numbers */
      .calendar-grid.with-week-numbers {
        grid-template-columns: auto repeat(7, 1fr);
      }

      .calendar-week-number {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: #9ca3af;
        font-weight: 500;
        min-width: 24px;
      }

      /* Date Range Selection */
      .calendar-cell.in-range {
        background: rgba(99, 102, 241, 0.1);
      }

      .calendar-cell.range-start {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      .calendar-cell.range-end {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      /* Quick Actions */
      .calendar-quick-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
      }

      .quick-action-btn {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 6px;
        font-size: 12px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
      }

      .quick-action-btn:hover {
        background: #f3f4f6;
        color: #111827;
      }

      @media (max-width: 640px) {
        .calendar-widget {
          padding: 16px;
        }
        
        .calendar-cell {
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Render the calendar
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    container.className = `calendar-widget ${this.options.mini ? 'mini' : ''}`;
    container.innerHTML = `
      ${this.options.showNavigation ? this.renderHeader(year, month) : ''}
      ${this.renderCalendar(year, month)}
      ${this.options.showQuickActions ? this.renderQuickActions() : ''}
    `;

    // Create tooltip element
    if (!document.getElementById('calendar-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'calendar-tooltip';
      tooltip.className = 'calendar-tooltip';
      document.body.appendChild(tooltip);
    }
  }

  /**
   * Render calendar header
   */
  renderHeader(year, month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    return `
      <div class="calendar-header">
        <div class="calendar-month-selector">
          <select class="month-year-select" id="${this.containerId}-month-select">
            ${monthNames.map((name, i) => 
              `<option value="${i}" ${i === month ? 'selected' : ''}>${name}</option>`
            ).join('')}
          </select>
          <select class="month-year-select" id="${this.containerId}-year-select">
            ${this.generateYearOptions(year)}
          </select>
        </div>
        <div class="calendar-nav">
          <button class="calendar-nav-btn" onclick="window.calendarWidget.previousMonth('${this.containerId}')">
            ←
          </button>
          <button class="calendar-nav-btn" onclick="window.calendarWidget.today('${this.containerId}')">
            Today
          </button>
          <button class="calendar-nav-btn" onclick="window.calendarWidget.nextMonth('${this.containerId}')">
            →
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate year options for select
   */
  generateYearOptions(currentYear) {
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    let options = '';
    
    for (let year = startYear; year <= endYear; year++) {
      options += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
    
    return options;
  }

  /**
   * Render calendar grid
   */
  renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let html = `<div class="calendar-grid ${this.options.showWeekNumbers ? 'with-week-numbers' : ''}">`;
    
    // Week day headers
    if (this.options.showWeekNumbers) {
      html += '<div class="calendar-week-number"></div>';
    }
    dayNames.forEach(day => {
      html += `<div class="calendar-weekday">${day.substr(0, 3)}</div>`;
    });

    // Add empty cells for days before month starts
    let weekNumber = this.getWeekNumber(firstDay);
    if (this.options.showWeekNumbers) {
      html += `<div class="calendar-week-number">${weekNumber}</div>`;
    }
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      html += this.renderCalendarCell(prevMonthDay, true);
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Add week number at start of week
      if (date.getDay() === 0 && this.options.showWeekNumbers) {
        weekNumber = this.getWeekNumber(date);
        html += `<div class="calendar-week-number">${weekNumber}</div>`;
      }
      
      html += this.renderCalendarCell(date, false);
    }

    // Add days from next month to complete the grid
    const remainingCells = 42 - (startingDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      
      // Add week number at start of week
      if (nextMonthDay.getDay() === 0 && this.options.showWeekNumbers) {
        weekNumber = this.getWeekNumber(nextMonthDay);
        html += `<div class="calendar-week-number">${weekNumber}</div>`;
      }
      
      html += this.renderCalendarCell(nextMonthDay, true);
    }

    html += '</div>';
    return html;
  }

  /**
   * Render individual calendar cell
   */
  renderCalendarCell(date, isOtherMonth) {
    const dateStr = this.formatDateString(date);
    const isToday = this.isToday(date);
    const isSelected = this.isSelected(date);
    const isDisabled = this.isDisabled(date);
    const events = this.events.get(dateStr) || [];
    
    let classes = ['calendar-cell'];
    if (isOtherMonth) classes.push('other-month');
    if (isToday && this.options.highlightToday) classes.push('today');
    if (isSelected) classes.push('selected');
    if (isDisabled) classes.push('disabled');
    if (events.length > 0) classes.push('has-event');

    return `
      <div class="${classes.join(' ')}" 
           data-date="${dateStr}"
           ${!isDisabled && this.options.allowSelection ? `onclick="window.calendarWidget.selectDate('${this.containerId}', '${dateStr}')"` : ''}
           ${!isDisabled && this.options.allowEventCreation ? `ondblclick="window.calendarWidget.createEvent('${this.containerId}', '${dateStr}')"` : ''}
           ${events.length > 0 ? `onmouseenter="window.calendarWidget.showTooltip(event, '${dateStr}')" onmouseleave="window.calendarWidget.hideTooltip()"` : ''}>
        ${date.getDate()}
        ${events.length > 0 ? this.renderEventIndicators(events) : ''}
      </div>
    `;
  }

  /**
   * Render event indicators
   */
  renderEventIndicators(events) {
    const maxDots = 3;
    const displayEvents = events.slice(0, maxDots);
    
    return `
      <div class="calendar-event-indicator">
        ${displayEvents.map(event => 
          `<div class="event-dot ${event.type || ''}"></div>`
        ).join('')}
      </div>
    `;
  }

  /**
   * Render quick actions
   */
  renderQuickActions() {
    return `
      <div class="calendar-quick-actions">
        <button class="quick-action-btn" onclick="window.calendarWidget.today('${this.containerId}')">
          Today
        </button>
        <button class="quick-action-btn" onclick="window.calendarWidget.clearSelection('${this.containerId}')">
          Clear
        </button>
      </div>
    `;
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Month/Year selectors
    const monthSelect = document.getElementById(`${this.containerId}-month-select`);
    const yearSelect = document.getElementById(`${this.containerId}-year-select`);
    
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.currentDate.setMonth(parseInt(e.target.value));
        this.render();
        if (this.options.onMonthChange) {
          this.options.onMonthChange(this.currentDate);
        }
      });
    }
    
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.currentDate.setFullYear(parseInt(e.target.value));
        this.render();
        if (this.options.onMonthChange) {
          this.options.onMonthChange(this.currentDate);
        }
      });
    }
  }

  /**
   * Navigate to previous month
   */
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentDate);
    }
  }

  /**
   * Navigate to next month
   */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentDate);
    }
  }

  /**
   * Navigate to today
   */
  today() {
    this.currentDate = new Date();
    this.render();
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentDate);
    }
  }

  /**
   * Select a date
   */
  selectDate(dateStr) {
    if (!this.options.allowSelection) return;
    
    const date = new Date(dateStr);
    if (this.isDisabled(date)) return;

    if (this.options.multiSelect) {
      const index = this.selectedDates.findIndex(d => this.formatDateString(d) === dateStr);
      if (index > -1) {
        this.selectedDates.splice(index, 1);
      } else {
        this.selectedDates.push(date);
      }
    } else {
      this.selectedDates = [date];
    }

    this.render();
    
    if (this.options.onDateSelect) {
      this.options.onDateSelect(this.options.multiSelect ? this.selectedDates : date);
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedDates = [];
    this.render();
  }

  /**
   * Add events to calendar
   */
  addEvents(events) {
    events.forEach(event => {
      const dateStr = this.formatDateString(new Date(event.date));
      if (!this.events.has(dateStr)) {
        this.events.set(dateStr, []);
      }
      this.events.get(dateStr).push(event);
    });
    this.render();
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events.clear();
    this.render();
  }

  /**
   * Show tooltip for events
   */
  showTooltip(event, dateStr) {
    const events = this.events.get(dateStr);
    if (!events || events.length === 0) return;

    const tooltip = document.getElementById('calendar-tooltip');
    const eventNames = events.map(e => e.title || e.name).join(', ');
    
    tooltip.textContent = eventNames;
    tooltip.classList.add('visible');
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('calendar-tooltip');
    tooltip.classList.remove('visible');
  }

  /**
   * Utility methods
   */
  formatDateString(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Create event on double-click
   */
  async createEvent(dateStr) {
    if (!this.options.allowEventCreation) return;

    const eventData = {
      title: prompt('Event title:'),
      date: dateStr,
      type: 'custom'
    };

    if (!eventData.title) return;

    try {
      const response = await window.axeesAPI.createCalendarEvent(eventData);
      if (response.success) {
        this.addEvents([eventData]);
        if (this.options.onEventCreate) {
          this.options.onEventCreate(eventData);
        }
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  }

  /**
   * Edit existing event
   */
  async editEvent(eventId, eventData) {
    if (!this.options.allowEventEditing) return;

    const newTitle = prompt('Edit event title:', eventData.title);
    if (!newTitle || newTitle === eventData.title) return;

    try {
      const updatedData = { ...eventData, title: newTitle };
      const response = await window.axeesAPI.updateCalendarEvent(eventId, updatedData);
      
      if (response.success) {
        // Update local event data
        const dateStr = this.formatDateString(new Date(eventData.date));
        const dayEvents = this.events.get(dateStr) || [];
        const eventIndex = dayEvents.findIndex(e => e.id === eventId);
        if (eventIndex > -1) {
          dayEvents[eventIndex] = updatedData;
          this.render();
        }
        
        if (this.options.onEventEdit) {
          this.options.onEventEdit(updatedData);
        }
      }
    } catch (error) {
      console.error('Failed to edit event:', error);
      alert('Failed to edit event');
    }
  }

  /**
   * Load payment schedules
   */
  async loadPaymentSchedules() {
    if (!this.options.showPaymentSchedules) return;

    try {
      // Load payment schedules from active deals
      const response = await window.axeesAPI.getDeals();
      if (response.success && response.deals) {
        const paymentEvents = [];
        
        response.deals.forEach(deal => {
          if (deal.milestones) {
            deal.milestones.forEach(milestone => {
              if (milestone.dueDate) {
                paymentEvents.push({
                  id: `payment-${milestone._id}`,
                  title: `Payment Due: ${milestone.title || 'Milestone'}`,
                  date: milestone.dueDate,
                  type: 'payment',
                  amount: milestone.amount,
                  dealId: deal._id
                });
              }
            });
          }
        });
        
        this.addEvents(paymentEvents);
      }
    } catch (error) {
      console.error('Failed to load payment schedules:', error);
    }
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date) {
    const dateStr = this.formatDateString(date);
    return this.selectedDates.some(d => this.formatDateString(d) === dateStr);
  }

  isDisabled(date) {
    if (this.options.minDate && date < this.options.minDate) return true;
    if (this.options.maxDate && date > this.options.maxDate) return true;
    return false;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

// Create global instance manager
window.calendarWidget = {
  instances: new Map(),
  
  create(containerId, options) {
    const instance = new CalendarWidget(containerId, options);
    this.instances.set(containerId, instance);
    return instance;
  },
  
  getInstance(containerId) {
    return this.instances.get(containerId);
  },
  
  // Proxy methods for global onclick handlers
  previousMonth(containerId) {
    const instance = this.getInstance(containerId);
    if (instance) instance.previousMonth();
  },
  
  nextMonth(containerId) {
    const instance = this.getInstance(containerId);
    if (instance) instance.nextMonth();
  },
  
  today(containerId) {
    const instance = this.getInstance(containerId);
    if (instance) instance.today();
  },
  
  selectDate(containerId, dateStr) {
    const instance = this.getInstance(containerId);
    if (instance) instance.selectDate(dateStr);
  },
  
  clearSelection(containerId) {
    const instance = this.getInstance(containerId);
    if (instance) instance.clearSelection();
  },
  
  showTooltip(event, dateStr) {
    const containerId = event.target.closest('.calendar-widget').querySelector('[id]').id;
    const instance = this.getInstance(containerId);
    if (instance) instance.showTooltip(event, dateStr);
  },
  
  hideTooltip() {
    const tooltip = document.getElementById('calendar-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
  },

  createEvent(containerId, dateStr) {
    const instance = this.getInstance(containerId);
    if (instance) instance.createEvent(dateStr);
  },

  editEvent(containerId, eventId, eventData) {
    const instance = this.getInstance(containerId);
    if (instance) instance.editEvent(eventId, eventData);
  }
};