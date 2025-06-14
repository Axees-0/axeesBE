// routes/monitoring.js
const express = require('express');
const router = express.Router();
const { getMonitoringService } = require('../services/monitoring');

/**
 * Monitoring API Routes
 * Provides endpoints for accessing KPIs, metrics, and monitoring data
 */

// Initialize monitoring service
let monitoring;

// Middleware to ensure monitoring is initialized
const ensureMonitoring = async (req, res, next) => {
  if (!monitoring) {
    try {
      monitoring = getMonitoringService({
        latency: {
          enabled: true,
          flushInterval: 60000
        },
        cost: {
          enabled: true,
          currency: 'USD'
        },
        kpi: {
          enabled: true,
          updateInterval: 60000
        }
      });
      await monitoring.initialize();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to initialize monitoring' });
    }
  }
  next();
};

/**
 * GET /api/monitoring/dashboard
 * Get complete dashboard data including all KPIs
 */
router.get('/dashboard', ensureMonitoring, (req, res) => {
  try {
    const dashboard = monitoring.getKPIDashboard();
    const data = dashboard.getDashboardData();
    
    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/kpis
 * Get current KPI values
 */
router.get('/kpis', ensureMonitoring, (req, res) => {
  try {
    const dashboard = monitoring.getKPIDashboard();
    const { current, status } = dashboard.getDashboardData();
    
    res.json({
      success: true,
      kpis: current,
      status,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get active alerts
 */
router.get('/alerts', ensureMonitoring, (req, res) => {
  try {
    const dashboard = monitoring.getKPIDashboard();
    const { alerts } = dashboard.getDashboardData();
    
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/latency
 * Get latency metrics
 */
router.get('/latency', ensureMonitoring, (req, res) => {
  try {
    const latencyMonitor = monitoring.getLatencyMonitor();
    const stats = latencyMonitor.getStats();
    const percentiles = {
      dataIngestion: latencyMonitor.calculatePercentiles('dataIngestion'),
      signalProcessing: latencyMonitor.calculatePercentiles('signalProcessing'),
      pipeline: latencyMonitor.calculatePercentiles('pipeline')
    };
    
    res.json({
      success: true,
      stats,
      percentiles,
      activePipelines: latencyMonitor.activePipelines.size,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/costs
 * Get cost tracking data
 */
router.get('/costs', ensureMonitoring, (req, res) => {
  try {
    const costTracker = monitoring.getCostTracker();
    const summary = costTracker.getSummary();
    const databento = costTracker.getDatabentoCosts();
    
    res.json({
      success: true,
      summary,
      databento,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/costs/daily
 * Get daily cost breakdown
 */
router.get('/costs/daily', ensureMonitoring, (req, res) => {
  try {
    const costTracker = monitoring.getCostTracker();
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dailyCosts = costTracker.getDailyCosts(date);
    
    res.json({
      success: true,
      data: dailyCosts,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/costs/record
 * Record a cost entry (for testing)
 */
router.post('/costs/record', ensureMonitoring, (req, res) => {
  try {
    const { provider, service, amount, metadata } = req.body;
    
    if (!provider || !service || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: provider, service, amount'
      });
    }
    
    const costTracker = monitoring.getCostTracker();
    const id = costTracker.record(provider, service, amount, metadata);
    
    res.json({
      success: true,
      id,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/costs/databento
 * Record Databento-specific costs
 */
router.post('/costs/databento', ensureMonitoring, (req, res) => {
  try {
    const { costType, usage, metadata } = req.body;
    
    if (!costType || usage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: costType, usage'
      });
    }
    
    const costTracker = monitoring.getCostTracker();
    const id = costTracker.recordDatabento(costType, usage, metadata);
    
    res.json({
      success: true,
      id,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/latency/pipeline/start
 * Start tracking a pipeline
 */
router.post('/latency/pipeline/start', ensureMonitoring, (req, res) => {
  try {
    const { pipelineId, metadata } = req.body;
    
    if (!pipelineId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pipelineId'
      });
    }
    
    const latencyMonitor = monitoring.getLatencyMonitor();
    latencyMonitor.startPipeline(pipelineId, metadata);
    
    res.json({
      success: true,
      pipelineId,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/latency/pipeline/complete
 * Complete pipeline tracking
 */
router.post('/latency/pipeline/complete', ensureMonitoring, (req, res) => {
  try {
    const { pipelineId, metadata } = req.body;
    
    if (!pipelineId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pipelineId'
      });
    }
    
    const latencyMonitor = monitoring.getLatencyMonitor();
    latencyMonitor.completePipeline(pipelineId, metadata);
    
    res.json({
      success: true,
      pipelineId,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/history
 * Get KPI history
 */
router.get('/history', ensureMonitoring, (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const dashboard = monitoring.getKPIDashboard();
    const history = dashboard.getRecentHistory(hours);
    
    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/report
 * Export monitoring report
 */
router.get('/report', ensureMonitoring, (req, res) => {
  try {
    const format = req.query.format || 'json';
    const dashboard = monitoring.getKPIDashboard();
    const report = dashboard.exportReport(format);
    
    if (format === 'json') {
      res.json(JSON.parse(report));
    } else {
      res.send(report);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/threshold
 * Update alert threshold
 */
router.post('/threshold', ensureMonitoring, (req, res) => {
  try {
    const { service, period, amount } = req.body;
    
    if (!service || !period || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service, period, amount'
      });
    }
    
    if (service === 'cost') {
      const costTracker = monitoring.getCostTracker();
      costTracker.setThreshold(period, amount);
    }
    
    res.json({
      success: true,
      service,
      period,
      amount,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'monitoring',
    timestamp: Date.now()
  });
});

module.exports = router;