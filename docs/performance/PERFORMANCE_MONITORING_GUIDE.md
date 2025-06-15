# Performance Monitoring Guide

## Overview

This guide provides comprehensive instructions for monitoring the performance of the Axees platform in production environments. It covers tool setup, key metrics, alerting strategies, and troubleshooting procedures.

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Essential Metrics](#essential-metrics)
3. [Tool Configuration](#tool-configuration)
4. [Dashboard Setup](#dashboard-setup)
5. [Alert Configuration](#alert-configuration)
6. [Performance Analysis](#performance-analysis)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Best Practices](#best-practices)

## Monitoring Architecture

### Recommended Stack

```
Application → CloudWatch/Prometheus → Grafana → Alerts
     ↓              ↓                    ↓         ↓
   Logs         Metrics            Dashboards  PagerDuty
     ↓              ↓                    ↓         ↓
   S3/ELK      Time Series DB     Visualization  Team
```

### Data Collection Points

1. **Application Level**
   - API endpoints
   - Database queries
   - Cache operations
   - External service calls

2. **Infrastructure Level**
   - Server resources
   - Network metrics
   - Container health
   - Load balancer stats

3. **Business Level**
   - User activities
   - Transaction volumes
   - Feature usage
   - Error patterns

## Essential Metrics

### Golden Signals

#### 1. Latency
```javascript
// Track API response times
const responseTimeHistogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Usage in Express middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    responseTimeHistogram
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});
```

#### 2. Traffic
```javascript
// Track request rate
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Track active users
const activeUsersGauge = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['user_type']
});
```

#### 3. Errors
```javascript
// Track error rates
const errorCounter = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'error_type']
});

// Track specific error types
const dbErrorCounter = new Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'error_code']
});
```

#### 4. Saturation
```javascript
// Track resource utilization
const cpuGauge = new Gauge({
  name: 'process_cpu_percent',
  help: 'CPU usage percentage'
});

const memoryGauge = new Gauge({
  name: 'process_memory_bytes',
  help: 'Memory usage in bytes'
});

const dbConnectionsGauge = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});
```

### Application-Specific Metrics

#### Chat System Metrics
```javascript
const messagesSentCounter = new Counter({
  name: 'chat_messages_sent_total',
  help: 'Total number of chat messages sent'
});

const activeChatsGauge = new Gauge({
  name: 'chat_rooms_active',
  help: 'Number of active chat rooms'
});

const sseConnectionsGauge = new Gauge({
  name: 'sse_connections_active',
  help: 'Number of active SSE connections'
});
```

#### Business Metrics
```javascript
const offerCounter = new Counter({
  name: 'offers_created_total',
  help: 'Total number of offers created',
  labelNames: ['status', 'platform']
});

const dealCounter = new Counter({
  name: 'deals_completed_total',
  help: 'Total number of deals completed',
  labelNames: ['platform', 'category']
});
```

## Tool Configuration

### CloudWatch Setup (AWS)

1. **Install CloudWatch Agent**
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

2. **Configure Metrics Collection**
```json
{
  "metrics": {
    "namespace": "Axees/Production",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent",
          "inodes_free"
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
```

### Prometheus Setup

1. **Install Prometheus Client**
```bash
npm install prom-client
```

2. **Configure Metrics Endpoint**
```javascript
const client = require('prom-client');
const express = require('express');
const app = express();

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

3. **Prometheus Configuration**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'axees-api'
    static_configs:
      - targets: ['api.axees.com:80']
    metrics_path: '/metrics'
```

## Dashboard Setup

### Grafana Dashboard Configuration

#### API Performance Dashboard
```json
{
  "dashboard": {
    "title": "Axees API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Response Time (P95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_errors_total[5m]) / rate(http_requests_total[5m])"
        }]
      }
    ]
  }
}
```

#### Resource Utilization Dashboard
```json
{
  "panels": [
    {
      "title": "CPU Usage",
      "targets": [{
        "expr": "process_cpu_percent"
      }]
    },
    {
      "title": "Memory Usage",
      "targets": [{
        "expr": "process_memory_bytes / 1024 / 1024"
      }]
    },
    {
      "title": "Database Connections",
      "targets": [{
        "expr": "database_connections_active"
      }]
    }
  ]
}
```

## Alert Configuration

### Critical Alerts

#### High Response Time
```yaml
alert: HighResponseTime
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 5m
labels:
  severity: critical
annotations:
  summary: "High API response time"
  description: "95th percentile response time is {{ $value }}s"
```

#### High Error Rate
```yaml
alert: HighErrorRate
expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
for: 5m
labels:
  severity: critical
annotations:
  summary: "High error rate detected"
  description: "Error rate is {{ $value | humanizePercentage }}"
```

#### Database Connection Exhaustion
```yaml
alert: DatabaseConnectionExhaustion
expr: database_connections_active / database_connections_max > 0.9
for: 5m
labels:
  severity: warning
annotations:
  summary: "Database connection pool near exhaustion"
  description: "{{ $value | humanizePercentage }} of connections in use"
```

### Warning Alerts

#### Memory Usage
```yaml
alert: HighMemoryUsage
expr: process_memory_bytes / process_memory_limit_bytes > 0.8
for: 10m
labels:
  severity: warning
annotations:
  summary: "High memory usage detected"
  description: "Memory usage is {{ $value | humanizePercentage }}"
```

## Performance Analysis

### Response Time Analysis

1. **Identify Slow Endpoints**
```promql
# Top 10 slowest endpoints
topk(10, 
  histogram_quantile(0.95, 
    sum by (route) (
      rate(http_request_duration_seconds_bucket[5m])
    )
  )
)
```

2. **Analyze Trends**
```promql
# Response time trend over 24 hours
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
) 
```

### Load Pattern Analysis

1. **Peak Traffic Times**
```promql
# Requests per minute over 24 hours
rate(http_requests_total[1m])
```

2. **User Activity Patterns**
```promql
# Active users by hour
avg_over_time(active_users_total[1h])
```

### Error Analysis

1. **Error Distribution**
```promql
# Errors by type
sum by (error_type) (
  rate(http_errors_total[5m])
)
```

2. **Error Correlation**
```promql
# Correlation between load and errors
rate(http_errors_total[5m]) / rate(http_requests_total[5m])
```

## Troubleshooting Guide

### High Response Times

1. **Check Database Performance**
```bash
# MongoDB slow query log
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(10).sort({ ts: -1 })
```

2. **Analyze API Traces**
```javascript
// Add request timing middleware
app.use((req, res, next) => {
  req.timings = { start: Date.now() };
  
  // Track database time
  const originalQuery = mongoose.Query.prototype.exec;
  mongoose.Query.prototype.exec = async function() {
    const start = Date.now();
    const result = await originalQuery.apply(this, arguments);
    req.timings.database = (req.timings.database || 0) + (Date.now() - start);
    return result;
  };
  
  res.on('finish', () => {
    const total = Date.now() - req.timings.start;
    if (total > 1000) {
      console.log('Slow request:', {
        path: req.path,
        total,
        database: req.timings.database,
        processing: total - (req.timings.database || 0)
      });
    }
  });
  
  next();
});
```

### Memory Leaks

1. **Heap Snapshot Analysis**
```javascript
// Enable heap snapshots
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot() {
  const fileName = `heap-${Date.now()}.heapsnapshot`;
  const stream = fs.createWriteStream(fileName);
  v8.writeHeapSnapshot(stream);
  console.log(`Heap snapshot written to ${fileName}`);
}

// Take snapshots periodically
setInterval(takeHeapSnapshot, 3600000); // Every hour
```

2. **Memory Profiling**
```javascript
// Track memory growth
let lastMemory = process.memoryUsage();

setInterval(() => {
  const currentMemory = process.memoryUsage();
  const growth = {
    heapUsed: currentMemory.heapUsed - lastMemory.heapUsed,
    external: currentMemory.external - lastMemory.external
  };
  
  if (growth.heapUsed > 10 * 1024 * 1024) { // 10MB growth
    console.warn('Memory growth detected:', growth);
  }
  
  lastMemory = currentMemory;
}, 60000); // Check every minute
```

### Database Connection Issues

1. **Connection Pool Monitoring**
```javascript
// Monitor connection pool
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected');
});

// Log pool stats
setInterval(() => {
  const stats = mongoose.connection.db.serverStatus();
  console.log('Connection pool:', {
    current: stats.connections.current,
    available: stats.connections.available
  });
}, 30000);
```

## Best Practices

### 1. Metric Naming Conventions

Follow Prometheus naming conventions:
- Use lowercase with underscores
- Include unit suffixes (_seconds, _bytes, _total)
- Be descriptive but concise

### 2. Label Cardinality

Avoid high-cardinality labels:
- ❌ user_id, request_id, timestamp
- ✅ status_code, method, endpoint

### 3. Sampling Strategies

For high-volume metrics:
```javascript
// Sample 10% of requests
if (Math.random() < 0.1) {
  metrics.recordDetailedTrace(req);
}
```

### 4. Alert Fatigue Prevention

- Set appropriate thresholds
- Use rate windows (5m, 15m)
- Implement alert suppression
- Group related alerts

### 5. Dashboard Organization

- One dashboard per service/concern
- Use consistent color schemes
- Include annotation markers
- Add documentation links

### 6. Performance Budget

Set and monitor performance budgets:
```javascript
const performanceBudget = {
  api: { p95: 500, p99: 1000 },
  database: { p95: 100, p99: 200 },
  memory: { max: 500 * 1024 * 1024 },
  errorRate: { max: 0.01 }
};
```

## Automation Scripts

### Daily Performance Report
```javascript
const generateDailyReport = async () => {
  const metrics = await getMetricsForPeriod('24h');
  
  const report = {
    date: new Date().toISOString(),
    summary: {
      requests: metrics.totalRequests,
      errors: metrics.totalErrors,
      errorRate: metrics.errorRate,
      p95ResponseTime: metrics.p95ResponseTime,
      peakConcurrentUsers: metrics.peakUsers
    },
    alerts: metrics.alertsFired,
    recommendations: analyzeAndRecommend(metrics)
  };
  
  await sendReport(report);
};
```

### Auto-scaling Triggers
```javascript
const checkScalingTriggers = async () => {
  const metrics = await getCurrentMetrics();
  
  if (metrics.cpuUsage > 80 || metrics.responseTime > 1000) {
    await triggerScaleUp();
  } else if (metrics.cpuUsage < 20 && metrics.instances > 1) {
    await triggerScaleDown();
  }
};
```

## Conclusion

Effective performance monitoring requires a combination of the right tools, meaningful metrics, and proactive analysis. This guide provides the foundation for maintaining optimal performance of the Axees platform. Regular review and adjustment of monitoring strategies ensure continued effectiveness as the system evolves.