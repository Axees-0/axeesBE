// routes/inviteRoutes.js

const { Router } = require("express");
/** @type {import('express').Router} */
const router = Router();
const inviteController = require("../controllers/inviteController");

/**
 * @swagger
 * tags:
 *   name: Invite
 *   description: Invitation system
 */

// 1) Create new invite
/**
 * @swagger
 * /invite/create:
 *   post:
 *     summary: Create an invitation
 *     tags: [Invite]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteeName: { type: string }
 *               inviteeEmail: { type: string }
 *     responses:
 *       200:
 *         description: Invite created, email sent
 */
router.post("/create", inviteController.createInvite);

// 2) My invites
/**
 * @swagger
 * /invite/my-invites:
 *   get:
 *     summary: Get invites created by logged in user
 *     tags: [Invite]
 *     responses:
 *       200:
 *         description: Returns array of invites
 */
router.get("/my-invites", inviteController.getMyInvites);

// 3) Check invite status
/**
 * @swagger
 * /invite/status/{inviteToken}:
 *   get:
 *     summary: Check invitation status by token
 *     tags: [Invite]
 *     parameters:
 *       - in: path
 *         name: inviteToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite found
 *       404:
 *         description: Invite not found
 */
router.get("/status/:inviteToken", inviteController.getInviteStatus);

// 4) (Optional) Accept invite
/**
 * @swagger
 * /invite/accept:
 *   post:
 *     summary: Accept an invitation token
 *     tags: [Invite]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteToken: { type: string }
 *     responses:
 *       200:
 *         description: Invite accepted
 *       404:
 *         description: Invalid token
 */
router.post("/accept", inviteController.acceptInvite);

// 5) Delete invite
/**
 * @swagger
 * /invite/{inviteId}:
 *   delete:
 *     summary: Delete an invite by ID
 */
router.delete("/:inviteId", inviteController.deleteInvite);

module.exports = router;
