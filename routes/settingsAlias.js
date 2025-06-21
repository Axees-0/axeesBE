const express = require('express');
const router = express.Router();

// Import the notification settings routes to use their handlers
const notificationSettingsRoutes = require('./notificationSettingsRoutes');

/**
 * Settings Alias Routes
 * These routes provide compatibility aliases for frontend expectations
 * /api/settings/* -> /api/account/*
 */

// Get email notification settings (frontend expects: GET /api/settings/email-notifications)
router.get('/email-notifications', (req, res, next) => {
  // Redirect to account notification settings
  req.url = '/notification-settings';
  notificationSettingsRoutes(req, res, next);
});

// Update email notification settings (frontend expects: PUT /api/settings/email-notifications)
router.put('/email-notifications', (req, res, next) => {
  // Redirect to account notification settings update
  req.url = '/notification-settings';
  notificationSettingsRoutes(req, res, next);
});

// Get email preferences (frontend expects: GET /api/settings/email-preferences)
router.get('/email-preferences', (req, res, next) => {
  // Redirect to account email preferences
  req.url = '/email-preferences';
  notificationSettingsRoutes(req, res, next);
});

// Update email preferences (frontend expects: PUT /api/settings/email-preferences)
router.put('/email-preferences', (req, res, next) => {
  // Redirect to account email preferences update
  req.url = '/email-preferences';
  notificationSettingsRoutes(req, res, next);
});

module.exports = router;