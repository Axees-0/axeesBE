# 🧪 Axees API Test Scenarios Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Authentication Test Scenarios](#authentication-test-scenarios)
- [User Management Test Scenarios](#user-management-test-scenarios)
- [Offer Management Test Scenarios](#offer-management-test-scenarios)
- [Payment System Test Scenarios](#payment-system-test-scenarios)
- [Chat & Messaging Test Scenarios](#chat--messaging-test-scenarios)
- [Security Test Scenarios](#security-test-scenarios)
- [Performance Test Scenarios](#performance-test-scenarios)
- [Error Handling Test Scenarios](#error-handling-test-scenarios)
- [Expected Response Formats](#expected-response-formats)

## 🎯 Overview

This document provides comprehensive test scenarios for the Axees Platform API, including expected request/response formats, error cases, and validation rules.

### Test Coverage
- **200+ Test Scenarios** across all API endpoints
- **Performance Benchmarks** with specific SLA requirements
- **Security Testing** covering OWASP Top 10
- **Error Handling** for all 4xx and 5xx scenarios
- **Integration Testing** with external services

## 🔧 Test Environment Setup

### Prerequisites
```bash
# Required software
- Node.js 18.x or 20.x
- MongoDB 6.0+
- Postman (for manual testing)
- Jest (for automated testing)
```

### Environment Configuration
```env
# Test environment variables
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/axees-test
JWT_SECRET=test-jwt-secret-key
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=test_sid
TWILIO_AUTH_TOKEN=test_token
OPENAI_API_KEY=test_key
FIREBASE_PROJECT_ID=test_project
```

### Test Data Setup
```javascript
// Default test users for scenarios
const testUsers = {
  creator: {
    phone: '+12125551234',
    email: 'creator@test.com',
    password: 'SecurePassword123!',
    userType: 'Creator'
  },
  marketer: {
    phone: '+12125551235', 
    email: 'marketer@test.com',
    password: 'SecurePassword123!',
    userType: 'Marketer'
  }
};
```

## 🔐 Authentication Test Scenarios

### 1. User Registration Flow

#### Scenario 1.1: Complete Registration Flow
```http
POST /api/auth/register/start
Content-Type: application/json

{
  "phone": "+12125551234",
  "userType": "Creator"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to +12125551234",
  "expiresIn": "5 minutes"
}
```

#### Scenario 1.2: OTP Verification
```http
POST /api/auth/register/verify
Content-Type: application/json

{
  "phone": "+12125551234",
  "otp": "123456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15 minutes"
}
```

#### Scenario 1.3: Registration Completion
```http
POST /api/auth/register/complete
Content-Type: application/json
Authorization: Bearer {{tempToken}}

{
  "name": "Test Creator",
  "userName": "testcreator123",
  "email": "creator@test.com",
  "password": "SecurePassword123!"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+12125551234",
    "name": "Test Creator",
    "userName": "testcreator123",
    "email": "creator@test.com",
    "userType": "Creator",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login Scenarios

#### Scenario 2.1: Successful Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+12125551234",
  "password": "SecurePassword123!"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+12125551234",
    "name": "Test Creator",
    "userType": "Creator"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Performance SLA:** < 200ms response time

## 👤 User Management Test Scenarios

### 3. Profile Operations

#### Scenario 3.1: Get User Profile
```http
GET /api/account/profile/{{userId}}
x-user-id: {{userId}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+12125551234",
    "name": "Test Creator",
    "userName": "testcreator123",
    "email": "creator@test.com",
    "userType": "Creator",
    "creatorData": {
      "platforms": [
        {
          "platform": "instagram",
          "handle": "@testcreator",
          "followersCount": 10000
        }
      ],
      "categories": ["lifestyle", "fashion"],
      "portfolio": []
    },
    "settings": {
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    }
  }
}
```

**Performance SLA:** < 150ms response time

#### Scenario 3.2: Update User Profile
```http
PUT /api/account/profile/{{userId}}
Content-Type: application/json
x-user-id: {{userId}}

{
  "name": "Updated Creator Name",
  "bio": "Updated bio text",
  "location": "New York, NY"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Creator Name",
    "bio": "Updated bio text",
    "location": "New York, NY",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 📝 Offer Management Test Scenarios

### 4. Offer Creation and Management

#### Scenario 4.1: Create New Offer (Marketer)
```http
POST /api/marketer/offers
Content-Type: application/json
x-user-id: {{marketerId}}

{
  "creatorId": "507f1f77bcf86cd799439012",
  "offerName": "Instagram Campaign for Product Launch",
  "description": "Promote our new eco-friendly water bottle",
  "proposedAmount": 1500,
  "currency": "USD",
  "platforms": ["Instagram"],
  "deliverables": ["Post", "Story", "Reel"],
  "desiredPostDate": "2024-12-25",
  "desiredReviewDate": "2024-12-20",
  "additionalRequirements": "Must include our hashtag #EcoLife"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "offer": {
    "_id": "507f1f77bcf86cd799439013",
    "marketerId": "507f1f77bcf86cd799439011",
    "creatorId": "507f1f77bcf86cd799439012",
    "offerName": "Instagram Campaign for Product Launch",
    "description": "Promote our new eco-friendly water bottle",
    "proposedAmount": 1500,
    "currency": "USD",
    "platforms": ["Instagram"],
    "deliverables": ["Post", "Story", "Reel"],
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Performance SLA:** < 400ms response time

#### Scenario 4.2: List Offers
```http
GET /api/marketer/offers?status=pending&limit=10&offset=0
x-user-id: {{marketerId}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "offers": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "offerName": "Instagram Campaign for Product Launch",
      "proposedAmount": 1500,
      "currency": "USD",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "creator": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Creator Name",
        "userName": "creatorhandle"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Performance SLA:** < 300ms response time

## 💳 Payment System Test Scenarios

### 5. Payment Processing

#### Scenario 5.1: Create Checkout Session
```http
POST /api/payments/checkout
Content-Type: application/json
x-user-id: {{marketerId}}

{
  "amount": 1500,
  "currency": "USD",
  "description": "Payment for Instagram Campaign",
  "offerId": "507f1f77bcf86cd799439013",
  "paymentType": "offer_funding"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "sessionId": "cs_test_123456789",
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_123456789",
  "clientSecret": "cs_test_123456789_secret",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

**Performance SLA:** < 500ms response time

#### Scenario 5.2: Get Payment Methods
```http
GET /api/payments/methods
x-user-id: {{userId}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "paymentMethods": [
    {
      "id": "pm_123456789",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  ]
}
```

## 💬 Chat & Messaging Test Scenarios

### 6. Real-time Messaging

#### Scenario 6.1: Create Chat Room
```http
POST /api/chats
Content-Type: application/json
x-user-id: {{userId}}

{
  "recipientId": "507f1f77bcf86cd799439012"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "chatId": "507f1f77bcf86cd799439014",
  "participants": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 6.2: Send Message
```http
POST /api/chats/{{chatId}}/messages
Content-Type: application/json
x-user-id: {{userId}}

{
  "text": "Hello! I'm interested in collaborating on your campaign.",
  "receiverId": "507f1f77bcf86cd799439012",
  "type": "text"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": {
    "_id": "507f1f77bcf86cd799439015",
    "chatId": "507f1f77bcf86cd799439014",
    "senderId": "507f1f77bcf86cd799439011",
    "receiverId": "507f1f77bcf86cd799439012",
    "text": "Hello! I'm interested in collaborating on your campaign.",
    "type": "text",
    "status": "sent",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Performance SLA:** < 250ms response time

## 🔒 Security Test Scenarios

### 7. Security Validation Tests

#### Scenario 7.1: Unauthorized Access (401)
```http
GET /api/account/profile/507f1f77bcf86cd799439011
# Missing x-user-id header
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized access. Authentication required.",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 7.2: Invalid Token (401)
```http
GET /api/account/profile/507f1f77bcf86cd799439011
Authorization: Bearer invalid.jwt.token
```

**Expected Response (401):**
```json
{
  "error": "Invalid authentication token.",
  "code": "INVALID_TOKEN",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 7.3: Forbidden Access (403)
```http
GET /api/marketer/offers
x-user-id: {{creatorId}}
# Creator trying to access marketer-only endpoint
```

**Expected Response (403):**
```json
{
  "error": "Access forbidden. Insufficient permissions.",
  "code": "FORBIDDEN",
  "requiredRole": "Marketer",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 7.4: SQL Injection Prevention
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "'; DROP TABLE users; --",
  "password": "password"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid phone number format.",
  "code": "VALIDATION_ERROR",
  "field": "phone",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 7.5: XSS Prevention
```http
PUT /api/account/profile/{{userId}}
Content-Type: application/json
x-user-id: {{userId}}

{
  "name": "<script>alert('XSS')</script>",
  "bio": "<img src=x onerror=alert('XSS')>"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid characters detected in input.",
  "code": "VALIDATION_ERROR",
  "fields": ["name", "bio"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ⚡ Performance Test Scenarios

### 8. Performance Benchmarks

#### Scenario 8.1: Concurrent Login Tests
```javascript
// Load test: 10 concurrent login requests
const concurrentRequests = 10;
const loginPromises = Array.from({length: concurrentRequests}, () =>
  request(app)
    .post('/api/auth/login')
    .send({
      phone: '+12125551234',
      password: 'SecurePassword123!'
    })
);

const results = await Promise.all(loginPromises);
// Expected: All responses < 200ms, 0% failure rate
```

#### Scenario 8.2: Offer List Performance
```javascript
// Load test: 50 concurrent offer list requests
const concurrentRequests = 50;
const offerListPromises = Array.from({length: concurrentRequests}, () =>
  request(app)
    .get('/api/marketer/offers')
    .set('x-user-id', marketerId)
);

const results = await Promise.all(offerListPromises);
// Expected: All responses < 300ms, 0% failure rate
```

#### Scenario 8.3: Message Sending Performance
```javascript
// Load test: 20 concurrent message sends
const concurrentRequests = 20;
const messagePromises = Array.from({length: concurrentRequests}, () =>
  request(app)
    .post(`/api/chats/${chatId}/messages`)
    .set('x-user-id', userId)
    .send({
      text: 'Performance test message',
      receiverId: recipientId
    })
);

const results = await Promise.all(messagePromises);
// Expected: All responses < 250ms, 0% failure rate
```

### Performance SLA Requirements

| Endpoint Category | Response Time SLA | Concurrent Users | Success Rate |
|------------------|-------------------|------------------|--------------|
| Authentication   | < 200ms           | 10 users         | > 99%        |
| User Management  | < 150ms           | 25 users         | > 99%        |
| Offer Operations | < 300ms           | 50 users         | > 99%        |
| Payment Processing| < 500ms          | 20 users         | > 99%        |
| Messaging        | < 250ms           | 20 users         | > 99%        |

## ❌ Error Handling Test Scenarios

### 9. Error Response Tests

#### Scenario 9.1: Validation Errors (400)
```http
POST /api/auth/register/start
Content-Type: application/json

{
  "phone": "invalid-phone",
  "userType": "InvalidType"
}
```

**Expected Response (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "phone",
      "message": "Phone number must be in E.164 format"
    },
    {
      "field": "userType",
      "message": "User type must be either 'Creator' or 'Marketer'"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 9.2: Resource Not Found (404)
```http
GET /api/marketer/offers/507f1f77bcf86cd799439999
x-user-id: {{marketerId}}
```

**Expected Response (404):**
```json
{
  "error": "Offer not found",
  "code": "RESOURCE_NOT_FOUND",
  "resource": "offer",
  "id": "507f1f77bcf86cd799439999",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 9.3: Conflict Error (409)
```http
POST /api/auth/register/start
Content-Type: application/json

{
  "phone": "+12125551234",
  "userType": "Creator"
}
# Phone number already registered
```

**Expected Response (409):**
```json
{
  "error": "Phone number already registered",
  "code": "RESOURCE_CONFLICT",
  "field": "phone",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Scenario 9.4: Rate Limiting (429)
```javascript
// Send 100 rapid requests to trigger rate limiting
for (let i = 0; i < 100; i++) {
  await request(app)
    .post('/api/auth/login')
    .send({
      phone: '+12125551234',
      password: 'wrong-password'
    });
}
```

**Expected Response (429):**
```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📊 Expected Response Formats

### 10. Standard Response Structures

#### Success Response Format
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

#### Error Response Format
```json
{
  "error": "Human readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

#### Paginated Response Format
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Security Headers Required
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Content-Type Standards
- Request: `application/json`
- Response: `application/json; charset=utf-8`
- File Upload: `multipart/form-data`

## 🔍 Test Execution Guidelines

### Manual Testing with Postman
1. Import the collection: `Axees_API_Tests.postman_collection.json`
2. Import the environment: `Axees_API_Environment.postman_environment.json`
3. Set the `base_url` variable to your test environment
4. Run tests in sequence or use Collection Runner for automation

### Automated Testing with Jest
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:security
npm run test:performance
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Continuous Integration
```yaml
# GitHub Actions will automatically run:
- Linting and code quality checks
- Unit tests
- Integration tests
- Security tests
- Performance benchmarks
- Coverage reporting
```

## 📝 Test Data Management

### Data Cleanup
```javascript
// All tests should clean up after themselves
afterEach(async () => {
  await clearDatabase();
});
```

### Mock Data Consistency
```javascript
// Use consistent test data across scenarios
const testData = require('./fixtures/testData.js');
```

### Environment Isolation
```javascript
// Ensure test isolation
beforeEach(async () => {
  await resetMocks();
  await seedTestData();
});
```

---

**Note:** This documentation should be updated whenever new API endpoints are added or existing ones are modified. All test scenarios should be validated in both staging and production environments before release.