// tests/integration/monitoring.test.js
const request = require('supertest');
const express = require('express');
const { LatencyMonitor, CostTracker, KPIDashboard } = require('../../services/monitoring');

describe('Monitoring Services', () => {
  describe('LatencyMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new LatencyMonitor({ enabled: true });
    });

    afterEach(() => {
      monitor.stop();
    });

    it('should track pipeline latency', async () => {
      const pipelineId = 'test_pipeline_123';
      
      // Start pipeline
      monitor.startPipeline(pipelineId, { test: true });
      
      // Track data ingestion
      monitor.hookDataIngestionStart(pipelineId);
      await new Promise(resolve => setTimeout(resolve, 50));
      monitor.hookDataIngestionEnd(pipelineId);
      
      // Track signal processing
      monitor.hookSignalStart(pipelineId, 'test_signal');
      await new Promise(resolve => setTimeout(resolve, 30));
      monitor.hookSignalEnd(pipelineId, 'test_signal');
      
      // Complete pipeline
      monitor.completePipeline(pipelineId);
      
      // Check stats
      const stats = monitor.getStats();
      expect(stats.dataIngestion).toBeDefined();
      expect(stats.dataIngestion.count).toBe(1);
      expect(stats.dataIngestion.average).toBeGreaterThan(40);
    });

    it('should calculate percentiles correctly', () => {
      // Add test data
      for (let i = 0; i < 100; i++) {
        monitor.addMetric({
          type: 'dataIngestion',
          duration: i + 1,
          timestamp: Date.now()
        });
      }
      
      const percentiles = monitor.calculatePercentiles('dataIngestion');
      expect(percentiles.p50).toBe(50);
      expect(percentiles.p90).toBe(90);
      expect(percentiles.p95).toBe(95);
      expect(percentiles.p99).toBe(99);
    });
  });

  describe('CostTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = new CostTracker({ enabled: true, dataDir: './test-costs' });
    });

    afterEach(() => {
      tracker.reset();
    });

    it('should track Databento costs', () => {
      // Record streaming costs
      tracker.recordDatabento('streaming', 10, { symbol: 'AAPL' });
      tracker.recordDatabento('bandwidth', 2.5, { dataset: 'XNAS' });
      
      const databentoCosts = tracker.getDatabentoCosts();
      expect(databentoCosts.streaming).toBe(0.5); // 10 minutes * 0.05
      expect(databentoCosts.bandwidth).toBe(0.25); // 2.5 GB * 0.10
      expect(databentoCosts.total).toBe(0.75);
    });

    it('should track infrastructure costs', () => {
      tracker.recordInfrastructure('compute', 5); // 5 hours
      tracker.recordInfrastructure('storage', 100); // 100 GB
      
      const summary = tracker.getSummary();
      expect(summary.providers.infrastructure).toBeDefined();
      expect(summary.providers.infrastructure.total).toBe(4.8); // (5 * 0.50) + (100 * 0.023)
    });

    it('should calculate daily costs', () => {
      tracker.record('test', 'service1', 100);
      tracker.record('test', 'service2', 200);
      
      const dailyCosts = tracker.getDailyCosts();
      expect(dailyCosts.total).toBe(300);
      expect(dailyCosts.costs.test).toBeDefined();
    });
  });

  describe('KPIDashboard', () => {
    let dashboard;

    beforeEach(() => {
      dashboard = new KPIDashboard({ enabled: true });
    });

    afterEach(() => {
      dashboard.stop();
    });

    it('should collect KPIs', async () => {
      const data = dashboard.getDashboardData();
      
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('definitions');
    });

    it('should track alert thresholds', () => {
      // Simulate high latency
      dashboard.currentKPIs = {
        latency: {
          pipelineP95: 1500 // Above critical threshold
        }
      };
      
      dashboard.checkAllThresholds();
      
      const alerts = Array.from(dashboard.alerts.values());
      const latencyAlert = alerts.find(a => a.kpiName === 'pipelineP95');
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert.status).toBe('critical');
    });
  });

  describe('Monitoring API Routes', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api/monitoring', require('../../routes/monitoring'));
    });

    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/monitoring/dashboard')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return current KPIs', async () => {
      const response = await request(app)
        .get('/api/monitoring/kpis')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.kpis).toBeDefined();
      expect(response.body.status).toBeDefined();
    });

    it('should record Databento costs', async () => {
      const response = await request(app)
        .post('/api/monitoring/costs/databento')
        .send({
          costType: 'streaming',
          usage: 5,
          metadata: { symbol: 'AAPL' }
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it('should handle invalid cost type', async () => {
      const response = await request(app)
        .post('/api/monitoring/costs/databento')
        .send({
          costType: 'invalid',
          usage: 5
        })
        .expect(500);
      
      expect(response.body.success).toBe(false);
    });
  });
});