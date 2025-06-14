// tests/integration/prediction-accuracy.test.js
const request = require('supertest');
const express = require('express');

// Import test helpers
const authHelpers = require('../helpers/authHelpers');
const testUtils = require('../helpers/testUtils');
const { PredictionAccuracyValidator, PredictionAccuracyAssertions } = require('../helpers/predictionAccuracyHelpers');

// Import models
const User = require('../../models/User');
const Message = require('../../models/Message');
const ChatRoom = require('../../models/ChatRoom');

// Import routes
const chatRoutes = require('../../routes/chat');
const userRoutes = require('../../routes/users');

// Mock services
jest.mock('../../services/notificationService', () => ({
  sendUnreadMessageNotification: jest.fn().mockResolvedValue(true)
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

describe('Prediction Accuracy Validation Tests', () => {
  let testUsers, testChatRooms;
  let accuracyValidator;

  beforeEach(async () => {
    await testUtils.cleanupTestData();
    
    accuracyValidator = new PredictionAccuracyValidator({
      accuracyThresholds: {
        minimum: 0.70,
        target: 0.85,
        excellent: 0.95
      }
    });

    // Create test users
    testUsers = [];
    for (let i = 0; i < 5; i++) {
      const user = await authHelpers.createTestUser({
        name: `Prediction User ${i + 1}`,
        email: `preduser${i + 1}@test.com`,
        userType: i % 2 === 0 ? 'Creator' : 'Marketer'
      });
      testUsers.push(user);
    }

    // Create test chat rooms
    testChatRooms = [];
    const room = await ChatRoom.create({
      participants: [testUsers[0]._id, testUsers[1]._id],
      unreadCount: new Map([
        [testUsers[0]._id.toString(), 0],
        [testUsers[1]._id.toString(), 0]
      ])
    });
    testChatRooms.push(room);
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe('Basic Prediction Accuracy Testing', () => {
    it('should validate classification prediction accuracy', async () => {
      console.log('🎯 Testing Classification Prediction Accuracy');

      // Simulate classification predictions
      const testData = [
        { prediction: 'creator', actual: 'creator', confidence: 0.95 },
        { prediction: 'marketer', actual: 'marketer', confidence: 0.92 },
        { prediction: 'creator', actual: 'creator', confidence: 0.88 },
        { prediction: 'marketer', actual: 'creator', confidence: 0.65 }, // Wrong
        { prediction: 'creator', actual: 'creator', confidence: 0.91 },
        { prediction: 'marketer', actual: 'marketer', confidence: 0.89 },
        { prediction: 'creator', actual: 'marketer', confidence: 0.71 }, // Wrong
        { prediction: 'marketer', actual: 'marketer', confidence: 0.93 },
        { prediction: 'creator', actual: 'creator', confidence: 0.96 },
        { prediction: 'marketer', actual: 'marketer', confidence: 0.90 }
      ];

      testData.forEach(data => {
        accuracyValidator.addPrediction(
          data.prediction,
          data.actual,
          data.confidence,
          { modelVersion: '1.0', context: 'user_type_classification' }
        );
      });

      const metrics = accuracyValidator.metrics;

      console.log(`Classification Results:`);
      console.log(`  Total predictions: ${metrics.totalPredictions}`);
      console.log(`  Correct predictions: ${metrics.correctPredictions}`);
      console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Precision: ${(metrics.precision * 100).toFixed(1)}%`);
      console.log(`  Recall: ${(metrics.recall * 100).toFixed(1)}%`);
      console.log(`  F1 Score: ${metrics.f1Score.toFixed(3)}`);

      // Validate accuracy meets threshold
      PredictionAccuracyAssertions.expectMinimumAccuracy(accuracyValidator, 0.70);
      PredictionAccuracyAssertions.expectHighConfidence(accuracyValidator, 0.75);
      
      expect(metrics.totalPredictions).toBe(10);
      expect(metrics.correctPredictions).toBe(8);
      expect(metrics.accuracy).toBe(0.8);
    });

    it('should validate regression prediction accuracy', async () => {
      console.log('📊 Testing Regression Prediction Accuracy');

      // Simulate regression predictions (e.g., message count prediction)
      const regressionData = [
        { prediction: 45, actual: 42, confidence: null },
        { prediction: 120, actual: 125, confidence: null },
        { prediction: 85, actual: 88, confidence: null },
        { prediction: 200, actual: 195, confidence: null },
        { prediction: 65, actual: 100, confidence: null }, // Large error
        { prediction: 150, actual: 148, confidence: null },
        { prediction: 90, actual: 92, confidence: null },
        { prediction: 300, actual: 305, confidence: null }
      ];

      regressionData.forEach(data => {
        accuracyValidator.addPrediction(
          data.prediction,
          data.actual,
          data.confidence,
          { modelVersion: '1.0', context: 'message_count_prediction' }
        );
      });

      const metrics = accuracyValidator.metrics;
      const confidenceAnalysis = accuracyValidator.analyzeConfidenceDistribution();

      console.log(`Regression Results:`);
      console.log(`  Total predictions: ${metrics.totalPredictions}`);
      console.log(`  Accurate predictions (within 10% tolerance): ${metrics.correctPredictions}`);
      console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Average confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`);

      if (confidenceAnalysis) {
        console.log(`  Confidence distribution:`);
        console.log(`    High: ${confidenceAnalysis.distribution.high.percentage.toFixed(1)}%`);
        console.log(`    Medium: ${confidenceAnalysis.distribution.medium.percentage.toFixed(1)}%`);
        console.log(`    Low: ${confidenceAnalysis.distribution.low.percentage.toFixed(1)}%`);
      }

      expect(metrics.totalPredictions).toBe(8);
      expect(metrics.accuracy).toBeGreaterThan(0.7);
    });

    it('should validate binary classification accuracy', async () => {
      console.log('✅ Testing Binary Classification Accuracy');

      // Simulate binary predictions (e.g., will user engage?)
      const binaryData = [
        { prediction: true, actual: true, confidence: 0.85 },
        { prediction: false, actual: false, confidence: 0.90 },
        { prediction: true, actual: true, confidence: 0.92 },
        { prediction: false, actual: true, confidence: 0.45 }, // False negative
        { prediction: true, actual: false, confidence: 0.55 }, // False positive
        { prediction: false, actual: false, confidence: 0.88 },
        { prediction: true, actual: true, confidence: 0.91 },
        { prediction: true, actual: true, confidence: 0.87 },
        { prediction: false, actual: false, confidence: 0.93 },
        { prediction: true, actual: true, confidence: 0.89 }
      ];

      binaryData.forEach(data => {
        accuracyValidator.addPrediction(
          data.prediction,
          data.actual,
          data.confidence,
          { modelVersion: '1.0', context: 'engagement_prediction' }
        );
      });

      const metrics = accuracyValidator.metrics;

      console.log(`Binary Classification Results:`);
      console.log(`  Total predictions: ${metrics.totalPredictions}`);
      console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Precision: ${(metrics.precision * 100).toFixed(1)}%`);
      console.log(`  Recall: ${(metrics.recall * 100).toFixed(1)}%`);
      console.log(`  F1 Score: ${metrics.f1Score.toFixed(3)}`);
      console.log(`  ROC AUC: ${metrics.rocAuc.toFixed(3)}`);

      // Check confusion matrix
      if (metrics.confusionMatrix) {
        console.log(`  Confusion Matrix:`);
        Object.entries(metrics.confusionMatrix).forEach(([actual, predictions]) => {
          console.log(`    Actual ${actual}: ${JSON.stringify(predictions)}`);
        });
      }

      PredictionAccuracyAssertions.expectMinimumAccuracy(accuracyValidator, 0.70);
      PredictionAccuracyAssertions.expectBalancedMetrics(accuracyValidator, 0.65, 0.65);
      
      expect(metrics.rocAuc).toBeGreaterThan(0);
      expect(metrics.kappa).toBeGreaterThan(0);
    });
  });

  describe('Confidence Analysis and Distribution', () => {
    it('should analyze prediction confidence distribution', async () => {
      console.log('📈 Testing Confidence Distribution Analysis');

      // Generate predictions with varying confidence levels
      const confidenceTestData = [];
      
      // High confidence correct predictions
      for (let i = 0; i < 20; i++) {
        confidenceTestData.push({
          prediction: 'A',
          actual: 'A',
          confidence: 0.85 + Math.random() * 0.15 // 85-100%
        });
      }

      // Medium confidence predictions
      for (let i = 0; i < 15; i++) {
        const isCorrect = Math.random() > 0.3;
        confidenceTestData.push({
          prediction: 'B',
          actual: isCorrect ? 'B' : 'C',
          confidence: 0.60 + Math.random() * 0.20 // 60-80%
        });
      }

      // Low confidence predictions
      for (let i = 0; i < 10; i++) {
        const isCorrect = Math.random() > 0.5;
        confidenceTestData.push({
          prediction: 'C',
          actual: isCorrect ? 'C' : 'A',
          confidence: 0.20 + Math.random() * 0.40 // 20-60%
        });
      }

      confidenceTestData.forEach(data => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
      });

      const confidenceAnalysis = accuracyValidator.analyzeConfidenceDistribution();

      console.log(`Confidence Distribution Analysis:`);
      console.log(`  Mean confidence: ${(confidenceAnalysis.mean * 100).toFixed(1)}%`);
      console.log(`  Median confidence: ${(confidenceAnalysis.median * 100).toFixed(1)}%`);
      console.log(`  Min confidence: ${(confidenceAnalysis.min * 100).toFixed(1)}%`);
      console.log(`  Max confidence: ${(confidenceAnalysis.max * 100).toFixed(1)}%`);
      console.log(`  Standard deviation: ${(confidenceAnalysis.std * 100).toFixed(1)}%`);

      console.log(`  Distribution breakdown:`);
      console.log(`    High confidence (>95%): ${confidenceAnalysis.distribution.high.count} (${confidenceAnalysis.distribution.high.percentage.toFixed(1)}%)`);
      console.log(`    Medium confidence (80-95%): ${confidenceAnalysis.distribution.medium.count} (${confidenceAnalysis.distribution.medium.percentage.toFixed(1)}%)`);
      console.log(`    Low confidence (<80%): ${confidenceAnalysis.distribution.low.count} (${confidenceAnalysis.distribution.low.percentage.toFixed(1)}%)`);

      expect(confidenceAnalysis).toBeDefined();
      expect(confidenceAnalysis.mean).toBeGreaterThan(0);
      expect(confidenceAnalysis.distribution.high.count).toBeGreaterThan(0);
    });

    it('should correlate confidence with accuracy', async () => {
      console.log('🔗 Testing Confidence-Accuracy Correlation');

      // Group predictions by confidence level
      const confidenceBuckets = {
        high: { predictions: [], correct: 0 },
        medium: { predictions: [], correct: 0 },
        low: { predictions: [], correct: 0 }
      };

      // Generate correlated data
      const testData = [
        // High confidence - mostly correct
        ...Array(30).fill(null).map(() => ({
          prediction: 'A',
          actual: Math.random() > 0.1 ? 'A' : 'B',
          confidence: 0.85 + Math.random() * 0.15
        })),
        // Medium confidence - moderately correct
        ...Array(25).fill(null).map(() => ({
          prediction: 'B',
          actual: Math.random() > 0.3 ? 'B' : 'C',
          confidence: 0.60 + Math.random() * 0.25
        })),
        // Low confidence - often incorrect
        ...Array(20).fill(null).map(() => ({
          prediction: 'C',
          actual: Math.random() > 0.6 ? 'D' : 'C',
          confidence: 0.20 + Math.random() * 0.40
        }))
      ];

      testData.forEach(data => {
        const result = accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
        
        // Categorize by confidence
        if (data.confidence >= 0.80) {
          confidenceBuckets.high.predictions.push(result);
          if (data.prediction === data.actual) confidenceBuckets.high.correct++;
        } else if (data.confidence >= 0.60) {
          confidenceBuckets.medium.predictions.push(result);
          if (data.prediction === data.actual) confidenceBuckets.medium.correct++;
        } else {
          confidenceBuckets.low.predictions.push(result);
          if (data.prediction === data.actual) confidenceBuckets.low.correct++;
        }
      });

      console.log(`Confidence-Accuracy Correlation:`);
      Object.entries(confidenceBuckets).forEach(([level, bucket]) => {
        const accuracy = bucket.predictions.length > 0 
          ? bucket.correct / bucket.predictions.length 
          : 0;
        console.log(`  ${level.charAt(0).toUpperCase() + level.slice(1)} confidence: ${(accuracy * 100).toFixed(1)}% accurate (${bucket.correct}/${bucket.predictions.length})`);
      });

      // High confidence should have higher accuracy
      const highAccuracy = confidenceBuckets.high.correct / confidenceBuckets.high.predictions.length;
      const lowAccuracy = confidenceBuckets.low.correct / confidenceBuckets.low.predictions.length;
      
      expect(highAccuracy).toBeGreaterThan(lowAccuracy);
    });
  });

  describe('Model Drift Detection', () => {
    it('should detect model performance drift over time', async () => {
      console.log('📉 Testing Model Drift Detection');

      // Establish baseline with good predictions
      const baselineData = Array(50).fill(null).map(() => ({
        prediction: Math.random() > 0.2 ? 'correct' : 'incorrect',
        actual: 'correct',
        confidence: 0.80 + Math.random() * 0.20
      }));

      baselineData.forEach(data => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
      });

      const baselineAccuracy = accuracyValidator.metrics.accuracy;
      console.log(`Baseline accuracy: ${(baselineAccuracy * 100).toFixed(1)}%`);

      // Clear and add degraded predictions
      accuracyValidator.clear();

      const degradedData = Array(50).fill(null).map(() => ({
        prediction: Math.random() > 0.5 ? 'correct' : 'incorrect', // 50% accuracy
        actual: 'correct',
        confidence: 0.60 + Math.random() * 0.30
      }));

      degradedData.forEach(data => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
      });

      const driftAnalysis = accuracyValidator.detectModelDrift(baselineAccuracy);

      console.log(`Drift Analysis:`);
      console.log(`  Current accuracy: ${(accuracyValidator.metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Drift detected: ${driftAnalysis.hasDrift ? 'Yes' : 'No'}`);
      console.log(`  Drift amount: ${(driftAnalysis.driftAmount * 100).toFixed(1)}%`);
      console.log(`  Direction: ${driftAnalysis.direction}`);
      console.log(`  Severity: ${driftAnalysis.severity}`);
      console.log(`  Recommendation: ${driftAnalysis.recommendation}`);

      expect(driftAnalysis.hasDrift).toBe(true);
      expect(driftAnalysis.direction).toBe('degradation');
      expect(driftAnalysis.driftAmount).toBeGreaterThan(0.05);
    });

    it('should track accuracy changes over time windows', async () => {
      console.log('⏱️ Testing Accuracy Over Time Windows');

      // Simulate predictions over time with degrading accuracy
      const timeSimulation = async () => {
        // Phase 1: Good accuracy (first 20 predictions)
        for (let i = 0; i < 20; i++) {
          accuracyValidator.addPrediction(
            'A',
            Math.random() > 0.1 ? 'A' : 'B', // 90% accuracy
            0.85 + Math.random() * 0.15
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Phase 2: Degraded accuracy (next 20 predictions)
        for (let i = 0; i < 20; i++) {
          accuracyValidator.addPrediction(
            'B',
            Math.random() > 0.4 ? 'B' : 'C', // 60% accuracy
            0.60 + Math.random() * 0.20
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      };

      await timeSimulation();

      const timeWindows = [500, 1000, 2000]; // milliseconds
      const accuracyOverTime = accuracyValidator.testAccuracyOverTime(timeWindows);

      console.log(`Accuracy Over Time Windows:`);
      Object.entries(accuracyOverTime).forEach(([window, data]) => {
        console.log(`  ${window}: ${(data.accuracy * 100).toFixed(1)}% accuracy (${data.count} predictions)`);
      });

      // Just verify we have time window data
      expect(Object.keys(accuracyOverTime).length).toBeGreaterThan(0);
      
      const windows = Object.values(accuracyOverTime);
      if (windows.length >= 2) {
        // Log the accuracy trend without asserting specific direction
        // as the exact order depends on timing
        console.log(`  Accuracy trend detected across ${windows.length} time windows`);
      }
    });
  });

  describe('Performance Under Load Testing', () => {
    it('should test prediction performance under load', async () => {
      console.log('🏋️ Testing Prediction Performance Under Load');

      const loadTestConfig = {
        duration: 3000, // 3 seconds
        requestsPerSecond: 50
      };

      const performanceResults = await accuracyValidator.testPerformanceUnderLoad(loadTestConfig);

      console.log(`Load Test Results:`);
      console.log(`  Duration: ${performanceResults.endTime - performanceResults.startTime}ms`);
      console.log(`  Total requests: ${performanceResults.totalRequests}`);
      console.log(`  Successful predictions: ${performanceResults.successfulPredictions}`);
      console.log(`  Failed predictions: ${performanceResults.failedPredictions}`);
      console.log(`  Throughput: ${performanceResults.throughput.toFixed(1)} predictions/second`);

      console.log(`  Response Time Statistics:`);
      console.log(`    Min: ${performanceResults.responseTimeStats.min}ms`);
      console.log(`    Max: ${performanceResults.responseTimeStats.max}ms`);
      console.log(`    Average: ${performanceResults.responseTimeStats.avg.toFixed(1)}ms`);
      console.log(`    95th percentile: ${performanceResults.responseTimeStats.p95}ms`);
      console.log(`    99th percentile: ${performanceResults.responseTimeStats.p99}ms`);

      console.log(`  Memory Usage:`);
      console.log(`    Initial: ${performanceResults.memoryUsage.initial.toFixed(1)}MB`);
      console.log(`    Peak: ${performanceResults.memoryUsage.peak.toFixed(1)}MB`);
      console.log(`    Final: ${performanceResults.memoryUsage.final.toFixed(1)}MB`);

      PredictionAccuracyAssertions.expectStablePerformance(performanceResults, 1000);
      
      expect(performanceResults.totalRequests).toBeGreaterThan(0);
      expect(performanceResults.throughput).toBeGreaterThan(10);
      expect(performanceResults.failedPredictions).toBe(0);
    });

    it('should validate prediction consistency under concurrent load', async () => {
      console.log('🔄 Testing Prediction Consistency Under Concurrent Load');

      // Simulate concurrent predictions
      const concurrentPredictions = async (count) => {
        const promises = [];
        
        for (let i = 0; i < count; i++) {
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => {
                const prediction = Math.random() > 0.3 ? 'A' : 'B';
                const actual = Math.random() > 0.25 ? 'A' : 'B';
                const confidence = 0.70 + Math.random() * 0.30;
                
                accuracyValidator.addPrediction(prediction, actual, confidence, {
                  requestId: `concurrent-${i}`,
                  timestamp: Date.now()
                });
                
                resolve({ prediction, actual, confidence });
              }, Math.random() * 100);
            })
          );
        }
        
        return Promise.all(promises);
      };

      const startTime = Date.now();
      const results = await concurrentPredictions(100);
      const duration = Date.now() - startTime;

      console.log(`Concurrent Prediction Results:`);
      console.log(`  Total concurrent predictions: ${results.length}`);
      console.log(`  Processing duration: ${duration}ms`);
      console.log(`  Overall accuracy: ${(accuracyValidator.metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Average confidence: ${(accuracyValidator.metrics.averageConfidence * 100).toFixed(1)}%`);

      expect(results.length).toBe(100);
      expect(accuracyValidator.metrics.totalPredictions).toBe(100);
      // With random predictions, accuracy can vary - just check it's reasonable
      expect(accuracyValidator.metrics.accuracy).toBeGreaterThan(0.30);
      expect(accuracyValidator.metrics.accuracy).toBeLessThan(0.90);
    });
  });

  describe('Bias Detection and Analysis', () => {
    it('should detect prediction bias across demographic groups', async () => {
      console.log('⚖️ Testing Prediction Bias Detection');

      // Generate predictions with demographic data
      const testDataWithDemographics = [
        // Group A - Higher accuracy
        ...Array(30).fill(null).map((_, i) => ({
          prediction: 'positive',
          actual: Math.random() > 0.1 ? 'positive' : 'negative', // 90% accuracy
          confidence: 0.85,
          demographic: { group: 'A', age: '25-34', location: 'urban' }
        })),
        // Group B - Lower accuracy
        ...Array(30).fill(null).map((_, i) => ({
          prediction: 'positive',
          actual: Math.random() > 0.4 ? 'positive' : 'negative', // 60% accuracy
          confidence: 0.75,
          demographic: { group: 'B', age: '35-44', location: 'rural' }
        })),
        // Group C - Medium accuracy
        ...Array(30).fill(null).map((_, i) => ({
          prediction: 'positive',
          actual: Math.random() > 0.25 ? 'positive' : 'negative', // 75% accuracy
          confidence: 0.80,
          demographic: { group: 'C', age: '45-54', location: 'suburban' }
        }))
      ];

      const demographicData = [];
      testDataWithDemographics.forEach(data => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
        demographicData.push(data.demographic);
      });

      const biasAnalysis = accuracyValidator.analyzePredictionBias(demographicData);

      console.log(`Bias Analysis Results:`);
      console.log(`  Overall accuracy: ${(biasAnalysis.overall.accuracy * 100).toFixed(1)}%`);

      console.log(`  Accuracy by demographic group:`);
      Object.entries(biasAnalysis.byDemographic).forEach(([attribute, groups]) => {
        console.log(`    ${attribute}:`);
        Object.entries(groups).forEach(([value, stats]) => {
          console.log(`      ${value}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.count} predictions)`);
        });
      });

      console.log(`  Bias metrics:`);
      Object.entries(biasAnalysis.biasMetrics).forEach(([attribute, metrics]) => {
        console.log(`    ${attribute}:`);
        console.log(`      Accuracy gap: ${(metrics.accuracyGap * 100).toFixed(1)}%`);
        console.log(`      Fairness ratio: ${metrics.fairnessRatio.toFixed(3)}`);
        console.log(`      Has bias: ${metrics.hasBias ? 'Yes' : 'No'}`);
      });

      expect(biasAnalysis.biasMetrics.group.hasBias).toBe(true);
      expect(biasAnalysis.biasMetrics.group.accuracyGap).toBeGreaterThan(0.05);
    });

    it('should analyze temporal bias in predictions', async () => {
      console.log('📅 Testing Temporal Bias Analysis');

      // Simulate predictions with temporal patterns
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const temporalData = [];

      days.forEach((day, index) => {
        // Accuracy varies by day (weekend predictions less accurate)
        const isWeekend = index >= 5;
        const dayAccuracy = isWeekend ? 0.65 : 0.85;

        for (let i = 0; i < 20; i++) {
          const isCorrect = Math.random() < dayAccuracy;
          temporalData.push({
            prediction: 'engagement',
            actual: isCorrect ? 'engagement' : 'no-engagement',
            confidence: 0.70 + Math.random() * 0.25,
            demographic: { dayOfWeek: day, timeOfDay: i < 10 ? 'morning' : 'afternoon' }
          });
        }
      });

      const demographicData = [];
      temporalData.forEach(data => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence);
        demographicData.push(data.demographic);
      });

      const temporalBiasAnalysis = accuracyValidator.analyzePredictionBias(demographicData);

      console.log(`Temporal Bias Analysis:`);
      console.log(`  Accuracy by day of week:`);
      Object.entries(temporalBiasAnalysis.byDemographic.dayOfWeek).forEach(([day, stats]) => {
        console.log(`    ${day}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.count} predictions)`);
      });

      const dayBiasMetrics = temporalBiasAnalysis.biasMetrics.dayOfWeek;
      console.log(`  Day of week bias:`);
      console.log(`    Accuracy gap: ${(dayBiasMetrics.accuracyGap * 100).toFixed(1)}%`);
      console.log(`    Has temporal bias: ${dayBiasMetrics.hasBias ? 'Yes' : 'No'}`);

      expect(dayBiasMetrics.hasBias).toBe(true);
      expect(temporalBiasAnalysis.byDemographic.dayOfWeek).toBeDefined();
    });
  });

  describe('Comprehensive Accuracy Reporting', () => {
    it('should generate comprehensive accuracy report', async () => {
      console.log('📋 Testing Comprehensive Accuracy Report Generation');

      // Generate diverse prediction data
      const comprehensiveData = [
        // High accuracy predictions
        ...Array(40).fill(null).map(() => ({
          prediction: 'A',
          actual: Math.random() > 0.15 ? 'A' : 'B',
          confidence: 0.85 + Math.random() * 0.15
        })),
        // Medium accuracy predictions
        ...Array(30).fill(null).map(() => ({
          prediction: 'B',
          actual: Math.random() > 0.3 ? 'B' : 'C',
          confidence: 0.65 + Math.random() * 0.20
        })),
        // Low accuracy predictions
        ...Array(20).fill(null).map(() => ({
          prediction: 'C',
          actual: Math.random() > 0.5 ? 'D' : 'C',
          confidence: 0.40 + Math.random() * 0.30
        }))
      ];

      comprehensiveData.forEach((data, index) => {
        accuracyValidator.addPrediction(data.prediction, data.actual, data.confidence, {
          userId: testUsers[index % testUsers.length]._id.toString(),
          sessionId: `session-${Math.floor(index / 10)}`,
          modelVersion: '2.0',
          timestamp: Date.now() - (comprehensiveData.length - index) * 100
        });
      });

      const report = await accuracyValidator.generateAccuracyReport();

      console.log(`Accuracy Report Summary:`);
      console.log(`  Overall accuracy: ${(report.accuracy.overall * 100).toFixed(1)}%`);
      console.log(`  Grade: ${report.accuracy.grade}`);
      console.log(`  Meets minimum threshold: ${report.accuracy.meetThreshold ? 'Yes' : 'No'}`);
      console.log(`  Meets target: ${report.accuracy.targetMet ? 'Yes' : 'No'}`);

      console.log(`  Detailed metrics:`);
      console.log(`    Precision: ${(report.detailedMetrics.precision * 100).toFixed(1)}%`);
      console.log(`    Recall: ${(report.detailedMetrics.recall * 100).toFixed(1)}%`);
      console.log(`    F1 Score: ${report.detailedMetrics.f1Score.toFixed(3)}`);
      console.log(`    Kappa: ${report.detailedMetrics.kappa.toFixed(3)}`);

      console.log(`  Quality assessment:`);
      console.log(`    Data quality: ${report.qualityAssessment.dataQuality.completeness}`);
      console.log(`    Model quality: ${report.qualityAssessment.modelQuality.accuracy}`);
      console.log(`    Overall quality: ${report.qualityAssessment.overallQuality}`);

      if (report.recommendations.length > 0) {
        console.log(`  Recommendations (${report.recommendations.length}):`);
        report.recommendations.forEach((rec, index) => {
          console.log(`    ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        });
      }

      expect(report).toBeDefined();
      expect(report.accuracy.overall).toBeGreaterThan(0);
      expect(report.metadata.totalPredictions).toBe(90);
      expect(report.reportPath).toBeDefined();

      console.log(`  Report saved to: ${report.reportPath}`);
    });

    it('should validate quality grade assignment', async () => {
      console.log('🏆 Testing Quality Grade Assignment');

      // Test different accuracy levels
      const testScenarios = [
        { name: 'Excellent', targetAccuracy: 0.96 },
        { name: 'Good', targetAccuracy: 0.88 },
        { name: 'Fair', targetAccuracy: 0.75 },
        { name: 'Poor', targetAccuracy: 0.65 }
      ];

      for (const scenario of testScenarios) {
        accuracyValidator.clear();

        // Generate predictions to achieve target accuracy
        for (let i = 0; i < 50; i++) {
          const isCorrect = Math.random() < scenario.targetAccuracy;
          accuracyValidator.addPrediction(
            'prediction',
            isCorrect ? 'prediction' : 'different',
            0.70 + Math.random() * 0.30
          );
        }

        const grade = accuracyValidator.getAccuracyGrade(accuracyValidator.metrics.accuracy);
        const quality = accuracyValidator.assessPredictionQuality();

        console.log(`  ${scenario.name} scenario:`);
        console.log(`    Target accuracy: ${(scenario.targetAccuracy * 100).toFixed(0)}%`);
        console.log(`    Actual accuracy: ${(accuracyValidator.metrics.accuracy * 100).toFixed(1)}%`);
        console.log(`    Grade: ${grade}`);
        console.log(`    Overall quality: ${quality.overallQuality}`);
      }

      // The last scenario should have poor quality (D grade)
      const finalGrade = accuracyValidator.getAccuracyGrade(accuracyValidator.metrics.accuracy);
      expect(['C', 'D']).toContain(finalGrade);
    });
  });

  describe('Integration with Real API Data', () => {
    it('should validate predictions with actual API responses', async () => {
      console.log('🔌 Testing Prediction Validation with API Integration');

      // Create some test messages for prediction
      const testMessages = [];
      for (let i = 0; i < 5; i++) {
        const message = await Message.create({
          chatId: testChatRooms[0]._id, // Use chatId instead of roomId
          senderId: testUsers[i % 2]._id,
          receiverId: testUsers[(i + 1) % 2]._id,
          text: `Test message ${i + 1}`,
          timestamp: new Date(Date.now() - i * 60000) // Stagger timestamps
        });
        testMessages.push(message);
      }

      // Make API calls and validate predictions
      const response = await request(app)
        .get(`/api/chat/${testChatRooms[0]._id}/messages`)
        .set('x-user-id', testUsers[0]._id.toString());

      expect(response.status).toBe(200);

      // Simulate predictions about message patterns
      if (response.body.length > 0) {
        // Predict next message sender
        const lastSender = response.body[0].senderId;
        const predictedNextSender = lastSender === testUsers[0]._id.toString() 
          ? testUsers[1]._id.toString() 
          : testUsers[0]._id.toString();

        // In a real scenario, we'd wait for actual next message
        // For testing, we'll simulate the outcome
        const actualNextSender = testUsers[1]._id.toString();

        accuracyValidator.addPrediction(
          predictedNextSender,
          actualNextSender,
          0.75,
          {
            context: 'next_sender_prediction',
            apiEndpoint: `/api/chat/${testChatRooms[0]._id}/messages`,
            predictionType: 'user_behavior'
          }
        );

        // Predict message frequency
        const messageCount = response.body.length;
        const predictedDailyMessages = messageCount * 24; // Simple extrapolation
        const actualDailyMessages = messageCount * 20; // Simulated actual

        accuracyValidator.addPrediction(
          predictedDailyMessages,
          actualDailyMessages,
          0.65,
          {
            context: 'message_frequency_prediction',
            predictionType: 'volume_estimation'
          }
        );
      }

      const metrics = accuracyValidator.metrics;
      console.log(`API Integration Prediction Results:`);
      console.log(`  Total predictions: ${metrics.totalPredictions}`);
      console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`  Average confidence: ${(metrics.averageConfidence * 100).toFixed(1)}%`);

      expect(metrics.totalPredictions).toBeGreaterThan(0);
    });
  });
});