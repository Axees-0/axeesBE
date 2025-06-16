const express = require("express");
const router = express.Router();
const negotiationController = require("../controllers/negotiationController");

/**
 * Enhanced Negotiation Routes
 * Provides comprehensive negotiation table management
 */

// GET /api/negotiation/:offerId - Get comprehensive negotiation table data
router.get("/:offerId", negotiationController.getNegotiationTable);

// POST /api/negotiation/:offerId/counter - Submit enhanced counter offer
router.post("/:offerId/counter", negotiationController.submitCounterOffer);

// POST /api/negotiation/:offerId/accept - Accept current negotiation terms
router.post("/:offerId/accept", negotiationController.acceptNegotiation);

// POST /api/negotiation/:offerId/reject - Reject negotiation
router.post("/:offerId/reject", negotiationController.rejectNegotiation);

// POST /api/negotiation/:offerId/message - Add message/note to negotiation
router.post("/:offerId/message", negotiationController.addNegotiationMessage);

// GET /api/negotiation/:offerId/visual-diff - Get visual diff comparison (Bug #9)
router.get("/:offerId/visual-diff", negotiationController.getOfferVisualDiff);

// GET /api/negotiation/analytics/user - Get user negotiation analytics
router.get("/analytics/user", negotiationController.getNegotiationAnalytics);

module.exports = router;