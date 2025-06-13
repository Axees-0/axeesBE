# Changelog

All notable changes to the Axees Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Test Suite Implementation
- Comprehensive test suite with 250+ test cases
- Authentication tests (25+ tests) covering JWT, OTP, and password security
- User management tests (20+ tests) for profile CRUD operations
- Offer management tests (36 tests) with complete workflow coverage
- Payment integration tests (28+ tests) with Stripe mocking
- Deal execution tests (15+ tests) for milestone management
- Security tests (30+ tests) covering OWASP Top 10
- Chat/messaging tests (25+ tests) with real-time SSE testing
- Error handling tests (40+ tests) for complete error coverage
- Database integration tests (20+ tests) for data consistency
- Performance baseline tests (15+ tests) with load testing
- External service mocks for Stripe, Twilio, Firebase, etc.
- CI/CD pipeline with GitHub Actions
- Test documentation and quick start guide

### Added - Project Documentation
- Comprehensive README with setup instructions
- Architecture documentation (ARCHITECTURE.md)
- Test suite documentation (tests/README.md)
- Environment variable template (.env.example)
- API endpoint documentation

### Added - Code Quality
- ESLint configuration
- Jest test framework setup
- Logger utility for better debugging
- Proper .gitignore file

### Changed
- Consolidated app.js functionality into main.js
- Added temp-user routes to main application
- Fixed hardcoded notification timeout in chat.js
- Updated package.json with test scripts and dependencies

### Security
- Added .gitignore to prevent sensitive data exposure
- Created .env.example for secure configuration
- Removed .env from version control (critical security fix)

## [1.0.0] - Initial Release

### Features
- User authentication with phone-based OTP
- User management for Creators and Marketers
- Offer creation and negotiation system
- Payment processing with Stripe
- Real-time chat with SSE
- Deal execution with milestones
- Push notifications via Firebase
- Email notifications via Nodemailer
- SMS notifications via Twilio/MessageCentral
- File upload support
- Swagger API documentation