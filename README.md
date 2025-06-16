# Axees Backend API

## Overview
Axees is an influencer marketing platform connecting brands/marketers with content creators. This backend API powers the platform with features including user authentication, offer management, payment processing, real-time chat, and deal execution workflows.

## 🚀 Features
- **Authentication**: Phone-based OTP authentication with JWT tokens
- **User Management**: Separate flows for Creators and Marketers
- **Offer System**: Complete offer lifecycle with real-time collaboration and negotiations
- **Payment Integration**: Stripe integration with escrow payments
- **Real-time Chat**: SSE-based messaging with file attachments
- **Deal Execution**: Milestone-based project management
- **AI-Powered Creator Discovery**: Advanced influencer search with competitive intelligence
- **Security**: Comprehensive security measures against common vulnerabilities
- **Frontend Integration**: Complete frontend-backend integration with Phase 1-4 implementations
  - Phase 1: Infrastructure setup and API integration
  - Phase 2: Authentication system with JWT and OTP verification
  - Phase 3: Core features - offer creation, real-time collaboration, and negotiation with comments
  - Phase 4: Payment system - Stripe integration, trial offers, and payment persistence (Backend Complete)

## 📋 Prerequisites
- Node.js 18.x or 20.x
- MongoDB 6.0+
- Redis (optional, for caching)
- Stripe account (for payments)
- Twilio account (for SMS)
- Firebase project (for push notifications)

## 🛠️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd axeesBE
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB
```bash
mongod --dbpath /data/db
```

5. Run the application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🌐 Frontend Integration

The backend now includes an integrated demo frontend with a comprehensive API client layer.

### Frontend Features
- **API Client**: Centralized API integration (`/public/js/api.js`)
  - Automatic retry logic with exponential backoff
  - Global loading state management
  - JWT token handling and automatic refresh
  - Phone-based authentication with OTP verification
  - Email verification and comment API integration
- **Authentication System**: Complete phone/OTP registration and login flow
  - AuthContext for centralized state management
  - Auto-logout with token expiry warnings
  - Protected route handling
  - Multi-tab session synchronization
- **Offer Management**: Complete offer lifecycle implementation
  - Multi-step offer creation with draft saving
  - Real-time collaboration with conflict resolution
  - Negotiation system with comment timeline
  - Email retry mechanism with exponential backoff
- **Payment System**: Comprehensive payment infrastructure (Backend Complete)
  - Stripe integration with payment methods and webhooks
  - $1 trial offer system with automatic conversion
  - Secure payment persistence with AES-256-GCM encryption
  - Stripe Connect for creator payouts
  - PCI compliant tokenization and storage
- **Dynamic Navigation**: Role-based navigation with user dropdown
- **Loading Indicators**: Visual feedback during API operations
- **Demo Pages**: Fully styled demo pages showcasing platform features

### Accessing the Frontend
Once the server is running, access the frontend at:
- Landing Page: `http://localhost:8080/`
- Dashboard: `http://localhost:8080/dashboard.html`
- Marketplace: `http://localhost:8080/marketplace.html`
- Profile: `http://localhost:8080/profile.html`

### API Client Usage
```javascript
// The global API client is available in all pages
const response = await axeesAPI.login(phone, password);
const otpResponse = await axeesAPI.startRegistration(phone, 'influencer');
await axeesAPI.verifyOtp(phone, code);
const profile = await axeesAPI.getProfile();

// Authentication state management
authContext.subscribe((state) => {
  if (state.isAuthenticated) {
    console.log('User logged in:', state.user);
  }
});

// Check loading state
if (axeesAPI.isLoading()) {
  // Show custom loading UI
}

// Listen for loading events
window.addEventListener('axees-loading-change', (event) => {
  console.log(event.detail.endpoint, event.detail.isLoading);
});
```

## 🧪 Testing

The project includes a comprehensive test suite with **98.1% pass rate (106/108 tests)** covering all major functionality including payment processing, deal execution, authentication, and security.

