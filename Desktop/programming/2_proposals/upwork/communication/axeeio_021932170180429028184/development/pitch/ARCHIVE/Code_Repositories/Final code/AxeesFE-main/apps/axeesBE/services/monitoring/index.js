// services/monitoring/index.js
const LatencyMonitor = require('./LatencyMonitor');
const CostTracker = require('./CostTracker');
const KPIDashboard = require('./KPIDashboard');

/**
 * Monitoring Service Factory
 * Provides centralized access to all monitoring components
 */
class MonitoringService {
  constructor(options = {}) {
    this.options = options;
    this.components = {};
    this.initialized = false;
  }

  /**
   * Initialize all monitoring components
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize LatencyMonitor
    this.components.latencyMonitor = new LatencyMonitor({
      ...this.options.latency,
      name: 'MainLatencyMonitor'
    });

    // Initialize CostTracker
    this.components.costTracker = new CostTracker({
      ...this.options.cost,
      name: 'MainCostTracker'
    });

    // Initialize KPIDashboard
    this.components.kpiDashboard = new KPIDashboard({
      ...this.options.kpi,
      name: 'MainKPIDashboard',
      alertChannels: this.options.alertChannels || []
    });

    this.initialized = true;
  }

  /**
   * Get LatencyMonitor instance
   */
  getLatencyMonitor() {
    if (!this.initialized) {
      throw new Error('Monitoring services not initialized');
    }
    return this.components.latencyMonitor;
  }

  /**
   * Get CostTracker instance
   */
  getCostTracker() {
    if (!this.initialized) {
      throw new Error('Monitoring services not initialized');
    }
    return this.components.costTracker;
  }

  /**
   * Get KPIDashboard instance
   */
  getKPIDashboard() {
    if (!this.initialized) {
      throw new Error('Monitoring services not initialized');
    }
    return this.components.kpiDashboard;
  }

  /**
   * Get all monitoring data
   */
  getAllData() {
    if (!this.initialized) {
      throw new Error('Monitoring services not initialized');
    }

    return {
      latency: this.components.latencyMonitor.getStats(),
      costs: this.components.costTracker.getSummary(),
      kpis: this.components.kpiDashboard.getDashboardData()
    };
  }

  /**
   * Stop all monitoring services
   */
  stop() {
    Object.values(this.components).forEach(component => {
      if (component.stop) {
        component.stop();
      }
    });
    this.initialized = false;
  }
}

// Create singleton instance
let monitoringInstance = null;

/**
 * Get or create monitoring service instance
 */
function getMonitoringService(options) {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService(options);
  }
  return monitoringInstance;
}

// Export individual components and factory
module.exports = {
  LatencyMonitor,
  CostTracker,
  KPIDashboard,
  MonitoringService,
  getMonitoringService
};