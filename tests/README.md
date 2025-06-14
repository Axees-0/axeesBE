# 🧪 Axees Platform - Test Suite Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Axees platform test suite provides comprehensive testing coverage including:
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint and database integration testing
- **Security Tests**: Vulnerability and security testing
- **Performance Tests**: Baseline performance benchmarking
- **E2E Tests**: End-to-end user journey testing

### Test Coverage Summary
- **Total Test Cases**: 200+
- **Code Coverage**: ~85%
- **Test Execution Time**: ~3 minutes (full suite)
- **External Services**: Fully mocked

## 🏗️ Test Architecture

```
tests/
├── fixtures/           # Test data and fixtures
├── helpers/           # Test utilities and helpers
│   ├── auth.js        # Authentication helpers
│   ├── database.js    # Database connection/cleanup
│   ├── serviceMocks.js # External service mocks
│   └── testApp.js     # Express app for testing
├── integration/       # Integration test suites
│   ├── auth.test.js
│   ├── auth-profile.test.js
│   ├── chat-messaging.test.js
│   ├── database-integration.test.js
│   ├── deal-execution.test.js
│   ├── error-handling.test.js
│   ├── offer-management.test.js
│   ├── payment-management.test.js
│   ├── performance-baseline.test.js
│   ├── security.test.js
│   └── user-management.test.js
├── mocks/            # Manual mocks
├── unit/             # Unit tests
├── setup.js          # Global test setup
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- MongoDB 6.0+ (or use MongoDB Memory Server)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up test environment:
```bash
cp .env.example .env.test
```

3. Configure test environment variables in `.env.test`:
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/axees-test
JWT_SECRET=test-jwt-secret
# Add other required variables...
```

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites

#### Unit Tests
```bash
npm run test:unit
```

#### Integration Tests
```bash
npm run test:integration
```

#### Security Tests
```bash
npm run test:security
# or specific security test
npm test tests/integration/security.test.js
```

#### Performance Tests
```bash
npm run test:performance
```

#### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Running Individual Test Files
```bash
# Run specific test file
npm test tests/integration/auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create offer"

# Run tests in specific directory
npm test tests/integration/
```

