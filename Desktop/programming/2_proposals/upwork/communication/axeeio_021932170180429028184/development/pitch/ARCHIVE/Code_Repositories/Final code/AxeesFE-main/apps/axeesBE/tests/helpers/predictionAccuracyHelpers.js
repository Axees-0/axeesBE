// tests/helpers/predictionAccuracyHelpers.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * PredictionAccuracyValidator - Comprehensive prediction validation and testing
 * 
 * Provides functionality for:
 * - Prediction model accuracy assessment
 * - Performance metrics calculation
 * - Prediction confidence analysis
 * - Model drift detection
 * - A/B testing for prediction models
 * - Real-time accuracy monitoring
 * - Prediction bias detection
 */
class PredictionAccuracyValidator {
  constructor(options = {}) {
    this.options = {
      reportsDir: options.reportsDir || path.join(process.cwd(), 'tests', 'reports'),
      accuracyThresholds: {
        minimum: 0.70,     // 70% minimum accuracy
        target: 0.85,      // 85% target accuracy
        excellent: 0.95    // 95% excellent accuracy
      },
      confidenceThresholds: {
        low: 0.60,
        medium: 0.80,
        high: 0.95
      },
      driftThreshold: 0.05,  // 5% accuracy drift threshold
      ...options
    };

    this.predictions = [];
    this.groundTruth = [];
    this.confidenceScores = [];
    this.predictionMetadata = [];
    
    this.metrics = {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      averageConfidence: 0,
      confusionMatrix: null,
      rocAuc: 0,
      kappa: 0
    };

    this.modelPerformance = {
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      throughput: 0
    };

    this.biasAnalysis = {
      demographicBias: {},
      temporalBias: {},
      geographicalBias: {},
      behavioralBias: {}
    };

    this.startTime = Date.now();
  }

  /**
   * Add prediction result for validation
   */
  addPrediction(prediction, actualValue, confidence = null, metadata = {}) {
    const predictionEntry = {
      id: this.generateId(),
      prediction: prediction,
      actual: actualValue,
      confidence: confidence || this.calculateConfidence(prediction, actualValue),
      timestamp: Date.now(),
      metadata: {
        userId: metadata.userId || null,
        sessionId: metadata.sessionId || null,
        context: metadata.context || {},
        modelVersion: metadata.modelVersion || '1.0.0',
        features: metadata.features || {},
        ...metadata
      }
    };

    this.predictions.push(predictionEntry.prediction);
    this.groundTruth.push(predictionEntry.actual);
    this.confidenceScores.push(predictionEntry.confidence);
    this.predictionMetadata.push(predictionEntry);

    this.metrics.totalPredictions++;
    if (this.isPredictionCorrect(prediction, actualValue)) {
      this.metrics.correctPredictions++;
    }

    this.updateMetrics();
    return predictionEntry;
  }

  /**
   * Generate unique identifier
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Calculate confidence score for prediction
   */
  calculateConfidence(prediction, actual) {
    if (typeof prediction === 'number' && typeof actual === 'number') {
      // For regression problems, use inverse of relative error
      const relativeError = Math.abs(prediction - actual) / Math.max(Math.abs(actual), 1);
      return Math.max(0, 1 - relativeError);
    } else if (prediction === actual) {
      // For classification, exact match gets high confidence
      return 0.95 + Math.random() * 0.05; // 95-100%
    } else {
      // Incorrect predictions get lower confidence
      return 0.2 + Math.random() * 0.3; // 20-50%
    }
  }

  /**
   * Check if prediction is correct
   */
  isPredictionCorrect(prediction, actual) {
    if (typeof prediction === 'number' && typeof actual === 'number') {
      // For numerical predictions, allow some tolerance
      const tolerance = Math.abs(actual) * 0.1 || 0.1; // 10% tolerance
      return Math.abs(prediction - actual) <= tolerance;
    } else {
      // For categorical predictions, exact match
      return prediction === actual;
    }
  }

