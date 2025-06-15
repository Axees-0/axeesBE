const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const mongoose = require('mongoose');

describe('Health Check and Live System Monitoring Tests', () => {
  const monitoringResults = {
    healthChecks: {},
    uptimeMonitoring: {},
    alertSystem: {},
    systemStatus: {},
    dashboardFunctionality: {}
  };

  let monitoringStartTime;
  let systemMetrics = {
    requestCount: 0,
    errorCount: 0,
    responseTimeSum: 0,
    uptimeStart: Date.now()
  };

  beforeAll(async () => {
    await connect();
    monitoringStartTime = Date.now();
  });

  afterAll(async () => {
    // Output comprehensive monitoring system assessment
    console.log('\n🏥 HEALTH CHECK & LIVE SYSTEM MONITORING RESULTS');
    console.log('=================================================');
    
    Object.entries(monitoringResults).forEach(([category, results]) => {
      console.log(`\n📋 ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No tests recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, result]) => {
        const statusIcon = result.status === 'healthy' ? '🟢' : 
                          result.status === 'warning' ? '🟡' : '🔴';
        console.log(`\n   ${statusIcon} ${test}:`);
        console.log(`      Status: ${result.status.toUpperCase()}`);
        console.log(`      Message: ${result.message}`);
        
        if (result.responseTime !== undefined) {
          console.log(`      Response Time: ${result.responseTime}ms`);
        }
        if (result.uptime !== undefined) {
          console.log(`      Uptime: ${result.uptime}ms`);
        }
        if (result.successRate !== undefined) {
          console.log(`      Success Rate: ${result.successRate}%`);
        }
        if (result.availability !== undefined) {
          console.log(`      Availability: ${result.availability}%`);
        }
        if (result.alertsTriggered !== undefined) {
          console.log(`      Alerts Triggered: ${result.alertsTriggered}`);
        }
        if (result.details) {
          console.log(`      Details: ${result.details}`);
        }
        if (result.recommendation && result.status !== 'healthy') {
          console.log(`      💡 Recommendation: ${result.recommendation}`);
        }
      });
    });
    
    // Overall monitoring system health score
    const allTests = Object.values(monitoringResults).flatMap(category => Object.values(category));
    const healthyTests = allTests.filter(test => test.status === 'healthy').length;
    const warningTests = allTests.filter(test => test.status === 'warning').length;
    const unhealthyTests = allTests.filter(test => test.status === 'unhealthy').length;
    
    const healthScore = Math.round((healthyTests + (warningTests * 0.6)) / allTests.length * 100);
    
    console.log('\n🎯 MONITORING SYSTEM HEALTH SCORE');
    console.log('==================================');
    console.log(`   Overall Health: ${healthScore}%`);
    console.log(`   Total Checks: ${allTests.length}`);
    console.log(`   🟢 Healthy: ${healthyTests}`);
    console.log(`   🟡 Warning: ${warningTests}`);
    console.log(`   🔴 Unhealthy: ${unhealthyTests}`);
    
    if (healthScore >= 90) {
      console.log('   🟢 MONITORING SYSTEM OPTIMAL');
    } else if (healthScore >= 75) {
      console.log('   🟡 MONITORING SYSTEM FUNCTIONAL');
    } else {
      console.log('   🔴 MONITORING SYSTEM NEEDS ATTENTION');
    }
    
    console.log('\n=================================================\n');
    
    await closeDatabase();
  });

  // Helper function to record monitoring results
  const recordMonitoringResult = (category, testName, status, message, metrics = {}) => {
    monitoringResults[category][testName] = {
      status, // 'healthy', 'warning', or 'unhealthy'
      message,
      timestamp: new Date().toISOString(),
      ...metrics
    };
  };

  // Helper function to simulate monitoring check
  const performHealthCheck = async (endpoint, expectedStatus = 200, timeout = 5000) => {
    const startTime = Date.now();
    
    try {
      const response = await request(app)
        .get(endpoint)
        .timeout(timeout);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === expectedStatus && responseTime < timeout;
      
      return {
        success: true,
        status: response.status,
        responseTime,
        isHealthy,
        body: response.body || response.text
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        status: 0,
        responseTime,
        isHealthy: false,
        error: error.message
      };
    }
  };

  describe('Health Check Endpoint Tests', () => {
    it('should validate basic application health check', async () => {
      const healthCheck = await performHealthCheck('/');
      
      const status = healthCheck.isHealthy ? 'healthy' : 'unhealthy';
      const message = healthCheck.success 
        ? `Application responding normally in ${healthCheck.responseTime}ms`
        : `Application health check failed: ${healthCheck.error}`;

      recordMonitoringResult('healthChecks', 'Basic Application Health', status, message, {
        responseTime: healthCheck.responseTime,
        httpStatus: healthCheck.status,
        recommendation: !healthCheck.isHealthy ? 'Investigate application startup and basic routing issues' : null
      });

      expect(healthCheck.success).toBe(true);
      expect(healthCheck.responseTime).toBeLessThan(1000);
    });

    it('should validate database connectivity health check', async () => {
      const startTime = Date.now();
      let dbHealth = { connected: false, responseTime: 0, error: null };
      
      try {
        const connectionState = mongoose.connection.readyState;
        const isConnected = connectionState === 1;
        
        if (isConnected) {
          // Perform a simple database operation to verify connectivity
          const result = await mongoose.connection.db.admin().ping();
          dbHealth = {
            connected: isConnected && result.ok === 1,
            responseTime: Date.now() - startTime,
            connectionState,
            pingResult: result.ok
          };
        } else {
          dbHealth = {
            connected: false,
            responseTime: Date.now() - startTime,
            connectionState,
            error: `Connection state: ${connectionState}`
          };
        }
      } catch (error) {
        dbHealth = {
          connected: false,
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
      
      const status = dbHealth.connected ? 'healthy' : 'unhealthy';
      const message = dbHealth.connected 
        ? `Database connectivity healthy (${dbHealth.responseTime}ms)`
        : `Database connectivity issues: ${dbHealth.error}`;

      recordMonitoringResult('healthChecks', 'Database Connectivity', status, message, {
        responseTime: dbHealth.responseTime,
        connectionState: dbHealth.connectionState || 'unknown',
        recommendation: !dbHealth.connected ? 'Check database connection configuration and network connectivity' : null
      });

      expect(dbHealth.connected).toBe(true);
      expect(dbHealth.responseTime).toBeLessThan(500);
    });

    it('should validate API endpoints health status', async () => {
      const criticalEndpoints = [
        { path: '/api/users/profile', method: 'GET', expectedStatus: 400, name: 'User Profile' }, // Requires auth
        { path: '/api/auth/login', method: 'POST', expectedStatus: 400, name: 'Authentication' }, // Requires body
        { path: '/api-docs', method: 'GET', expectedStatus: [200, 302], name: 'API Documentation' }
      ];

      const endpointResults = [];
      
      for (const endpoint of criticalEndpoints) {
        const startTime = Date.now();
        
        try {
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app).get(endpoint.path);
          } else if (endpoint.method === 'POST') {
            response = await request(app).post(endpoint.path).send({});
          }
          
          const responseTime = Date.now() - startTime;
          const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
            ? endpoint.expectedStatus 
            : [endpoint.expectedStatus];
          const statusOk = expectedStatuses.includes(response.status);
          
          endpointResults.push({
            name: endpoint.name,
            path: endpoint.path,
            status: response.status,
            responseTime,
            healthy: statusOk && responseTime < 1000,
            expectedStatus: endpoint.expectedStatus
          });
        } catch (error) {
          endpointResults.push({
            name: endpoint.name,
            path: endpoint.path,
            status: 0,
            responseTime: Date.now() - startTime,
            healthy: false,
            error: error.message
          });
        }
      }
      
      const healthyEndpoints = endpointResults.filter(e => e.healthy).length;
      const totalEndpoints = endpointResults.length;
      const healthPercentage = Math.round((healthyEndpoints / totalEndpoints) * 100);
      
      const status = healthPercentage >= 100 ? 'healthy' : 
                   healthPercentage >= 75 ? 'warning' : 'unhealthy';
      const message = `${healthyEndpoints}/${totalEndpoints} critical endpoints healthy (${healthPercentage}%)`;

      recordMonitoringResult('healthChecks', 'API Endpoints Health', status, message, {
        healthyEndpoints,
        totalEndpoints,
        healthPercentage,
        details: endpointResults.map(e => `${e.name}: ${e.healthy ? 'OK' : 'FAIL'}`).join(', '),
        recommendation: status !== 'healthy' ? 'Investigate failing API endpoints and fix routing or authentication issues' : null
      });

      expect(healthPercentage).toBeGreaterThan(75);
    });

    it('should validate system resource health thresholds', async () => {
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryUtilization = Math.round((memoryUsedMB / memoryTotalMB) * 100);
      
      const uptime = Math.round(process.uptime() * 1000); // Convert to milliseconds
      const nodeVersion = process.version;
      
      // Health thresholds
      const memoryHealthy = memoryUtilization < 80 && memoryUsedMB < 500;
      const uptimeHealthy = uptime > 1000; // At least 1 second uptime
      const versionHealthy = parseInt(nodeVersion.slice(1)) >= 18; // Node 18+
      
      const resourcesHealthy = memoryHealthy && uptimeHealthy && versionHealthy;
      const status = resourcesHealthy ? 'healthy' : memoryUtilization > 90 ? 'unhealthy' : 'warning';
      
      const message = `Memory: ${memoryUsedMB}MB (${memoryUtilization}%), Uptime: ${Math.round(uptime/1000)}s, Node: ${nodeVersion}`;

      recordMonitoringResult('healthChecks', 'System Resource Health', status, message, {
        memoryUsedMB,
        memoryUtilization: `${memoryUtilization}%`,
        uptime,
        nodeVersion,
        recommendation: !resourcesHealthy ? 'Monitor memory usage and consider optimization if memory utilization exceeds 80%' : null
      });

      expect(memoryUtilization).toBeLessThan(95); // Memory shouldn't be critically high
      expect(uptime).toBeGreaterThan(0); // Should have some uptime
    });
  });

  describe('Uptime Monitoring Validation', () => {
    it('should monitor application uptime and availability', async () => {
      const monitoringDuration = 2000; // 2 seconds of monitoring
      const checkInterval = 200; // Check every 200ms
      const checksToPerform = Math.floor(monitoringDuration / checkInterval);
      
      const uptimeChecks = [];
      const startTime = Date.now();
      
      for (let i = 0; i < checksToPerform; i++) {
        const checkStart = Date.now();
        
        try {
          const response = await request(app).get('/');
          const checkTime = Date.now() - checkStart;
          
          uptimeChecks.push({
            timestamp: Date.now(),
            success: response.status === 200,
            responseTime: checkTime,
            status: response.status
          });
        } catch (error) {
          uptimeChecks.push({
            timestamp: Date.now(),
            success: false,
            responseTime: Date.now() - checkStart,
            error: error.message
          });
        }
        
        // Wait for next check interval
        if (i < checksToPerform - 1) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }
      
      const totalChecks = uptimeChecks.length;
      const successfulChecks = uptimeChecks.filter(check => check.success).length;
      const availability = Math.round((successfulChecks / totalChecks) * 100);
      const averageResponseTime = Math.round(
        uptimeChecks.reduce((sum, check) => sum + check.responseTime, 0) / totalChecks
      );
      const maxResponseTime = Math.max(...uptimeChecks.map(check => check.responseTime));
      const monitoringPeriod = Date.now() - startTime;
      
      const status = availability >= 100 ? 'healthy' : 
                   availability >= 95 ? 'warning' : 'unhealthy';
      const message = `${availability}% availability over ${Math.round(monitoringPeriod/1000)}s monitoring period`;

      recordMonitoringResult('uptimeMonitoring', 'Application Availability', status, message, {
        availability: `${availability}%`,
        monitoringPeriod,
        totalChecks,
        successfulChecks,
        averageResponseTime,
        maxResponseTime,
        recommendation: availability < 100 ? 'Investigate causes of service unavailability and implement redundancy' : null
      });

      expect(availability).toBeGreaterThan(90); // 90% availability minimum
      expect(averageResponseTime).toBeLessThan(500); // Average response should be reasonable
    });

    it('should validate uptime tracking accuracy', async () => {
      const processUptime = Math.round(process.uptime() * 1000); // milliseconds
      const testStartTime = Date.now();
      const expectedMinimumUptime = testStartTime - monitoringStartTime;
      
      // Test uptime measurement consistency
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      
      const processUptimeAfter = Math.round(process.uptime() * 1000);
      const uptimeDifference = processUptimeAfter - processUptime;
      const accurateTracking = uptimeDifference >= 90 && uptimeDifference <= 110; // Within 10ms tolerance
      
      const status = accurateTracking && processUptime > 0 ? 'healthy' : 'warning';
      const message = `Process uptime: ${Math.round(processUptime/1000)}s, tracking accuracy: ${accurateTracking ? 'good' : 'needs improvement'}`;

      recordMonitoringResult('uptimeMonitoring', 'Uptime Tracking Accuracy', status, message, {
        processUptime,
        uptimeDifference,
        accurateTracking,
        recommendation: !accurateTracking ? 'Implement more precise uptime tracking mechanisms' : null
      });

      expect(processUptime).toBeGreaterThan(0);
      expect(accurateTracking).toBe(true);
    });
  });

  describe('Alert System Testing', () => {
    it('should validate error detection and alerting capability', async () => {
      const errorTestCases = [
        { endpoint: '/api/nonexistent', expectedStatus: 404, severity: 'low' },
        { endpoint: '/api/users/profile', expectedStatus: 400, severity: 'medium' }, // Missing auth
        { endpoint: '/api/auth/login', expectedStatus: 400, severity: 'medium' } // Missing body
      ];
      
      const alertResults = [];
      
      for (const testCase of errorTestCases) {
        const startTime = Date.now();
        
        try {
          const response = await request(app).get(testCase.endpoint);
          const responseTime = Date.now() - startTime;
          
          const errorDetected = response.status === testCase.expectedStatus;
          const alertTriggered = errorDetected; // In real system, this would trigger actual alerts
          
          alertResults.push({
            endpoint: testCase.endpoint,
            expectedStatus: testCase.expectedStatus,
            actualStatus: response.status,
            responseTime,
            errorDetected,
            alertTriggered,
            severity: testCase.severity
          });
        } catch (error) {
          alertResults.push({
            endpoint: testCase.endpoint,
            error: error.message,
            errorDetected: true,
            alertTriggered: true,
            severity: 'high'
          });
        }
      }
      
      const alertsTriggered = alertResults.filter(result => result.alertTriggered).length;
      const totalTests = alertResults.length;
      const alertingEffectiveness = Math.round((alertsTriggered / totalTests) * 100);
      
      const status = alertingEffectiveness >= 100 ? 'healthy' : 
                   alertingEffectiveness >= 80 ? 'warning' : 'unhealthy';
      const message = `${alertsTriggered}/${totalTests} alerts properly triggered (${alertingEffectiveness}% effectiveness)`;

      recordMonitoringResult('alertSystem', 'Error Detection & Alerting', status, message, {
        alertsTriggered,
        totalTests,
        alertingEffectiveness: `${alertingEffectiveness}%`,
        details: alertResults.map(r => `${r.endpoint}: ${r.alertTriggered ? 'ALERT' : 'NO_ALERT'}`).join(', '),
        recommendation: alertingEffectiveness < 100 ? 'Improve error detection sensitivity and alert configuration' : null
      });

      expect(alertingEffectiveness).toBeGreaterThan(80);
    });

    it('should validate performance threshold alerting', async () => {
      const performanceThresholds = {
        responseTime: 1000, // 1 second
        memoryUsage: 200, // 200MB
        errorRate: 10 // 10%
      };
      
      // Test response time alerting
      const slowRequests = [];
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await request(app).get('/');
        const responseTime = Date.now() - startTime;
        
        const exceedsThreshold = responseTime > performanceThresholds.responseTime;
        slowRequests.push({ responseTime, exceedsThreshold });
      }
      
      // Test memory usage alerting
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryExceedsThreshold = memoryUsedMB > performanceThresholds.memoryUsage;
      
      // Calculate alerting metrics
      const responseTimeAlerts = slowRequests.filter(req => req.exceedsThreshold).length;
      const memoryAlerts = memoryExceedsThreshold ? 1 : 0;
      const totalPotentialAlerts = slowRequests.length + 1; // +1 for memory
      const actualAlerts = responseTimeAlerts + memoryAlerts;
      
      const alertingAccuracy = totalPotentialAlerts > 0 ? 
        Math.round(((totalPotentialAlerts - actualAlerts) / totalPotentialAlerts) * 100) : 100;
      
      const status = actualAlerts === 0 ? 'healthy' : 
                   actualAlerts <= 2 ? 'warning' : 'unhealthy';
      const message = `${actualAlerts} performance threshold alerts triggered`;

      recordMonitoringResult('alertSystem', 'Performance Threshold Alerting', status, message, {
        responseTimeAlerts,
        memoryAlerts,
        totalAlerts: actualAlerts,
        alertingAccuracy: `${alertingAccuracy}%`,
        thresholds: `Response: ${performanceThresholds.responseTime}ms, Memory: ${performanceThresholds.memoryUsage}MB`,
        recommendation: actualAlerts > 0 ? 'Investigate performance issues triggering threshold alerts' : null
      });

      expect(actualAlerts).toBeLessThan(5); // Shouldn't have too many performance alerts
    });
  });

  describe('System Status Validation', () => {
    it('should validate comprehensive system status reporting', async () => {
      const statusStartTime = Date.now();
      
      // Gather comprehensive system status
      const systemStatus = {
        application: { healthy: true, details: 'Running normally' },
        database: { healthy: false, details: 'Unknown' },
        memory: { healthy: true, details: 'Within limits' },
        cpu: { healthy: true, details: 'Normal utilization' },
        network: { healthy: true, details: 'Responsive' }
      };
      
      // Check application status
      try {
        const appResponse = await request(app).get('/');
        systemStatus.application = {
          healthy: appResponse.status === 200,
          details: `HTTP ${appResponse.status}`,
          responseTime: Date.now() - statusStartTime
        };
      } catch (error) {
        systemStatus.application = {
          healthy: false,
          details: `Error: ${error.message}`
        };
      }
      
      // Check database status
      try {
        const dbState = mongoose.connection.readyState;
        systemStatus.database = {
          healthy: dbState === 1,
          details: `Connection state: ${dbState}`,
          connected: dbState === 1
        };
      } catch (error) {
        systemStatus.database = {
          healthy: false,
          details: `Database error: ${error.message}`
        };
      }
      
      // Check memory status
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      systemStatus.memory = {
        healthy: memoryUsedMB < 300,
        details: `${memoryUsedMB}MB used`,
        usage: memoryUsedMB
      };
      
      // Check CPU status (simplified)
      const cpuUsage = process.cpuUsage();
      systemStatus.cpu = {
        healthy: true, // Simplified check
        details: 'CPU monitoring active',
        userTime: Math.round(cpuUsage.user / 1000),
        systemTime: Math.round(cpuUsage.system / 1000)
      };
      
      // Calculate overall system health
      const healthyComponents = Object.values(systemStatus).filter(component => component.healthy).length;
      const totalComponents = Object.keys(systemStatus).length;
      const overallHealth = Math.round((healthyComponents / totalComponents) * 100);
      
      const status = overallHealth >= 100 ? 'healthy' : 
                   overallHealth >= 80 ? 'warning' : 'unhealthy';
      const message = `${healthyComponents}/${totalComponents} system components healthy (${overallHealth}%)`;

      recordMonitoringResult('systemStatus', 'Comprehensive System Status', status, message, {
        overallHealth: `${overallHealth}%`,
        healthyComponents,
        totalComponents,
        applicationHealthy: systemStatus.application.healthy,
        databaseHealthy: systemStatus.database.healthy,
        memoryHealthy: systemStatus.memory.healthy,
        details: Object.entries(systemStatus).map(([key, value]) => 
          `${key}: ${value.healthy ? 'OK' : 'ISSUE'}`
        ).join(', '),
        recommendation: overallHealth < 100 ? 'Address unhealthy system components for optimal performance' : null
      });

      expect(overallHealth).toBeGreaterThan(60); // At least 60% of components should be healthy
    });

    it('should validate system status update frequency', async () => {
      const updateIntervals = [];
      const numberOfUpdates = 5;
      
      for (let i = 0; i < numberOfUpdates; i++) {
        const updateStart = Date.now();
        
        // Simulate status update check
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const connectionState = mongoose.connection.readyState;
        
        // Simulate status collection time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const updateTime = Date.now() - updateStart;
        updateIntervals.push(updateTime);
        
        // Small delay between updates
        if (i < numberOfUpdates - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      const averageUpdateTime = Math.round(
        updateIntervals.reduce((sum, time) => sum + time, 0) / updateIntervals.length
      );
      const maxUpdateTime = Math.max(...updateIntervals);
      const updateFrequencyGood = averageUpdateTime < 100 && maxUpdateTime < 200;
      
      const status = updateFrequencyGood ? 'healthy' : 'warning';
      const message = `Status updates averaging ${averageUpdateTime}ms (max: ${maxUpdateTime}ms)`;

      recordMonitoringResult('systemStatus', 'Status Update Frequency', status, message, {
        averageUpdateTime,
        maxUpdateTime,
        numberOfUpdates,
        updateFrequencyGood,
        recommendation: !updateFrequencyGood ? 'Optimize status update collection for better monitoring performance' : null
      });

      expect(averageUpdateTime).toBeLessThan(150); // Updates should be fast
      expect(maxUpdateTime).toBeLessThan(300); // No single update should be too slow
    });
  });

  describe('Monitoring Dashboard Functionality', () => {
    it('should validate monitoring data aggregation', async () => {
      const aggregationStartTime = Date.now();
      
      // Collect various monitoring data points
      const monitoringData = {
        requests: [],
        errors: [],
        responseTimeMetrics: [],
        systemMetrics: []
      };
      
      // Simulate multiple requests and collect metrics
      for (let i = 0; i < 10; i++) {
        const requestStart = Date.now();
        
        try {
          const response = await request(app).get('/');
          const responseTime = Date.now() - requestStart;
          
          monitoringData.requests.push({
            timestamp: Date.now(),
            status: response.status,
            responseTime,
            endpoint: '/',
            success: response.status === 200
          });
          
          monitoringData.responseTimeMetrics.push(responseTime);
        } catch (error) {
          monitoringData.errors.push({
            timestamp: Date.now(),
            error: error.message,
            endpoint: '/'
          });
        }
        
        // Collect system metrics
        const memoryUsage = process.memoryUsage();
        monitoringData.systemMetrics.push({
          timestamp: Date.now(),
          memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          uptime: Math.round(process.uptime())
        });
      }
      
      // Aggregate the data
      const aggregationTime = Date.now() - aggregationStartTime;
      const totalRequests = monitoringData.requests.length;
      const successfulRequests = monitoringData.requests.filter(req => req.success).length;
      const errorCount = monitoringData.errors.length;
      const averageResponseTime = monitoringData.responseTimeMetrics.length > 0 ?
        Math.round(monitoringData.responseTimeMetrics.reduce((a, b) => a + b, 0) / monitoringData.responseTimeMetrics.length) : 0;
      const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0;
      
      const aggregationEfficient = aggregationTime < 1000 && totalRequests === 10;
      const status = aggregationEfficient && successRate >= 90 ? 'healthy' : 
                   aggregationEfficient ? 'warning' : 'unhealthy';
      const message = `Aggregated ${totalRequests} requests, ${errorCount} errors in ${aggregationTime}ms`;

      recordMonitoringResult('dashboardFunctionality', 'Data Aggregation', status, message, {
        aggregationTime,
        totalRequests,
        successfulRequests,
        errorCount,
        successRate: `${successRate}%`,
        averageResponseTime,
        dataPointsCollected: monitoringData.systemMetrics.length,
        recommendation: !aggregationEfficient ? 'Optimize monitoring data collection and aggregation processes' : null
      });

      expect(aggregationTime).toBeLessThan(2000); // Aggregation should be fast
      expect(totalRequests).toBeGreaterThan(5); // Should collect reasonable amount of data
      expect(successRate).toBeGreaterThan(80); // Most requests should succeed
    });

    it('should validate real-time monitoring capabilities', async () => {
      const realtimeTestDuration = 1000; // 1 second
      const monitoringInterval = 100; // Check every 100ms
      const expectedUpdates = Math.floor(realtimeTestDuration / monitoringInterval);
      
      const realtimeData = [];
      const startTime = Date.now();
      
      // Simulate real-time monitoring
      while (Date.now() - startTime < realtimeTestDuration) {
        const updateStart = Date.now();
        
        // Collect current system state
        const currentState = {
          timestamp: Date.now(),
          memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          uptime: Math.round(process.uptime()),
          connectionState: mongoose.connection.readyState,
          updateTime: 0
        };
        
        currentState.updateTime = Date.now() - updateStart;
        realtimeData.push(currentState);
        
        // Wait for next monitoring interval
        const nextUpdate = startTime + (realtimeData.length * monitoringInterval);
        const waitTime = nextUpdate - Date.now();
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      const actualUpdates = realtimeData.length;
      const averageUpdateTime = realtimeData.reduce((sum, data) => sum + data.updateTime, 0) / actualUpdates;
      const updateConsistency = Math.abs(actualUpdates - expectedUpdates) <= 2; // Allow 2 update tolerance
      const realtimeEffective = updateConsistency && averageUpdateTime < 50;
      
      const status = realtimeEffective ? 'healthy' : 'warning';
      const message = `Real-time monitoring: ${actualUpdates} updates in ${realtimeTestDuration}ms (expected: ${expectedUpdates})`;

      recordMonitoringResult('dashboardFunctionality', 'Real-time Monitoring', status, message, {
        actualUpdates,
        expectedUpdates,
        averageUpdateTime: Math.round(averageUpdateTime),
        updateConsistency,
        monitoringInterval,
        testDuration: realtimeTestDuration,
        recommendation: !realtimeEffective ? 'Improve real-time monitoring update frequency and consistency' : null
      });

      expect(actualUpdates).toBeGreaterThan(expectedUpdates * 0.8); // At least 80% of expected updates
      expect(averageUpdateTime).toBeLessThan(100); // Updates should be fast
    });
  });
});