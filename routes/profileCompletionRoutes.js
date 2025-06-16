const express = require("express");
const router = express.Router();
const profileCompletionController = require("../controllers/profileCompletionController");

/**
 * Profile Completion Routes
 * Provides comprehensive profile completion tracking and management
 */

// GET /api/profile-completion/:userId - Get user's profile completion status
router.get("/:userId", profileCompletionController.getProfileCompletion);

// POST /api/profile-completion/:userId/step - Mark specific step as completed
router.post("/:userId/step", profileCompletionController.markStepCompleted);

// GET /api/profile-completion/requirements/:userType - Get profile requirements for user type
router.get("/requirements/:userType", profileCompletionController.getProfileRequirements);

// PUT /api/profile-completion/:userId/notifications - Update notification settings
router.put("/:userId/notifications", profileCompletionController.updateNotificationSettings);

// GET /api/profile-completion/analytics/overview - Get completion analytics (admin)
router.get("/analytics/overview", profileCompletionController.getCompletionAnalytics);

// POST /api/profile-completion/:userId/reminder - Send completion reminder
router.post("/:userId/reminder", profileCompletionController.sendCompletionReminder);

module.exports = router;