  /**
   * Update accuracy metrics
   */
  updateMetrics() {
    if (this.metrics.totalPredictions === 0) return;

    this.metrics.accuracy = this.metrics.correctPredictions / this.metrics.totalPredictions;
    this.metrics.averageConfidence = this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length;

    // Calculate precision, recall, F1 for classification problems
    this.calculateClassificationMetrics();
    
    // Calculate confusion matrix if applicable
    this.calculateConfusionMatrix();
    
    // Calculate advanced metrics
    this.calculateAdvancedMetrics();
  }

  /**
   * Calculate classification metrics
   */
  calculateClassificationMetrics() {
    if (this.predictions.length === 0) return;

    // Get unique classes
    const uniqueClasses = [...new Set([...this.predictions, ...this.groundTruth])];
    
    if (uniqueClasses.length === 2 && uniqueClasses.every(c => typeof c === 'boolean' || c === 0 || c === 1)) {
      // Binary classification
      this.calculateBinaryClassificationMetrics();
    } else if (uniqueClasses.every(c => typeof c === 'string' || typeof c === 'number')) {
      // Multi-class classification
      this.calculateMultiClassMetrics();
    }
  }

  /**
   * Calculate binary classification metrics
   */
  calculateBinaryClassificationMetrics() {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < this.predictions.length; i++) {
      const pred = this.predictions[i];
      const actual = this.groundTruth[i];
      
      if (actual && pred) tp++;
      else if (!actual && pred) fp++;
      else if (!actual && !pred) tn++;
      else if (actual && !pred) fn++;
    }

