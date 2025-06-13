const express = require('express');
const router = express.Router();
const tempUserController = require('../controllers/tempUserController');
const { authenticateToken } = require('../middleware/auth');

// Convert temp user to permanent user
router.post('/convert/:userName', authenticateToken, async (req, res) => {
  try {
    const result = await tempUserController.convertTempUserToPermanent(req.params.userName);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update temp user status
router.patch('/status/:userName', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await tempUserController.updateTempUserStatus(req.params.userName, status);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cleanup expired temp users (admin only)
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await tempUserController.cleanupExpiredTempUsers();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 