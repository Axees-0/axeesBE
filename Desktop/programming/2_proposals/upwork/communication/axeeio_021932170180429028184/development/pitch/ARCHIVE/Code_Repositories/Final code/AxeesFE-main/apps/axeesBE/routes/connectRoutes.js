// routes/connect.js
const express = require('express');
const { onboardConnectAccount, verifyConnectAccount } = require('../controllers/connectController');
const router = express.Router();

// POST /api/connect/onboard
router.post('/onboard', onboardConnectAccount);
// Route to verify a Stripe Connect account
router.get('/verify/:connectId', verifyConnectAccount);

module.exports = router;