    this.metrics.precision = tp / (tp + fp) || 0;
    this.metrics.recall = tp / (tp + fn) || 0;
    this.metrics.f1Score = 2 * (this.metrics.precision * this.metrics.recall) / (this.metrics.precision + this.metrics.recall) || 0;
  }

  /**
   * Calculate multi-class metrics
   */
  calculateMultiClassMetrics() {
    const classes = [...new Set(this.groundTruth)];
    let totalPrecision = 0, totalRecall = 0;

    classes.forEach(cls => {
      let tp = 0, fp = 0, fn = 0;
      
      for (let i = 0; i < this.predictions.length; i++) {
        const pred = this.predictions[i];
        const actual = this.groundTruth[i];
        
        if (actual === cls && pred === cls) tp++;
        else if (actual !== cls && pred === cls) fp++;
        else if (actual === cls && pred !== cls) fn++;
      }
      
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      
      totalPrecision += precision;
      totalRecall += recall;
    });

    this.metrics.precision = totalPrecision / classes.length;
    this.metrics.recall = totalRecall / classes.length;
    this.metrics.f1Score = 2 * (this.metrics.precision * this.metrics.recall) / (this.metrics.precision + this.metrics.recall) || 0;
  }

  /**
   * Calculate confusion matrix
   */
  calculateConfusionMatrix() {
    const classes = [...new Set([...this.predictions, ...this.groundTruth])].sort();
    const matrix = {};

    classes.forEach(actualClass => {
      matrix[actualClass] = {};
      classes.forEach(predictedClass => {
        matrix[actualClass][predictedClass] = 0;
      });
    });

    for (let i = 0; i < this.predictions.length; i++) {
      const pred = this.predictions[i];
      const actual = this.groundTruth[i];
      if (matrix[actual] && matrix[actual][pred] !== undefined) {
        matrix[actual][pred]++;
      }
    }

    this.metrics.confusionMatrix = matrix;
  }

  /**
   * Calculate advanced metrics
   */
  calculateAdvancedMetrics() {
    // Calculate Cohen's Kappa
    this.calculateKappa();
    
    // Calculate ROC AUC for binary classification
    if (this.isBinaryClassification()) {
      this.calculateROCAUC();
    }
  }

  /**
   * Calculate Cohen's Kappa coefficient
   */
  calculateKappa() {
    if (this.predictions.length === 0) return;

    const observedAccuracy = this.metrics.accuracy;
    
    // Calculate expected accuracy
    const classes = [...new Set(this.groundTruth)];
    let expectedAccuracy = 0;
    
    classes.forEach(cls => {
      const actualCount = this.groundTruth.filter(v => v === cls).length;
      const predictedCount = this.predictions.filter(v => v === cls).length;
      expectedAccuracy += (actualCount * predictedCount) / (this.predictions.length * this.predictions.length);
    });

    this.metrics.kappa = (observedAccuracy - expectedAccuracy) / (1 - expectedAccuracy) || 0;
  }

  /**
   * Check if this is binary classification
   */
  isBinaryClassification() {
    const uniqueClasses = [...new Set([...this.predictions, ...this.groundTruth])];
    return uniqueClasses.length === 2;
  }

  /**
   * Calculate ROC AUC for binary classification
   */
  calculateROCAUC() {
    if (!this.isBinaryClassification() || this.confidenceScores.length === 0) return;

    // Sort by confidence score
    const sortedData = this.predictionMetadata
      .map((meta, i) => ({
        confidence: this.confidenceScores[i],
        actual: this.groundTruth[i],
        prediction: this.predictions[i]
      }))
      .sort((a, b) => b.confidence - a.confidence);

    let auc = 0;
    let tpr = 0; // True Positive Rate
    let fpr = 0; // False Positive Rate
    let prevFpr = 0;

    const positives = this.groundTruth.filter(v => v).length;
    const negatives = this.groundTruth.length - positives;

    if (positives === 0 || negatives === 0) return;

    for (const data of sortedData) {
      if (data.actual) {
        tpr += 1 / positives;
      } else {
        auc += tpr * (fpr - prevFpr);
        prevFpr = fpr;
        fpr += 1 / negatives;
      }
    }

    this.metrics.rocAuc = auc;
  }

  /**
   * Test prediction accuracy over time
   */
  testAccuracyOverTime(timeWindows = [1000, 5000, 10000]) {
    const accuracyOverTime = {};
    const currentTime = Date.now();

    timeWindows.forEach(window => {
      const windowStart = currentTime - window;
      const recentPredictions = this.predictionMetadata.filter(p => p.timestamp >= windowStart);
      
      if (recentPredictions.length > 0) {
        const correct = recentPredictions.filter(p => this.isPredictionCorrect(p.prediction, p.actual)).length;
        accuracyOverTime[`${window}ms`] = {
          accuracy: correct / recentPredictions.length,
          count: recentPredictions.length,
          window: window
        };
      }
    });

    return accuracyOverTime;
  }

  /**
   * Detect model drift
   */
  detectModelDrift(baselineAccuracy) {
    const currentAccuracy = this.metrics.accuracy;
    const drift = Math.abs(currentAccuracy - baselineAccuracy);
    
    return {
      hasDrift: drift > this.options.driftThreshold,
      driftAmount: drift,
      direction: currentAccuracy < baselineAccuracy ? 'degradation' : 'improvement',
      severity: this.getDriftSeverity(drift),
      recommendation: this.getDriftRecommendation(drift, currentAccuracy < baselineAccuracy)
    };
  }

  /**
   * Get drift severity level
   */
  getDriftSeverity(drift) {
    if (drift < 0.02) return 'minimal';
    if (drift < 0.05) return 'moderate';
    if (drift < 0.10) return 'significant';
    return 'critical';
  }

  /**
   * Get drift recommendation
   */
  getDriftRecommendation(drift, isDegradation) {
    if (!isDegradation) {
      return 'Model performance has improved. Consider updating baseline metrics.';
    }
    
    if (drift < 0.02) {
      return 'Minor drift detected. Monitor closely.';
    } else if (drift < 0.05) {
      return 'Moderate drift detected. Consider model retraining.';
    } else if (drift < 0.10) {
      return 'Significant drift detected. Model retraining recommended.';
    } else {
      return 'Critical drift detected. Immediate model retraining required.';
    }
  }

  /**
   * Analyze prediction confidence distribution
   */
  analyzeConfidenceDistribution() {
    if (this.confidenceScores.length === 0) return null;

    const sortedConfidence = [...this.confidenceScores].sort((a, b) => a - b);
    
    return {
      mean: this.metrics.averageConfidence,
      median: sortedConfidence[Math.floor(sortedConfidence.length / 2)],
      min: Math.min(...this.confidenceScores),
      max: Math.max(...this.confidenceScores),
      std: this.calculateStandardDeviation(this.confidenceScores),
      percentiles: {
        p25: sortedConfidence[Math.floor(sortedConfidence.length * 0.25)],
        p75: sortedConfidence[Math.floor(sortedConfidence.length * 0.75)],
        p90: sortedConfidence[Math.floor(sortedConfidence.length * 0.90)],
        p95: sortedConfidence[Math.floor(sortedConfidence.length * 0.95)]
      },
      distribution: this.categorizeConfidenceScores()
    };
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Categorize confidence scores
   */
  categorizeConfidenceScores() {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    this.confidenceScores.forEach(score => {
      if (score < this.options.confidenceThresholds.low) {
        distribution.low++;
      } else if (score < this.options.confidenceThresholds.medium) {
        distribution.medium++;
      } else {
        distribution.high++;
      }
    });

    const total = this.confidenceScores.length;
    return {
      low: { count: distribution.low, percentage: (distribution.low / total) * 100 },
      medium: { count: distribution.medium, percentage: (distribution.medium / total) * 100 },
      high: { count: distribution.high, percentage: (distribution.high / total) * 100 }
    };
  }

  /**
   * Test model performance under load
   */
  async testPerformanceUnderLoad(loadTestConfig = {}) {
    const config = {
      duration: 10000, // 10 seconds
      requestsPerSecond: 100,
      ...loadTestConfig
    };

    const results = {
      startTime: Date.now(),
      endTime: null,
      totalRequests: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      responseTimeStats: {
        min: Infinity,
        max: 0,
        avg: 0,
        p95: 0,
        p99: 0
      },
      memoryUsage: {
        initial: this.getMemoryUsage(),
        peak: 0,
        final: 0
      },
      throughput: 0
    };

    const endTime = Date.now() + config.duration;
    const interval = 1000 / config.requestsPerSecond;
    const responseTimes = [];

    while (Date.now() < endTime) {
      const requestStart = Date.now();
      
      try {
        // Simulate prediction request
        const prediction = this.simulatePrediction();
        const responseTime = Date.now() - requestStart;
        
        responseTimes.push(responseTime);
        results.totalRequests++;
        results.successfulPredictions++;
        
        // Track memory usage
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > results.memoryUsage.peak) {
          results.memoryUsage.peak = currentMemory;
        }
        
      } catch (error) {
        results.failedPredictions++;
      }

      // Wait for next request
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    results.endTime = Date.now();
    results.memoryUsage.final = this.getMemoryUsage();
    
    // Calculate response time statistics
    if (responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);
      results.responseTimeStats.min = responseTimes[0];
      results.responseTimeStats.max = responseTimes[responseTimes.length - 1];
      results.responseTimeStats.avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      results.responseTimeStats.p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      results.responseTimeStats.p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    }
    
    results.throughput = results.successfulPredictions / ((results.endTime - results.startTime) / 1000);
    
    return results;
  }

  /**
   * Simulate a prediction request
   */
  simulatePrediction() {
    // Simulate prediction logic with some processing time
    const processingTime = Math.random() * 50 + 10; // 10-60ms
    const startTime = Date.now();
    
    while (Date.now() - startTime < processingTime) {
      // Busy wait to simulate processing
    }
    
    return {
      prediction: Math.random() > 0.5,
      confidence: Math.random(),
      processingTime: processingTime
    };
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsage() {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }

  /**
   * Analyze prediction bias
   */
  analyzePredictionBias(demographicData = []) {
    if (demographicData.length !== this.predictionMetadata.length) {
      throw new Error('Demographic data length must match prediction data length');
    }

    const biasAnalysis = {
      overall: {
        accuracy: this.metrics.accuracy,
        totalPredictions: this.metrics.totalPredictions
      },
      byDemographic: {},
      biasMetrics: {}
    };

    // Group by demographic attributes
    const demographics = {};
    demographicData.forEach((demo, index) => {
      Object.entries(demo).forEach(([key, value]) => {
        if (!demographics[key]) demographics[key] = {};
        if (!demographics[key][value]) demographics[key][value] = [];
        demographics[key][value].push(index);
      });
    });

    // Calculate accuracy for each demographic group
    Object.entries(demographics).forEach(([attribute, groups]) => {
      biasAnalysis.byDemographic[attribute] = {};
      
      Object.entries(groups).forEach(([value, indices]) => {
        const groupPredictions = indices.map(i => this.predictions[i]);
        const groupActual = indices.map(i => this.groundTruth[i]);
        
        const correct = groupPredictions.filter((pred, idx) => 
          this.isPredictionCorrect(pred, groupActual[idx])
        ).length;
        
        biasAnalysis.byDemographic[attribute][value] = {
          accuracy: correct / indices.length,
          count: indices.length,
          percentage: (indices.length / this.metrics.totalPredictions) * 100
        };
      });
      
      // Calculate bias metrics for this attribute
      const accuracies = Object.values(biasAnalysis.byDemographic[attribute]).map(g => g.accuracy);
      const maxAccuracy = Math.max(...accuracies);
      const minAccuracy = Math.min(...accuracies);
      
      biasAnalysis.biasMetrics[attribute] = {
        maxAccuracy,
        minAccuracy,
        accuracyGap: maxAccuracy - minAccuracy,
        fairnessRatio: minAccuracy / maxAccuracy,
        hasBias: (maxAccuracy - minAccuracy) > 0.05 // 5% threshold
      };
    });

    return biasAnalysis;
  }

  /**
   * Generate comprehensive accuracy report
   */
  async generateAccuracyReport() {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        testDuration: Date.now() - this.startTime,
        totalPredictions: this.metrics.totalPredictions,
        version: '1.0.0'
      },
      
      accuracy: {
        overall: this.metrics.accuracy,
        grade: this.getAccuracyGrade(this.metrics.accuracy),
        meetThreshold: this.metrics.accuracy >= this.options.accuracyThresholds.minimum,
        targetMet: this.metrics.accuracy >= this.options.accuracyThresholds.target
      },
      
      detailedMetrics: {
        accuracy: this.metrics.accuracy,
        precision: this.metrics.precision,
        recall: this.metrics.recall,
        f1Score: this.metrics.f1Score,
        rocAuc: this.metrics.rocAuc,
        kappa: this.metrics.kappa,
        confusionMatrix: this.metrics.confusionMatrix
      },
      
      confidence: this.analyzeConfidenceDistribution(),
      
      accuracyOverTime: this.testAccuracyOverTime(),
      
      recommendations: this.generateRecommendations(),
      
      qualityAssessment: this.assessPredictionQuality()
    };

    // Save report to file
    const reportPath = path.join(this.options.reportsDir, `prediction-accuracy-${Date.now()}.json`);
    try {
      if (!fs.existsSync(this.options.reportsDir)) {
        fs.mkdirSync(this.options.reportsDir, { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      report.reportPath = reportPath;
    } catch (error) {
      console.warn('Failed to save report:', error.message);
    }

    return report;
  }

  /**
   * Get accuracy grade
   */
  getAccuracyGrade(accuracy) {
    if (accuracy >= this.options.accuracyThresholds.excellent) return 'A+';
    if (accuracy >= 0.90) return 'A';
    if (accuracy >= this.options.accuracyThresholds.target) return 'B';
    if (accuracy >= this.options.accuracyThresholds.minimum) return 'C';
    return 'D';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.accuracy < this.options.accuracyThresholds.minimum) {
      recommendations.push({
        priority: 'critical',
        category: 'accuracy',
        issue: `Accuracy ${(this.metrics.accuracy * 100).toFixed(1)}% below minimum threshold`,
        recommendation: 'Model retraining required with improved features and data quality'
      });
    }

    if (this.metrics.averageConfidence < 0.7) {
      recommendations.push({
        priority: 'high',
        category: 'confidence',
        issue: `Low average confidence ${(this.metrics.averageConfidence * 100).toFixed(1)}%`,
        recommendation: 'Review confidence calculation and model uncertainty estimation'
      });
    }

    if (this.metrics.precision < 0.8 && this.metrics.recall < 0.8) {
      recommendations.push({
        priority: 'medium',
        category: 'balance',
        issue: 'Both precision and recall below optimal levels',
        recommendation: 'Balance training data and adjust classification thresholds'
      });
    }

    return recommendations;
  }

  /**
   * Assess prediction quality
   */
  assessPredictionQuality() {
    return {
      dataQuality: {
        completeness: this.metrics.totalPredictions > 100 ? 'good' : 'limited',
        consistency: this.metrics.accuracy > 0.8 ? 'consistent' : 'inconsistent',
        reliability: this.metrics.averageConfidence > 0.8 ? 'reliable' : 'unreliable'
      },
      
      modelQuality: {
        accuracy: this.getAccuracyGrade(this.metrics.accuracy),
        stability: this.metrics.kappa > 0.6 ? 'stable' : 'unstable',
        discrimination: this.metrics.rocAuc > 0.8 ? 'good' : 'fair'
      },
      
      overallQuality: this.calculateOverallQuality()
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality() {
    const scores = {
      accuracy: this.metrics.accuracy,
      confidence: this.metrics.averageConfidence,
      precision: this.metrics.precision,
      recall: this.metrics.recall
    };

    const weights = { accuracy: 0.4, confidence: 0.2, precision: 0.2, recall: 0.2 };
    const weightedScore = Object.entries(scores).reduce((sum, [metric, score]) => {
      return sum + (score * weights[metric]);
    }, 0);

    if (weightedScore >= 0.9) return 'excellent';
    if (weightedScore >= 0.8) return 'good';
    if (weightedScore >= 0.7) return 'fair';
    return 'poor';
  }

  /**
   * Clear all data
   */
  clear() {
    this.predictions = [];
    this.groundTruth = [];
    this.confidenceScores = [];
    this.predictionMetadata = [];
    
    this.metrics = {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      averageConfidence: 0,
      confusionMatrix: null,
      rocAuc: 0,
      kappa: 0
    };

    this.startTime = Date.now();
  }
}

/**
 * PredictionAccuracyAssertions - Assertion helpers for prediction accuracy tests
 */
class PredictionAccuracyAssertions {
  static expectMinimumAccuracy(validator, minAccuracy) {
    expect(validator.metrics.accuracy).toBeGreaterThanOrEqual(minAccuracy);
  }

  static expectHighConfidence(validator, minConfidence = 0.8) {
    expect(validator.metrics.averageConfidence).toBeGreaterThanOrEqual(minConfidence);
  }

  static expectBalancedMetrics(validator, minPrecision = 0.7, minRecall = 0.7) {
    expect(validator.metrics.precision).toBeGreaterThanOrEqual(minPrecision);
    expect(validator.metrics.recall).toBeGreaterThanOrEqual(minRecall);
  }

  static expectNoBias(biasAnalysis, maxGap = 0.1) {
    Object.values(biasAnalysis.biasMetrics).forEach(metric => {
      expect(metric.accuracyGap).toBeLessThanOrEqual(maxGap);
    });
  }

  static expectStablePerformance(performanceResults, maxResponseTime = 1000) {
    expect(performanceResults.responseTimeStats.p95).toBeLessThanOrEqual(maxResponseTime);
  }

  static expectQualityGrade(validator, minGrade) {
    const gradeMapping = { 'A+': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
    const actualGrade = validator.getAccuracyGrade(validator.metrics.accuracy);
    expect(gradeMapping[actualGrade]).toBeGreaterThanOrEqual(gradeMapping[minGrade]);
  }
}

module.exports = {
  PredictionAccuracyValidator,
  PredictionAccuracyAssertions
};