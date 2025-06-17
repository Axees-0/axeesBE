/**
 * Dashboard Manager - Connect to Real API Data
 * Replaces static mock data with dynamic backend integration
 */

class DashboardManager {
  constructor() {
    this.dashboardData = null;
    this.isLoading = false;
    this.refreshInterval = null;
    
    this.initialize();
  }

  async initialize() {
    if (!window.authContext || !window.authContext.isAuthenticated) {
      this.redirectToLogin();
      return;
    }

    await this.loadDashboardData();
    this.setupRefreshInterval();
    this.setupEventListeners();
  }

  /**
   * Load dashboard data from API
   */
  async loadDashboardData() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();

    try {
      const [dashboardResponse, dealsResponse] = await Promise.all([
        window.axeesAPI.getDealDashboard(),
        window.axeesAPI.getDeals()
      ]);

      if (dashboardResponse.success) {
        this.dashboardData = dashboardResponse.data;
        this.updateDashboardUI();
      }

      if (dealsResponse.success) {
        this.updateActiveDeals(dealsResponse.deals);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.showErrorState();
      this.fallbackToMockData();
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  /**
   * Update dashboard UI with real data
   */
  updateDashboardUI() {
    if (!this.dashboardData) return;

    const data = this.dashboardData;
    
    // Check if we have ARR data from the deal dashboard
    if (data.summary?.arr) {
      // We have deal dashboard data with ARR
      this.animateStatValue('earningsValue', data.summary.arr.current || 0, '$', '');
      this.animateStatValue('followersValue', data.summary.totalDeals || 0, '', '');
      this.animateStatValue('engagementValue', data.summary.conversionRate || 0, '', '%');
      this.animateStatValue('dealsValue', data.summary.activeDeals || 0, '', '');
      
      // Update labels to reflect ARR metrics
      this.updateStatLabels();
      
      // Update performance chart with monthly breakdown
      if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
        this.updatePerformanceChartWithARR(data.monthlyBreakdown);
      }
      
      // Update trend indicators
      this.updateTrendIndicators(data.summary.arr);
    } else {
      // Fallback to regular dashboard data
      this.animateStatValue('earningsValue', data.totalEarnings || 0, '$', '');
      this.animateStatValue('followersValue', data.totalFollowers || 0, '', data.totalFollowers >= 1000 ? 'K' : '');
      this.animateStatValue('engagementValue', data.averageEngagementRate || 0, '', '%');
      this.animateStatValue('dealsValue', data.activeDealsCount || 0, '', '');
      
      // Update performance chart data
      this.updatePerformanceChart(data.performanceData || {});
    }

    // Update activity feed with real data
    this.updateActivityFeed(data.recentActivity || data.insights?.recommendations || []);

    // Update user name if available
    this.updateUserWelcome(data.userName || data.user?.userName || 'Creator');
  }

  /**
   * Update active deals section
   */
  updateActiveDeals(deals) {
    const dealsGrid = document.querySelector('.deals-grid');
    if (!dealsGrid || !deals || deals.length === 0) return;

    const activeDeals = deals.filter(deal => 
      deal.status === 'active' || deal.status === 'pending' || deal.status === 'in_progress'
    ).slice(0, 3); // Show only first 3

    dealsGrid.innerHTML = activeDeals.map(deal => `
      <div class="deal-card" data-deal-id="${deal._id}">
        <div class="deal-header">
          <div>
            <h4 class="deal-title">${deal.title || deal.offerName || 'Untitled Deal'}</h4>
            <div class="deal-brand">${deal.brandName || deal.marketerName || 'Unknown Brand'}</div>
          </div>
          <div class="deal-amount">$${this.formatAmount(deal.amount || deal.proposedAmount || 0)}</div>
        </div>
        <div class="deal-status ${this.getStatusClass(deal.status)}">${this.formatStatus(deal.status)}</div>
      </div>
    `).join('');

    // Add click handlers for deal cards
    this.setupDealCardHandlers();
  }

  /**
   * Update activity feed with real data
   */
  updateActivityFeed(activities) {
    const activityContainer = document.querySelector('.dashboard-card .card-body');
    const existingActivity = activityContainer?.querySelector('.activity-item');
    
    if (!activityContainer || !existingActivity) return;

    // Clear existing activities
    const activityItems = activityContainer.querySelectorAll('.activity-item');
    activityItems.forEach(item => item.remove());

    if (!activities || activities.length === 0) {
      activityContainer.innerHTML = `
        <div class="activity-item">
          <div class="activity-icon deal">🎯</div>
          <div class="activity-content">
            <div class="activity-text">No recent activity</div>
            <div class="activity-time">Start collaborating to see activity here</div>
          </div>
        </div>
      `;
      return;
    }

    // Add real activities
    activities.slice(0, 5).forEach(activity => {
      const activityElement = document.createElement('div');
      activityElement.className = 'activity-item';
      activityElement.innerHTML = `
        <div class="activity-icon ${this.getActivityIconClass(activity.type)}">${this.getActivityIcon(activity.type)}</div>
        <div class="activity-content">
          <div class="activity-text">${activity.description || activity.message}</div>
          <div class="activity-time">${this.formatTimeAgo(activity.createdAt || activity.timestamp)}</div>
        </div>
      `;
      activityContainer.appendChild(activityElement);
    });
  }

  /**
   * Update user welcome message
   */
  updateUserWelcome(userName) {
    const titleElement = document.querySelector('.dashboard-title');
    if (titleElement) {
      titleElement.textContent = `Welcome back, ${userName}! 👋`;
    }
  }

  /**
   * Update performance chart with real data
   */
  updatePerformanceChart(performanceData) {
    const chartContainer = document.getElementById('performanceChart');
    if (!chartContainer) return;

    if (!performanceData.earnings || performanceData.earnings.length === 0) {
      this.showChartPlaceholder();
      return;
    }

    // Create a simple bar chart with real data
    const earnings = performanceData.earnings.slice(-4); // Last 4 data points
    const maxValue = Math.max(...earnings.map(e => e.amount || 0));
    
    chartContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <div style="width: 80%; height: 60%; position: relative; display: flex; align-items: end; justify-content: space-around; background: var(--gray-50); border-radius: var(--radius-lg); padding: 20px;">
          ${earnings.map((data, index) => {
            const height = maxValue > 0 ? (data.amount / maxValue) * 100 : 20;
            return `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="width: 30px; height: ${height}%; background: ${index % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)'}; border-radius: 4px 4px 0 0; opacity: 0.8; transition: all 0.3s ease;" title="$${data.amount}"></div>
                <div style="font-size: 12px; color: var(--text-muted);">${this.formatChartDate(data.date)}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top: var(--space-4); text-align: center; color: var(--text-secondary);">
          <div style="font-weight: var(--font-semibold); margin-bottom: var(--space-1);">Earnings Trend 📈</div>
          <div style="font-size: var(--text-sm);">Total: $${this.formatAmount(earnings.reduce((sum, e) => sum + (e.amount || 0), 0))}</div>
        </div>
      </div>
    `;
  }

  /**
   * Animate stat values
   */
  animateStatValue(elementId, target, prefix, suffix) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const increment = target / 50;
    const isDecimal = target % 1 !== 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      let displayValue = isDecimal ? current.toFixed(1) : Math.floor(current);
      
      if (suffix === 'K' && target >= 1000) {
        displayValue = (current / 1000).toFixed(1);
      }
      
      element.textContent = prefix + this.formatNumber(displayValue) + suffix;
    }, 30);
  }

  /**
   * Setup refresh interval
   */
  setupRefreshInterval() {
    // Refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 5 * 60 * 1000);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Refresh button functionality
    document.addEventListener('click', (e) => {
      if (e.target.matches('.dashboard-refresh')) {
        this.loadDashboardData();
      }
    });

    // Visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.loadDashboardData();
      }
    });
  }

  /**
   * Setup deal card click handlers
   */
  setupDealCardHandlers() {
    document.querySelectorAll('.deal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const dealId = card.dataset.dealId;
        if (dealId) {
          this.openDealDetails(dealId);
        }
      });
    });
  }

  /**
   * Open deal details modal/page
   */
  openDealDetails(dealId) {
    // For now, redirect to marketplace with deal focus
    window.location.href = `marketplace.html?deal=${dealId}`;
  }

  /**
   * Utility methods
   */
  formatAmount(amount) {
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toLocaleString();
  }

  formatNumber(value) {
    return parseFloat(value).toLocaleString();
  }

  formatStatus(status) {
    const statusMap = {
      'active': 'Active',
      'pending': 'Pending Review',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status) {
    const classMap = {
      'active': 'active',
      'in_progress': 'active',
      'pending': 'pending',
      'completed': 'completed',
      'cancelled': 'pending'
    };
    return classMap[status] || 'pending';
  }

  getActivityIconClass(type) {
    const classMap = {
      'deal': 'deal',
      'payment': 'payment',
      'content': 'content',
      'milestone': 'deal',
      'message': 'content'
    };
    return classMap[type] || 'deal';
  }

  getActivityIcon(type) {
    const iconMap = {
      'deal': '🤝',
      'payment': '💰',
      'content': '📸',
      'milestone': '🎯',
      'message': '💬'
    };
    return iconMap[type] || '🔔';
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return time.toLocaleDateString();
  }

  formatChartDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Loading and error states
   */
  showLoadingState() {
    const statsCards = document.querySelectorAll('.stat-card .stat-value');
    statsCards.forEach(card => {
      card.style.opacity = '0.5';
    });
  }

  hideLoadingState() {
    const statsCards = document.querySelectorAll('.stat-card .stat-value');
    statsCards.forEach(card => {
      card.style.opacity = '1';
    });
  }

  showErrorState() {
    const notification = document.createElement('div');
    notification.className = 'dashboard-error-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--error);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideInFromRight 0.3s ease;
    `;
    notification.textContent = 'Failed to load dashboard data. Using cached data.';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showChartPlaceholder() {
    const chartContainer = document.getElementById('performanceChart');
    if (!chartContainer) return;

    chartContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <div style="width: 80%; height: 60%; background: linear-gradient(45deg, var(--primary-color), var(--secondary-color)); border-radius: var(--radius-lg); opacity: 0.1; position: relative; overflow: hidden;">
          <div style="position: absolute; bottom: 0; left: 10%; width: 15%; height: 40%; background: var(--primary-color); opacity: 0.7; border-radius: 4px 4px 0 0;"></div>
          <div style="position: absolute; bottom: 0; left: 30%; width: 15%; height: 65%; background: var(--secondary-color); opacity: 0.7; border-radius: 4px 4px 0 0;"></div>
          <div style="position: absolute; bottom: 0; left: 50%; width: 15%; height: 50%; background: var(--primary-color); opacity: 0.7; border-radius: 4px 4px 0 0;"></div>
          <div style="position: absolute; bottom: 0; left: 70%; width: 15%; height: 80%; background: var(--secondary-color); opacity: 0.7; border-radius: 4px 4px 0 0;"></div>
        </div>
        <div style="margin-top: var(--space-4); text-align: center; color: var(--text-secondary);">
          <div style="font-weight: var(--font-semibold); margin-bottom: var(--space-1);">No Performance Data Yet 📊</div>
          <div style="font-size: var(--text-sm);">Start collaborating to see analytics here</div>
        </div>
      </div>
    `;
  }

  /**
   * Update stat labels for ARR dashboard
   */
  updateStatLabels() {
    const labels = document.querySelectorAll('.stat-label');
    if (labels.length >= 4) {
      labels[0].textContent = 'Annual Recurring Revenue';
      labels[1].textContent = 'Total Deals';
      labels[2].textContent = 'Conversion Rate';
      labels[3].textContent = 'Active Deals';
    }
  }

  /**
   * Update performance chart with ARR data
   */
  updatePerformanceChartWithARR(monthlyData) {
    const chartContainer = document.getElementById('performanceChart');
    if (!chartContainer || !monthlyData || monthlyData.length === 0) return;

    // Get last 6 months of data
    const recentData = monthlyData.slice(-6);
    const maxValue = Math.max(...recentData.map(d => d.revenue || 0));
    
    chartContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <div style="width: 90%; height: 60%; position: relative; display: flex; align-items: end; justify-content: space-around; background: var(--gray-50); border-radius: var(--radius-lg); padding: 20px;">
          ${recentData.map((data, index) => {
            const height = maxValue > 0 ? (data.revenue / maxValue) * 100 : 20;
            const color = data.growth > 0 ? 'var(--success)' : 'var(--primary-color)';
            return `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;">
                <div style="width: 80%; max-width: 40px; height: ${height}%; background: ${color}; border-radius: 4px 4px 0 0; opacity: 0.8; transition: all 0.3s ease; position: relative;" title="$${this.formatAmount(data.revenue)}">
                  ${data.growth ? `<span style="position: absolute; top: -20px; font-size: 10px; color: ${data.growth > 0 ? 'var(--success)' : 'var(--error)'};">${data.growth > 0 ? '+' : ''}${data.growth.toFixed(1)}%</span>` : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">${this.formatMonthYear(data.month)}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top: var(--space-4); text-align: center; color: var(--text-secondary);">
          <div style="font-weight: var(--font-semibold); margin-bottom: var(--space-1);">ARR Growth Trend 📈</div>
          <div style="font-size: var(--text-sm);">Total ARR: $${this.formatAmount(recentData[recentData.length - 1]?.revenue || 0)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Update trend indicators
   */
  updateTrendIndicators(arrData) {
    if (!arrData) return;

    // Update the change indicators
    const changeElements = document.querySelectorAll('.stat-change');
    
    if (changeElements[0] && arrData.growth !== undefined) {
      const growthPercent = arrData.growth || 0;
      changeElements[0].className = `stat-change ${growthPercent >= 0 ? 'positive' : 'negative'}`;
      changeElements[0].innerHTML = `
        <span>${growthPercent >= 0 ? '↗' : '↘'}</span>
        <span>${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}% ARR growth</span>
      `;
    }

    if (changeElements[1] && arrData.newDealsCount !== undefined) {
      changeElements[1].innerHTML = `
        <span>↗</span>
        <span>${arrData.newDealsCount} new this month</span>
      `;
    }

    if (changeElements[2] && arrData.conversionGrowth !== undefined) {
      const convGrowth = arrData.conversionGrowth || 0;
      changeElements[2].className = `stat-change ${convGrowth >= 0 ? 'positive' : 'negative'}`;
      changeElements[2].innerHTML = `
        <span>${convGrowth >= 0 ? '↗' : '↘'}</span>
        <span>${convGrowth >= 0 ? '+' : ''}${convGrowth.toFixed(1)}% from last month</span>
      `;
    }
  }

  /**
   * Format month year for chart
   */
  formatMonthYear(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  /**
   * Fallback to mock data if API fails
   */
  fallbackToMockData() {
    const mockData = {
      totalEarnings: 0,
      totalFollowers: 0,
      averageEngagementRate: 0,
      activeDealsCount: 0,
      recentActivity: [],
      userName: window.authContext?.user?.userName || 'Creator'
    };

    this.dashboardData = mockData;
    this.updateDashboardUI();
  }

  redirectToLogin() {
    window.location.href = 'index.html';
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Initialize dashboard manager
window.dashboardManager = new DashboardManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.dashboardManager) {
    window.dashboardManager.destroy();
  }
});