### Current Test Status
- **Total Tests**: 108
- **Passing**: 106 (98.1%)
- **Test Coverage**: Payment management, deal execution, authentication, webhooks
- **Recent Improvements**: Enhanced authentication, fixed webhook processing, improved database queries

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
# Payment management tests (comprehensive Stripe integration)
npm test tests/integration/payment-management.test.js

# Deal execution tests (milestone-based workflow)
npm test tests/integration/deal-execution.test.js

# Authentication tests
npm run test:auth

# Offer management tests (36 tests)
npm run test:offers

# Security tests
npm run test:security

# Performance tests
npm run test:performance
```

### Generate coverage report
```bash
npm run test:coverage
```

### Test Documentation
Comprehensive test documentation is available in `docs/testing/` including API test scenarios and testing achievements summary.

## 💳 Payment System

### Payment Features
- **Stripe Integration**: Full Stripe payment processing with webhooks
- **Escrow System**: Secure escrow payments for deal transactions
- **Multiple Payment Types**: Support for offer fees, milestone funding, and final payments
- **Advanced Filtering**: Comprehensive payment history with date range, status, and pagination
- **Real-time Webhooks**: Automatic payment status updates via Stripe webhooks
- **Role-based Access**: Admin override capabilities for payment management

### Deal Execution API Endpoints

The Deal Execution API provides milestone-based project management with role-based access control, payment automation, and comprehensive workflow tracking.

#### Core Deal Execution Flow

```http
PUT /api/v1/deals/:id/submit-milestone
```
Allows creators to submit deliverables for funded milestones.

**Request Body:**
```json
{
  "milestoneId": "64a1b2c3d4e5f6789012",
  "deliverables": [
    {
      "type": "file",
      "url": "/uploads/deliverables/design-mockup.jpg",
      "originalName": "design-mockup.jpg"
    },
    {
      "type": "text",
      "content": "Content has been created according to specifications."
    }
  ],
  "notes": "Milestone completed successfully"
}
```

```http
PUT /api/v1/deals/:id/approve-milestone
```
Allows marketers to approve or reject submitted milestone deliverables.

**Request Body:**
```json
{
  "milestoneId": "64a1b2c3d4e5f6789012",
  "action": "approve",
  "rating": 5
}
```

For rejection:
```json
{
  "milestoneId": "64a1b2c3d4e5f6789012",
  "action": "reject",
  "feedback": "Please revise according to brand guidelines"
}
```

```http
POST /api/v1/deals/:id/complete
```
Completes a deal with optional final payment and rating.

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Excellent work, very satisfied",
  "triggerFinalPayment": true
}
```

#### File Upload Support

```http
POST /api/v1/deals/:id/upload-deliverable
```
Upload files that can be used as milestone deliverables (supports images, documents, videos up to 50MB).

#### Key Features:
- **Role-based access**: Creators submit, Marketers approve
- **Automatic payments**: Milestone approval triggers payment release
- **Notification system**: Real-time updates for all parties
- **File upload**: Support for multiple file types with validation
- **Error handling**: Comprehensive validation and error responses
- **Duplicate prevention**: Prevents duplicate submissions and completions

### Payment API Endpoints

#### Core Payment Processing
```http
POST /api/payments/create-payment-intent
```
Creates a Stripe payment intent with amount validation and currency handling.

**Request Body:**
```json
{
  "amount": 50.00,
  "currency": "usd",
  "metadata": {
    "dealId": "64a1b2c3d4e5f6789012",
    "paymentType": "escrowPayment"
  }
}
```

```http
POST /api/payments/confirm-payment
```
Confirms payment intent and creates escrow records for deals.

**Request Body:**
```json
{
  "paymentIntentId": "pi_test_1234567890",
  "paymentMethodId": "pm_test_1234567890",
  "dealId": "64a1b2c3d4e5f6789012",
  "escrowAmount": 500
}
```

