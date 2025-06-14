// services/monitoring/LatencyMonitor.js
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

/**
 * LatencyMonitor - Production-ready latency monitoring service
 * Tracks latency across data ingestion and signal pipeline stages
 */
class LatencyMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = options.name || 'LatencyMonitor';
    this.enabled = options.enabled !== false;
    this.bufferSize = options.bufferSize || 10000;
    this.flushInterval = options.flushInterval || 60000; // 1 minute
    this.thresholds = options.thresholds || {
      dataIngestion: { warning: 100, critical: 500 },
      signalProcessing: { warning: 50, critical: 200 },
      pipeline: { warning: 200, critical: 1000 }
    };
    
    // Metrics storage
    this.metrics = new Map();
    this.buffer = [];
    this.stats = {
      dataIngestion: { count: 0, sum: 0, min: Infinity, max: 0 },
      signalProcessing: { count: 0, sum: 0, min: Infinity, max: 0 },
      pipeline: { count: 0, sum: 0, min: Infinity, max: 0 }
    };
    
    // Pipeline tracking
    this.activePipelines = new Map();
    this.pipelineStages = new Map();
    
    // Start flush timer
    if (this.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Start tracking a pipeline operation
   */
  startPipeline(pipelineId, metadata = {}) {
    if (!this.enabled) return;
    
    const pipeline = {
      id: pipelineId,
      startTime: performance.now(),
      stages: new Map(),
      metadata
    };
    
    this.activePipelines.set(pipelineId, pipeline);
    return pipelineId;
  }

  /**
   * Track data ingestion latency
   */
  recordDataIngestion(pipelineId, duration, metadata = {}) {
    if (!this.enabled) return;
    
    const timestamp = Date.now();
    const metric = {
      type: 'dataIngestion',
      pipelineId,
      duration,
      timestamp,
      metadata
    };
    
    this.addMetric(metric);
    this.updateStats('dataIngestion', duration);
    
    // Track in pipeline
    const pipeline = this.activePipelines.get(pipelineId);
    if (pipeline) {
      pipeline.stages.set('dataIngestion', {
        duration,
        timestamp,
        endTime: performance.now()
      });
    }
    
    // Check thresholds
    this.checkThreshold('dataIngestion', duration, pipelineId);
  }

  /**
   * Track signal processing latency
   */
  recordSignalProcessing(pipelineId, signalType, duration, metadata = {}) {
    if (!this.enabled) return;
    
    const timestamp = Date.now();
    const metric = {
      type: 'signalProcessing',
      pipelineId,
      signalType,
      duration,
      timestamp,
      metadata
    };
    
    this.addMetric(metric);
    this.updateStats('signalProcessing', duration);
    
    // Track in pipeline
    const pipeline = this.activePipelines.get(pipelineId);
    if (pipeline) {
      const stageKey = `signal_${signalType}`;
      pipeline.stages.set(stageKey, {
        duration,
        timestamp,
        endTime: performance.now()
      });
    }
    
    // Check thresholds
    this.checkThreshold('signalProcessing', duration, pipelineId);
  }

  /**
   * Complete pipeline tracking
   */
  completePipeline(pipelineId, metadata = {}) {
    if (!this.enabled) return;
    
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) return;
    
    const endTime = performance.now();
    const totalDuration = endTime - pipeline.startTime;
    
    const metric = {
      type: 'pipeline',
      pipelineId,
      duration: totalDuration,
      timestamp: Date.now(),
      stages: Array.from(pipeline.stages.entries()).map(([stage, data]) => ({
        stage,
        duration: data.duration,
        timestamp: data.timestamp
      })),
      metadata: { ...pipeline.metadata, ...metadata }
    };
    
    this.addMetric(metric);
    this.updateStats('pipeline', totalDuration);
    
    // Clean up
    this.activePipelines.delete(pipelineId);
    
    // Check thresholds
    this.checkThreshold('pipeline', totalDuration, pipelineId);
    
    // Emit completion event
    this.emit('pipelineComplete', {
      pipelineId,
      duration: totalDuration,
      stages: pipeline.stages
    });
  }

  /**
   * Hook for data ingestion start
   */
  hookDataIngestionStart(pipelineId) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    this.pipelineStages.set(`${pipelineId}_ingestion_start`, startTime);
  }

  /**
   * Hook for data ingestion end
   */
  hookDataIngestionEnd(pipelineId, metadata = {}) {
    if (!this.enabled) return;
    
    const startKey = `${pipelineId}_ingestion_start`;
    const startTime = this.pipelineStages.get(startKey);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordDataIngestion(pipelineId, duration, metadata);
      this.pipelineStages.delete(startKey);
    }
  }

  /**
   * Hook for signal processing start
   */
  hookSignalStart(pipelineId, signalType) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    this.pipelineStages.set(`${pipelineId}_signal_${signalType}_start`, startTime);
  }

  /**
   * Hook for signal processing end
   */
  hookSignalEnd(pipelineId, signalType, metadata = {}) {
    if (!this.enabled) return;
    
    const startKey = `${pipelineId}_signal_${signalType}_start`;
    const startTime = this.pipelineStages.get(startKey);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordSignalProcessing(pipelineId, signalType, duration, metadata);
      this.pipelineStages.delete(startKey);
    }
  }

  /**
   * Add metric to buffer
   */
  addMetric(metric) {
    this.buffer.push(metric);
    
    // Trim buffer if needed
    if (this.buffer.length > this.bufferSize) {
      this.buffer = this.buffer.slice(-this.bufferSize);
    }
  }

  /**
   * Update running statistics
   */
  updateStats(type, duration) {
    const stats = this.stats[type];
    if (!stats) return;
    
    stats.count++;
    stats.sum += duration;
    stats.min = Math.min(stats.min, duration);
    stats.max = Math.max(stats.max, duration);
  }

  /**
   * Check if duration exceeds thresholds
   */
  checkThreshold(type, duration, pipelineId) {
    const threshold = this.thresholds[type];
    if (!threshold) return;
    
    if (duration >= threshold.critical) {
      this.emit('threshold:critical', {
        type,
        duration,
        pipelineId,
        threshold: threshold.critical
      });
    } else if (duration >= threshold.warning) {
      this.emit('threshold:warning', {
        type,
        duration,
        pipelineId,
        threshold: threshold.warning
      });
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const stats = {};
    
    Object.entries(this.stats).forEach(([type, data]) => {
      if (data.count > 0) {
        stats[type] = {
          count: data.count,
          average: data.sum / data.count,
          min: data.min,
          max: data.max
        };
      }
    });
    
    return stats;
  }

  /**
   * Get metrics for specific time range
   */
  getMetrics(startTime, endTime, type = null) {
    let metrics = this.buffer.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
    
    if (type) {
      metrics = metrics.filter(m => m.type === type);
    }
    
    return metrics;
  }

  /**
   * Calculate percentiles for a metric type
   */
  calculatePercentiles(type, percentiles = [50, 90, 95, 99]) {
    const durations = this.buffer
      .filter(m => m.type === type)
      .map(m => m.duration)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) return null;
    
    const result = {};
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * durations.length) - 1;
      result[`p${p}`] = durations[Math.max(0, index)];
    });
    
    return result;
  }

  /**
   * Start flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush metrics (emit for external processing)
   */
  flush() {
    if (this.buffer.length === 0) return;
    
    const metrics = [...this.buffer];
    const stats = this.getStats();
    const percentiles = {
      dataIngestion: this.calculatePercentiles('dataIngestion'),
      signalProcessing: this.calculatePercentiles('signalProcessing'),
      pipeline: this.calculatePercentiles('pipeline')
    };
    
    this.emit('flush', {
      timestamp: Date.now(),
      metrics,
      stats,
      percentiles,
      activePipelines: this.activePipelines.size
    });
    
    // Clear buffer after flush
    this.buffer = [];
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.buffer = [];
    this.activePipelines.clear();
    this.pipelineStages.clear();
    
    Object.keys(this.stats).forEach(type => {
      this.stats[type] = { count: 0, sum: 0, min: Infinity, max: 0 };
    });
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.enabled = false;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    this.flush();
  }

  /**
   * Export metrics for external storage
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      buffer: [...this.buffer],
      stats: this.getStats(),
      percentiles: {
        dataIngestion: this.calculatePercentiles('dataIngestion'),
        signalProcessing: this.calculatePercentiles('signalProcessing'),
        pipeline: this.calculatePercentiles('pipeline')
      }
    };
  }
}

module.exports = LatencyMonitor;