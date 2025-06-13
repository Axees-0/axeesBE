// controllers/inviteController.js

const Invite = require("../models/Invite");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a transporter using SMTP credentials from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., "smtp.gmail.com"
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * POST /invite/create
 * body: { inviterId, inviteeName, inviteeEmail }
 */
exports.createInvite = async (req, res) => {
  try {
    // Ideally, inviterId should be taken from req.user (after authentication)
    const inviterId = req.body.inviterId;
    const { inviteeName, inviteeEmail } = req.body;
    if (!inviteeName || !inviteeEmail) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Generate a random invite token
    const inviteToken = crypto.randomBytes(16).toString("hex");

    // Create a new invite document
    const newInvite = new Invite({
      inviter: inviterId,
      inviteeName,
      inviteeEmail,
      inviteToken,
      status: "pending",
    });
    await newInvite.save();

    // Build the sign-up link – adjust the URL to your front-end
    const signUpLink = `${process.env.FRONTEND_URL}/URM01CreateAccount?inviteToken=${inviteToken}`;

    // Build an HTML email template with your app's logo and a button
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invitation to Axees</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
          }
          .logo {
            width: 150px;
            margin-bottom: 20px;
          }
          .button {
            background-color: #430B92;
            color: #ffffff !important;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="${process.env.BACKEND_URL}/uploads/assets/icon.png"></img>
          <h2>You've been invited to Axees!</h2>
          <p>Hello ${inviteeName},</p>
          <p>You have been invited to join Axees. Click the button below to sign up:</p>
          <a class="button" href="${signUpLink}">Join Axees</a>
          <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
          <p>${signUpLink}</p>
          <div class="footer">
            <p>Thank you,<br/>The Axees Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Set up mail options
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@axees.com",
      to: inviteeEmail,
      subject: "You've been invited to Axees!",
      html: htmlTemplate,
    };

    // Send the email using SMTP
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully. Message ID:", info.messageId);

    res.json({
      message: "Invite created and email sent",
      invite: newInvite,
    });
  } catch (err) {
    console.error("Error creating invite:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /invite/my-invites
 * Returns all invites created by the current user.
 * Expects inviterId to be passed as a query parameter or obtained from req.user.
 */
exports.getMyInvites = async (req, res) => {
  try {
    const inviterId = req.query.userId; // In production, use req.user._id
    const invites = await Invite.find({ inviter: inviterId }).sort({
      createdAt: -1,
    });
    res.json({
      message: "Invites retrieved",
      invites,
    });
  } catch (err) {
    console.error("Error getting invites:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /invite/status/:inviteToken
 * Check the status of an invite by token.
 */
exports.getInviteStatus = async (req, res) => {
  try {
    const { inviteToken } = req.params;
    const invite = await Invite.findOne({ inviteToken });
    if (!invite) {
      return res.status(404).json({ message: "Invite not found or invalid" });
    }
    res.json({
      message: "Invite found",
      invite: {
        inviteeName: invite.inviteeName,
        inviteeEmail: invite.inviteeEmail,
        status: invite.status,
      },
    });
  } catch (err) {
    console.error("Error checking invite status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /invite/accept
 * Accept an invite after registration.
 * body: { inviteToken }
 */
exports.acceptInvite = async (req, res) => {
  try {
    const { inviteToken } = req.body;
    const invite = await Invite.findOne({ inviteToken });
    if (!invite) {
      return res.status(404).json({ message: "Invalid invite token" });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Invite not pending" });
    }
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();
    res.json({
      message: "Invite accepted successfully",
      invite,
    });
  } catch (err) {
    console.error("Error accepting invite:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /invite/:inviteId
 * Delete an invite by ID.
 */
exports.deleteInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const invite = await Invite.findByIdAndDelete(inviteId);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
    res.json({ message: "Invite deleted successfully" });
  } catch (err) {
    console.error("Error deleting invite:", err);
    res.status(500).json({ message: "Server error" });
  }
};
