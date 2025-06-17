// routes/notifications.js
const { Router } = require("express");
/** @type {import('express').Router} */
const router = Router();
const Notification = require("../models/Notification");

// In-memory storage for SSE clients
const notificationClients = new Map();

/**
 * GET /api/notifications?userId=XYZ
 * Fetch all notifications belonging to a given user
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/notifications/mark-read?userId=XYZ
 * Mark all notifications as read for a given user
 */
router.post("/mark-read", async (req, res) => {
  try {
    const { userId, type, notificationId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    if (type === "individual") {
      await Notification.markAsRead(userId, notificationId);
    } else if (type === "all") {
      await Notification.markAllAsRead(userId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing id parameter" });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    await Notification.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/notifications/stream
 * Server-Sent Events stream for real-time notifications
 */
router.get("/stream", (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Notification stream connected' })}\n\n`);

  // Store client connection
  notificationClients.set(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    notificationClients.delete(userId);
  });

  req.on('error', () => {
    notificationClients.delete(userId);
  });
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for a user
 */
router.put("/preferences", async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const preferences = req.body.preferences || req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Store preferences (you might want to create a UserPreferences model)
    // For now, we'll just acknowledge the request
    console.log(`Updated notification preferences for user ${userId}:`, preferences);

    res.json({ 
      success: true, 
      message: "Notification preferences updated",
      preferences: preferences
    });
  } catch (err) {
    console.error("Error updating notification preferences:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for a user
 */
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Broadcast notification to specific user
 * This function should be called from other parts of the application
 * when a new notification needs to be sent
 */
function broadcastNotification(userId, notification) {
  const client = notificationClients.get(userId);
  if (client) {
    try {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      notificationClients.delete(userId);
    }
  }
}

// Export the broadcast function for use in other modules
router.broadcastNotification = broadcastNotification;

module.exports = router;
