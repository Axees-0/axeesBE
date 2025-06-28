const express = require('express');
const router = express.Router();

// Import the marketer offer routes to use their handlers
const marketerOfferRoutes = require('./marketerOfferRoutes');

/**
 * Offer Alias Routes
 * These routes provide compatibility aliases for frontend expectations
 * /api/offers/* -> /api/marketer/offers/*
 */

// Get offers list (frontend expects: GET /api/offers)
router.get('/', (req, res, next) => {
  // Redirect to marketer offers endpoint
  req.url = '/';
  marketerOfferRoutes(req, res, next);
});

// Create offer (frontend expects: POST /api/offers)
router.post('/', (req, res, next) => {
  // Redirect to marketer offers create endpoint
  req.url = '/';
  marketerOfferRoutes(req, res, next);
});

// Get specific offer (frontend expects: GET /api/offers/:id)
router.get('/:id', (req, res, next) => {
  // Redirect to marketer offer by ID
  req.url = `/${req.params.id}`;
  marketerOfferRoutes(req, res, next);
});

// Update offer (frontend expects: PUT /api/offers/:id)
router.put('/:id', (req, res, next) => {
  // Redirect to marketer offer update
  req.url = `/${req.params.id}`;
  marketerOfferRoutes(req, res, next);
});

// Delete offer (frontend expects: DELETE /api/offers/:id)
router.delete('/:id', (req, res, next) => {
  // Redirect to marketer offer delete
  req.url = `/${req.params.id}`;
  marketerOfferRoutes(req, res, next);
});

// Accept offer (frontend expects: POST /api/offers/:id/accept)
router.post('/:id/accept', (req, res, next) => {
  // Redirect to marketer offer accept
  req.url = `/${req.params.id}/accept`;
  marketerOfferRoutes(req, res, next);
});

// Reject offer (frontend expects: POST /api/offers/:id/reject)
router.post('/:id/reject', (req, res, next) => {
  // Redirect to marketer offer reject
  req.url = `/${req.params.id}/reject`;
  marketerOfferRoutes(req, res, next);
});

// Counter offer (frontend expects: POST /api/offers/:id/counter)
router.post('/:id/counter', (req, res, next) => {
  // Redirect to marketer offer counter
  req.url = `/${req.params.id}/counter`;
  marketerOfferRoutes(req, res, next);
});

// Withdraw offer (frontend expects: POST /api/offers/:id/withdraw)
router.post('/:id/withdraw', (req, res, next) => {
  // Redirect to marketer offer withdraw
  req.url = `/${req.params.id}/withdraw`;
  marketerOfferRoutes(req, res, next);
});

// Get offer history (frontend expects: GET /api/offers/:id/history)
router.get('/:id/history', (req, res, next) => {
  // Redirect to marketer offer history
  req.url = `/${req.params.id}/history`;
  marketerOfferRoutes(req, res, next);
});

// Note: Templates and fee calculation are handled by separate dedicated routes
// that were already implemented in this session:
// - /api/offers/templates/* -> handled by offerTemplateRoutes
// - /api/offers/calculate-fees -> handled by feeRoutes

module.exports = router;