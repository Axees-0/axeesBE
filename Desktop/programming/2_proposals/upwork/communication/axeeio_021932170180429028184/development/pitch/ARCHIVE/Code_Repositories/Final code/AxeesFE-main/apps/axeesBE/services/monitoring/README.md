# Monitoring Services

This directory contains production-ready monitoring services for tracking latency, costs, and KPIs across the data ingestion and signal processing pipeline.

## Components

### 1. LatencyMonitor
Tracks latency across all pipeline stages with nanosecond precision.

**Features:**
- Pipeline lifecycle tracking (start → data ingestion → signal processing → complete)
- Real-time latency statistics (P50, P90, P95, P99)
- Threshold-based alerting
- Hook system for easy integration

**Usage:**
```javascript
const { LatencyMonitor } = require('./services/monitoring');

const monitor = new LatencyMonitor({
  thresholds: {
    dataIngestion: { warning: 100, critical: 500 },
    signalProcessing: { warning: 50, critical: 200 }
  }
});

// Start pipeline tracking
const pipelineId = monitor.startPipeline('pipeline_123', { source: 'databento' });

// Track data ingestion
monitor.hookDataIngestionStart(pipelineId);
// ... perform ingestion ...
monitor.hookDataIngestionEnd(pipelineId);

// Track signal processing
monitor.hookSignalStart(pipelineId, 'momentum');
// ... process signal ...
monitor.hookSignalEnd(pipelineId, 'momentum');

// Complete pipeline
monitor.completePipeline(pipelineId);
```

### 2. CostTracker
Tracks costs from various sources including Databento billing.

**Features:**
- Provider-specific cost tracking
- Databento billing integration (streaming, historical, bandwidth, requests)
- Cost threshold alerting
- Daily/weekly/monthly rollups
- CSV/JSON export

**Usage:**
```javascript
const { CostTracker } = require('./services/monitoring');

const tracker = new CostTracker({
  alertThresholds: {
    daily: 1000,
    weekly: 5000,
    monthly: 20000
  }
});

// Record Databento costs
tracker.recordDatabento('streaming', 5, { symbol: 'AAPL' }); // 5 minutes
tracker.recordDatabento('bandwidth', 0.5, { dataset: 'XNAS.ITCH' }); // 0.5 GB

// Record infrastructure costs
tracker.recordInfrastructure('compute', 2.5); // 2.5 hours

// Get cost summary
const summary = tracker.getSummary();
```

### 3. KPIDashboard
Centralized KPI monitoring and alerting system.

**Features:**
- Real-time KPI tracking
- Multi-category KPIs (latency, cost, performance, business)
- Alert channel integration
- Historical data retention
- Dashboard API endpoints

**KPI Categories:**
- **Latency**: P95 metrics for all pipeline stages
- **Cost**: Daily costs, cost per signal, Databento costs
- **Performance**: Throughput, success rate, error rate, uptime
- **Business**: Active users, revenue, signals processed

**Usage:**
```javascript
const { KPIDashboard } = require('./services/monitoring');

const dashboard = new KPIDashboard({
  alertChannels: [slackChannel, emailChannel],
  updateInterval: 60000 // 1 minute
});

// Get dashboard data
const data = dashboard.getDashboardData();

// Subscribe to alerts
dashboard.on('kpi:alert', (alert) => {
  console.log('KPI Alert:', alert);
});
```

## API Endpoints

The monitoring services expose REST API endpoints at `/api/monitoring`:

- `GET /api/monitoring/dashboard` - Complete dashboard data
- `GET /api/monitoring/kpis` - Current KPI values
- `GET /api/monitoring/alerts` - Active alerts
- `GET /api/monitoring/latency` - Latency metrics
- `GET /api/monitoring/costs` - Cost tracking data
- `GET /api/monitoring/history` - KPI history
- `POST /api/monitoring/costs/databento` - Record Databento costs
- `POST /api/monitoring/latency/pipeline/start` - Start pipeline tracking

## Integration Example

See `dataIngestionIntegration.js` for a complete example of integrating monitoring into your data pipeline:

```javascript
const { DataIngestionPipeline } = require('./services/monitoring/dataIngestionIntegration');

const pipeline = new DataIngestionPipeline();
await pipeline.initialize();

// Process Databento market data
const signals = await pipeline.processDatabentoBatch({
  symbol: 'AAPL',
  dataset: 'XNAS.ITCH',
  streamDuration: 5,
  records: marketData
});
```

## Configuration

Configure monitoring services in your environment:

```javascript
// Initialize with custom configuration
const monitoring = getMonitoringService({
  latency: {
    enabled: true,
    bufferSize: 10000,
    flushInterval: 60000,
    thresholds: {
      dataIngestion: { warning: 100, critical: 500 },
      signalProcessing: { warning: 50, critical: 200 },
      pipeline: { warning: 200, critical: 1000 }
    }
  },
  cost: {
    enabled: true,
    currency: 'USD',
    dataDir: './data/costs',
    alertThresholds: {
      daily: 1000,
      weekly: 5000,
      monthly: 20000
    }
  },
  kpi: {
    enabled: true,
    updateInterval: 60000,
    alertChannels: []
  }
});
```

## Alert Channels

Implement custom alert channels by creating objects with a `send` method:

```javascript
const slackAlertChannel = {
  send: async (alert) => {
    await slack.postMessage({
      channel: '#monitoring-alerts',
      text: `${alert.severity}: ${alert.message}`
    });
  }
};

dashboard.addAlertChannel(slackAlertChannel);
```

## Monitoring Best Practices

1. **Always use pipeline IDs** - Generate unique IDs for each pipeline run
2. **Handle errors gracefully** - Always complete pipelines even on error
3. **Set appropriate thresholds** - Start conservative and tune based on actual performance
4. **Monitor the monitors** - Check monitoring service health regularly
5. **Export data regularly** - Use export functions to archive historical data

## Troubleshooting

### High Latency Alerts
1. Check pipeline stages to identify bottlenecks
2. Review recent code changes
3. Verify external service (Databento) performance
4. Check system resources

### Cost Overruns
1. Review Databento usage patterns
2. Check for unnecessary API calls
3. Optimize data retention policies
4. Consider batching requests

### Missing Metrics
1. Ensure monitoring is initialized
2. Verify hooks are properly placed
3. Check error logs for failed recordings
4. Validate pipeline IDs are unique