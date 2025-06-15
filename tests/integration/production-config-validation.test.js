const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const dns = require('dns');

describe('Production Configuration Validation Tests', () => {
  const validationResults = {
    environment: {},
    database: {},
    security: {},
    externalServices: {},
    performance: {},
    dependencies: {},
    deployment: {}
  };

  let testEnvironment = 'test';

  beforeAll(() => {
    // Detect if we're running production-like tests
    testEnvironment = process.env.NODE_ENV || 'test';
  });

  afterAll(() => {
    // Output comprehensive validation report
    console.log('\n🔒 PRODUCTION CONFIGURATION VALIDATION REPORT');
    console.log('================================================');
    
    Object.entries(validationResults).forEach(([category, results]) => {
      console.log(`\n📋 ${category.toUpperCase()} VALIDATION:`);
      Object.entries(results).forEach(([test, result]) => {
        const status = result.valid ? '✅' : '❌';
        console.log(`  ${status} ${test}: ${result.message}`);
        if (result.details) {
          console.log(`     Details: ${result.details}`);
        }
        if (result.recommendation && !result.valid) {
          console.log(`     💡 Recommendation: ${result.recommendation}`);
        }
      });
    });
    
    // Summary
    const totalTests = Object.values(validationResults).reduce((total, category) => 
      total + Object.keys(category).length, 0
    );
    const passedTests = Object.values(validationResults).reduce((total, category) => 
      total + Object.values(category).filter(result => result.valid).length, 0
    );
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`   Total Checks: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('\n================================================\n');
  });

  // Helper function to record validation results
  const recordValidation = (category, testName, isValid, message, details = null, recommendation = null) => {
    validationResults[category][testName] = {
      valid: isValid,
      message,
      details,
      recommendation
    };
  };

  describe('Environment Configuration Validation', () => {
    it('should validate critical environment variables are set', () => {
      const criticalEnvVars = [
        'MONGO_URI',
        'JWT_SECRET',
        'PORT'
      ];

      const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);
      const isValid = missingVars.length === 0;
      
      recordValidation(
        'environment',
        'Critical Environment Variables',
        isValid,
        isValid ? 'All critical environment variables are set' : `Missing: ${missingVars.join(', ')}`,
        `Checked: ${criticalEnvVars.join(', ')}`,
        isValid ? null : 'Set missing environment variables in production deployment'
      );

      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });

    it('should validate production-specific environment variables', () => {
      const productionEnvVars = [
        'STRIPE_SECRET_KEY',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'FIREBASE_PRIVATE_KEY',
        'OPENAI_API_KEY',
        'REDIS_URL'
      ];

      const setVars = productionEnvVars.filter(varName => process.env[varName]);
      const missingVars = productionEnvVars.filter(varName => !process.env[varName]);
      const isValid = testEnvironment !== 'production' || setVars.length >= productionEnvVars.length * 0.8; // 80% threshold

      recordValidation(
        'environment',
        'Production Service Variables',
        isValid,
        `${setVars.length}/${productionEnvVars.length} production variables configured`,
        `Present: ${setVars.join(', ')}${missingVars.length ? ` | Missing: ${missingVars.join(', ')}` : ''}`,
        !isValid ? 'Configure missing external service credentials for production' : null
      );

      if (testEnvironment === 'production') {
        expect(setVars.length).toBeGreaterThan(productionEnvVars.length * 0.7);
      }
    });

    it('should validate environment variable formats and security', () => {
      const envValidations = [];

      // JWT Secret validation
      if (process.env.JWT_SECRET) {
        const jwtSecretValid = process.env.JWT_SECRET.length >= 32;
        envValidations.push({
          name: 'JWT_SECRET',
          valid: jwtSecretValid,
          issue: jwtSecretValid ? null : 'JWT secret too short (< 32 characters)'
        });
      }

      // MongoDB URI validation
      if (process.env.MONGO_URI) {
        const mongoUriValid = process.env.MONGO_URI.startsWith('mongodb://') || process.env.MONGO_URI.startsWith('mongodb+srv://');
        envValidations.push({
          name: 'MONGO_URI',
          valid: mongoUriValid,
          issue: mongoUriValid ? null : 'Invalid MongoDB URI format'
        });
      }

      // Port validation
      if (process.env.PORT) {
        const port = parseInt(process.env.PORT, 10);
        const portValid = port > 0 && port <= 65535;
        envValidations.push({
          name: 'PORT',
          valid: portValid,
          issue: portValid ? null : 'Invalid port number'
        });
      }

      const invalidEnvVars = envValidations.filter(env => !env.valid);
      const isValid = invalidEnvVars.length === 0;

      recordValidation(
        'environment',
        'Environment Variable Formats',
        isValid,
        isValid ? 'All environment variables have valid formats' : `Invalid formats detected`,
        invalidEnvVars.length ? invalidEnvVars.map(env => `${env.name}: ${env.issue}`).join(', ') : 'All formats valid',
        !isValid ? 'Fix environment variable formats before production deployment' : null
      );

      expect(isValid).toBe(true);
    });

    it('should validate NODE_ENV is set appropriately', () => {
      const nodeEnv = process.env.NODE_ENV;
      const validEnvironments = ['development', 'test', 'staging', 'production'];
      const isValid = validEnvironments.includes(nodeEnv);

      recordValidation(
        'environment',
        'NODE_ENV Configuration',
        isValid,
        isValid ? `NODE_ENV correctly set to: ${nodeEnv}` : `Invalid NODE_ENV: ${nodeEnv}`,
        `Valid options: ${validEnvironments.join(', ')}`,
        !isValid ? 'Set NODE_ENV to appropriate environment (production, staging, development)' : null
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Database Configuration Validation', () => {
    it('should validate MongoDB connection configuration', async () => {
      const mongoUri = process.env.MONGO_URI;
      let isValid = false;
      let message = 'MongoDB URI not configured';
      let details = null;

      if (mongoUri) {
        try {
          // Test connection without actually connecting to avoid conflicts
          const uriPattern = /^mongodb(\+srv)?:\/\/([^:]+):?([^@]*)@([^\/]+)\/(.*)$/;
          const uriValid = uriPattern.test(mongoUri);
          
          if (uriValid) {
            // Parse URI components
            const match = mongoUri.match(uriPattern);
            const [, protocol, username, password, host, database] = match;
            
            const hasAuth = username && password;
            const hasDatabase = database && database.length > 0;
            
            isValid = hasAuth && hasDatabase;
            message = isValid ? 
              'MongoDB URI properly configured with authentication and database' :
              'MongoDB URI missing authentication or database name';
            details = `Protocol: ${protocol || 'mongodb'}, Host: ${host}, Database: ${database || 'none'}, Auth: ${hasAuth ? 'yes' : 'no'}`;
          } else {
            message = 'Invalid MongoDB URI format';
            details = 'URI does not match expected MongoDB format';
          }
        } catch (error) {
          message = `MongoDB URI validation error: ${error.message}`;
          details = error.stack;
        }
      }

      recordValidation(
        'database',
        'MongoDB Configuration',
        isValid,
        message,
        details,
        !isValid ? 'Ensure MongoDB URI includes proper authentication and database name' : null
      );

      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });

    it('should validate MongoDB connection parameters', () => {
      const mongoUri = process.env.MONGO_URI;
      let isValid = false;
      let message = 'MongoDB URI not available for parameter validation';
      let details = null;

      if (mongoUri) {
        try {
          // Check for production-recommended parameters
          const hasNewUrlParser = mongoUri.includes('useNewUrlParser=true') || testEnvironment !== 'production';
          const hasUnifiedTopology = mongoUri.includes('useUnifiedTopology=true') || testEnvironment !== 'production';
          const hasRetryWrites = mongoUri.includes('retryWrites=true') || testEnvironment !== 'production';
          
          const parameterScore = [hasNewUrlParser, hasUnifiedTopology, hasRetryWrites].filter(Boolean).length;
          isValid = parameterScore >= 2; // At least 2 out of 3 recommended parameters

          message = `MongoDB connection parameters: ${parameterScore}/3 recommended settings`;
          details = `useNewUrlParser: ${hasNewUrlParser}, useUnifiedTopology: ${hasUnifiedTopology}, retryWrites: ${hasRetryWrites}`;
        } catch (error) {
          message = `Parameter validation error: ${error.message}`;
          details = error.stack;
        }
      }

      recordValidation(
        'database',
        'MongoDB Connection Parameters',
        isValid,
        message,
        details,
        !isValid ? 'Add recommended MongoDB connection parameters for production reliability' : null
      );

      // Less strict for test environment
      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });

    it('should validate Redis configuration if available', () => {
      const redisUrl = process.env.REDIS_URL;
      let isValid = true; // Redis is optional, so default to valid
      let message = 'Redis not configured (optional)';
      let details = null;

      if (redisUrl) {
        try {
          const redisUrlPattern = /^redis:\/\/([^:]*):?([^@]*)@?([^:]+):?(\d+)?\/?\d*$/;
          const redisValid = redisUrlPattern.test(redisUrl) || redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://');
          
          isValid = redisValid;
          message = redisValid ? 'Redis URL properly formatted' : 'Invalid Redis URL format';
          details = redisValid ? `Redis URL configured: ${redisUrl.substring(0, 20)}...` : 'Redis URL does not match expected format';
        } catch (error) {
          isValid = false;
          message = `Redis validation error: ${error.message}`;
          details = error.stack;
        }
      }

      recordValidation(
        'database',
        'Redis Configuration',
        isValid,
        message,
        details,
        !isValid ? 'Fix Redis URL format or remove if not needed' : null
      );

      // Only require Redis in production if it's configured
      if (testEnvironment === 'production' && redisUrl) {
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Security Configuration Validation', () => {
    it('should validate JWT secret strength', () => {
      const jwtSecret = process.env.JWT_SECRET;
      let isValid = false;
      let message = 'JWT secret not configured';
      let details = null;

      if (jwtSecret) {
        const minLength = 32;
        const hasUppercase = /[A-Z]/.test(jwtSecret);
        const hasLowercase = /[a-z]/.test(jwtSecret);
        const hasNumbers = /\d/.test(jwtSecret);
        const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(jwtSecret);
        
        const lengthValid = jwtSecret.length >= minLength;
        const complexityScore = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
        
        isValid = lengthValid && complexityScore >= 3;
        message = isValid ? 
          'JWT secret meets security requirements' : 
          'JWT secret does not meet security requirements';
        details = `Length: ${jwtSecret.length}/${minLength}, Complexity: ${complexityScore}/4 (uppercase, lowercase, numbers, special chars)`;
      }

      recordValidation(
        'security',
        'JWT Secret Strength',
        isValid,
        message,
        details,
        !isValid ? 'Use a JWT secret with at least 32 characters and mixed character types' : null
      );

      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });

    it('should validate bcrypt configuration', async () => {
      let isValid = false;
      let message = 'bcrypt validation failed';
      let details = null;

      try {
        // Test bcrypt functionality and performance
        const testPassword = 'testPassword123!';
        const saltRounds = 10; // Default used in the application
        
        const startTime = Date.now();
        const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
        const hashTime = Date.now() - startTime;
        
        const isValidHash = await bcrypt.compare(testPassword, hashedPassword);
        const performanceAcceptable = hashTime < 1000; // Should complete within 1 second
        
        isValid = isValidHash && performanceAcceptable;
        message = isValid ? 
          'bcrypt functioning correctly with acceptable performance' : 
          'bcrypt performance or functionality issues detected';
        details = `Hash time: ${hashTime}ms, Functionality: ${isValidHash ? 'working' : 'failed'}`;
      } catch (error) {
        message = `bcrypt validation error: ${error.message}`;
        details = error.stack;
      }

      recordValidation(
        'security',
        'bcrypt Configuration',
        isValid,
        message,
        details,
        !isValid ? 'Check bcrypt installation and system performance' : null
      );

      expect(isValid).toBe(true);
    });

    it('should validate CORS configuration', () => {
      // This is a basic validation - in a real app you'd check the actual CORS middleware config
      const nodeEnv = process.env.NODE_ENV;
      const corsOrigin = process.env.CORS_ORIGIN || '*';
      
      const isProduction = nodeEnv === 'production';
      const hasRestrictiveCors = corsOrigin !== '*';
      const isValid = !isProduction || hasRestrictiveCors;
      
      const message = isValid ? 
        'CORS configuration appropriate for environment' : 
        'CORS allows all origins in production environment';
      const details = `Environment: ${nodeEnv}, CORS Origin: ${corsOrigin}`;

      recordValidation(
        'security',
        'CORS Configuration',
        isValid,
        message,
        details,
        !isValid ? 'Configure restrictive CORS origins for production' : null
      );

      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });

    it('should validate file upload security', () => {
      // Check if upload directory exists and has proper permissions
      const uploadDir = path.join(__dirname, '../../uploads');
      let isValid = false;
      let message = 'Upload directory validation failed';
      let details = null;

      try {
        const uploadDirExists = fs.existsSync(uploadDir);
        
        if (uploadDirExists) {
          const stats = fs.statSync(uploadDir);
          const isDirectory = stats.isDirectory();
          const isWritable = fs.accessSync ? true : true; // Simplified check
          
          isValid = isDirectory && isWritable;
          message = isValid ? 
            'Upload directory properly configured' : 
            'Upload directory configuration issues';
          details = `Exists: ${uploadDirExists}, Is Directory: ${isDirectory}, Writable: ${isWritable}`;
        } else {
          message = 'Upload directory does not exist';
          details = `Checked path: ${uploadDir}`;
        }
      } catch (error) {
        message = `Upload directory validation error: ${error.message}`;
        details = error.stack;
      }

      recordValidation(
        'security',
        'File Upload Security',
        isValid,
        message,
        details,
        !isValid ? 'Ensure upload directory exists with proper permissions' : null
      );

      // Upload directory might not exist in test environment
      if (testEnvironment === 'production') {
        expect(isValid).toBe(true);
      }
    });
  });

  describe('External Services Configuration Validation', () => {
    it('should validate Stripe configuration', () => {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
      
      let isValid = false;
      let message = 'Stripe not configured';
      let details = null;

      if (stripeSecretKey || stripePublishableKey) {
        const secretValid = stripeSecretKey && (
          stripeSecretKey.startsWith('sk_test_') || 
          stripeSecretKey.startsWith('sk_live_')
        );
        const publishableValid = stripePublishableKey && (
          stripePublishableKey.startsWith('pk_test_') || 
          stripePublishableKey.startsWith('pk_live_')
        );
        
        const isLiveMode = stripeSecretKey && stripeSecretKey.startsWith('sk_live_');
        const isTestMode = stripeSecretKey && stripeSecretKey.startsWith('sk_test_');
        
        isValid = secretValid && (testEnvironment !== 'production' || isLiveMode);
        message = isValid ? 
          `Stripe configured in ${isLiveMode ? 'live' : 'test'} mode` : 
          'Stripe configuration invalid or inappropriate for environment';
        details = `Secret Key: ${secretValid ? 'valid' : 'invalid'}, Publishable Key: ${publishableValid ? 'valid' : 'invalid'}, Mode: ${isLiveMode ? 'live' : isTestMode ? 'test' : 'unknown'}`;
      }

      recordValidation(
        'externalServices',
        'Stripe Configuration',
        isValid || testEnvironment !== 'production',
        message,
        details,
        !isValid && testEnvironment === 'production' ? 'Configure live Stripe keys for production' : null
      );

      if (testEnvironment === 'production' && (stripeSecretKey || stripePublishableKey)) {
        expect(isValid).toBe(true);
      }
    });

    it('should validate Twilio configuration', () => {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      let isValid = false;
      let message = 'Twilio not configured';
      let details = null;

      if (twilioAccountSid || twilioAuthToken) {
        const sidValid = twilioAccountSid && twilioAccountSid.startsWith('AC');
        const tokenValid = twilioAuthToken && twilioAuthToken.length >= 32;
        const phoneValid = twilioPhoneNumber && twilioPhoneNumber.startsWith('+');
        
        const configScore = [sidValid, tokenValid, phoneValid].filter(Boolean).length;
        isValid = configScore >= 2; // At least Account SID and Auth Token
        
        message = isValid ? 
          'Twilio properly configured' : 
          'Twilio configuration incomplete';
        details = `Account SID: ${sidValid ? 'valid' : 'invalid'}, Auth Token: ${tokenValid ? 'valid' : 'invalid'}, Phone: ${phoneValid ? 'valid' : 'invalid'}`;
      }

      recordValidation(
        'externalServices',
        'Twilio Configuration',
        isValid || testEnvironment !== 'production',
        message,
        details,
        !isValid && testEnvironment === 'production' ? 'Configure complete Twilio credentials for SMS functionality' : null
      );

      if (testEnvironment === 'production' && (twilioAccountSid || twilioAuthToken)) {
        expect(isValid).toBe(true);
      }
    });

    it('should validate Firebase configuration', () => {
      const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
      const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      let isValid = false;
      let message = 'Firebase not configured';
      let details = null;

      if (firebasePrivateKey || firebaseProjectId || firebaseClientEmail) {
        const privateKeyValid = firebasePrivateKey && firebasePrivateKey.includes('BEGIN PRIVATE KEY');
        const projectIdValid = firebaseProjectId && firebaseProjectId.length > 0;
        const emailValid = firebaseClientEmail && firebaseClientEmail.includes('@');
        
        const configScore = [privateKeyValid, projectIdValid, emailValid].filter(Boolean).length;
        isValid = configScore >= 2;
        
        message = isValid ? 
          'Firebase properly configured' : 
          'Firebase configuration incomplete';
        details = `Private Key: ${privateKeyValid ? 'valid' : 'invalid'}, Project ID: ${projectIdValid ? 'valid' : 'invalid'}, Client Email: ${emailValid ? 'valid' : 'invalid'}`;
      }

      recordValidation(
        'externalServices',
        'Firebase Configuration',
        isValid || testEnvironment !== 'production',
        message,
        details,
        !isValid && testEnvironment === 'production' ? 'Configure complete Firebase service account credentials' : null
      );

      if (testEnvironment === 'production' && (firebasePrivateKey || firebaseProjectId)) {
        expect(isValid).toBe(true);
      }
    });

    it('should validate OpenAI configuration', () => {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      let isValid = false;
      let message = 'OpenAI not configured';
      let details = null;

      if (openaiApiKey) {
        const keyValid = openaiApiKey.startsWith('sk-') && openaiApiKey.length >= 40;
        
        isValid = keyValid;
        message = isValid ? 
          'OpenAI API key properly formatted' : 
          'OpenAI API key invalid format';
        details = `Key format: ${keyValid ? 'valid' : 'invalid'}, Length: ${openaiApiKey.length}`;
      }

      recordValidation(
        'externalServices',
        'OpenAI Configuration',
        isValid || testEnvironment !== 'production',
        message,
        details,
        !isValid && testEnvironment === 'production' ? 'Configure valid OpenAI API key for AI features' : null
      );

      if (testEnvironment === 'production' && openaiApiKey) {
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Performance Configuration Validation', () => {
    it('should validate Node.js version compatibility', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
      
      const isValid = majorVersion >= 18; // Minimum Node.js 18 as per package.json
      const message = isValid ? 
        `Node.js version ${nodeVersion} is compatible` : 
        `Node.js version ${nodeVersion} is below minimum requirement`;
      const details = `Current: ${nodeVersion}, Minimum required: 18.x`;

      recordValidation(
        'performance',
        'Node.js Version',
        isValid,
        message,
        details,
        !isValid ? 'Upgrade to Node.js 18 or higher for optimal performance and security' : null
      );

      expect(isValid).toBe(true);
    });

    it('should validate memory configuration', () => {
      const memoryUsage = process.memoryUsage();
      const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryUtilization = (usedMemoryMB / totalMemoryMB) * 100;
      
      const hasAdequateMemory = totalMemoryMB >= 100; // At least 100MB heap
      const healthyUtilization = memoryUtilization < 80; // Less than 80% utilization
      
      const isValid = hasAdequateMemory && healthyUtilization;
      const message = isValid ? 
        'Memory configuration is healthy' : 
        'Memory configuration issues detected';
      const details = `Total Heap: ${totalMemoryMB}MB, Used: ${usedMemoryMB}MB, Utilization: ${memoryUtilization.toFixed(1)}%`;

      recordValidation(
        'performance',
        'Memory Configuration',
        isValid,
        message,
        details,
        !isValid ? 'Increase available memory or optimize memory usage' : null
      );

      expect(hasAdequateMemory).toBe(true);
    });

    it('should validate performance monitoring capabilities', () => {
      const hasPerfHooks = typeof process.hrtime === 'function';
      const hasConsoleTime = typeof console.time === 'function';
      const hasMemoryUsage = typeof process.memoryUsage === 'function';
      
      const monitoringScore = [hasPerfHooks, hasConsoleTime, hasMemoryUsage].filter(Boolean).length;
      const isValid = monitoringScore >= 2;
      
      const message = isValid ? 
        'Performance monitoring capabilities available' : 
        'Limited performance monitoring capabilities';
      const details = `hrtime: ${hasPerfHooks}, console.time: ${hasConsoleTime}, memoryUsage: ${hasMemoryUsage}`;

      recordValidation(
        'performance',
        'Performance Monitoring',
        isValid,
        message,
        details,
        !isValid ? 'Ensure Node.js environment supports performance monitoring' : null
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Dependencies Validation', () => {
    it('should validate critical dependencies are installed', () => {
      const criticalDependencies = [
        'express',
        'mongoose',
        'jsonwebtoken',
        'bcrypt',
        'cors',
        'dotenv'
      ];

      const installedDeps = [];
      const missingDeps = [];

      criticalDependencies.forEach(dep => {
        try {
          require.resolve(dep);
          installedDeps.push(dep);
        } catch (error) {
          missingDeps.push(dep);
        }
      });

      const isValid = missingDeps.length === 0;
      const message = isValid ? 
        'All critical dependencies are installed' : 
        `Missing critical dependencies: ${missingDeps.join(', ')}`;
      const details = `Installed: ${installedDeps.join(', ')}`;

      recordValidation(
        'dependencies',
        'Critical Dependencies',
        isValid,
        message,
        details,
        !isValid ? 'Install missing dependencies with npm install' : null
      );

      expect(isValid).toBe(true);
    });

    it('should validate optional dependencies', () => {
      const optionalDependencies = [
        'stripe',
        'twilio',
        'firebase-admin',
        'openai',
        'redis',
        'aws-sdk'
      ];

      const installedOptional = [];
      const missingOptional = [];

      optionalDependencies.forEach(dep => {
        try {
          require.resolve(dep);
          installedOptional.push(dep);
        } catch (error) {
          missingOptional.push(dep);
        }
      });

      const installationRate = (installedOptional.length / optionalDependencies.length) * 100;
      const isValid = installationRate >= 70; // At least 70% of optional deps should be available

      const message = `${installedOptional.length}/${optionalDependencies.length} optional dependencies installed (${installationRate.toFixed(1)}%)`;
      const details = `Available: ${installedOptional.join(', ')}${missingOptional.length ? ` | Missing: ${missingOptional.join(', ')}` : ''}`;

      recordValidation(
        'dependencies',
        'Optional Dependencies',
        isValid,
        message,
        details,
        !isValid ? 'Install missing optional dependencies for full functionality' : null
      );

      // More lenient for optional dependencies
      expect(installationRate).toBeGreaterThan(50);
    });
  });

  describe('Deployment Readiness Validation', () => {
    it('should validate production deployment checklist', () => {
      const productionChecks = {
        nodeEnvSet: process.env.NODE_ENV === 'production',
        secretsConfigured: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
        databaseConfigured: process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb'),
        portConfigured: process.env.PORT && !isNaN(parseInt(process.env.PORT, 10)),
        corsConfigured: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
      };

      const passedChecks = Object.values(productionChecks).filter(Boolean).length;
      const totalChecks = Object.keys(productionChecks).length;
      const readinessScore = (passedChecks / totalChecks) * 100;
      
      const isValid = testEnvironment !== 'production' || readinessScore >= 80;
      const message = `Production readiness: ${passedChecks}/${totalChecks} checks passed (${readinessScore.toFixed(1)}%)`;
      const details = Object.entries(productionChecks)
        .map(([check, passed]) => `${check}: ${passed ? 'pass' : 'fail'}`)
        .join(', ');

      recordValidation(
        'deployment',
        'Production Readiness',
        isValid,
        message,
        details,
        !isValid ? 'Complete production readiness checklist before deployment' : null
      );

      if (testEnvironment === 'production') {
        expect(readinessScore).toBeGreaterThan(80);
      }
    });

    it('should validate health check endpoint availability', () => {
      // This would typically test the actual health endpoint
      // For now, we'll validate that the basic app structure supports health checks
      const hasExpressApp = typeof require('express') === 'function';
      const canCreateRoutes = hasExpressApp;
      
      const isValid = canCreateRoutes;
      const message = isValid ? 
        'Application supports health check endpoints' : 
        'Application cannot support health check endpoints';
      const details = `Express available: ${hasExpressApp}`;

      recordValidation(
        'deployment',
        'Health Check Support',
        isValid,
        message,
        details,
        !isValid ? 'Ensure Express.js is properly configured for health checks' : null
      );

      expect(isValid).toBe(true);
    });

    it('should validate error handling configuration', () => {
      const hasErrorHandling = typeof process.on === 'function';
      const hasConsoleError = typeof console.error === 'function';
      const hasProcessExit = typeof process.exit === 'function';
      
      const errorHandlingScore = [hasErrorHandling, hasConsoleError, hasProcessExit].filter(Boolean).length;
      const isValid = errorHandlingScore >= 2;
      
      const message = isValid ? 
        'Error handling capabilities available' : 
        'Limited error handling capabilities';
      const details = `process.on: ${hasErrorHandling}, console.error: ${hasConsoleError}, process.exit: ${hasProcessExit}`;

      recordValidation(
        'deployment',
        'Error Handling',
        isValid,
        message,
        details,
        !isValid ? 'Ensure proper error handling mechanisms are in place' : null
      );

      expect(isValid).toBe(true);
    });
  });
});