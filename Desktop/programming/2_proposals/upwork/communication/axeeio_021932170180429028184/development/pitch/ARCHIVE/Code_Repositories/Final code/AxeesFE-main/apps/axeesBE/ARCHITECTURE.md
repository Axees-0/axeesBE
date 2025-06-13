# Axees Platform Architecture

## System Overview

The Axees platform is a comprehensive influencer marketing solution built with a modern, scalable architecture. The system connects marketers with content creators through a secure, feature-rich API.

## Technology Stack

### Backend
- **Runtime**: Node.js 18.x / 20.x
- **Framework**: Express.js
- **Database**: MongoDB 6.0+ with Mongoose ODM
- **Authentication**: JWT with phone-based OTP verification
- **Real-time**: Server-Sent Events (SSE) for chat
- **File Storage**: Local filesystem (production: AWS S3 recommended)
- **Payment Processing**: Stripe
- **Messaging**: Twilio SMS & Firebase Push Notifications
- **Email**: Nodemailer with SMTP

### Testing & Quality
- **Test Framework**: Jest with Supertest
- **Coverage**: 85%+ with 250+ test cases
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint

## Core Architecture Patterns

### 1. MVC Pattern
```
├── models/          # Data models (Mongoose schemas)
├── controllers/     # Business logic handlers
├── routes/          # API endpoint definitions
└── views/           # Not used (API-only)
```

### 2. Service Layer Pattern
- Business logic separated into service modules
- Controllers handle HTTP concerns only
- Services handle domain logic

### 3. Middleware Architecture
- Authentication middleware for protected routes
- Error handling middleware
- Request validation middleware
- File upload handling with Multer

## Data Flow Architecture

```
Client Request
    ↓
Express Router
    ↓
Middleware Stack
    ├── CORS
    ├── Body Parser
    ├── Authentication
    └── Validation
    ↓
Controller
    ↓
Service Layer
    ↓
Data Access (Mongoose)
    ↓
MongoDB
```

## Key Components

### Authentication System
- **Phone-based OTP**: Initial authentication via SMS
- **JWT Tokens**: Stateless session management
- **Role-based Access**: Creator vs Marketer permissions
- **Manual Auth**: Flexible authentication middleware

### Offer Management System
```
Offer States:
Draft → Sent → Counter → Accepted/Rejected → Deal Created
```

### Payment Flow
1. **Checkout Session**: Stripe checkout for payments
2. **Escrow System**: 50% upfront, 50% on completion
3. **Milestone Funding**: Marketer funds milestones
4. **Withdrawal**: Creators request payouts

### Real-time Chat System
- **SSE Implementation**: Server-Sent Events for real-time updates
- **Message Queue**: In-memory client management
- **File Attachments**: Multipart upload support
- **Notification Delay**: 2-minute delay for unread messages

## Security Architecture

### Authentication & Authorization
- JWT token validation
- Role-based access control
- Resource-level authorization checks

### Input Security
- Request validation and sanitization
- XSS prevention
- NoSQL injection protection
- File upload validation

### API Security
- Rate limiting on sensitive endpoints
- CORS configuration
- Security headers
- HTTPS enforcement (production)

## Database Schema Design

### Core Collections
1. **Users**: Polymorphic design for Creator/Marketer
2. **Offers**: Negotiation and deal proposals
3. **Deals**: Active projects with milestones
4. **Chats**: Conversation rooms
5. **Messages**: Individual chat messages
6. **Transactions**: Payment records

### Indexing Strategy
- Phone numbers (unique)
- Username (unique, case-insensitive)
- Email (unique, case-insensitive)
- Offer status + dates (compound)
- Chat participants (compound)

## External Service Integration

### Payment Processing (Stripe)
- Checkout Sessions API
- Payment Methods API
- Webhooks for payment events
- Connect for marketplace payouts

### Communication Services
- **Twilio**: SMS OTP delivery
- **MessageCentral**: Backup SMS provider
- **Firebase**: Push notifications
- **Nodemailer**: Email notifications

## Scalability Considerations

### Horizontal Scaling
- Stateless architecture (JWT)
- Database connection pooling
- External service abstraction

### Performance Optimizations
- Database indexing
- Query optimization
- Caching strategy (Redis ready)
- Pagination for large datasets

### Monitoring Points
- API response times
- Database query performance
- External service latency
- Error rates and types

## Deployment Architecture

### Development
```
Local MongoDB → Node.js Server → Local Testing
```

### Staging/Production
```
MongoDB Atlas → Node.js (EB) → CloudFront → Clients
     ↓              ↓
   Backups      Auto-scaling
```

### Environment Configuration
- Environment-based configuration
- Secrets management via environment variables
- Feature flags for gradual rollouts

## API Design Principles

### RESTful Conventions
- Resource-based URLs
- HTTP method semantics
- Status code standards
- Consistent response format

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Future Architecture Considerations

### Microservices Migration
- Payment service extraction
- Notification service extraction
- Chat service with WebSocket

### Performance Enhancements
- Redis caching layer
- CDN for static assets
- Database read replicas
- Message queue implementation

### Observability
- Distributed tracing
- Centralized logging
- Performance monitoring
- Business metrics dashboard