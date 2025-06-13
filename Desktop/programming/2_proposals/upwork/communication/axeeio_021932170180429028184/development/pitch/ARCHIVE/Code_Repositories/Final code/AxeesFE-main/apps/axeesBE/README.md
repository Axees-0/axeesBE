# Axees Backend API

## Overview
Axees is an influencer marketing platform connecting brands/marketers with content creators. This backend API powers the platform with features including user authentication, offer management, payment processing, real-time chat, and deal execution workflows.

## 🚀 Features
- **Authentication**: Phone-based OTP authentication with JWT tokens
- **User Management**: Separate flows for Creators and Marketers
- **Offer System**: Complete offer lifecycle with negotiations
- **Payment Integration**: Stripe integration with escrow payments
- **Real-time Chat**: SSE-based messaging with file attachments
- **Deal Execution**: Milestone-based project management
- **Security**: Comprehensive security measures against common vulnerabilities

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

## 🧪 Testing

The project includes a comprehensive test suite with 250+ tests covering all major functionality.

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
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

For detailed testing documentation, see [tests/README.md](tests/README.md).

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

#### Payments
- `POST /api/payments/checkout` - Create checkout session
- `GET /api/payments/methods` - List payment methods
- `POST /api/payments/withdraw` - Request withdrawal
- `GET /api/payments/earnings` - Get earnings history

#### Chat
- `GET /api/chats/` - List chat rooms
- `POST /api/chats/:chatId/messages` - Send message
- `GET /api/chats/:chatId/messages` - Get messages
- `GET /api/chats/:chatId/stream` - SSE stream for real-time updates

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