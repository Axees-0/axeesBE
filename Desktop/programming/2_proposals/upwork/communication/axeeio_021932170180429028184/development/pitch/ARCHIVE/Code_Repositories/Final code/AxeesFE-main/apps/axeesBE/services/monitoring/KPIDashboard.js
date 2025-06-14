// services/monitoring/KPIDashboard.js
const EventEmitter = require('events');
const LatencyMonitor = require('./LatencyMonitor');
const CostTracker = require('./CostTracker');

/**
 * KPIDashboard - Centralized KPI monitoring and alerting
 * Surfaces all KPIs on dashboard and alert channels
 */
class KPIDashboard extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = options.name || 'KPIDashboard';
    this.enabled = options.enabled !== false;
    this.updateInterval = options.updateInterval || 60000; // 1 minute
    this.alertChannels = options.alertChannels || [];
    
    // KPI definitions
    this.kpiDefinitions = {
      // Latency KPIs
      latency: {
        dataIngestionP95: { threshold: 100, unit: 'ms', critical: 500 },
        signalProcessingP95: { threshold: 50, unit: 'ms', critical: 200 },
        pipelineP95: { threshold: 200, unit: 'ms', critical: 1000 },
        averageLatency: { threshold: 100, unit: 'ms', critical: 300 }
      },
      
      // Cost KPIs
      cost: {
        dailyCost: { threshold: 1000, unit: 'USD', critical: 2000 },
        databentoCost: { threshold: 500, unit: 'USD', critical: 1000 },
        costPerSignal: { threshold: 0.01, unit: 'USD', critical: 0.05 },
        infrastructureCost: { threshold: 500, unit: 'USD', critical: 1000 }
      },
      
      // Performance KPIs
      performance: {
        throughput: { threshold: 1000, unit: 'signals/sec', critical: 500 },
        successRate: { threshold: 99.5, unit: '%', critical: 95 },
        errorRate: { threshold: 0.5, unit: '%', critical: 5 },
        uptime: { threshold: 99.9, unit: '%', critical: 99 }
      },
      
      // Business KPIs
      business: {
        activeUsers: { threshold: 100, unit: 'users', critical: 50 },
        revenue: { threshold: 10000, unit: 'USD', critical: 5000 },
        signalsProcessed: { threshold: 1000000, unit: 'signals', critical: 500000 },
        apiUsage: { threshold: 1000000, unit: 'requests', critical: 2000000 }
      }
    };
    
    // Current KPI values
    this.currentKPIs = {};
    this.kpiHistory = new Map();
    this.alerts = new Map();
    
    // Component references
    this.latencyMonitor = null;
    this.costTracker = null;
    
    // Initialize
    if (this.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize KPI Dashboard
   */
  initialize() {
    // Initialize monitoring components
    this.latencyMonitor = new LatencyMonitor({ name: 'KPI_LatencyMonitor' });
    this.costTracker = new CostTracker({ name: 'KPI_CostTracker' });
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start KPI collection
    this.startKPICollection();
    
    // KPI Dashboard initialized successfully
  }

  /**
   * Set up event listeners for monitoring components
   */
  setupEventListeners() {
    // Latency events
    this.latencyMonitor.on('flush', (data) => {
      this.updateLatencyKPIs(data);
    });
    
    this.latencyMonitor.on('threshold:critical', (event) => {
      this.handleCriticalAlert('latency', event);
    });
    
    // Cost events
    this.costTracker.on('cost:recorded', (cost) => {
      this.updateCostKPIs();
    });
    
    this.costTracker.on('threshold:exceeded', (event) => {
      this.handleCriticalAlert('cost', event);
    });
  }

  /**
   * Start KPI collection
   */
  startKPICollection() {
    // Initial collection
    this.collectAllKPIs();
    
    // Schedule regular updates
    this.collectionTimer = setInterval(() => {
      this.collectAllKPIs();
    }, this.updateInterval);
  }

  /**
   * Collect all KPIs
   */
  async collectAllKPIs() {
    const timestamp = Date.now();
    
    // Collect latency KPIs
    const latencyKPIs = this.collectLatencyKPIs();
    
    // Collect cost KPIs
    const costKPIs = this.collectCostKPIs();
    
    // Collect performance KPIs
    const performanceKPIs = await this.collectPerformanceKPIs();
    
    // Collect business KPIs
    const businessKPIs = await this.collectBusinessKPIs();
    
    // Update current KPIs
    this.currentKPIs = {
      timestamp,
      latency: latencyKPIs,
      cost: costKPIs,
      performance: performanceKPIs,
      business: businessKPIs
    };
    
    // Store in history
    this.addToHistory(timestamp, this.currentKPIs);
    
    // Check all KPI thresholds
    this.checkAllThresholds();
    
    // Emit update event
    this.emit('kpi:updated', this.currentKPIs);
  }

  /**
   * Collect latency KPIs
   */
  collectLatencyKPIs() {
    const stats = this.latencyMonitor.getStats();
    const percentiles = {
      dataIngestion: this.latencyMonitor.calculatePercentiles('dataIngestion'),
      signalProcessing: this.latencyMonitor.calculatePercentiles('signalProcessing'),
      pipeline: this.latencyMonitor.calculatePercentiles('pipeline')
    };
    
    return {
      dataIngestionP95: percentiles.dataIngestion?.p95 || 0,
      signalProcessingP95: percentiles.signalProcessing?.p95 || 0,
      pipelineP95: percentiles.pipeline?.p95 || 0,
      averageLatency: stats.pipeline?.average || 0
    };
  }

  /**
   * Collect cost KPIs
   */
  collectCostKPIs() {
    const summary = this.costTracker.getSummary();
    const databentoCosts = this.costTracker.getDatabentoCosts();
    
    // Calculate cost per signal
    const signalsProcessed = this.currentKPIs.business?.signalsProcessed || 1;
    const costPerSignal = summary.totalCosts / signalsProcessed;
    
    return {
      dailyCost: summary.periods.daily.total,
      databentoCost: databentoCosts.total,
      costPerSignal: costPerSignal,
      infrastructureCost: summary.providers.infrastructure?.total || 0
    };
  }

  /**
   * Collect performance KPIs
   */
  async collectPerformanceKPIs() {
    // These would typically come from your application metrics
    // For now, returning sample data
    return {
      throughput: this.calculateThroughput(),
      successRate: this.calculateSuccessRate(),
      errorRate: this.calculateErrorRate(),
      uptime: this.calculateUptime()
    };
  }

  /**
   * Collect business KPIs
   */
  async collectBusinessKPIs() {
    // These would typically come from your database
    // For now, returning sample data
    return {
      activeUsers: await this.getActiveUserCount(),
      revenue: await this.getRevenue(),
      signalsProcessed: await this.getSignalsProcessedCount(),
      apiUsage: await this.getAPIUsageCount()
    };
  }

  /**
   * Update latency KPIs from monitor data
   */
  updateLatencyKPIs(data) {
    if (data.percentiles) {
      const latencyKPIs = {
        dataIngestionP95: data.percentiles.dataIngestion?.p95 || 0,
        signalProcessingP95: data.percentiles.signalProcessing?.p95 || 0,
        pipelineP95: data.percentiles.pipeline?.p95 || 0
      };
      
      Object.assign(this.currentKPIs.latency || {}, latencyKPIs);
    }
  }

  /**
   * Update cost KPIs
   */
  updateCostKPIs() {
    const costKPIs = this.collectCostKPIs();
    Object.assign(this.currentKPIs.cost || {}, costKPIs);
  }

  /**
   * Check all KPI thresholds
   */
  checkAllThresholds() {
    Object.entries(this.kpiDefinitions).forEach(([category, kpis]) => {
      Object.entries(kpis).forEach(([kpiName, definition]) => {
        const value = this.currentKPIs[category]?.[kpiName];
        if (value !== undefined) {
          this.checkThreshold(category, kpiName, value, definition);
        }
      });
    });
  }

  /**
   * Check individual KPI threshold
   */
  checkThreshold(category, kpiName, value, definition) {
    const key = `${category}.${kpiName}`;
    
    // Check if we need to compare inversely (like success rate)
    const isInverseMetric = ['successRate', 'uptime'].includes(kpiName);
    
    let status = 'normal';
    let exceeded = false;
    
    if (isInverseMetric) {
      if (value < definition.critical) {
        status = 'critical';
        exceeded = true;
      } else if (value < definition.threshold) {
        status = 'warning';
        exceeded = true;
      }
    } else {
      if (value > definition.critical) {
        status = 'critical';
        exceeded = true;
      } else if (value > definition.threshold) {
        status = 'warning';
        exceeded = true;
      }
    }
    
    // Check if alert state changed
    const currentAlert = this.alerts.get(key);
    if (!currentAlert || currentAlert.status !== status) {
      if (exceeded) {
        const alert = {
          category,
          kpiName,
          value,
          threshold: definition.threshold,
          critical: definition.critical,
          unit: definition.unit,
          status,
          timestamp: Date.now()
        };
        
        this.alerts.set(key, alert);
        this.sendAlert(alert);
      } else if (currentAlert) {
        // Clear alert
        this.alerts.delete(key);
        this.sendRecovery(currentAlert);
      }
    }
  }

  /**
   * Send alert to configured channels
   */
  sendAlert(alert) {
    // KPI Alert triggered
    
    // Emit alert event
    this.emit('kpi:alert', alert);
    
    // Send to alert channels
    this.alertChannels.forEach(channel => {
      channel.send({
        type: 'kpi_alert',
        severity: alert.status,
        alert
      });
    });
  }

  /**
   * Send recovery notification
   */
  sendRecovery(alert) {
    // KPI recovered to normal
    
    // Emit recovery event
    this.emit('kpi:recovery', alert);
    
    // Send to alert channels
    this.alertChannels.forEach(channel => {
      channel.send({
        type: 'kpi_recovery',
        alert
      });
    });
  }

  /**
   * Handle critical alerts from components
   */
  handleCriticalAlert(source, event) {
    const alert = {
      source,
      event,
      timestamp: Date.now(),
      status: 'critical'
    };
    
    this.sendAlert(alert);
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    return {
      current: this.currentKPIs,
      alerts: Array.from(this.alerts.values()),
      history: this.getRecentHistory(),
      definitions: this.kpiDefinitions,
      status: this.getOverallStatus()
    };
  }

  /**
   * Get recent KPI history
   */
  getRecentHistory(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const history = [];
    
    this.kpiHistory.forEach((data, timestamp) => {
      if (timestamp > cutoff) {
        history.push({ timestamp, ...data });
      }
    });
    
    return history.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Add to history
   */
  addToHistory(timestamp, data) {
    this.kpiHistory.set(timestamp, data);
    
    // Trim old history (keep 7 days)
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (const [ts] of this.kpiHistory) {
      if (ts < cutoff) {
        this.kpiHistory.delete(ts);
      } else {
        break; // Map is ordered, so we can stop once we hit recent entries
      }
    }
  }

  /**
   * Get overall system status
   */
  getOverallStatus() {
    const alertCount = this.alerts.size;
    const criticalCount = Array.from(this.alerts.values()).filter(a => a.status === 'critical').length;
    
    if (criticalCount > 0) {
      return 'critical';
    } else if (alertCount > 0) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Add alert channel
   */
  addAlertChannel(channel) {
    this.alertChannels.push(channel);
  }

  /**
   * Export KPI report
   */
  exportReport(format = 'json') {
    const report = {
      generated: new Date().toISOString(),
      status: this.getOverallStatus(),
      current: this.currentKPIs,
      alerts: Array.from(this.alerts.values()),
      summary: this.generateSummary()
    };
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }
    
    // Add other formats as needed
    return report;
  }

  /**
   * Generate KPI summary
   */
  generateSummary() {
    const summary = {
      categories: {}
    };
    
    Object.entries(this.currentKPIs).forEach(([category, kpis]) => {
      if (typeof kpis === 'object' && !Array.isArray(kpis)) {
        summary.categories[category] = {
          kpis: Object.keys(kpis).length,
          alerts: Array.from(this.alerts.values()).filter(a => a.category === category).length
        };
      }
    });
    
    return summary;
  }

  // Mock methods for demonstration - replace with actual implementations
  calculateThroughput() {
    return Math.random() * 2000 + 500;
  }

  calculateSuccessRate() {
    return 99 + Math.random();
  }

  calculateErrorRate() {
    return Math.random() * 2;
  }

  calculateUptime() {
    return 99.5 + Math.random() * 0.5;
  }

  async getActiveUserCount() {
    return Math.floor(Math.random() * 200 + 50);
  }

  async getRevenue() {
    return Math.random() * 20000 + 5000;
  }

  async getSignalsProcessedCount() {
    return Math.floor(Math.random() * 2000000 + 500000);
  }

  async getAPIUsageCount() {
    return Math.floor(Math.random() * 2000000 + 500000);
  }

  /**
   * Stop dashboard
   */
  stop() {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }
    
    if (this.latencyMonitor) {
      this.latencyMonitor.stop();
    }
    
    this.enabled = false;
  }
}

module.exports = KPIDashboard;