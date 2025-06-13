// routes/notifications.js
const { Router } = require("express");
/** @type {import('express').Router} */
const router = Router();
const Notification = require("../models/Notification");

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

module.exports = router;
