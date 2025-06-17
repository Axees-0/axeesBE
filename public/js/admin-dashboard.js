/**
 * Admin Dashboard Manager
 * Comprehensive administrative dashboard for platform management
 */

class AdminDashboardManager {
    constructor() {
        this.apiBase = '/api/admin/dashboard';
        this.currentView = 'overview';
        this.dashboardData = null;
        this.refreshInterval = null;
        this.filters = {
            timeframe: '30d',
            userRole: 'all',
            dealStatus: 'all',
            page: 1,
            limit: 50
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.injectStyles();
        this.checkAdminAccess();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-admin-view]')) {
                this.switchView(e.target.dataset.adminView);
            } else if (e.target.matches('[data-admin-action="refresh"]')) {
                this.refreshCurrentView();
            } else if (e.target.matches('[data-admin-action="user-action"]')) {
                this.showUserActionModal(e.target.dataset.userId);
            } else if (e.target.matches('[data-admin-action="deal-intervene"]')) {
                this.showDealInterventionModal(e.target.dataset.dealId);
            } else if (e.target.matches('[data-admin-action="export-report"]')) {
                this.exportReport(e.target.dataset.reportType);
            } else if (e.target.matches('.admin-filter-button')) {
                this.applyFilters();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('.admin-filter-select')) {
                this.updateFilter(e.target.name, e.target.value);
            }
        });
    }

    /**
     * Check Admin Access
     */
    async checkAdminAccess() {
        try {
            // Check if user has admin privileges
            const response = await apiManager.makeRequest('/api/users/me');
            if (!response.success || response.data.user.role !== 'admin') {
                this.showAccessDenied();
                return;
            }
            
            // Initialize admin dashboard
            this.showAdminDashboard();
            this.loadOverview();
        } catch (error) {
            console.error('Error checking admin access:', error);
            this.showAccessDenied();
        }
    }

    /**
     * Show Access Denied
     */
    showAccessDenied() {
        const container = document.getElementById('admin-dashboard-container') || document.body;
        container.innerHTML = `
            <div class="admin-access-denied">
                <div class="access-denied-content">
                    <div class="access-denied-icon">🚫</div>
                    <h2>Access Denied</h2>
                    <p>You don't have administrative privileges to access this dashboard.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/dashboard.html'">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show Admin Dashboard
     */
    showAdminDashboard() {
        const container = document.getElementById('admin-dashboard-container') || this.createDashboardContainer();
        
        container.innerHTML = `
            <div class="admin-dashboard">
                <!-- Admin Header -->
                <div class="admin-header">
                    <div class="admin-title-section">
                        <h1>🔧 Admin Dashboard</h1>
                        <p class="admin-subtitle">Platform Management & Analytics</p>
                    </div>
                    <div class="admin-header-actions">
                        <button class="btn btn-secondary" data-admin-action="refresh">
                            🔄 Refresh
                        </button>
                        <div class="admin-status-indicator">
                            <span class="status-dot status-online"></span>
                            <span>System Online</span>
                        </div>
                    </div>
                </div>

                <!-- Admin Navigation -->
                <div class="admin-nav">
                    <button class="admin-nav-item active" data-admin-view="overview">
                        📊 Overview
                    </button>
                    <button class="admin-nav-item" data-admin-view="users">
                        👥 User Management
                    </button>
                    <button class="admin-nav-item" data-admin-view="deals">
                        🤝 Deal Management
                    </button>
                    <button class="admin-nav-item" data-admin-view="financials">
                        💰 Financial Analytics
                    </button>
                    <button class="admin-nav-item" data-admin-view="system">
                        ⚙️ System Health
                    </button>
                    <button class="admin-nav-item" data-admin-view="reports">
                        📋 Reports
                    </button>
                </div>

                <!-- Admin Content -->
                <div class="admin-content">
                    <div id="admin-view-content">
                        <!-- Dynamic content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create Dashboard Container
     */
    createDashboardContainer() {
        const container = document.createElement('div');
        container.id = 'admin-dashboard-container';
        container.className = 'admin-dashboard-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Switch Admin View
     */
    switchView(view) {
        // Update active nav item
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-admin-view="${view}"]`).classList.add('active');

        this.currentView = view;

        // Load view content
        switch (view) {
            case 'overview':
                this.loadOverview();
                break;
            case 'users':
                this.loadUserManagement();
                break;
            case 'deals':
                this.loadDealManagement();
                break;
            case 'financials':
                this.loadFinancialAnalytics();
                break;
            case 'system':
                this.loadSystemHealth();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    /**
     * Load Overview
     */
    async loadOverview() {
        try {
            this.showLoading('Loading dashboard overview...');
            
            const response = await apiManager.makeRequest(`${this.apiBase}/overview?timeframe=${this.filters.timeframe}&includeDetails=true`);
            
            if (response.success) {
                this.dashboardData = response.data.overview;
                this.displayOverview();
            } else {
                throw new Error(response.message || 'Failed to load overview');
            }
        } catch (error) {
            console.error('Error loading overview:', error);
            this.showError('Failed to load dashboard overview: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display Overview
     */
    displayOverview() {
        const data = this.dashboardData;
        const content = document.getElementById('admin-view-content');
        
        content.innerHTML = `
            <!-- Overview Stats -->
            <div class="admin-stats-grid">
                <div class="admin-stat-card users">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <h3>Total Users</h3>
                        <div class="stat-number">${data.user_metrics?.total_users || 0}</div>
                        <div class="stat-change ${data.user_metrics?.growth_rate >= 0 ? 'positive' : 'negative'}">
                            ${data.user_metrics?.growth_rate >= 0 ? '↗' : '↘'} ${Math.abs(data.user_metrics?.growth_rate || 0)}%
                        </div>
                    </div>
                </div>

                <div class="admin-stat-card deals">
                    <div class="stat-icon">🤝</div>
                    <div class="stat-content">
                        <h3>Active Deals</h3>
                        <div class="stat-number">${data.deal_metrics?.active_deals || 0}</div>
                        <div class="stat-meta">${data.deal_metrics?.total_deals || 0} total</div>
                    </div>
                </div>

                <div class="admin-stat-card revenue">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <h3>Total Revenue</h3>
                        <div class="stat-number">$${(data.financial_metrics?.total_revenue || 0).toLocaleString()}</div>
                        <div class="stat-meta">$${(data.financial_metrics?.monthly_revenue || 0).toLocaleString()} this month</div>
                    </div>
                </div>

                <div class="admin-stat-card health">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-content">
                        <h3>System Health</h3>
                        <div class="stat-number health-score">${data.system_health?.overall_score || 100}%</div>
                        <div class="stat-meta ${data.system_health?.status === 'healthy' ? 'status-good' : 'status-warning'}">
                            ${data.system_health?.status || 'healthy'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts and Analytics Section -->
            <div class="admin-charts-grid">
                <div class="admin-chart-card">
                    <div class="chart-header">
                        <h3>User Growth Trend</h3>
                        <select class="admin-filter-select" name="timeframe">
                            <option value="7d" ${this.filters.timeframe === '7d' ? 'selected' : ''}>Last 7 days</option>
                            <option value="30d" ${this.filters.timeframe === '30d' ? 'selected' : ''}>Last 30 days</option>
                            <option value="90d" ${this.filters.timeframe === '90d' ? 'selected' : ''}>Last 90 days</option>
                        </select>
                    </div>
                    <div class="chart-content">
                        ${this.createUserGrowthChart(data.user_metrics)}
                    </div>
                </div>

                <div class="admin-chart-card">
                    <div class="chart-header">
                        <h3>Deal Performance</h3>
                    </div>
                    <div class="chart-content">
                        ${this.createDealPerformanceChart(data.deal_metrics)}
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="admin-activity-section">
                <h3>Recent Platform Activity</h3>
                <div class="activity-feed">
                    ${this.createActivityFeed(data.recent_activity)}
                </div>
            </div>

            <!-- Alerts and Issues -->
            ${data.alerts_and_issues?.length > 0 ? `
                <div class="admin-alerts-section">
                    <h3>⚠️ Alerts & Issues</h3>
                    <div class="alerts-list">
                        ${data.alerts_and_issues.map(alert => this.createAlertItem(alert)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    /**
     * Load User Management
     */
    async loadUserManagement() {
        try {
            this.showLoading('Loading user management...');
            
            const queryParams = new URLSearchParams({
                page: this.filters.page,
                limit: this.filters.limit,
                role: this.filters.userRole,
                status: 'all',
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            const response = await apiManager.makeRequest(`${this.apiBase}/users?${queryParams}`);
            
            if (response.success) {
                this.displayUserManagement(response.data);
            } else {
                throw new Error(response.message || 'Failed to load user management');
            }
        } catch (error) {
            console.error('Error loading user management:', error);
            this.showError('Failed to load user management: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display User Management
     */
    displayUserManagement(data) {
        const content = document.getElementById('admin-view-content');
        
        content.innerHTML = `
            <!-- User Management Filters -->
            <div class="admin-filters-section">
                <div class="filters-row">
                    <div class="filter-group">
                        <label>User Role:</label>
                        <select class="admin-filter-select" name="userRole">
                            <option value="all">All Roles</option>
                            <option value="creator" ${this.filters.userRole === 'creator' ? 'selected' : ''}>Creators</option>
                            <option value="marketer" ${this.filters.userRole === 'marketer' ? 'selected' : ''}>Marketers</option>
                            <option value="admin" ${this.filters.userRole === 'admin' ? 'selected' : ''}>Admins</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Status:</label>
                        <select class="admin-filter-select" name="userStatus">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <button class="btn btn-primary admin-filter-button">Apply Filters</button>
                </div>
            </div>

            <!-- User Statistics -->
            <div class="admin-user-stats">
                <div class="user-stat-item">
                    <span class="stat-label">Total Users:</span>
                    <span class="stat-value">${data.total_users || 0}</span>
                </div>
                <div class="user-stat-item">
                    <span class="stat-label">Creators:</span>
                    <span class="stat-value">${data.creators_count || 0}</span>
                </div>
                <div class="user-stat-item">
                    <span class="stat-label">Marketers:</span>
                    <span class="stat-value">${data.marketers_count || 0}</span>
                </div>
                <div class="user-stat-item">
                    <span class="stat-label">Active Today:</span>
                    <span class="stat-value">${data.active_today || 0}</span>
                </div>
            </div>

            <!-- Users Table -->
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Last Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.users?.map(user => this.createUserRow(user)).join('') || '<tr><td colspan="6">No users found</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            ${this.createPagination(data.pagination)}
        `;
    }

    /**
     * Load Deal Management
     */
    async loadDealManagement() {
        try {
            this.showLoading('Loading deal management...');
            
            const queryParams = new URLSearchParams({
                page: this.filters.page,
                limit: this.filters.limit,
                status: this.filters.dealStatus,
                risk_level: 'all',
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            const response = await apiManager.makeRequest(`${this.apiBase}/deals?${queryParams}`);
            
            if (response.success) {
                this.displayDealManagement(response.data);
            } else {
                throw new Error(response.message || 'Failed to load deal management');
            }
        } catch (error) {
            console.error('Error loading deal management:', error);
            this.showError('Failed to load deal management: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display Deal Management
     */
    displayDealManagement(data) {
        const content = document.getElementById('admin-view-content');
        
        content.innerHTML = `
            <!-- Deal Management Filters -->
            <div class="admin-filters-section">
                <div class="filters-row">
                    <div class="filter-group">
                        <label>Deal Status:</label>
                        <select class="admin-filter-select" name="dealStatus">
                            <option value="all">All Status</option>
                            <option value="active" ${this.filters.dealStatus === 'active' ? 'selected' : ''}>Active</option>
                            <option value="pending" ${this.filters.dealStatus === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="completed" ${this.filters.dealStatus === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="disputed" ${this.filters.dealStatus === 'disputed' ? 'selected' : ''}>Disputed</option>
                        </select>
                    </div>
                    <button class="btn btn-primary admin-filter-button">Apply Filters</button>
                    <button class="btn btn-secondary" data-admin-action="export-report" data-report-type="deals">
                        📥 Export Report
                    </button>
                </div>
            </div>

            <!-- Deal Statistics -->
            <div class="admin-deal-stats">
                <div class="deal-stat-item">
                    <span class="stat-label">Total Deals:</span>
                    <span class="stat-value">${data.total_deals || 0}</span>
                </div>
                <div class="deal-stat-item">
                    <span class="stat-label">Active:</span>
                    <span class="stat-value">${data.active_deals || 0}</span>
                </div>
                <div class="deal-stat-item">
                    <span class="stat-label">At Risk:</span>
                    <span class="stat-value stat-warning">${data.at_risk_deals || 0}</span>
                </div>
                <div class="deal-stat-item">
                    <span class="stat-label">Disputed:</span>
                    <span class="stat-value stat-error">${data.disputed_deals || 0}</span>
                </div>
            </div>

            <!-- Deals Table -->
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Deal</th>
                            <th>Parties</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Risk Level</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.deals?.map(deal => this.createDealRow(deal)).join('') || '<tr><td colspan="7">No deals found</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            ${this.createPagination(data.pagination)}
        `;
    }

    /**
     * Create User Row
     */
    createUserRow(user) {
        const statusClass = user.status === 'active' ? 'status-active' : 
                          user.status === 'suspended' ? 'status-suspended' : 'status-inactive';
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.profileImage || '/img/default-avatar.png'}" alt="${user.userName}" class="user-avatar">
                        <div class="user-details">
                            <div class="user-name">${user.userName}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${statusClass}">${user.status || 'active'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" data-admin-action="user-action" data-user-id="${user._id}">
                        Manage
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Create Deal Row
     */
    createDealRow(deal) {
        const statusClass = `status-${deal.status}`;
        const riskClass = deal.risk_level === 'high' ? 'risk-high' : 
                         deal.risk_level === 'medium' ? 'risk-medium' : 'risk-low';
        
        return `
            <tr>
                <td>
                    <div class="deal-info">
                        <div class="deal-name">${deal.dealName || deal.dealNumber}</div>
                        <div class="deal-number">#${deal.dealNumber}</div>
                    </div>
                </td>
                <td>
                    <div class="deal-parties">
                        <div class="party">${deal.creator?.userName || 'Unknown'}</div>
                        <div class="party-separator">↔</div>
                        <div class="party">${deal.marketer?.userName || 'Unknown'}</div>
                    </div>
                </td>
                <td class="deal-value">$${(deal.paymentAmount || 0).toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${deal.status}</span></td>
                <td><span class="risk-badge ${riskClass}">${deal.risk_level || 'low'}</span></td>
                <td>${new Date(deal.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" data-admin-action="deal-intervene" data-deal-id="${deal._id}">
                        Manage
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Create User Growth Chart
     */
    createUserGrowthChart(metrics) {
        // Simple bar chart representation
        const growth = metrics?.growth_data || [];
        if (growth.length === 0) {
            return '<div class="chart-placeholder">No growth data available</div>';
        }

        return `
            <div class="simple-chart">
                <div class="chart-bars">
                    ${growth.slice(-7).map((data, index) => `
                        <div class="chart-bar">
                            <div class="bar" style="height: ${(data.users / Math.max(...growth.map(g => g.users))) * 100}%"></div>
                            <div class="bar-label">${new Date(data.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create Deal Performance Chart
     */
    createDealPerformanceChart(metrics) {
        if (!metrics) {
            return '<div class="chart-placeholder">No deal metrics available</div>';
        }

        return `
            <div class="performance-metrics">
                <div class="metric-item">
                    <div class="metric-label">Success Rate</div>
                    <div class="metric-value">${metrics.success_rate || 0}%</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Avg. Deal Value</div>
                    <div class="metric-value">$${(metrics.average_deal_value || 0).toLocaleString()}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Completion Time</div>
                    <div class="metric-value">${metrics.average_completion_days || 0} days</div>
                </div>
            </div>
        `;
    }

    /**
     * Create Activity Feed
     */
    createActivityFeed(activities) {
        if (!activities || activities.length === 0) {
            return '<div class="activity-empty">No recent activity</div>';
        }

        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Create Alert Item
     */
    createAlertItem(alert) {
        const priorityClass = `alert-${alert.priority}`;
        
        return `
            <div class="alert-item ${priorityClass}">
                <div class="alert-icon">${alert.priority === 'high' ? '🔴' : alert.priority === 'medium' ? '🟡' : '🔵'}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-time">${this.formatTimeAgo(alert.created_at)}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary">Investigate</button>
                </div>
            </div>
        `;
    }

    /**
     * Create Pagination
     */
    createPagination(pagination) {
        if (!pagination || pagination.total_pages <= 1) {
            return '';
        }

        const { current_page, total_pages, total_items } = pagination;
        
        return `
            <div class="admin-pagination">
                <div class="pagination-info">
                    Showing ${((current_page - 1) * this.filters.limit) + 1} to ${Math.min(current_page * this.filters.limit, total_items)} of ${total_items} items
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-sm btn-secondary ${current_page <= 1 ? 'disabled' : ''}" 
                            onclick="adminDashboard.changePage(${current_page - 1})" 
                            ${current_page <= 1 ? 'disabled' : ''}>
                        Previous
                    </button>
                    <span class="pagination-current">Page ${current_page} of ${total_pages}</span>
                    <button class="btn btn-sm btn-secondary ${current_page >= total_pages ? 'disabled' : ''}" 
                            onclick="adminDashboard.changePage(${current_page + 1})"
                            ${current_page >= total_pages ? 'disabled' : ''}>
                        Next
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Update Filter
     */
    updateFilter(name, value) {
        this.filters[name] = value;
    }

    /**
     * Apply Filters
     */
    applyFilters() {
        this.filters.page = 1; // Reset to first page
        this.refreshCurrentView();
    }

    /**
     * Change Page
     */
    changePage(page) {
        this.filters.page = page;
        this.refreshCurrentView();
    }

    /**
     * Refresh Current View
     */
    refreshCurrentView() {
        this.switchView(this.currentView);
    }

    /**
     * Load Financial Analytics
     */
    async loadFinancialAnalytics() {
        const content = document.getElementById('admin-view-content');
        content.innerHTML = `
            <div class="admin-placeholder">
                <div class="placeholder-icon">💰</div>
                <h3>Financial Analytics</h3>
                <p>Comprehensive financial reports and analytics dashboard coming soon.</p>
                <div class="placeholder-features">
                    <ul>
                        <li>Revenue tracking and trends</li>
                        <li>Payment processing analytics</li>
                        <li>Commission and fee reports</li>
                        <li>Financial forecasting</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Load System Health
     */
    async loadSystemHealth() {
        const content = document.getElementById('admin-view-content');
        content.innerHTML = `
            <div class="admin-placeholder">
                <div class="placeholder-icon">⚙️</div>
                <h3>System Health Monitoring</h3>
                <p>Real-time system performance and health monitoring coming soon.</p>
                <div class="placeholder-features">
                    <ul>
                        <li>Server performance metrics</li>
                        <li>Database health monitoring</li>
                        <li>API response time tracking</li>
                        <li>Error rate monitoring</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Load Reports
     */
    async loadReports() {
        const content = document.getElementById('admin-view-content');
        content.innerHTML = `
            <div class="admin-placeholder">
                <div class="placeholder-icon">📋</div>
                <h3>Administrative Reports</h3>
                <p>Comprehensive reporting system coming soon.</p>
                <div class="placeholder-features">
                    <ul>
                        <li>Custom report generation</li>
                        <li>Scheduled report delivery</li>
                        <li>Data export functionality</li>
                        <li>Report templates</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Utility Methods
     */
    getActivityIcon(type) {
        const icons = {
            user_signup: '👤',
            deal_created: '🤝',
            payment_processed: '💰',
            dispute_opened: '⚠️',
            system_alert: '🔔'
        };
        return icons[type] || '📋';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    }

    /**
     * Inject Styles
     */
    injectStyles() {
        const styles = `
            <style>
            .admin-dashboard-container {
                min-height: 100vh;
                background: var(--bg-secondary);
            }

            .admin-access-denied {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: var(--bg-secondary);
            }

            .access-denied-content {
                text-align: center;
                background: var(--bg-card);
                padding: var(--space-12);
                border-radius: var(--radius-xl);
                border: 1px solid var(--gray-200);
                max-width: 400px;
            }

            .access-denied-icon {
                font-size: 4rem;
                margin-bottom: var(--space-4);
            }

            .admin-dashboard {
                max-width: 1400px;
                margin: 0 auto;
                padding: var(--space-6);
            }

            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: var(--space-6);
                background: var(--bg-card);
                padding: var(--space-6);
                border-radius: var(--radius-xl);
                border: 1px solid var(--gray-200);
            }

            .admin-title-section h1 {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-3xl);
                font-weight: var(--font-bold);
                color: var(--text-primary);
            }

            .admin-subtitle {
                margin: 0;
                color: var(--text-secondary);
                font-size: var(--text-lg);
            }

            .admin-header-actions {
                display: flex;
                align-items: center;
                gap: var(--space-4);
            }

            .admin-status-indicator {
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-2) var(--space-3);
                background: var(--gray-50);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .status-dot.status-online {
                background: var(--success);
            }

            .admin-nav {
                display: flex;
                gap: var(--space-2);
                margin-bottom: var(--space-6);
                background: var(--bg-card);
                padding: var(--space-3);
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
                overflow-x: auto;
            }

            .admin-nav-item {
                background: transparent;
                border: none;
                padding: var(--space-3) var(--space-4);
                border-radius: var(--radius-md);
                cursor: pointer;
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                white-space: nowrap;
                transition: all 0.2s ease;
                color: var(--text-secondary);
            }

            .admin-nav-item:hover {
                background: var(--gray-100);
                color: var(--text-primary);
            }

            .admin-nav-item.active {
                background: var(--primary-color);
                color: white;
            }

            .admin-content {
                background: var(--bg-card);
                border-radius: var(--radius-xl);
                border: 1px solid var(--gray-200);
                padding: var(--space-6);
                min-height: 600px;
            }

            .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--space-4);
                margin-bottom: var(--space-8);
            }

            .admin-stat-card {
                background: var(--gray-50);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                display: flex;
                align-items: center;
                gap: var(--space-3);
                transition: all 0.2s ease;
            }

            .admin-stat-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }

            .admin-stat-card.users {
                border-left: 4px solid var(--primary-color);
            }

            .admin-stat-card.deals {
                border-left: 4px solid var(--info);
            }

            .admin-stat-card.revenue {
                border-left: 4px solid var(--success);
            }

            .admin-stat-card.health {
                border-left: 4px solid var(--warning);
            }

            .stat-icon {
                font-size: var(--text-2xl);
                flex-shrink: 0;
            }

            .stat-content h3 {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-sm);
                font-weight: var(--font-semibold);
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .stat-number {
                font-size: var(--text-2xl);
                font-weight: var(--font-bold);
                color: var(--text-primary);
                margin-bottom: var(--space-1);
            }

            .stat-change {
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
            }

            .stat-change.positive {
                color: var(--success);
            }

            .stat-change.negative {
                color: var(--error);
            }

            .stat-meta {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .stat-meta.status-good {
                color: var(--success);
            }

            .stat-meta.status-warning {
                color: var(--warning);
            }

            .health-score {
                color: var(--success);
            }

            .admin-charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: var(--space-6);
                margin-bottom: var(--space-8);
            }

            .admin-chart-card {
                background: var(--gray-50);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                border: 1px solid var(--gray-200);
            }

            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-4);
            }

            .chart-header h3 {
                margin: 0;
                font-size: var(--text-lg);
                font-weight: var(--font-semibold);
            }

            .chart-content {
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chart-placeholder {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
            }

            .simple-chart {
                width: 100%;
            }

            .chart-bars {
                display: flex;
                align-items: flex-end;
                gap: var(--space-2);
                height: 150px;
                padding: var(--space-2);
            }

            .chart-bar {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--space-1);
            }

            .bar {
                background: var(--primary-color);
                width: 100%;
                min-height: 4px;
                border-radius: var(--radius-md);
                transition: all 0.3s ease;
            }

            .bar-label {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .performance-metrics {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--space-4);
            }

            .metric-item {
                text-align: center;
                padding: var(--space-3);
                background: white;
                border-radius: var(--radius-md);
            }

            .metric-label {
                font-size: var(--text-sm);
                color: var(--text-secondary);
                margin-bottom: var(--space-1);
            }

            .metric-value {
                font-size: var(--text-lg);
                font-weight: var(--font-bold);
                color: var(--text-primary);
            }

            .admin-activity-section {
                margin-bottom: var(--space-8);
            }

            .admin-activity-section h3 {
                margin: 0 0 var(--space-4) 0;
                font-size: var(--text-xl);
                font-weight: var(--font-semibold);
            }

            .activity-feed {
                background: var(--gray-50);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                max-height: 400px;
                overflow-y: auto;
            }

            .activity-item {
                display: flex;
                align-items: flex-start;
                gap: var(--space-3);
                padding: var(--space-3);
                background: white;
                border-radius: var(--radius-md);
                margin-bottom: var(--space-2);
            }

            .activity-item:last-child {
                margin-bottom: 0;
            }

            .activity-icon {
                font-size: var(--text-lg);
                flex-shrink: 0;
            }

            .activity-content {
                flex: 1;
            }

            .activity-text {
                font-size: var(--text-sm);
                color: var(--text-primary);
                margin-bottom: var(--space-1);
            }

            .activity-time {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .activity-empty {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: var(--space-8);
            }

            .admin-filters-section {
                background: var(--gray-50);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                margin-bottom: var(--space-6);
            }

            .filters-row {
                display: flex;
                align-items: center;
                gap: var(--space-4);
                flex-wrap: wrap;
            }

            .filter-group {
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }

            .filter-group label {
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                color: var(--text-secondary);
                white-space: nowrap;
            }

            .admin-filter-select {
                padding: var(--space-2);
                border: 1px solid var(--gray-300);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                background: white;
            }

            .admin-user-stats, .admin-deal-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: var(--space-4);
                margin-bottom: var(--space-6);
                background: var(--gray-50);
                padding: var(--space-4);
                border-radius: var(--radius-lg);
            }

            .user-stat-item, .deal-stat-item {
                text-align: center;
                padding: var(--space-2);
                background: white;
                border-radius: var(--radius-md);
            }

            .stat-label {
                font-size: var(--text-sm);
                color: var(--text-secondary);
                margin-bottom: var(--space-1);
            }

            .stat-value {
                font-size: var(--text-lg);
                font-weight: var(--font-bold);
                color: var(--text-primary);
            }

            .stat-value.stat-warning {
                color: var(--warning);
            }

            .stat-value.stat-error {
                color: var(--error);
            }

            .admin-table-container {
                background: white;
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
                overflow: hidden;
                margin-bottom: var(--space-6);
            }

            .admin-table {
                width: 100%;
                border-collapse: collapse;
            }

            .admin-table th {
                background: var(--gray-50);
                padding: var(--space-3);
                text-align: left;
                font-weight: var(--font-semibold);
                color: var(--text-secondary);
                border-bottom: 1px solid var(--gray-200);
                font-size: var(--text-sm);
            }

            .admin-table td {
                padding: var(--space-3);
                border-bottom: 1px solid var(--gray-100);
                font-size: var(--text-sm);
            }

            .admin-table tr:last-child td {
                border-bottom: none;
            }

            .user-info, .deal-info {
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
            }

            .user-details {
                flex: 1;
            }

            .user-name, .deal-name {
                font-weight: var(--font-semibold);
                color: var(--text-primary);
            }

            .user-email, .deal-number {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .role-badge, .status-badge, .risk-badge {
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                text-transform: capitalize;
            }

            .role-badge.role-creator {
                background: rgba(99, 102, 241, 0.1);
                color: var(--primary-color);
            }

            .role-badge.role-marketer {
                background: rgba(236, 72, 153, 0.1);
                color: var(--secondary-color);
            }

            .role-badge.role-admin {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .status-badge.status-active {
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
            }

            .status-badge.status-pending {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .status-badge.status-completed {
                background: rgba(99, 102, 241, 0.1);
                color: var(--primary-color);
            }

            .status-badge.status-suspended, .status-badge.status-disputed {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
            }

            .status-badge.status-inactive {
                background: rgba(156, 163, 175, 0.1);
                color: var(--text-muted);
            }

            .risk-badge.risk-low {
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
            }

            .risk-badge.risk-medium {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .risk-badge.risk-high {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
            }

            .deal-parties {
                display: flex;
                align-items: center;
                gap: var(--space-1);
                font-size: var(--text-sm);
            }

            .party {
                color: var(--text-primary);
            }

            .party-separator {
                color: var(--text-muted);
            }

            .deal-value {
                font-weight: var(--font-semibold);
                color: var(--success);
            }

            .admin-pagination {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-4);
                background: var(--gray-50);
                border-radius: var(--radius-lg);
            }

            .pagination-info {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .pagination-controls {
                display: flex;
                align-items: center;
                gap: var(--space-3);
            }

            .pagination-current {
                font-size: var(--text-sm);
                color: var(--text-primary);
                font-weight: var(--font-medium);
            }

            .admin-placeholder {
                text-align: center;
                padding: var(--space-12);
            }

            .placeholder-icon {
                font-size: 4rem;
                margin-bottom: var(--space-4);
            }

            .admin-placeholder h3 {
                margin: 0 0 var(--space-3) 0;
                font-size: var(--text-2xl);
                font-weight: var(--font-bold);
            }

            .admin-placeholder p {
                margin: 0 0 var(--space-4) 0;
                color: var(--text-secondary);
                font-size: var(--text-lg);
            }

            .placeholder-features {
                max-width: 400px;
                margin: 0 auto;
            }

            .placeholder-features ul {
                text-align: left;
                margin: 0;
                padding-left: var(--space-4);
            }

            .placeholder-features li {
                margin-bottom: var(--space-2);
                color: var(--text-secondary);
            }

            @media (max-width: 768px) {
                .admin-dashboard {
                    padding: var(--space-4);
                }
                
                .admin-header {
                    flex-direction: column;
                    gap: var(--space-4);
                    align-items: stretch;
                }
                
                .admin-nav {
                    flex-wrap: wrap;
                }
                
                .admin-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .admin-charts-grid {
                    grid-template-columns: 1fr;
                }
                
                .filters-row {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .admin-user-stats, .admin-deal-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .admin-table-container {
                    overflow-x: auto;
                }
                
                .admin-pagination {
                    flex-direction: column;
                    gap: var(--space-3);
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Utility methods
     */
    showLoading(message = 'Loading...') {
        const content = document.getElementById('admin-view-content');
        if (content) {
            content.innerHTML = `
                <div class="admin-loading">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading will be replaced by actual content
    }

    showError(message) {
        console.error(message);
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert('Success: ' + message);
        }
    }
}

// Initialize Admin Dashboard Manager
window.adminDashboard = new AdminDashboardManager();

/**
 * System Health Monitoring Extension
 * Provides real-time alerts and monitoring for system health
 */
class SystemHealthMonitor {
    constructor(adminDashboard) {
        this.adminDashboard = adminDashboard;
        this.alerts = [];
        this.thresholds = {
            cpuUsage: 80,
            memoryUsage: 85,
            diskSpace: 90,
            responseTime: 2000,
            errorRate: 5,
            activeUsers: 10000
        };
        this.monitoringInterval = null;
        this.alertSubscribers = new Set();
        this.init();
    }

    init() {
        this.injectHealthStyles();
        this.addHealthMonitoringUI();
        this.startMonitoring();
    }

    /**
     * Add health monitoring UI to admin dashboard
     */
    addHealthMonitoringUI() {
        // Add health status to main dashboard
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader) {
            const healthIndicator = document.createElement('div');
            healthIndicator.id = 'system-health-indicator';
            healthIndicator.className = 'system-health-indicator';
            healthIndicator.innerHTML = `
                <div class="health-status health-good">
                    <span class="health-icon">✅</span>
                    <span class="health-text">System Healthy</span>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="systemHealthMonitor.showHealthPanel()">
                    📊 View Details
                </button>
            `;
            adminHeader.appendChild(healthIndicator);
        }

        // Add alerts widget to dashboard
        this.createAlertsWidget();
    }

    /**
     * Create alerts widget
     */
    createAlertsWidget() {
        const alertsWidget = document.createElement('div');
        alertsWidget.id = 'health-alerts-widget';
        alertsWidget.className = 'health-alerts-widget';
        alertsWidget.innerHTML = `
            <div class="widget-header">
                <h3>🚨 System Alerts</h3>
                <button class="btn-icon" onclick="systemHealthMonitor.showHealthPanel()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                </button>
            </div>
            <div class="alerts-container" id="alerts-container">
                <div class="no-alerts">
                    <span class="no-alerts-icon">✨</span>
                    <p>No active alerts</p>
                </div>
            </div>
        `;

        // Add to dashboard overview
        const dashboardContent = document.querySelector('.admin-dashboard');
        if (dashboardContent) {
            const overviewSection = dashboardContent.querySelector('.admin-stats-grid');
            if (overviewSection) {
                overviewSection.parentNode.insertBefore(alertsWidget, overviewSection.nextSibling);
            }
        }
    }

    /**
     * Start system monitoring
     */
    startMonitoring() {
        // Initial check
        this.checkSystemHealth();

        // Set up periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.checkSystemHealth();
        }, 30000); // Check every 30 seconds

        // Set up WebSocket for real-time alerts (simulated)
        this.simulateRealTimeAlerts();
    }

    /**
     * Check system health
     */
    async checkSystemHealth() {
        try {
            // Try to fetch real health data
            const response = await fetch('/api/admin/system/health');
            if (response.ok) {
                const healthData = await response.json();
                this.processHealthData(healthData);
            } else {
                // Use mock data if API not available
                this.processHealthData(this.getMockHealthData());
            }
        } catch (error) {
            console.error('Error checking system health:', error);
            this.processHealthData(this.getMockHealthData());
        }
    }

    /**
     * Process health data and generate alerts
     */
    processHealthData(healthData) {
        const newAlerts = [];

        // Check CPU usage
        if (healthData.cpu.usage > this.thresholds.cpuUsage) {
            newAlerts.push({
                id: `cpu-${Date.now()}`,
                type: 'critical',
                category: 'performance',
                message: `CPU usage critical: ${healthData.cpu.usage}%`,
                details: `CPU has been running at ${healthData.cpu.usage}% for the last 5 minutes`,
                timestamp: new Date(),
                metric: 'cpu',
                value: healthData.cpu.usage,
                threshold: this.thresholds.cpuUsage
            });
        }

        // Check memory usage
        if (healthData.memory.usagePercent > this.thresholds.memoryUsage) {
            newAlerts.push({
                id: `memory-${Date.now()}`,
                type: 'warning',
                category: 'performance',
                message: `Memory usage high: ${healthData.memory.usagePercent}%`,
                details: `${healthData.memory.used}GB of ${healthData.memory.total}GB used`,
                timestamp: new Date(),
                metric: 'memory',
                value: healthData.memory.usagePercent,
                threshold: this.thresholds.memoryUsage
            });
        }

        // Check disk space
        if (healthData.disk.usagePercent > this.thresholds.diskSpace) {
            newAlerts.push({
                id: `disk-${Date.now()}`,
                type: 'critical',
                category: 'storage',
                message: `Disk space critical: ${healthData.disk.usagePercent}%`,
                details: `Only ${healthData.disk.free}GB remaining`,
                timestamp: new Date(),
                metric: 'disk',
                value: healthData.disk.usagePercent,
                threshold: this.thresholds.diskSpace
            });
        }

        // Check response time
        if (healthData.performance.avgResponseTime > this.thresholds.responseTime) {
            newAlerts.push({
                id: `response-${Date.now()}`,
                type: 'warning',
                category: 'performance',
                message: `Slow response times: ${healthData.performance.avgResponseTime}ms`,
                details: `Average API response time exceeds ${this.thresholds.responseTime}ms`,
                timestamp: new Date(),
                metric: 'responseTime',
                value: healthData.performance.avgResponseTime,
                threshold: this.thresholds.responseTime
            });
        }

        // Check error rate
        if (healthData.errors.rate > this.thresholds.errorRate) {
            newAlerts.push({
                id: `errors-${Date.now()}`,
                type: 'critical',
                category: 'stability',
                message: `High error rate: ${healthData.errors.rate}%`,
                details: `${healthData.errors.count} errors in the last hour`,
                timestamp: new Date(),
                metric: 'errorRate',
                value: healthData.errors.rate,
                threshold: this.thresholds.errorRate
            });
        }

        // Update alerts
        this.updateAlerts(newAlerts);
        this.updateHealthStatus(healthData, newAlerts);
    }

    /**
     * Update alerts list
     */
    updateAlerts(newAlerts) {
        // Add new alerts
        newAlerts.forEach(alert => {
            // Check if similar alert already exists
            const existingAlert = this.alerts.find(a => 
                a.metric === alert.metric && a.type === alert.type
            );
            
            if (!existingAlert) {
                this.alerts.unshift(alert);
                this.notifySubscribers(alert);
            }
        });

        // Remove resolved alerts (older than 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);

        // Update UI
        this.renderAlerts();
    }

    /**
     * Update health status indicator
     */
    updateHealthStatus(healthData, alerts) {
        const indicator = document.getElementById('system-health-indicator');
        if (!indicator) return;

        const statusDiv = indicator.querySelector('.health-status');
        const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
        const warningAlerts = alerts.filter(a => a.type === 'warning').length;

        if (criticalAlerts > 0) {
            statusDiv.className = 'health-status health-critical';
            statusDiv.innerHTML = `
                <span class="health-icon">🔴</span>
                <span class="health-text">${criticalAlerts} Critical Alert${criticalAlerts > 1 ? 's' : ''}</span>
            `;
        } else if (warningAlerts > 0) {
            statusDiv.className = 'health-status health-warning';
            statusDiv.innerHTML = `
                <span class="health-icon">🟡</span>
                <span class="health-text">${warningAlerts} Warning${warningAlerts > 1 ? 's' : ''}</span>
            `;
        } else {
            statusDiv.className = 'health-status health-good';
            statusDiv.innerHTML = `
                <span class="health-icon">✅</span>
                <span class="health-text">System Healthy</span>
            `;
        }
    }

    /**
     * Render alerts in widget
     */
    renderAlerts() {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <span class="no-alerts-icon">✨</span>
                    <p>No active alerts</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.alerts.slice(0, 5).map(alert => `
            <div class="alert-item alert-${alert.type}" onclick="systemHealthMonitor.showAlertDetails('${alert.id}')">
                <div class="alert-header">
                    <span class="alert-icon">${this.getAlertIcon(alert.type)}</span>
                    <span class="alert-time">${this.formatTimeAgo(alert.timestamp)}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-details">${alert.details}</div>
            </div>
        `).join('');

        if (this.alerts.length > 5) {
            container.innerHTML += `
                <div class="view-all-alerts">
                    <button class="btn btn-link" onclick="systemHealthMonitor.showHealthPanel()">
                        View all ${this.alerts.length} alerts →
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show health monitoring panel
     */
    showHealthPanel() {
        const modal = document.createElement('div');
        modal.className = 'health-panel-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content health-panel" style="max-width: 1000px; width: 95%; max-height: 90vh;">
                <div class="modal-header">
                    <h2>System Health Monitoring</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="health-panel-body">
                    <!-- Real-time metrics -->
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>CPU Usage</h4>
                            <div class="metric-value" id="cpu-metric">--</div>
                            <div class="metric-chart" id="cpu-chart"></div>
                        </div>
                        <div class="metric-card">
                            <h4>Memory Usage</h4>
                            <div class="metric-value" id="memory-metric">--</div>
                            <div class="metric-chart" id="memory-chart"></div>
                        </div>
                        <div class="metric-card">
                            <h4>Disk Space</h4>
                            <div class="metric-value" id="disk-metric">--</div>
                            <div class="metric-chart" id="disk-chart"></div>
                        </div>
                        <div class="metric-card">
                            <h4>Response Time</h4>
                            <div class="metric-value" id="response-metric">--</div>
                            <div class="metric-chart" id="response-chart"></div>
                        </div>
                    </div>

                    <!-- Alert settings -->
                    <div class="alert-settings">
                        <h3>Alert Thresholds</h3>
                        <div class="threshold-grid">
                            ${Object.entries(this.thresholds).map(([key, value]) => `
                                <div class="threshold-item">
                                    <label>${this.formatMetricName(key)}</label>
                                    <input type="number" value="${value}" id="threshold-${key}" 
                                           onchange="systemHealthMonitor.updateThreshold('${key}', this.value)">
                                    <span class="threshold-unit">${this.getMetricUnit(key)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Active alerts -->
                    <div class="active-alerts-section">
                        <h3>Active Alerts (${this.alerts.length})</h3>
                        <div class="alerts-list">
                            ${this.alerts.length === 0 ? 
                                '<p class="no-alerts-message">No active alerts at this time</p>' :
                                this.alerts.map(alert => this.renderDetailedAlert(alert)).join('')
                            }
                        </div>
                    </div>

                    <!-- Alert history -->
                    <div class="alert-history-section">
                        <h3>Alert History</h3>
                        <div class="history-controls">
                            <select id="history-filter">
                                <option value="all">All Alerts</option>
                                <option value="critical">Critical Only</option>
                                <option value="warning">Warnings Only</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <button class="btn btn-secondary" onclick="systemHealthMonitor.exportAlertHistory()">
                                📥 Export History
                            </button>
                        </div>
                        <div class="history-placeholder">
                            <p>Alert history would show past 7 days of system alerts with filtering and export options</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="systemHealthMonitor.configureNotifications()">
                        🔔 Configure Notifications
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.updateHealthPanelMetrics();
    }

    /**
     * Render detailed alert
     */
    renderDetailedAlert(alert) {
        return `
            <div class="detailed-alert alert-${alert.type}">
                <div class="alert-header">
                    <span class="alert-icon">${this.getAlertIcon(alert.type)}</span>
                    <span class="alert-category">${alert.category.toUpperCase()}</span>
                    <span class="alert-timestamp">${new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                <div class="alert-content">
                    <h4>${alert.message}</h4>
                    <p>${alert.details}</p>
                    <div class="alert-metrics">
                        <span>Current: ${alert.value}${this.getMetricUnit(alert.metric)}</span>
                        <span>Threshold: ${alert.threshold}${this.getMetricUnit(alert.metric)}</span>
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-secondary" onclick="systemHealthMonitor.acknowledgeAlert('${alert.id}')">
                        Acknowledge
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="systemHealthMonitor.investigateAlert('${alert.id}')">
                        Investigate
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Update health panel metrics
     */
    async updateHealthPanelMetrics() {
        const healthData = await this.getLatestHealthData();
        
        // Update metric values
        document.getElementById('cpu-metric').textContent = `${healthData.cpu.usage}%`;
        document.getElementById('memory-metric').textContent = `${healthData.memory.usagePercent}%`;
        document.getElementById('disk-metric').textContent = `${healthData.disk.usagePercent}%`;
        document.getElementById('response-metric').textContent = `${healthData.performance.avgResponseTime}ms`;

        // Simulate charts
        ['cpu', 'memory', 'disk', 'response'].forEach(metric => {
            const chart = document.getElementById(`${metric}-chart`);
            if (chart) {
                chart.innerHTML = '<div class="mini-chart-placeholder">📊 Real-time chart</div>';
            }
        });
    }

    /**
     * Configure notifications
     */
    configureNotifications() {
        alert(`Notification Configuration would include:

🔔 Alert Channels:
• Email notifications
• SMS alerts for critical issues
• Slack/Discord webhooks
• In-app push notifications

📧 Recipients:
• Admin team members
• On-call engineers
• Escalation contacts

⚙️ Alert Rules:
• Severity-based routing
• Time-based escalation
• Alert grouping and deduplication`);
    }

    /**
     * Export alert history
     */
    exportAlertHistory() {
        alert(`Alert History Export would include:

📊 Export Formats:
• CSV for spreadsheet analysis
• JSON for system integration
• PDF report with charts

📅 Time Ranges:
• Last 24 hours
• Last 7 days
• Last 30 days
• Custom date range

📈 Included Data:
• Alert details and timestamps
• Resolution times
• System metrics at alert time
• Actions taken`);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = 'Current Admin';
            alert.acknowledgedAt = new Date();
            this.renderAlerts();
            this.showSuccess('Alert acknowledged');
        }
    }

    /**
     * Investigate alert
     */
    investigateAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;

        alert(`Investigating ${alert.message}

🔍 Investigation Tools:
• System logs viewer
• Performance profiler
• Database query analyzer
• Network traffic monitor

📊 Relevant Metrics:
• Historical data for ${alert.metric}
• Correlated system events
• Recent deployments
• User activity patterns

🛠️ Quick Actions:
• Restart affected services
• Scale resources
• Clear caches
• Roll back recent changes`);
    }

    /**
     * Update threshold
     */
    updateThreshold(metric, value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            this.thresholds[metric] = numValue;
            this.showSuccess(`${this.formatMetricName(metric)} threshold updated to ${numValue}${this.getMetricUnit(metric)}`);
            // Re-check health with new thresholds
            this.checkSystemHealth();
        }
    }

    /**
     * Simulate real-time alerts
     */
    simulateRealTimeAlerts() {
        // Simulate occasional alerts for demo
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every minute
                const mockAlert = this.generateMockAlert();
                this.updateAlerts([mockAlert]);
            }
        }, 60000);
    }

    /**
     * Generate mock alert
     */
    generateMockAlert() {
        const alertTypes = [
            {
                type: 'warning',
                category: 'performance',
                message: 'Database query slowdown detected',
                details: 'Average query time increased to 450ms',
                metric: 'database',
                value: 450,
                threshold: 200
            },
            {
                type: 'critical',
                category: 'security',
                message: 'Multiple failed login attempts',
                details: '50+ failed attempts from same IP in last 10 minutes',
                metric: 'security',
                value: 50,
                threshold: 20
            },
            {
                type: 'warning',
                category: 'capacity',
                message: 'Approaching user limit',
                details: '9,500 active users (95% of limit)',
                metric: 'users',
                value: 9500,
                threshold: 10000
            }
        ];

        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        return {
            ...alert,
            id: `alert-${Date.now()}`,
            timestamp: new Date()
        };
    }

    /**
     * Get mock health data
     */
    getMockHealthData() {
        return {
            cpu: {
                usage: 45 + Math.random() * 30,
                cores: 8,
                loadAverage: [2.5, 2.8, 2.6]
            },
            memory: {
                total: 16,
                used: 8 + Math.random() * 6,
                free: 2 + Math.random() * 6,
                usagePercent: 50 + Math.random() * 35
            },
            disk: {
                total: 500,
                used: 350 + Math.random() * 100,
                free: 50 + Math.random() * 100,
                usagePercent: 70 + Math.random() * 20
            },
            performance: {
                avgResponseTime: 150 + Math.random() * 350,
                requestsPerSecond: 100 + Math.random() * 200,
                activeConnections: 50 + Math.random() * 150
            },
            errors: {
                count: Math.floor(Math.random() * 50),
                rate: Math.random() * 5,
                lastError: new Date(Date.now() - Math.random() * 3600000)
            },
            services: {
                api: 'healthy',
                database: Math.random() > 0.1 ? 'healthy' : 'degraded',
                cache: 'healthy',
                queue: 'healthy'
            }
        };
    }

    /**
     * Get latest health data
     */
    async getLatestHealthData() {
        try {
            const response = await fetch('/api/admin/system/health');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching health data:', error);
        }
        return this.getMockHealthData();
    }

    /**
     * Subscribe to alerts
     */
    subscribe(callback) {
        this.alertSubscribers.add(callback);
    }

    /**
     * Unsubscribe from alerts
     */
    unsubscribe(callback) {
        this.alertSubscribers.delete(callback);
    }

    /**
     * Notify subscribers of new alert
     */
    notifySubscribers(alert) {
        this.alertSubscribers.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error notifying subscriber:', error);
            }
        });
    }

    /**
     * Utility methods
     */
    getAlertIcon(type) {
        const icons = {
            critical: '🔴',
            warning: '🟡',
            info: 'ℹ️'
        };
        return icons[type] || '📋';
    }

    formatMetricName(metric) {
        const names = {
            cpuUsage: 'CPU Usage',
            memoryUsage: 'Memory Usage',
            diskSpace: 'Disk Space',
            responseTime: 'Response Time',
            errorRate: 'Error Rate',
            activeUsers: 'Active Users'
        };
        return names[metric] || metric;
    }

    getMetricUnit(metric) {
        const units = {
            cpuUsage: '%',
            memoryUsage: '%',
            diskSpace: '%',
            responseTime: 'ms',
            errorRate: '%',
            activeUsers: '',
            database: 'ms',
            security: '',
            users: ''
        };
        return units[metric] || '';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    }

    showSuccess(message) {
        this.adminDashboard.showSuccess(message);
    }

    /**
     * Inject health monitoring styles
     */
    injectHealthStyles() {
        const styles = `
            <style id="health-monitoring-styles">
            .system-health-indicator {
                display: flex;
                align-items: center;
                gap: var(--space-3);
            }

            .health-status {
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-2) var(--space-3);
                border-radius: var(--radius-lg);
                font-weight: var(--font-medium);
            }

            .health-good {
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
            }

            .health-warning {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .health-critical {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
            }

            .health-icon {
                font-size: var(--text-lg);
            }

            .health-alerts-widget {
                background: var(--bg-card);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-xl);
                padding: var(--space-6);
                margin-bottom: var(--space-6);
            }

            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-4);
            }

            .widget-header h3 {
                margin: 0;
                font-size: var(--text-xl);
                color: var(--text-primary);
            }

            .alerts-container {
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
            }

            .no-alerts {
                text-align: center;
                padding: var(--space-8) var(--space-4);
                color: var(--text-muted);
            }

            .no-alerts-icon {
                font-size: var(--text-3xl);
                display: block;
                margin-bottom: var(--space-2);
            }

            .alert-item {
                padding: var(--space-3);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .alert-item:hover {
                transform: translateX(4px);
            }

            .alert-critical {
                background: rgba(239, 68, 68, 0.1);
                border-left: 4px solid var(--error);
            }

            .alert-warning {
                background: rgba(245, 158, 11, 0.1);
                border-left: 4px solid var(--warning);
            }

            .alert-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-1);
            }

            .alert-message {
                font-weight: var(--font-semibold);
                color: var(--text-primary);
                margin-bottom: var(--space-1);
            }

            .alert-details {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .alert-time {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .view-all-alerts {
                text-align: center;
                padding-top: var(--space-3);
            }

            .health-panel-body {
                padding: var(--space-6);
                max-height: 70vh;
                overflow-y: auto;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--space-4);
                margin-bottom: var(--space-8);
            }

            .metric-card {
                background: var(--gray-50);
                padding: var(--space-4);
                border-radius: var(--radius-lg);
                text-align: center;
            }

            .metric-card h4 {
                margin: 0 0 var(--space-2) 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
                text-transform: uppercase;
            }

            .metric-value {
                font-size: var(--text-3xl);
                font-weight: var(--font-bold);
                color: var(--primary-color);
                margin-bottom: var(--space-3);
            }

            .metric-chart {
                height: 60px;
                background: var(--bg-primary);
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .mini-chart-placeholder {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .alert-settings {
                background: var(--gray-50);
                padding: var(--space-6);
                border-radius: var(--radius-lg);
                margin-bottom: var(--space-8);
            }

            .alert-settings h3 {
                margin: 0 0 var(--space-4) 0;
                color: var(--text-primary);
            }

            .threshold-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--space-4);
            }

            .threshold-item {
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }

            .threshold-item label {
                flex: 1;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .threshold-item input {
                width: 80px;
                padding: var(--space-1) var(--space-2);
                border: 1px solid var(--gray-300);
                border-radius: var(--radius-md);
                text-align: right;
            }

            .threshold-unit {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .active-alerts-section,
            .alert-history-section {
                margin-bottom: var(--space-6);
            }

            .active-alerts-section h3,
            .alert-history-section h3 {
                margin: 0 0 var(--space-4) 0;
                color: var(--text-primary);
            }

            .alerts-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
            }

            .detailed-alert {
                padding: var(--space-4);
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
            }

            .alert-content h4 {
                margin: 0 0 var(--space-2) 0;
                color: var(--text-primary);
            }

            .alert-content p {
                margin: 0 0 var(--space-3) 0;
                color: var(--text-secondary);
            }

            .alert-metrics {
                display: flex;
                gap: var(--space-4);
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .alert-actions {
                display: flex;
                gap: var(--space-2);
                margin-top: var(--space-3);
            }

            .history-controls {
                display: flex;
                gap: var(--space-3);
                margin-bottom: var(--space-4);
            }

            .history-controls select {
                padding: var(--space-2);
                border: 1px solid var(--gray-300);
                border-radius: var(--radius-md);
                background: var(--bg-primary);
            }

            .history-placeholder {
                padding: var(--space-8);
                background: var(--gray-50);
                border-radius: var(--radius-lg);
                text-align: center;
                color: var(--text-muted);
            }

            @media (max-width: 768px) {
                .system-health-indicator {
                    flex-direction: column;
                    align-items: stretch;
                }

                .metrics-grid {
                    grid-template-columns: repeat(2, 1fr);
                }

                .threshold-grid {
                    grid-template-columns: 1fr;
                }

                .alert-actions {
                    flex-direction: column;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.alertSubscribers.clear();
    }
}

// Initialize System Health Monitor when admin dashboard is ready
window.addEventListener('load', () => {
    if (window.adminDashboard) {
        window.systemHealthMonitor = new SystemHealthMonitor(window.adminDashboard);
        
        // Example: Subscribe to alerts for custom handling
        window.systemHealthMonitor.subscribe((alert) => {
            console.log('New system alert:', alert);
            
            // Could trigger browser notifications, sounds, etc.
            if (alert.type === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Critical System Alert', {
                    body: alert.message,
                    icon: '/img/alert-icon.png',
                    badge: '/img/alert-badge.png'
                });
            }
        });
    }
});