### Test Scripts in package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:security": "jest tests/integration/security.test.js",
    "test:performance": "jest tests/integration/performance-baseline.test.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:smoke:staging": "jest tests/smoke/staging.test.js",
    "test:smoke:production": "jest tests/smoke/production.test.js",
    "test:e2e": "jest tests/e2e",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand"
  }
}
```

## 📚 Test Suites

### 1. Authentication Tests (`auth.test.js`, `auth-profile.test.js`)
- User registration flow (start → verify → complete)
- Login with phone/password
- JWT token generation and validation
- OTP verification
- Password reset flow
- Profile management

### 2. User Management Tests (`user-management.test.js`)
- Profile CRUD operations
- Creator/Marketer specific features
- User search and filtering
- Portfolio management
- Avatar upload

### 3. Offer Management Tests (`offer-management.test.js`)
**36 comprehensive tests covering:**
- Offer creation with validation
- Offer listing with role-based access
- Offer retrieval and authorization
- Counter-offer negotiations
- Offer acceptance and deal creation
- Status transitions

### 4. Payment Tests (`payment-management.test.js`)
- Stripe checkout session creation
- Payment method management
- Withdrawal processing
- Earnings tracking
- Refund handling
- Multi-currency support

### 5. Deal Execution Tests (`deal-execution.test.js`)
- Milestone creation and funding
- Work submission by creators
- Review and approval workflow
- Content submission
- Deal completion

### 6. Security Tests (`security.test.js`)
**Comprehensive security testing:**
- Authentication security (JWT, OTP)
- Input validation & injection prevention
- XSS prevention
- Authorization & access control
- Data privacy
- File upload security
- API security headers

### 7. Chat/Messaging Tests (`chat-messaging.test.js`)
- Chat room management
- Message sending/receiving
- Real-time features (SSE)
- Message editing/deletion
- File attachments
- Content filtering

### 8. Error Handling Tests (`error-handling.test.js`)
**Complete 4xx/5xx error coverage:**
- 400 Bad Request scenarios
- 401 Unauthorized handling
- 403 Forbidden access
- 404 Not Found
- 413 Payload Too Large
- 422 Unprocessable Entity
- 429 Too Many Requests
- 5xx Server Errors

### 9. Database Integration Tests (`database-integration.test.js`)
- Data consistency
- Transaction integrity
- Index performance
- Query optimization
- Bulk operations
- Memory usage

### 10. Performance Baseline Tests (`performance-baseline.test.js`)
- API response time benchmarks
- Concurrent load testing
- Database query performance
- Memory and resource usage
- Large payload handling

## ✍️ Writing Tests

### Test Structure
```javascript
describe('Feature Name', () => {
  // Setup
  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    // Reset state before each test
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Specific Functionality', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      const testData = { /* ... */ };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
```javascript
// ❌ Bad
it('should work', () => {});

// ✅ Good
it('should return 403 when non-participant tries to access chat messages', () => {});
```

2. **Follow AAA Pattern**
```javascript
it('should create offer successfully', async () => {
  // Arrange
  const offerData = createTestOfferData();
  
  // Act
  const response = await createOffer(offerData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.offer).toMatchObject(offerData);
});
```

3. **Use Test Helpers**
```javascript
// Use global test utilities
const phone = global.testUtils.generateTestPhone();
const email = global.testUtils.generateTestEmail();
const token = generateTestToken(userData);
```

4. **Mock External Services**
```javascript
// All external services are pre-mocked in serviceMocks.js
// Just use them normally in tests
const response = await request(app)
  .post('/api/auth/register/start')
  .send({ phone: '+12125551234' });
// Twilio SMS will be automatically mocked
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
The test suite is integrated with GitHub Actions for continuous integration:

1. **Triggers**:
   - Push to main/develop/staging
   - Pull requests
   - Daily scheduled runs

2. **Test Matrix**:
   - Node.js: 18.x, 20.x
   - MongoDB: 6.0, 7.0

3. **Pipeline Stages**:
   - Linting & formatting
   - Unit tests
   - Integration tests
   - Security scanning
   - Performance tests
   - Coverage reporting
   - Deployment (staging/production)

### Running Tests in CI
```yaml
# Tests run automatically in CI with:
npm run test:ci
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
```bash
# Ensure MongoDB is running
mongod --dbpath /data/db

# Or use MongoDB Memory Server (automatic in tests)
```

2. **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

3. **Test Timeouts**
```javascript
// Increase timeout for specific test
it('should handle large data', async () => {
  jest.setTimeout(10000); // 10 seconds
  // test code
}, 10000);
```

4. **Mock Issues**
```javascript
// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Then open chrome://inspect in Chrome
```

### Verbose Output
```bash
# Run with verbose output
VERBOSE_TESTS=true npm test
```

## 📊 Test Metrics

### Coverage Targets
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Performance Baselines
- **Login API**: < 500ms average
- **Profile Retrieval**: < 200ms average
- **Offer Creation**: < 400ms average
- **Message Sending**: < 250ms average
- **Concurrent Requests**: > 20 RPS

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add integration tests for new endpoints
4. Update this documentation
5. Check coverage doesn't decrease

## 📝 Test Data

### Test Users
```javascript
// Default test users created in tests
const creatorUser = {
  phone: '+12125551234',
  password: 'SecurePassword123!',
  userType: 'Creator'
};

const marketerUser = {
  phone: '+12125551235',
  password: 'SecurePassword123!',
  userType: 'Marketer'
};
```

### Test Helpers Available
- `generateTestToken(userData)` - Create JWT tokens
- `createTestUser(type)` - Create test users
- `clearDatabase()` - Clean up test data
- `global.testUtils.*` - Various test utilities

## 🔒 Security Testing

Security tests cover:
- OWASP Top 10 vulnerabilities
- Authentication bypass attempts
- Injection attacks (SQL, NoSQL, XSS)
- Authorization violations
- Rate limiting
- Input validation
- File upload security

## 🚦 Continuous Improvement

- Regular security audits with `npm audit`
- Performance baseline updates
- Coverage improvement initiatives
- Test optimization for speed
- Mock updates for new services

---

For questions or issues, please check the [troubleshooting](#troubleshooting) section or create an issue in the repository.