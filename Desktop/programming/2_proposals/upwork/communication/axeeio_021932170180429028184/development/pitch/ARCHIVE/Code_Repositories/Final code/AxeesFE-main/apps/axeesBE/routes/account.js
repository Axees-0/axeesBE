// routes/accountRoutes.js

const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
/** @type {import('express').Router} */
const router = Router();
const accountController = require("../controllers/accountController");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/media-packages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for media package uploads
const mediaPackageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.params.userId}-${file.fieldname}-${uniqueSuffix}${path.extname(
        file.originalname
      )}`
    );
  },
});

const mediaPackageUpload = multer({
  storage: mediaPackageStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/gif",
      "image/jpeg",
      "image/png",
      "application/photoshop",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: User account/profile management
 */

/**
 * @swagger
 * /account/register/set-profile:
 *   post:
 *     summary: Set initial user profile details after OTP verification
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               userName:
 *                 type: string
 *               brandName:
 *                 type: string
 *               handleName:
 *                 type: string
 *               nicheTopics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 */
router.post("/register/set-profile", accountController.setProfile);

/**
 * @swagger
 * /account/update-name:
 *   post:
 *     summary: Update user's name only
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Name updated successfully
 */
router.post("/update-name", accountController.updateName);

/**
 * @swagger
 * /account/update-username:
 *   post:
 *     summary: Update user's username
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - username
 *             properties:
 *               userId:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Username updated successfully
 *       409:
 *         description: Username already taken
 */
router.post("/update-username", accountController.updateUsername);

/**
 * @swagger
 * /account/set-email:
 *   post:
 *     summary: Update user's email
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - email
 *             properties:
 *               userId:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       404:
 *         description: User not found
 */
router.post("/set-email", accountController.setEmail);

/**
 * @swagger
 * /account/set-password:
 *   post:
 *     summary: Set user password (final stage to fully activate)
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 *       404:
 *         description: User not found
 */
router.post("/set-password", accountController.setPassword);

/**
 * @swagger
 * /account/profile/{userId}:
 *   put:
 *     summary: Update user profile (PUT or PATCH for certain fields)
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/profile/:userId", accountController.updateProfile);

/**
 * @swagger
 * /account/device-token/{userId}:
 *   put:
 *     summary: Update device token for push notifications
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device token updated successfully
 */
router.put("/device-token/:userId", accountController.updateDeviceToken);

/**
 * @swagger
 * /account/{userId}:
 *   delete:
 *     summary: Delete (soft delete) a user account
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete("/:userId", accountController.deleteAccount);

/**
 * @swagger
 * /account/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get("/profile/:userId", accountController.getProfile);

/**
 * @swagger
 * /account/creator/{userId}:
 *   patch:
 *     summary: Update creatorData fields (nicheTopics, achievements, etc.)
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       description: Creator fields to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               handleName: { type: string }
 *               nicheTopics: { type: array, items: { type: string } }
 *               totalFollowers: { type: number }
 *               achievements: { type: array, items: { type: string } }
 *               businessVentures: { type: array, items: { type: string } }
 *               rates: {
 *                 type: object,
 *                 properties: { sponsoredPostRate: { type: number } }
 *               }
 *     responses:
 *       200:
 *         description: Creator data updated
 */
router.patch("/creator/:userId", accountController.updateCreatorData);

/**
 * @swagger
 * /account/marketer/{userId}:
 *   patch:
 *     summary: Update marketerData fields
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       description: Marketer fields to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandName: { type: string }
 *               brandWebsite: { type: string }
 *               brandDescription: { type: string }
 *               industry: { type: string }
 *               budget: { type: number }
 *     responses:
 *       200:
 *         description: Marketer data updated
 */
router.patch("/marketer/:userId", accountController.updateMarketerData);

/**
 * @swagger
 * /account/creator/{userId}/social-handles:
 *   post:
 *     summary: Add a social handle to a Creator's profile
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform, handle]
 *             properties:
 *               platform: { type: string, enum: [instagram, tiktok, youtube, twitter, other] }
 *               handle: { type: string }
 *               followersCount: { type: number }
 *     responses:
 *       200:
 *         description: Social handle added
 */
router.post(
  "/creator/:userId/social-handles",
  accountController.addSocialHandle
);

/**
 * @swagger
 * /account/creator/{userId}/social-handles/{handleId}:
 *   patch:
 *     summary: Update an existing social handle sub-doc
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *       - in: path
 *         name: handleId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform: { type: string }
 *               handle: { type: string }
 *               followersCount: { type: number }
 *     responses:
 *       200:
 *         description: Social handle updated
 */
router.patch(
  "/creator/:userId/social-handles/:handleId",
  accountController.updateSocialHandle
);

/**
 * @swagger
 * /account/creator/{userId}/social-handles/{handleId}:
 *   delete:
 *     summary: Delete a social handle from a Creator's profile
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *       - in: path
 *         name: handleId
 *         required: true
 *     responses:
 *       200:
 *         description: Social handle removed
 */
router.delete(
  "/creator/:userId/social-handles/:handleId",
  accountController.deleteSocialHandle
);

/**
 * @swagger
 * /account/creator/{userId}/portfolio:
 *   post:
 *     summary: Add a portfolio item (image, video, etc.) to a Creator
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaUrl: { type: string }
 *               mediaType: { type: string, enum: [image, video, pdf, other] }
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Portfolio item added
 */
router.post("/creator/:userId/portfolio", accountController.addPortfolioItem);

/**
 * @swagger
 * /account/creator/{userId}/portfolio/{itemId}:
 *   patch:
 *     summary: Update a portfolio item
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *       - in: path
 *         name: itemId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaUrl: { type: string }
 *               mediaType: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Portfolio item updated
 */
router.patch(
  "/creator/:userId/portfolio/:itemId",
  accountController.updatePortfolioItem
);

/**
 * @swagger
 * /account/creator/{userId}/portfolio/{itemId}:
 *   delete:
 *     summary: Remove a portfolio item
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *       - in: path
 *         name: itemId
 *         required: true
 *     responses:
 *       200:
 *         description: Portfolio item removed
 */
router.delete(
  "/creator/:userId/portfolio/:itemId",
  accountController.deletePortfolioItem
);

/**
 * @swagger
 * /account/settings/{userId}:
 *   patch:
 *     summary: Update user settings (notifications, privacy)
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       description: Settings object
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   push: { type: boolean }
 *                   email: { type: boolean }
 *                   sms: { type: boolean }
 *               privacy:
 *                 type: object
 *                 properties:
 *                   showEmail: { type: boolean }
 *                   showPhone: { type: boolean }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch("/settings/:userId", accountController.updateSettings);

/**
 * @swagger
 * /account/change-password/{userId}:
 *   post:
 *     summary: Change user password
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Invalid current password
 */
router.post("/change-password/:userId", accountController.changePassword);

/**
 * /account/{userId}:
 *   delete:
 *     summary: Soft-delete the user account
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Account deleted (soft)
 */
router.delete("/:userId", accountController.deleteAccount);

/**
 * @swagger
 * /account/{userId}/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.post("/:userId/deactivate", accountController.deactivateAccount);

/**
 * @swagger
 * /account/{userId}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post("/:userId/avatar", accountController.uploadAvatar);

/**
 * @swagger
 * /account/{userId}/media-package:
 *   post:
 *     summary: Upload media package
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media package uploaded successfully
 *       400:
 *         description: Media package upload failed
 */
router.post(
  "/:userId/media-package",
  mediaPackageUpload.single("mediaPackage"),
  accountController.uploadMediaPackage
);

/**
 * @swagger
 * /account/notification-settings/{userId}:
 *   patch:
 *     summary: Update notification settings
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               push:
 *                 type: boolean
 *               email:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  "/notification-settings/:userId",
  accountController.updateNotificationSettings
);

/**
 * @swagger
 * /account/send-verification-email:
 *   post:
 *     summary: Send a verification email to the user.
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email sent successfully.
 *       400:
 *         description: Missing userId or user not found.
 */
router.post(
  "/send-verification-email",
  accountController.sendVerificationEmail
);

/**
 * @swagger
 * /account/verify-email/{token}:
 *   get:
 *     summary: Verify user email using the token.
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to the user's email.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired token.
 */
router.get("/verify-email/:token", accountController.verifyEmail);

module.exports = router;
