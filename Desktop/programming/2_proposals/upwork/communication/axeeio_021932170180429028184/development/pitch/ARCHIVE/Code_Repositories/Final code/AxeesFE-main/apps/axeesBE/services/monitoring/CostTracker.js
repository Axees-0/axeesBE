// services/monitoring/CostTracker.js
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * CostTracker - Production-ready cost tracking service
 * Tracks costs from various sources including Databento billing
 */
class CostTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = options.name || 'CostTracker';
    this.enabled = options.enabled !== false;
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'costs');
    this.currency = options.currency || 'USD';
    this.alertThresholds = options.alertThresholds || {
      daily: 1000,
      weekly: 5000,
      monthly: 20000
    };
    
    // Cost tracking
    this.costs = new Map();
    this.dailyCosts = new Map();
    this.providers = new Map();
    
    // Databento specific tracking
    this.databentoCosts = {
      streaming: 0,
      historical: 0,
      requests: 0,
      bandwidth: 0
    };
    
    // Cost rates
    this.costRates = {
      databento: {
        streaming: { perMinute: 0.05, unit: 'minute' },
        historical: { perRequest: 0.001, unit: 'request' },
        bandwidth: { perGB: 0.10, unit: 'GB' },
        requests: { per1000: 0.50, unit: '1000 requests' }
      },
      infrastructure: {
        compute: { perHour: 0.50, unit: 'hour' },
        storage: { perGB: 0.023, unit: 'GB/month' },
        network: { perGB: 0.09, unit: 'GB' }
      }
    };
    
    // Initialize
    if (this.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize cost tracker
   */
  async initialize() {
    try {
      // Create data directory if needed
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load historical costs
      await this.loadHistoricalCosts();
      
      // Start daily cost rollup
      this.startDailyRollup();
      
      // CostTracker initialized successfully
    } catch (error) {
      throw new Error(`Failed to initialize CostTracker: ${error.message}`);
    }
  }

  /**
   * Record a cost entry
   */
  record(provider, service, amount, metadata = {}) {
    if (!this.enabled) return;
    
    const timestamp = Date.now();
    const dateKey = this.getDateKey(timestamp);
    
    const entry = {
      id: `${provider}_${service}_${timestamp}`,
      provider,
      service,
      amount,
      currency: this.currency,
      timestamp,
      metadata
    };
    
    // Add to costs map
    this.costs.set(entry.id, entry);
    
    // Update daily totals
    const dailyKey = `${dateKey}_${provider}_${service}`;
    const currentDaily = this.dailyCosts.get(dailyKey) || 0;
    this.dailyCosts.set(dailyKey, currentDaily + amount);
    
    // Update provider totals
    const providerTotal = this.providers.get(provider) || { total: 0, services: {} };
    providerTotal.total += amount;
    providerTotal.services[service] = (providerTotal.services[service] || 0) + amount;
    this.providers.set(provider, providerTotal);
    
    // Emit cost event
    this.emit('cost:recorded', entry);
    
    // Check thresholds
    this.checkThresholds();
    
    return entry.id;
  }

  /**
   * Record Databento specific costs
   */
  recordDatabento(costType, usage, metadata = {}) {
    if (!this.enabled) return;
    
    const rate = this.costRates.databento[costType];
    if (!rate) {
      throw new Error(`Unknown Databento cost type: ${costType}`);
      return;
    }
    
    // Calculate cost
    let amount = 0;
    switch (costType) {
      case 'streaming':
        amount = usage * rate.perMinute;
        this.databentoCosts.streaming += amount;
        break;
      case 'historical':
        amount = usage * rate.perRequest;
        this.databentoCosts.historical += amount;
        break;
      case 'bandwidth':
        amount = usage * rate.perGB;
        this.databentoCosts.bandwidth += amount;
        break;
      case 'requests':
        amount = (usage / 1000) * rate.per1000;
        this.databentoCosts.requests += amount;
        break;
    }
    
    // Record the cost
    return this.record('databento', costType, amount, {
      ...metadata,
      usage,
      unit: rate.unit,
      rate: rate
    });
  }

  /**
   * Record infrastructure costs
   */
  recordInfrastructure(service, usage, metadata = {}) {
    if (!this.enabled) return;
    
    const rate = this.costRates.infrastructure[service];
    if (!rate) {
      throw new Error(`Unknown infrastructure service: ${service}`);
      return;
    }
    
    // Calculate cost based on service type
    let amount = 0;
    switch (service) {
      case 'compute':
        amount = usage * rate.perHour;
        break;
      case 'storage':
        amount = usage * rate.perGB;
        break;
      case 'network':
        amount = usage * rate.perGB;
        break;
    }
    
    // Record the cost
    return this.record('infrastructure', service, amount, {
      ...metadata,
      usage,
      unit: rate.unit,
      rate: rate
    });
  }

  /**
   * Get costs for a specific time range
   */
  getCosts(startTime, endTime, filters = {}) {
    const costs = Array.from(this.costs.values()).filter(cost => {
      if (cost.timestamp < startTime || cost.timestamp > endTime) {
        return false;
      }
      
      if (filters.provider && cost.provider !== filters.provider) {
        return false;
      }
      
      if (filters.service && cost.service !== filters.service) {
        return false;
      }
      
      return true;
    });
    
    // Calculate totals
    const total = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const byProvider = {};
    const byService = {};
    
    costs.forEach(cost => {
      // By provider
      if (!byProvider[cost.provider]) {
        byProvider[cost.provider] = 0;
      }
      byProvider[cost.provider] += cost.amount;
      
      // By service
      const serviceKey = `${cost.provider}_${cost.service}`;
      if (!byService[serviceKey]) {
        byService[serviceKey] = 0;
      }
      byService[serviceKey] += cost.amount;
    });
    
    return {
      costs,
      total,
      byProvider,
      byService,
      currency: this.currency,
      period: {
        start: new Date(startTime),
        end: new Date(endTime)
      }
    };
  }

  /**
   * Get daily costs
   */
  getDailyCosts(date = new Date()) {
    const dateKey = this.getDateKey(date);
    const dailyEntries = Array.from(this.dailyCosts.entries())
      .filter(([key]) => key.startsWith(dateKey));
    
    const costs = {};
    let total = 0;
    
    dailyEntries.forEach(([key, amount]) => {
      const [, provider, service] = key.split('_');
      if (!costs[provider]) {
        costs[provider] = {};
      }
      costs[provider][service] = amount;
      total += amount;
    });
    
    return {
      date: dateKey,
      total,
      costs,
      currency: this.currency
    };
  }

  /**
   * Get cost summary
   */
  getSummary() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    return {
      providers: Object.fromEntries(this.providers),
      databento: { ...this.databentoCosts },
      periods: {
        daily: this.getCosts(now - day, now),
        weekly: this.getCosts(now - (7 * day), now),
        monthly: this.getCosts(now - (30 * day), now)
      },
      totalCosts: Array.from(this.costs.values()).reduce((sum, cost) => sum + cost.amount, 0),
      currency: this.currency
    };
  }

  /**
   * Check cost thresholds
   */
  checkThresholds() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    // Check daily threshold
    const dailyCosts = this.getCosts(now - day, now);
    if (dailyCosts.total > this.alertThresholds.daily) {
      this.emit('threshold:exceeded', {
        type: 'daily',
        amount: dailyCosts.total,
        threshold: this.alertThresholds.daily,
        currency: this.currency
      });
    }
    
    // Check weekly threshold
    const weeklyCosts = this.getCosts(now - (7 * day), now);
    if (weeklyCosts.total > this.alertThresholds.weekly) {
      this.emit('threshold:exceeded', {
        type: 'weekly',
        amount: weeklyCosts.total,
        threshold: this.alertThresholds.weekly,
        currency: this.currency
      });
    }
    
    // Check monthly threshold
    const monthlyCosts = this.getCosts(now - (30 * day), now);
    if (monthlyCosts.total > this.alertThresholds.monthly) {
      this.emit('threshold:exceeded', {
        type: 'monthly',
        amount: monthlyCosts.total,
        threshold: this.alertThresholds.monthly,
        currency: this.currency
      });
    }
  }

  /**
   * Set alert threshold
   */
  setThreshold(period, amount) {
    this.alertThresholds[period] = amount;
    this.checkThresholds();
  }

  /**
   * Export cost data
   */
  async exportCosts(startTime, endTime, format = 'json') {
    const data = this.getCosts(startTime, endTime);
    const filename = `costs_${new Date(startTime).toISOString().split('T')[0]}_${new Date(endTime).toISOString().split('T')[0]}.${format}`;
    const filepath = path.join(this.dataDir, filename);
    
    if (format === 'json') {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      const csv = this.convertToCSV(data.costs);
      await fs.writeFile(filepath, csv);
    }
    
    return filepath;
  }

  /**
   * Convert costs to CSV format
   */
  convertToCSV(costs) {
    const headers = ['Timestamp', 'Provider', 'Service', 'Amount', 'Currency', 'Metadata'];
    const rows = costs.map(cost => [
      new Date(cost.timestamp).toISOString(),
      cost.provider,
      cost.service,
      cost.amount.toFixed(2),
      cost.currency,
      JSON.stringify(cost.metadata)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Load historical costs
   */
  async loadHistoricalCosts() {
    try {
      const files = await fs.readdir(this.dataDir);
      const costFiles = files.filter(f => f.startsWith('costs_') && f.endsWith('.json'));
      
      for (const file of costFiles) {
        const data = await fs.readFile(path.join(this.dataDir, file), 'utf8');
        const costs = JSON.parse(data);
        
        // Load costs into memory (last 30 days only)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        costs.costs.forEach(cost => {
          if (cost.timestamp > thirtyDaysAgo) {
            this.costs.set(cost.id, cost);
          }
        });
      }
    } catch (error) {
      // Historical costs not found or failed to load - continuing with empty history
    }
  }

  /**
   * Save current costs
   */
  async saveCosts() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const data = this.getCosts(
      yesterday.setHours(0, 0, 0, 0),
      yesterday.setHours(23, 59, 59, 999)
    );
    
    if (data.costs.length > 0) {
      await this.exportCosts(
        yesterday.setHours(0, 0, 0, 0),
        yesterday.setHours(23, 59, 59, 999)
      );
    }
  }

  /**
   * Start daily rollup timer
   */
  startDailyRollup() {
    // Run at midnight every day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      this.saveCosts();
      
      // Set up recurring daily save
      setInterval(() => {
        this.saveCosts();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Get date key for a timestamp
   */
  getDateKey(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  /**
   * Reset cost tracking
   */
  reset() {
    this.costs.clear();
    this.dailyCosts.clear();
    this.providers.clear();
    this.databentoCosts = {
      streaming: 0,
      historical: 0,
      requests: 0,
      bandwidth: 0
    };
  }

  /**
   * Get Databento cost breakdown
   */
  getDatabentoCosts() {
    return {
      ...this.databentoCosts,
      total: Object.values(this.databentoCosts).reduce((sum, cost) => sum + cost, 0),
      currency: this.currency,
      rates: this.costRates.databento
    };
  }

  /**
   * Update cost rate
   */
  updateCostRate(provider, service, rate) {
    if (!this.costRates[provider]) {
      this.costRates[provider] = {};
    }
    
    this.costRates[provider][service] = rate;
    
    this.emit('rate:updated', {
      provider,
      service,
      rate
    });
  }
}

module.exports = CostTracker;