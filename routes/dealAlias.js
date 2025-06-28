const express = require('express');
const router = express.Router();

// Import the marketer deal routes to use their handlers
const marketerDealRoutes = require('./marketerDealRoutes');

/**
 * Deal Alias Routes
 * These routes provide compatibility aliases for frontend expectations
 * /api/deals/* -> /api/marketer/deals/*
 */

// Get deals list (frontend expects: GET /api/deals)
router.get('/', (req, res, next) => {
  // Redirect to marketer deals endpoint
  req.url = '/';
  marketerDealRoutes(req, res, next);
});

// Create deal (frontend expects: POST /api/deals)
router.post('/', (req, res, next) => {
  // Redirect to marketer deals create endpoint
  req.url = '/';
  marketerDealRoutes(req, res, next);
});

// Get specific deal (frontend expects: GET /api/deals/:id)
router.get('/:id', (req, res, next) => {
  // Redirect to marketer deal by ID
  req.url = `/${req.params.id}`;
  marketerDealRoutes(req, res, next);
});

// Update deal (frontend expects: PUT /api/deals/:id)
router.put('/:id', (req, res, next) => {
  // Redirect to marketer deal update
  req.url = `/${req.params.id}`;
  marketerDealRoutes(req, res, next);
});

// Delete deal (frontend expects: DELETE /api/deals/:id)
router.delete('/:id', (req, res, next) => {
  // Redirect to marketer deal delete
  req.url = `/${req.params.id}`;
  marketerDealRoutes(req, res, next);
});

// Get deal payments (frontend expects: GET /api/deals/:id/payments)
router.get('/:id/payments', (req, res, next) => {
  // Redirect to marketer deal payments
  req.url = `/${req.params.id}/payments`;
  marketerDealRoutes(req, res, next);
});

// Get deal history (frontend expects: GET /api/deals/:id/history)
router.get('/:id/history', (req, res, next) => {
  // Redirect to marketer deal history
  req.url = `/${req.params.id}/history`;
  marketerDealRoutes(req, res, next);
});

// Update deal status (frontend expects: PATCH /api/deals/:id/status)
router.patch('/:id/status', (req, res, next) => {
  // Redirect to marketer deal status update
  req.url = `/${req.params.id}/status`;
  marketerDealRoutes(req, res, next);
});

// Cancel deal (frontend expects: POST /api/deals/:id/cancel)
router.post('/:id/cancel', (req, res, next) => {
  // Redirect to marketer deal cancel
  req.url = `/${req.params.id}/cancel`;
  marketerDealRoutes(req, res, next);
});

// Complete deal (frontend expects: POST /api/deals/:id/complete)
router.post('/:id/complete', (req, res, next) => {
  // Redirect to marketer deal complete
  req.url = `/${req.params.id}/complete`;
  marketerDealRoutes(req, res, next);
});

// Get deal milestones (frontend expects: GET /api/deals/:id/milestones)
router.get('/:id/milestones', (req, res, next) => {
  // Redirect to marketer deal milestones
  req.url = `/${req.params.id}/milestones`;
  marketerDealRoutes(req, res, next);
});

// Update milestone (frontend expects: PATCH /api/deals/:id/milestones/:milestoneId)
router.patch('/:id/milestones/:milestoneId', (req, res, next) => {
  // Redirect to marketer deal milestone update
  req.url = `/${req.params.id}/milestones/${req.params.milestoneId}`;
  marketerDealRoutes(req, res, next);
});

// Note: Analytics and stats are handled by separate dedicated routes
// that were already implemented in this session:
// - /api/deals/analytics -> handled by analyticsRoutes
// - /api/deals/stats -> handled by dashboardRoutes

module.exports = router;