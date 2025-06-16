const express = require("express");
const router = express.Router();
const trialOfferController = require("../controllers/trialOfferController");

/**
 * Trial Offer Routes
 * Handles $1 trial offers with automatic conversion
 */

// POST /api/trial-offers - Create a new trial offer
router.post("/", trialOfferController.createTrialOffer);

// POST /api/trial-offers/:offerId/accept - Accept trial offer and process $1 payment
router.post("/:offerId/accept", trialOfferController.acceptTrialOffer);

// POST /api/trial-offers/:offerId/convert - Convert trial to full offer
router.post("/:offerId/convert", trialOfferController.convertTrialToFull);

// POST /api/trial-offers/:offerId/cancel - Cancel trial offer
router.post("/:offerId/cancel", trialOfferController.cancelTrialOffer);

// GET /api/trial-offers/stats - Get trial offer statistics
router.get("/stats", trialOfferController.getTrialOfferStats);

// GET /api/trial-offers/active - Get active trials requiring action
router.get("/active", trialOfferController.getActiveTrials);

module.exports = router;