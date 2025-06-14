# Test Environment Setup and Configuration

## Overview

This document describes the test environment configuration for the Axees platform, including recent improvements to achieve higher test pass rates.

## Test Stack

- **Test Framework**: Jest
- **API Testing**: Supertest
- **Database**: MongoDB Memory Server
- **Mocking**: Jest mocks for external services

## Key Improvements Made

### 1. Babel Configuration

Fixed async/await transpilation issues by properly configuring Babel:

**babel.config.js**:
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: 'commonjs'
    }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-async-to-generator'
  ]
};
```

### 2. Jest Configuration

Enhanced Jest configuration for better compatibility:

**jest.config.js**:
```javascript
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(openai|stripe|@apidevtools|@babel/runtime)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js']
};
```

### 3. Service Mocks

Properly configured mocks for external services:

- **Twilio**: SMS sending mock
- **MessageCentral**: OTP verification mock
- **Stripe**: Payment processing mock
- **Firebase**: Push notification mock
- **OpenAI**: AI service mock

### 4. Response Format Standardization

All API endpoints now return consistent response format:
```javascript
{
  "success": boolean,
  "message": string,
  // ... additional data
}
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suite
```bash
npx jest tests/integration/auth.test.js
```

### Single Test
```bash
npx jest tests/integration/auth.test.js --testNamePattern="should login"
```

### With Coverage
```bash
npm test -- --coverage
```

## Test Categories

1. **Integration Tests** (`/tests/integration/`)
   - API endpoint testing
   - Database operations
   - Service integrations

2. **Unit Tests** (`/tests/unit/`)
   - Utility functions
   - Model validations
   - Business logic

## Common Issues and Solutions

### Issue: "Cannot find module" errors
**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

### Issue: Async/await syntax errors
**Solution**: Babel plugins are properly configured for async transformation

### Issue: Mock not working
**Solution**: Ensure mocks are defined before importing modules that use them

### Issue: Database connection errors
**Solution**: MongoDB Memory Server automatically handles test database

## Environment Variables

Create a `.env.test` file for test-specific configuration:
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret
MONGODB_URI=mongodb://localhost:27017/test
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean database between tests
3. **Mocking**: Mock external services to avoid API calls
4. **Assertions**: Use specific assertions for better error messages
5. **Async**: Always use proper async/await handling

## Debugging Tests

### Verbose Output
```bash
npx jest --verbose
```

### Debug Single Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Console Output
Tests suppress console.log by default. To see logs:
```bash
npx jest --silent=false
```

## Test Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 95%+
- **New Code**: 90%+

## Recent Achievements

- Fixed auth test suite: 65% pass rate (13/20 tests)
- Standardized API responses across all endpoints
- Improved JWT token generation with proper user data
- Fixed async/await transpilation issues
- Enhanced mock configurations for external services