// Test app configuration
// This provides a configured Express app for testing without starting the server

// Mock MessageCentral FIRST before any other requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockImplementation((verificationId, code) => {
    if (verificationId === 123456 && code === '123456') {
      return Promise.resolve(true);
    }
    return Promise.reject(new Error('Invalid OTP code'));
  }),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ path: '.env.test' });
}

const express = require('express');
const cors = require('cors');

// Mock external services
jest.mock('twilio');
jest.mock('../../services/firebaseService', () => ({
  admin: {
    messaging: () => ({
      send: jest.fn().mockResolvedValue({ success: true }),
      sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 })
    })
  }
}));

// Routes
const authRoutes = require('../../routes/auth');
const accountRoutes = require('../../routes/account');
const notificationsRoute = require('../../routes/notifications');
const usersRoutes = require('../../routes/users');
const inviteRoutes = require('../../routes/inviteRoutes');
const marketerOfferRoutes = require('../../routes/marketerOfferRoutes');
const marketerDealRoutes = require('../../routes/marketerDealRoutes');
const chatRoutes = require('../../routes/chat');
const chatV1Routes = require('../../routes/chatV1');
const paymentRoutes = require('../../routes/paymentRoutes');
const { manualAuth } = require('../../controllers/authController');
const connectRoutes = require('../../routes/connectRoutes');
const findRoutes = require('../../routes/findRoutes');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Routes with /api prefix (matching main.js)
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/notifications', notificationsRoute);
app.use('/api/users', usersRoutes);
app.use('/api/invite', inviteRoutes);

// Use marketer offer routes directly
app.use('/api/marketer/offers', marketerOfferRoutes);

app.use('/api/marketer/deals', manualAuth, marketerDealRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/v1/chat', chatV1Routes);
// Add auth middleware to payment routes (except webhook endpoint)
app.use('/api/payments/webhook', paymentRoutes);
app.use('/api/payments', manualAuth, paymentRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/find', findRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'test' && { stack: err.stack })
  });
});

module.exports = app;