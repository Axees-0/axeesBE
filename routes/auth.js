// routes/auth.js

const { Router } = require("express");
/** @type {import('express').Router} */
const router = Router();
const accountController = require("../controllers/accountController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication (OTP) & login flows
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive
 */
router.post("/login", accountController.login);

/**
 * @swagger
 * /auth/register/start:
 *   post:
 *     summary: Start registration (send OTP to phone)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - userType
 *             properties:
 *               phone:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [Marketer, Creator]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       409:
 *         description: Phone already registered
 */
router.post("/register/start", accountController.startRegistration);

/**
 * @swagger
 * /auth/register/verify-otp:
 *   post:
 *     summary: Verify OTP to create or finalize user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, user created or updated
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/register/verify-otp", accountController.verifyOtp);


/**
 * @swagger
 * /auth/register/verify-reset-otp:
 *   post:
 *     summary: Verify OTP to create or finalize user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               deviceToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, user created or updated
 *       400:
 *         description: Invalid or expired OTP
 */

router.post("/register/verify-reset-otp", accountController.verifyResetOtp);



/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP if it expired or user didn't receive it
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post("/resend-otp", accountController.resendOtp);

/**
 * @swagger
 * /auth/check-phone:
 *   get:
 *     summary: Check if a phone number is already registered
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns whether phone exists
 */
router.get("/check-phone", accountController.checkPhoneExists);

/**
 * @swagger
 * /auth/password-reset:
 *   post:
 *     summary: Start password reset by sending OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post("/password-reset", accountController.startPasswordReset);

/**
 * @swagger
 * /auth/complete-password-reset:
 *   post:
 *     summary: Complete password reset with new password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset completed successfully
 */
router.post(
  "/complete-password-reset",
  accountController.completePasswordReset
);



module.exports = router;