#### Payment History & Reporting
```http
GET /api/payments/history?page=1&limit=50&status=completed&includeCount=true
```
Retrieves payment history with advanced filtering and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (1-100, default: 50)
- `status` - Filter by status: pending, completed, failed, escrowed, released
- `filter` - Date filter: last30days or dateRange
- `startDate` - Start date for dateRange filter (YYYY-MM-DD)
- `endDate` - End date for dateRange filter (YYYY-MM-DD)
- `cursor` - Cursor for cursor-based pagination
- `includeCount` - Include total count in response
- `adminUserId` - Admin override to view other user's payments

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "total": 150,
    "totalPages": 3,
    "nextCursor": "2024-12-06T10:30:00.000Z"
  },
  "filters": {
    "applied": {
      "status": "completed",
      "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
    }
  }
}
```

### Testing
The payment system includes 72 comprehensive tests covering:
- Payment intent creation and validation
- Payment confirmation with escrow handling
- Webhook processing and signature validation
- Advanced pagination and filtering
- Error handling and edge cases
- Role-based access control

## 📚 API Documentation

### Swagger Documentation
API documentation is available at:
```
http://localhost:3000/api-docs
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/register/start` - Start registration with phone
- `POST /api/auth/register/verify` - Verify OTP
- `POST /api/auth/register/complete` - Complete registration
- `POST /api/auth/login` - Login with phone/password
- `GET /api/auth/profile` - Get authenticated user profile

#### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/search` - Search users
- `GET /api/users/creator/:id` - Get creator details

#### Offers
- `POST /api/marketer/offers` - Create offer
- `GET /api/marketer/offers` - List offers
- `GET /api/marketer/offers/:id` - Get offer details
- `POST /api/marketer/offers/:id/respond` - Respond to offer

#### Payments (Enhanced with Full Stripe Integration)
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment with escrow support
- `GET /api/payments/history` - Get comprehensive payment history with advanced filtering
- `POST /api/payments/create-checkout-session` - Create checkout session
- `GET /api/payments/session-status` - Get payment session status
- `POST /api/payments/webhook` - Handle Stripe webhooks
- `GET /api/payments/methods` - List payment methods
- `POST /api/payments/withdraw` - Request withdrawal
- `GET /api/payments/earnings` - Get earnings with pagination and filtering
- `GET /api/payments/earnings/summary` - Get earnings summary
- `GET /api/payments/earnings/:id` - Get individual earning details

#### Chat
- `GET /api/chats/` - List chat rooms
- `POST /api/chats/:chatId/messages` - Send message
- `GET /api/chats/:chatId/messages` - Get messages
- `GET /api/chats/:chatId/stream` - SSE stream for real-time updates

#### AI Creator Discovery
- `GET /api/find` - AI-powered influencer search with advanced filtering
- Supports 25+ filter parameters including demographics, engagement metrics, competitive analysis
- Features: name/location search, fraud detection, audience overlap analysis, growth trend analysis

#### Deals
- `GET /api/marketer/deals` - List deals
- `GET /api/marketer/deals/:id` - Get deal details
- `POST /api/marketer/deals/:id/milestones` - Add milestone
- `POST /api/marketer/deals/:id/milestones/:milestoneId/fund` - Fund milestone

## 🏗️ Project Structure
```
axeesBE/
├── controllers/       # Request handlers
├── models/           # MongoDB schemas
├── routes/           # API route definitions
├── services/         # Business logic services
├── utils/            # Utility functions
├── middleware/       # Express middleware
├── cron/             # Scheduled jobs
├── tests/            # Test suites
│   ├── integration/  # Integration tests
│   ├── helpers/      # Test utilities
│   └── README.md     # Testing documentation
├── uploads/          # File uploads directory
├── main.js           # Application entry point
├── .env.example      # Environment template
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🔒 Security
- JWT-based authentication
- Input validation and sanitization
- XSS and injection prevention
- Rate limiting on sensitive endpoints
- Secure password hashing with bcrypt
- HTTPS enforcement in production

## 🚦 Environment Variables
See `.env.example` for all required environment variables. Key variables include:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `TWILIO_ACCOUNT_SID` - Twilio credentials
- `FIREBASE_PROJECT_ID` - Firebase configuration

## 📈 Performance
- Response time targets:
  - Authentication: < 500ms
  - API calls: < 200ms
  - Complex queries: < 1s
- Supports 20+ concurrent requests
- Database indexing for optimal query performance

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
This project is proprietary software for Axees platform.

## 🆘 Support
For issues or questions, please contact the development team or create an issue in the repository.