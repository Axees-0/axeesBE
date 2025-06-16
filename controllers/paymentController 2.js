// controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const Deal = require("../models/deal");
const Payout = require("../models/payouts");
const Earning = require("../models/earnings");
const Notification = require("../models/Notification");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const mongoose = require("mongoose");
const withdrawals = require("../models/withdrawal");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");
// Define deal statuses
const DEAL_STATUSES = {
  ACCEPTED: "Accepted",
  IN_PROCESS: "In-Process",
  CANCELLATION: "Cancellation",
  CONTENT_FOR_APPROVAL: "Content for Approval Submitted",
  CONTENT_APPROVED: "Content Approved",
  FINAL_CONTENT_POSTED: "Final Content Posted",
  COMPLETION_PAYMENT: "Completion Payment Issued",
  OFFER_CONTENT_SUBMITTED: "Offer Content Submitted",
  OFFER_CONTENT_APPROVED: "Offer Content Approved",
};




// ------------------------------------------------------------------
// Inline Notification Functions
// ------------------------------------------------------------------
const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  // Push notification implementation would go here in production
};

const emailTemplate = (content, subject) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
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
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }
    .logo {
      width: 150px;
      margin-bottom: 20px;
      align-self: center;
    }
    .button {
      background-color: #430B92;
      color: #ffffff !important;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin-top: 20px;
      align-self: flex-start;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888888;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="logo" src="${process.env.BACKEND_URL}/uploads/assets/icon.png" alt="Logo" />
    ${content}
    <div class="footer">
      <p>Thank you,<br/>The Axees Team</p>
    </div>
  </div>
</body>
</html>
`;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, contentData) => {
  try {
    const htmlContent = emailTemplate(
      `<p>Dear ${contentData.userName || "User"},</p>
       <p>${contentData.message}</p>
       ${contentData.buttonText && contentData.buttonLink ? `<a class="button" href="${contentData.buttonLink}">${contentData.buttonText}</a>` : ""}`,
      subject
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@axees.com",
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// ------------------------------------------------------------------
// Payment Controller Endpoints (with manual authentication)
// ------------------------------------------------------------------

async function notifyUser(userId, title, message, data = {}, targetUrl) {
  try {
    const user = await User.findById(userId).select(
      "+email +deviceToken +name"
    );
    if (!user) return;

    const notificationData = {
      user: userId,
      type: title.toLowerCase().replace(/\s+/g, "_"),
      title,
      subtitle: message,
      unread: true,
      data: {
        targetScreen: "UOEPM02WithdrawMoneyCreator",
        type: title.toLowerCase().replace(/\s+/g, "_"),
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
    };

    // Save notification to DB
    await Notification.create(notificationData);

    // Send push notification
    if (user.deviceToken) {
      await sendPushNotification(
        user.deviceToken,
        title,
        message,
        Object.fromEntries(
          Object.entries(notificationData.data).map(([key, value]) => [
            key,
            String(value),
          ])
        )
      );
    }

    // Send email
    if (user.email) {
      await sendEmail(user.email, title, {
        userName: user.name || "User",
        message: message,
        buttonText: "View Details",
        buttonLink: targetUrl || `${process.env.FRONTEND_URL}/dashboard`
      });
    }
  } catch (error) {
    console.error("notifyUser error:", error);
  }
}

exports.createCheckoutSessionHelper = async ({
  amount,
  currency = "usd",
  quantity = 1,
  metadata = {},
}) => {
  try {
    if (!amount) throw new Error("Amount is required");

    const paymentType = metadata.paymentType || metadata.type || "offerFee";
    const lineItems   = [];

    /* -------------------------------------------------------- *
     *  Build Stripe line‑items
     * -------------------------------------------------------- */
    if (["escrowPayment", "milestoneFunding", "finalPayment"].includes(paymentType)) {
      const escrowAmount = Number(metadata.escrowAmount) || 0;
      const feeAmount    = Number(metadata.feeAmount)    || 0;
      const bonusAmount  = Number(metadata.bonusAmount)  || 0;

      // 1) main payment (escrow / milestone / final 50 %)
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name:
              paymentType === "milestoneFunding"
                ? "Milestone Funding"
                : paymentType === "finalPayment"
                ? "Final Payment (50%)"
                : "Escrow Amount (50%)",
          },
          unit_amount: Math.round(escrowAmount * 100),
        },
        quantity,
      });

      // 2) optional bonus
      if (bonusAmount > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Bonus" },
            unit_amount: Math.round(bonusAmount * 100),
          },
          quantity,
        });
      }

      // 3) platform fee
      if (feeAmount > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Platform Fee" },
            unit_amount: Math.round(feeAmount * 100),
          },
          quantity,
        });
      }
    } else {
      // offer‑fee or any other single‑item payment
      const productName        = paymentType === "offerFee" ? "Offer Processing Fee" : "Axees Payment";
      const productDescription =
        paymentType === "offerFee"
          ? amount === 1
            ? "$1 fee to send your offer to the creator"
            : `$${amount} fee to process your offer`
          : `Payment of $${amount}`;

      lineItems.push({
        price_data: {
          currency,
          product_data: { name: productName, description: productDescription },
          unit_amount: Math.round(amount * 100),
        },
        quantity,
      });
    }

    /* -------------------------------------------------------- *
     *  Create the Checkout Session
     * -------------------------------------------------------- */
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: lineItems,
      mode: "payment",
      metadata,                         // <-- keep exactly what the caller sent
      payment_intent_data: { metadata } // <-- same for the PaymentIntent
    });

    // Earning creation handled separately via webhook

    return {
      clientSecret: session.client_secret,
      sessionId:    session.id,
    };
  } catch (err) {
    console.error("createCheckoutSessionHelper error:", err);
    throw err;
  }
};


exports.createCheckoutSession = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const { amount, currency, quantity, metadata = {} } = req.body;
    // Ensure metadata includes the authenticated userId
    const updatedMetadata = { ...metadata, userId: req.user.id };
    const sessionData = await this.createCheckoutSessionHelper({
      amount,
      currency,
      quantity,
      metadata: updatedMetadata,
    });
    return successResponse(res, "Checkout session created successfully", sessionData);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return errorResponse(res, error.message, 500);
  }
};


/* -------------------------------------------------------------------------- *
 *  WITHDRAW MONEY   (Instant Pay vs 48 h Cash-Out)
 * -------------------------------------------------------------------------- */
exports.withdrawMoney = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized", 401);
    }

    const userId = req.user.id;
    const { amount, paymentMethodId, instantPay = false } = req.body;

    if (!amount || !paymentMethodId) {
      return errorResponse(res, "Amount and paymentMethodId are required", 400);
    }

    // Fetch the user's stripeConnectId
    const user = await User.findById(userId).select("+stripeConnectId");
    if (!user?.stripeConnectId) {
      return errorResponse(res, "No Stripe Connect account for this user", 404);
    }

    // Verify the Connect account and ensure payouts are enabled
    const account = await stripe.accounts.retrieve(user.stripeConnectId);
    if (!account.payouts_enabled) {
      return errorResponse(res, "Payouts are not enabled for this account", 400);
    }

    // Validate the paymentMethodId (external account) exists for this Connect account
    try {
      const externalAccount = await stripe.accounts.retrieveExternalAccount(
        user.stripeConnectId,
        paymentMethodId
      );
      if (!externalAccount || externalAccount.object !== "bank_account") {
        return errorResponse(res, "Invalid or unsupported external account", 400);
      }
    } catch (err) {
      console.error("Error validating external account:", err);
      return errorResponse(res, "No such external account: " + paymentMethodId, 400);
    }

    /* ---- balance check in Axees app -------------------------------------- */
    const agg = await Earning.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const availableBalance = agg[0]?.total || 0;
    if (amount > availableBalance) {
      return errorResponse(res, "Insufficient funds in Axees account", 400);
    }

    /* ---- balance check in Stripe platform account ------------------------ */
    const platformAccountId = process.env.STRIPE_PLATFORM_ACCOUNT_ID; // acct_1RFN7qP9Q552XxNN


    const addTestFunds = async () => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 100000, // $1000.00 in cents
          currency: 'usd',
          payment_method: 'pm_card_visa', // Test Visa card (4242 4242 4242 4242, any future date, any CVC)
          confirm: true,
          description: 'Simulating funds for test mode payout',
        });
        // Test funds added successfully
      } catch (err) {
        console.error('Error adding test funds:', err);
      }
    };

    addTestFunds();
    
    const balance = await stripe.balance.retrieve();
    const availableBalanceInStripe = balance.available.find(b => b.currency === "usd")?.amount || 0;
    const netAmount = amount - (instantPay ? +(amount * 0.01).toFixed(2) : 0);
    const amountInCents = Math.round(netAmount * 100);
    if (amountInCents > availableBalanceInStripe) {
      return errorResponse(res, `Insufficient funds in platform Stripe account. Available: $${(availableBalanceInStripe / 100).toFixed(2)}, Required: $${(amountInCents / 100).toFixed(2)}`, 400);
    }

    /* ---- compute fee & status ------------------------------------------- */
    const fee = instantPay ? +(amount * 0.01).toFixed(2) : 0;
    const status = instantPay ? "completed" : "scheduled";
    const payoutAt = instantPay ? new Date() : new Date(Date.now() + 48 * 3600 * 1000);

    let withdrawl;

    /* ---- if INSTANT: transfer from platform to Connect account and payout */
    if (instantPay) {
      // Step 1: Transfer funds from platform account to the user's Connect account
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: "usd",
        destination: user.stripeConnectId,
        description: `Transfer for instant payout to user ${userId}`,
      });

      // Step 2: Create a payout from the Connect account to the user's external account
      const payout = await stripe.payouts.create(
        {
          amount: amountInCents,
          currency: "usd",
          destination: paymentMethodId,
          description: `Instant payout to user ${userId}`,
        },
        {
          stripeAccount: user.stripeConnectId, // Specify the Connect account
        }
      );

      withdrawl = new withdrawals({
        user: userId,
        amount: amount,
        paymentMethod: paymentMethodId, // Reference to the payment method
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
        transactionId: payout.id, // Use the Stripe payout ID as the transactionId
      });

      await withdrawl.save();
    } else {
      // Scheduled payout (not implemented, adding placeholder)
      withdrawl = new withdrawals({
        user: userId,
        amount: amount,
        paymentMethod: paymentMethodId,
        status: "scheduled",
        createdAt: new Date(),
        completedAt: payoutAt,
        transactionId: `scheduled_${Date.now()}`, // Placeholder for scheduled payouts
      });

      await withdrawl.save();
    }

    /* ---- notify (helper) ------------------------------------------------- */
    const verb = instantPay ? "completed" : "scheduled";
    await notifyUser(
      userId,
      "Withdrawal",
      `Your withdrawal of $${netAmount.toFixed(2)} has been ${verb}.`,
      { withdrawId: withdrawl._id.toString() }
    );

    return successResponse(res, "Withdrawal processed successfully", { 
      withdrawal: withdrawl, 
      availableBalance: availableBalance - amount 
    }, 201);
  } catch (err) {
    console.error("withdrawMoney error:", err);
    return handleServerError(res, err, "money withdrawal");
  }
};

/* -------------------------------------------------------------------------- *
 *  FETCH PAYOUT METHODS (external accounts) for current user
 * -------------------------------------------------------------------------- */
exports.fetchPaymentMethods = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const user = await User.findById(req.user.id).select("+stripeConnectId");
    if (!user?.stripeConnectId) {
      return errorResponse(res, "No Stripe Connect account for this user", 404);
    }

    // Verify the Connect account status
    const account = await stripe.accounts.retrieve(user.stripeConnectId);
    if (!account.payouts_enabled) {
      return errorResponse(res, "Payouts are not enabled for this account", 400);
    }

    // Fetch all external accounts (e.g., bank accounts) linked to the Connect account
    const externalAccounts = await stripe.accounts.listExternalAccounts(user.stripeConnectId, {
      object: "bank_account", // Only fetch bank accounts (you can add "card" if needed for debit cards)
      limit: 100,
    });

    // Filter and format the external accounts for the response
    const payoutMethods = externalAccounts.data.map(account => ({
      id: account.id,
      bank_name: account.bank_name || "Unknown Bank",
      last4: account.last4,
      currency: account.currency,
      status: account.status || "active",
      isBankAccount: true,
    }));

    return successResponse(res, "Payment methods retrieved successfully", { payoutMethods });
  } catch (err) {
    console.error("fetchPaymentMethods error:", err);
    const msg = err?.raw?.message ?? err.message ?? "Internal server error";
    return errorResponse(res, msg, err.statusCode ?? 500);
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  const withdrawalId = req.params.id; 
  const userId = req.user.id;
  try {
    const isCreator = req.user.userType === "Creator"; // Check if the user is a creator

    // Fetch the withdrawals for the user, sorted by creation date
    const withdrawal = await withdrawals.find({ user: userId }).sort({ createdAt: -1 });
    if (isCreator) {
      
      const withdrawalDetails = await Promise.all(
        withdrawal.map(async (withdrawl) => {
          const deal = await Deal.findById(withdrawl.deal); // Find the deal associated with this withdrawal

          // Fetch the relevant creator or marketer's details based on user type
          const creatorOrMarketer = isCreator ? deal.creatorId : deal.marketerId; // Use creatorId for creators
          const creatorOrMarketerUser = await User.findById(creatorOrMarketer);

          return {
            ...withdrawl._doc,
            dealNumber: deal.dealNumber, // Add deal number from the deal table
            paymentMethod: withdrawl.paymentMethod, // Payment method from the withdrawal table
            transactionId: withdrawl.transactionId, // Transaction ID from the withdrawal table
            depositingAccount: withdrawl.paymentDetails?.account, // Account info from withdrawal table
            name: user.userName, // Creator or Marketer name
          };
        })
      );

      return successResponse(res, "Withdrawal history retrieved successfully", withdrawalDetails);
    } else {
      // If not a creator, return the withdrawals normally
      return successResponse(res, "Withdrawal history retrieved successfully", withdrawal);
    }
  } catch (error) {
    console.error("Error retrieving withdrawal history:", error);
    return handleServerError(res, error, "withdrawal history retrieval");
  }
};

exports.withdrawal = async (req, res) => {
  const withdrawalId = req.params.withdrawalId;  // Retrieve the withdrawalId from the URL
  const userId = req.user.id;

  try {
    const isCreator = req.user.userType === "Creator"; // Check if the user is a creator

    // Fetch the withdrawal based on withdrawalId
    const withdrawal = await withdrawals.findOne({ _id: withdrawalId, user: userId });

    if (!withdrawal) {
      return errorResponse(res, "Withdrawal not found", 404);
    }

    if (isCreator) {
      const deal = await Deal.findById(withdrawal.deal); // Find the deal associated with this withdrawal
      const creatorOrMarketer = isCreator ? deal.creatorId : deal.marketerId; // Use creatorId for creators
      const creatorOrMarketerUser = await User.findById(creatorOrMarketer);

      const withdrawalData = {
        ...withdrawal._doc,
        dealNumber: deal.dealNumber, // Add deal number from the deal table
        paymentMethod: withdrawal.paymentMethod, // Payment method from the withdrawal table
        transactionId: withdrawal.transactionId, // Transaction ID from the withdrawal table
        depositingAccount: withdrawal.paymentDetails?.account, // Account info from withdrawal table
        name: user.userName, // Creator or Marketer name
      };
      return successResponse(res, "Withdrawal details retrieved successfully", withdrawalData);
    } else {
      // If not a creator, return the withdrawal normally
      return successResponse(res, "Withdrawal details retrieved successfully", withdrawal);
    }
  } catch (error) {
    console.error("Error retrieving withdrawal history:", error);
    return handleServerError(res, error, "withdrawal details retrieval");
  }
};




// ✅ Update Earnings Summary Controller to support filters
exports.getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Optional: apply date range filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // 1) Sum up all earnings (with optional range)
    const earningsAgg = await Earning.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), ...dateFilter } },
      { $group: { _id: null, totalEarned: { $sum: "$amount" } } }
    ]);
    const totalEarned = earningsAgg[0]?.totalEarned || 0;

    // 2) Sum up all withdrawals (all-time)
    const withdrawalsAgg = await withdrawals.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalWithdrawn: { $sum: "$amount" } } }
    ]);
    const totalWithdrawn = withdrawalsAgg[0]?.totalWithdrawn || 0;

    // 3) Compute available balance (based on full earnings, not filtered)
    const fullEarningsAgg = await Earning.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const availableBalance = (fullEarningsAgg[0]?.total || 0) - totalWithdrawn;

    return successResponse(res, "Earnings summary retrieved successfully", {
      totalEarned,
      totalWithdrawn,
      availableBalance,
      currentWeekEarnings: totalEarned // filtered week value
    });
  } catch (error) {
    console.error("Error retrieving earnings summary:", error);
    return handleServerError(res, error, "earnings summary retrieval");
  }
};

// controllers/paymentController.js
// (existing imports and configuration)

// controllers/paymentController.js

exports.getEarningById = async (req, res) => {
  try {
    const { earningId } = req.params; // This should be a valid ObjectId string
    if (!earningId) {
      return errorResponse(res, "Earning ID is required in the URL", 400);
    }

    // Find the earning and populate referenced fields as needed.
    const earning = await Earning.findById(earningId)
    .populate({
      path: 'deal', // Populate the 'deal' reference in the earning
      select: 'creatorId marketerId', // Get the creatorId or marketerId
      populate: [
        { path: 'creatorId', select: 'userName' }, // Populate creatorId's userName
        { path: 'marketerId', select: 'userName' }, // Populate marketerId's userName
        {
          path: 'paymentInfo.transactions',  // Populate paymentInfo.transactions
          select: 'transactionId' // Select transactionId field in transactions
        }
      ],
    })
    .exec();
  
  

    if (!earning) {
      return errorResponse(res, "Earning not found", 404);
    }

    // Compute senderName based on associated deal data.
    let senderName = "Unknown";
    if (earning.deal && earning.user) {
      const recipientId = earning.user.toString();
      const creatorId =
        earning.deal.creatorId && earning.deal.creatorId._id
          ? earning.deal.creatorId._id.toString()
          : earning.deal.creatorId?.toString();
      const marketerId =
        earning.deal.marketerId && earning.deal.marketerId._id
          ? earning.deal.marketerId._id.toString()
          : earning.deal.marketerId?.toString();

      if (recipientId === creatorId && earning.deal.marketerId) {
        senderName =
          earning.deal.marketerId.userName ||
          earning.deal.marketerId.name ||
          "Marketer";
      } else if (recipientId === marketerId && earning.deal.creatorId) {
        senderName =
          earning.deal.creatorId.userName ||
          earning.deal.creatorId.name ||
          "Creator";
      }
    }

    // Enrich the earning with the computed senderName.
    const enrichedEarning = {
      ...earning.toObject(),
      senderName,
    };

    return successResponse(res, "Earning details retrieved successfully", enrichedEarning);
  } catch (error) {
    console.error("Error retrieving earning by ID:", error);
    return handleServerError(res, error, "earning details retrieval");
  }
};



/**
 * Retrieves earnings history with advanced filtering, pagination, and role-based access control
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.filter] - Date filter: 'last30days' or 'dateRange'
 * @param {string} [req.query.startDate] - Start date for dateRange filter (YYYY-MM-DD)
 * @param {string} [req.query.endDate] - End date for dateRange filter (YYYY-MM-DD)
 * @param {string} [req.query.status] - Transaction status filter
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=50] - Items per page (max 100)
 * @param {string} [req.query.cursor] - Cursor for cursor-based pagination
 * @param {boolean} [req.query.includeCount] - Include total count in response
 * @param {string} [req.query.adminUserId] - Admin override to view other user's earnings
 * @param {Object} res - Express response object
 * @returns {Object} Paginated earnings data with metadata
 */
exports.getEarnings = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const userId = req.user.id;
    const userRole = req.user.role || req.user.userType;

    // Extract query parameters with enhanced validation
    const { 
      filter, 
      startDate, 
      endDate, 
      status,
      page = 1, 
      limit = 50,
      cursor,
      includeCount = false,
      adminUserId // Admin override to view another user's earnings
    } = req.query;

    // Input validation for pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Role-based access control
    let targetUserId = userId;
    if (adminUserId && (userRole === 'admin' || userRole === 'Admin')) {
      targetUserId = adminUserId;
    } else if (adminUserId && userRole !== 'admin' && userRole !== 'Admin') {
      return errorResponse(res, "Forbidden: Insufficient permissions to access other user's earnings", 403);
    }

    // Enhanced date filter validation
    let dateFilter = {};
    if (filter === "last30days") {
      const thirtyDaysAgo = moment().subtract(30, "days").toDate();
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (filter === "dateRange" && startDate && endDate) {
      // Validate date formats
      const start = moment(startDate, ["YYYY-MM-DD", "MM/DD/YYYY", "YYYY-MM-DDTHH:mm:ss.SSSZ"], true);
      const end = moment(endDate, ["YYYY-MM-DD", "MM/DD/YYYY", "YYYY-MM-DDTHH:mm:ss.SSSZ"], true);
      
      if (!start.isValid() || !end.isValid()) {
        return errorResponse(res, "Invalid date format. Please use YYYY-MM-DD format.", 400);
      }

      if (start.isAfter(end)) {
        return errorResponse(res, "Start date cannot be after end date.", 400);
      }

      // Check for reasonable date range (not more than 2 years)
      if (end.diff(start, 'days') > 730) {
        return errorResponse(res, "Date range cannot exceed 2 years.", 400);
      }

      dateFilter = { 
        createdAt: { 
          $gte: start.toDate(), 
          $lte: end.endOf('day').toDate() 
        } 
      };
    } else if ((startDate || endDate) && filter !== "dateRange") {
      return errorResponse(res, "When providing startDate or endDate, filter must be 'dateRange'.", 400);
    }

    // Status filter validation
    let statusFilter = {};
    if (status) {
      const validStatuses = ['pending', 'completed', 'failed', 'escrowed', 'released'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, `Invalid status. Valid options are: ${validStatuses.join(', ')}`, 400);
      }
      statusFilter = { status };
    }

    // Build the main query
    const query = { 
      user: new mongoose.Types.ObjectId(targetUserId), 
      ...dateFilter, 
      ...statusFilter 
    };

    // Cursor-based pagination (optional)
    if (cursor) {
      try {
        const cursorDate = new Date(cursor);
        if (isNaN(cursorDate.getTime())) {
          return errorResponse(res, "Invalid cursor format", 400);
        }
        query.createdAt = { ...query.createdAt, $lt: cursorDate };
      } catch (err) {
        return errorResponse(res, "Invalid cursor format", 400);
      }
    }

    // Get total count if requested (for pagination info)
    let totalCount = null;
    if (includeCount === 'true' || includeCount === true) {
      totalCount = await Earning.countDocuments(query);
    }

    // Find earnings with enhanced error handling
    let earnings;
    try {
      earnings = await Earning.find(query)
        .sort({ createdAt: -1 })
        .skip(cursor ? 0 : skip) // Skip only for offset-based pagination
        .limit(limitNum)
        .populate({
          path: "deal",
          select: "dealName dealNumber creatorId marketerId paymentInfo",
          populate: [
            { path: "creatorId", select: "userName name" },
            { path: "marketerId", select: "userName name" },
          ],
        })
        .populate({
          path: "user",
          select: "userName name",
        })
        .lean() // Use lean for better performance
        .exec();
    } catch (dbError) {
      console.error("Database query error:", dbError);
      const errorDetails = process.env.NODE_ENV === 'development' ? { details: dbError.message } : {};
      return errorResponse(res, "Database error occurred while retrieving earnings", 500, errorDetails);
    }

    // Enhanced data enrichment with better error handling
    const enrichedEarnings = earnings.map((earning) => {
      let senderName = "Unknown";
      let dealName = "Unknown Deal";
      let dealNumber = "N/A";
      
      try {
        if (earning.deal) {
          dealName = earning.deal.dealName || "Untitled Deal";
          dealNumber = earning.deal.dealNumber || "N/A";
          
          const recipientId = earning.user._id ? earning.user._id.toString() : earning.user.toString();
          const creatorId = earning.deal.creatorId?._id ? 
            earning.deal.creatorId._id.toString() : 
            earning.deal.creatorId?.toString();
          const marketerId = earning.deal.marketerId?._id ? 
            earning.deal.marketerId._id.toString() : 
            earning.deal.marketerId?.toString();

          if (recipientId === creatorId && earning.deal.marketerId) {
            senderName = earning.deal.marketerId.userName || 
                        earning.deal.marketerId.name || 
                        "Marketer";
          } else if (recipientId === marketerId && earning.deal.creatorId) {
            senderName = earning.deal.creatorId.userName || 
                        earning.deal.creatorId.name || 
                        "Creator";
          }
        }
      } catch (enrichmentError) {
        console.error("Error enriching earning data:", enrichmentError);
        // Continue with default values
      }

      return {
        ...earning,
        senderName,
        dealNumber,
        dealName,
        // Add pagination cursor for next request
        cursor: earning.createdAt
      };
    });

    // Build response with pagination metadata
    const response = {
      data: enrichedEarnings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: earnings.length === limitNum,
        ...(totalCount !== null && { total: totalCount, totalPages: Math.ceil(totalCount / limitNum) }),
        ...(earnings.length > 0 && { nextCursor: earnings[earnings.length - 1].createdAt })
      },
      filters: {
        applied: {
          ...(filter && { filter }),
          ...(startDate && endDate && { dateRange: { startDate, endDate } }),
          ...(status && { status })
        }
      }
    };

    return successResponse(res, "Earnings retrieved successfully", response);
    
  } catch (error) {
    console.error("Error retrieving earnings:", error);
    const errorDetails = process.env.NODE_ENV === 'development' ? { details: error.message } : {};
    return errorResponse(res, "Error retrieving earnings history", 500, errorDetails);
  }
};

// controllers/paymentController.js

exports.addPaymentMethod = async (req, res) => {
  try {
    /* 0. Validate + load user */
    const {
      paymentMethodId,
      isBankAccount  = false,   // ACH payout?
      isPayoutCard   = false,   // Instant debit‐card payout?
    } = req.body;

    if (!paymentMethodId) {
      return errorResponse(res, "paymentMethodId is required", 400);
    }

    // pull in both your Customer ID and Connect account ID
    const user = await User.findById(req.user.id).select(
      "+stripeCustomerId +stripeConnectId +paymentMethods +email +name"
    );
    if (!user) return errorResponse(res, "User not found", 404);

    /* 1. Ensure a Stripe Customer exists (for charge‐only cards & legacy ACH) */
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name : user.name ?? user.userName ?? "Axees user",
      });
      user.stripeCustomerId = customer.id;
    }

    /* 2. Attach to Stripe */
    let externalId;

    // ── Payout flows (bank OR debit card) go on the CONNECT account ────────
    if (isBankAccount || isPayoutCard) {
      if (!user.stripeConnectId) {
        return errorResponse(res, "Creator has no Stripe Connect account", 400);
      }

      const ext = await stripe.accounts.createExternalAccount(
        user.stripeConnectId,
        { external_account: paymentMethodId }
      );
      externalId = ext.id;

    // ── Charge‐only cards remain on your Customer ─────────────────────────
    } else {
      const pm = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });
      // make it the default for invoices
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: pm.id },
      });
      externalId = pm.id;
    }

    /* 3. Store reference in MongoDB */
    user.paymentMethods ??= [];
    if (!user.paymentMethods.some((m) => m.id === externalId)) {
      user.paymentMethods.push({
        id           : externalId,
        isBankAccount,
        isPayoutCard,
        addedAt      : new Date(),
      });
    }
    await user.save();

    return successResponse(res, "Payment method saved successfully", {
      id: externalId,
      isBankAccount,
      isPayoutCard,
    });

  } catch (err) {
    console.error("addPaymentMethod error:", err);
    const msg = err?.raw?.message || err.message || "Internal server error";
    return errorResponse(res, msg, err.statusCode ?? 500);
  }
};



// controllers/paymentController.js

exports.createCheckoutSessionHelper = async ({
  amount,
  currency = "usd",
  quantity = 1,
  metadata = {},
}) => {
  try {
    if (!amount) throw new Error("Amount is required");

    const paymentType = metadata.paymentType || metadata.type || "offerFee";
    const lineItems   = [];

    /* -------------------------------------------------------- *
     *  Build Stripe line‑items
     * -------------------------------------------------------- */
    if (["escrowPayment", "milestoneFunding", "finalPayment"].includes(paymentType)) {
      const escrowAmount = Number(metadata.escrowAmount) || 0;
      const feeAmount    = Number(metadata.feeAmount)    || 0;
      const bonusAmount  = Number(metadata.bonusAmount)  || 0;

      // 1) main payment (escrow / milestone / final 50 %)
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name:
              paymentType === "milestoneFunding"
                ? "Milestone Funding"
                : paymentType === "finalPayment"
                ? "Final Payment (50%)"
                : "Escrow Amount (50%)",
          },
          unit_amount: Math.round(escrowAmount * 100),
        },
        quantity,
      });

      // 2) optional bonus
      if (bonusAmount > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Bonus" },
            unit_amount: Math.round(bonusAmount * 100),
          },
          quantity,
        });
      }

      // 3) platform fee
      if (feeAmount > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Platform Fee" },
            unit_amount: Math.round(feeAmount * 100),
          },
          quantity,
        });
      }
    } else {
      // offer‑fee or any other single‑item payment
      const productName        = paymentType === "offerFee" ? "Offer Processing Fee" : "Axees Payment";
      const productDescription =
        paymentType === "offerFee"
          ? amount === 1
            ? "$1 fee to send your offer to the creator"
            : `$${amount} fee to process your offer`
          : `Payment of $${amount}`;

      lineItems.push({
        price_data: {
          currency,
          product_data: { name: productName, description: productDescription },
          unit_amount: Math.round(amount * 100),
        },
        quantity,
      });
    }

    /* -------------------------------------------------------- *
     *  Create the Checkout Session
     * -------------------------------------------------------- */
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: lineItems,
      mode: "payment",
      metadata,                         // <-- keep exactly what the caller sent
      payment_intent_data: { metadata } // <-- same for the PaymentIntent
    });

    return {
      clientSecret: session.client_secret,
      sessionId:    session.id,
    };
  } catch (err) {
    console.error("createCheckoutSessionHelper error:", err);
    throw err;
  }
};


// Duplicate removed - using the version with auth check at line 321

exports.getSessionStatus = async (req, res) => {
  try {
    const { session_id, userId } = req.query;
    if (!session_id) {
      return errorResponse(res, "Session ID is required", 400);
    }
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });
    const paymentStatus = session.payment_status;
    let transactionNumber = null;
    const pi = session.payment_intent;
    if (pi && pi.charges && pi.charges.data && pi.charges.data.length > 0) {
      transactionNumber = pi.charges.data[0].id;
    } else if (pi?.latest_charge) {
      transactionNumber = pi.latest_charge;
    } else {
      transactionNumber = pi?.id || null;
    }
    return successResponse(res, "Session status retrieved successfully", {
      payment_status: paymentStatus,
      transaction_number: transactionNumber,
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    return errorResponse(res, error.message, 500);
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Ensure event exists before processing
  if (!event || !event.type) {
    return res.status(400).send('Invalid webhook event');
  }

  switch (event.type) {
    /* ------------------------------------------------------------ *
     * CONNECT ACCOUNT EVENTS
     * ------------------------------------------------------------ */
    case 'account.updated': {
      const account = event.data.object;

      // Find the user with this stripeConnectId
      const user = await User.findOne({ stripeConnectId: account.id });
      if (!user) {
        console.error(`User not found for stripeConnectId: ${account.id}`);
        break;
      }

      // Update onboarding status
      user.onboardingComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;
      await user.save();

      // Notify the user if onboarding is complete
      if (user.onboardingComplete) {
        await notifyUser(
          user._id,
          "Onboarding Complete",
          "Your Stripe Connect account onboarding is complete. You can now receive payouts.",
          { stripeConnectId: account.id }
        );
      }

      break;
    }

    case 'payout.created': {
      const payout = event.data.object;

      // Find the withdrawal record associated with this payout
      const withdrawal = await withdrawals.findOne({ transactionId: payout.id });
      if (!withdrawal) {
        console.error(`Withdrawal not found for payout: ${payout.id}`);
        break;
      }

      withdrawal.status = "pending";
      await withdrawal.save();

      // Notify the user
      const user = await User.findById(withdrawal.user);
      if (user) {
        await notifyUser(
          user._id,
          "Payout Created",
          `A payout of $${(payout.amount / 100).toFixed(2)} has been created and is pending.`,
          { withdrawalId: withdrawal._id.toString(), payoutId: payout.id }
        );
      }

      break;
    }

    case 'payout.paid': {
      const payout = event.data.object;

      // Find the withdrawal record associated with this payout
      const withdrawal = await withdrawals.findOne({ transactionId: payout.id });
      if (!withdrawal) {
        console.error(`Withdrawal not found for payout: ${payout.id}`);
        break;
      }

      withdrawal.status = "completed";
      withdrawal.completedAt = new Date();
      await withdrawal.save();

      // Notify the user
      const user = await User.findById(withdrawal.user);
      if (user) {
        await notifyUser(
          user._id,
          "Payout Successful",
          `Your payout of $${(payout.amount / 100).toFixed(2)} has been successfully paid.`,
          { withdrawalId: withdrawal._id.toString(), payoutId: payout.id }
        );
      }

      break;
    }

    case 'payout.failed': {
      const payout = event.data.object;

      // Find the withdrawal record associated with this payout
      const withdrawal = await withdrawals.findOne({ transactionId: payout.id });
      if (!withdrawal) {
        console.error(`Withdrawal not found for payout: ${payout.id}`);
        break;
      }

      withdrawal.status = "failed";
      withdrawal.failureReason = payout.failure_message || payout.failure_code;
      await withdrawal.save();

      // Notify the user
      const user = await User.findById(withdrawal.user);
      if (user) {
        await notifyUser(
          user._id,
          "Payout Failed",
          `Your payout of $${(payout.amount / 100).toFixed(2)} failed: ${payout.failure_message || payout.failure_code}`,
          { withdrawalId: withdrawal._id.toString(), payoutId: payout.id }
        );
      }

      break;
    }
    /* ------------------------------------------------------------ *
     *  CARD CHARGE SUCCEEDED
     * ------------------------------------------------------------ */
    case 'payment_intent.succeeded': {
      const pi       = event.data.object;      // this is a PaymentIntent
      const metadata = pi.metadata || {};
      const { paymentType, dealId, milestoneId, escrowAmount } = metadata;
    
      // You can update your database here based on the payment status
      // E.g., you can mark the deal as "paid" or update the payment status
      const deal = await Deal.findById(dealId);
      if (deal) {
        deal.paymentStatus = "Paid"; // Update the payment status of the deal
        await deal.save();
    
        // Create a new earning entry for the user
        await Earning.create({
          user: deal.creatorId,
          amount: deal.paymentInfo.paymentAmount,
          deal: dealId,
          transactionNumber: pi.id,  // Store the Stripe transaction ID
        });
      }
  

      /* ---------- final 50 % payment ---------- */
      if (paymentType === 'finalPayment' && dealId) {
        try {
          const deal = await Deal.findById(dealId);
          if (!deal) break;

    
    // 3. Add to deal.transactions

    if (!deal.paymentInfo) {
      deal.paymentInfo = { transactions: [] };
    }
    if (!Array.isArray(deal.paymentInfo.transactions)) {
      deal.paymentInfo.transactions = [];
    }
 
    deal.paymentInfo.transactions.push({
      paymentAmount: escrowAmount,
      paymentMethod: "CreditCard",
      transactionId: pi.id,
      status: "Completed",
      paidAt: new Date(),
      type: "release_final",
    });
    
    
    
    deal.markModified("paymentInfo");
    await deal.save();
    
            //  1. Record earning for creator
    await earnings.create({
      user: deal.creatorId,
      amount: escrowAmount,
      deal: deal._id,
      paymentMethod: "CreditCard",
      transactionId: pi.id, // Generate or get from actual transaction
      reference: "Final 50% payment release",
      createdAt: new Date(),
    });

    // 2. Record payout for marketer
    await payouts.create({
      user: deal.marketerId,
      amount: escrowAmount,
      paymentMethod:  "CreditCard",
      stripeTransactionId: pi.id,
      deal: deal._id,
      status: "COMPLETED",
      requestedAt: new Date(),
    });
        } catch (e) {
          console.error('finalPayment webhook error:', e);
        }
      }

      /* ---------- milestone funding ---------- */
      if (paymentType === 'milestoneFunding' && dealId && milestoneId) {
        try {
          const deal = await Deal.findById(dealId);
          if (!deal) break;

          const milestone = deal.milestones.find(
            m =>
            (m.id   && m.id.toString()   === milestoneId) ||
            (m._id  && m._id.toString()  === milestoneId)
            );
            
          if (!milestone) break;

          /* mark milestone funded */
          //milestone.status   = 'paid';
          milestone.status   = "active"; 
          milestone.fundedAt = new Date();

          /* record transaction */
          deal.paymentInfo.transactions.push({
            paymentAmount : Number(metadata.escrowAmount) || milestone.amount,
            bonusAmount   : Number(metadata.bonusAmount)  || 0,
            feeAmount     : Number(metadata.feeAmount)    || 0,
            transactionId : pi.id,
            status        : 'active',
            type          : 'milestone',
            milestoneId   : milestone.id,
            paidAt        : new Date()
          });

          await payouts.create({
            user: deal.marketerId,
            amount: escrowAmount,
            paymentMethod: "CreditCard",
            stripeTransactionId: pi.id, // or use a real tx ID if available
            deal: deal._id,
            status: "ESCROW", // still held in escrow until approved
            milestoneId:  milestone.id,
            requestedAt: new Date(),
          });


          /* update overall escrow status */
          const paidSoFar = deal.paymentInfo.transactions
            .filter(t => t.status === 'Completed')
            .reduce((s, t) => s + Number(t.paymentAmount || 0), 0);

          if (paidSoFar >= deal.paymentInfo.amount) {
            deal.paymentInfo.paymentStatus = 'Escrow Paid';
          }

          await deal.save();
        } catch (e) {
          console.error('milestoneFunding webhook error:', e);
        }
      }

      break;
    }

    /* ------------------------------------------------------------ */
    case 'payment_method.attached': {
      // Payment method successfully attached
      break;
    }

    case 'charge.refunded': {
      const refund = event.data.object;
      const deal = await Deal.findOne({
        'paymentInfo.transactions.transactionId': refund.payment_intent
      });
      if (deal) {
        deal.paymentInfo.transactions.forEach(t => {
          if (t.transactionId === refund.payment_intent) {
            t.refundId     = refund.id;
            t.refundStatus = refund.status;
          }
        });
        await deal.save();
      }
      break;
    }

    default:
      // Unhandled event type - could be logged in production for monitoring
  }

  return successResponse(res, "Webhook processed successfully", { received: true });
};

exports.createRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    if (!transactionId) {
      return errorResponse(res, "Transaction ID is required", 400);
    }

    // Retrieve the PaymentIntent to check if it involves a connected account
    const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    const connectedAccountId = paymentIntent.destination; // For Connect transfers

    let refund;
    if (connectedAccountId) {
      // Refund for a Connect transaction
      refund = await stripe.refunds.create(
        {
          payment_intent: transactionId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: reason || "requested_by_customer",
        },
        {
          stripeAccount: connectedAccountId, // Refund on the connected account
        }
      );
    } else {
      // Standard refund on your platform account
      refund = await stripe.refunds.create({
        charge: paymentIntent.charges.data[0].id,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason || "requested_by_customer",
      });
    }

    const notificationMessage = `Refund processed for transaction ${transactionId}.`;
    const notification = new Notification({
      user: req.user.id,
      type: "REFUND",
      title: "Refund Processed",
      subtitle: notificationMessage,
      data: { transactionId, amount: amount ? amount.toString() : "" },
      unread: true,
    });
    await notification.save();

    if (req.user.deviceToken) {
      await sendPushNotification(req.user.deviceToken, "Refund Processed", notificationMessage, {
        targetScreen: "RefundDetails",
        userId: req.user.id.toString(),
      });
    }

    await sendEmail(
      req.user.email,
      "Refund Processed",
      { userName: req.user.name || "User", message: notificationMessage, buttonText: "", buttonLink: "" }
    );

    return successResponse(res, "Refund processed successfully", {
      status: refund.status,
      amount: refund.amount / 100,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return errorResponse(res, error.message, 500);
  }
};




exports.requestPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethodId } = req.body;
    if (!amount || !paymentMethodId) {
      return errorResponse(res, "Amount and payment method ID are required", 400);
    }
    const payout = new Payout({
      user: userId,
      amount,
      paymentMethod: paymentMethodId,
      status: "PENDING",
      requestedAt: new Date(),
    });
    const newPayout = await payout.save();
    
    const notificationMessage = `Your payout request for $${amount} is now pending.`;
    const notification = new Notification({
      user: userId,
      type: "PAYOUT_REQUEST",
      title: "Payout Request Received",
      subtitle: notificationMessage,
      data: { amount: amount.toString() },
      unread: true,
    });
    await notification.save();

    if (req.user.deviceToken) {
      await sendPushNotification(req.user.deviceToken, "Payout Request Received", notificationMessage, {
        targetScreen: "PayoutHistory",
        userId: userId.toString(),
      });
    }
    await sendEmail(
      req.user.email,
      "Payout Request Received",
      { userName: req.user.name || "User", message: notificationMessage, buttonText: "View Details", buttonLink: `${process.env.FRONTEND_URL}/payments/payouts/history` }
    );
    return successResponse(res, "Payout request created successfully", newPayout, 201);
  } catch (error) {
    console.error("Error requesting payout:", error);
    return errorResponse(res, "Error processing payout request", 500);
  }
};



// Duplicate removed - using the version with auth check at line 321

exports.cancelOfferAndProcessRefund = async (req, res) => {
  try {
    const { payoutId } = req.params;
    // Find the payout record by its ID
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return errorResponse(res, "Payout not found", 404);
    }

    // Assume payout.amount is the original credited amount
    const originalAmount = payout.amount;
    // Deduct $1 fee for cancellation
    const refundAmount = Math.max(originalAmount - 1, 0);

    // Assume you store the Stripe charge ID in payout.stripeTransactionId
    const stripeChargeId = payout.stripeTransactionId;
    if (!stripeChargeId) {
      return errorResponse(res, "Stripe transaction identifier missing", 400);
    }

    // Process the refund (Stripe expects amount in cents)
    const refund = await stripe.refunds.create({
      charge: stripeChargeId,
      amount: Math.round(refundAmount * 100),
      reason: "offer_cancellation",
    });

    // Update the payout record as refunded
    payout.status = "REFUNDED"; 
    payout.completedAt = new Date();
    await payout.save();

    const notificationMessage = `Your offer has been cancelled. A refund of $${refundAmount.toFixed(2)} has been processed, with a $1 fee applied.`;

    // Create a notification entry
    const notification = new Notification({
      user: req.user.id,
      type: "OFFER_CANCELLATION",
      title: "Offer Cancelled",
      subtitle: notificationMessage,
      data: {
        payoutId,
        refundAmount: refundAmount.toString(),
      },
      unread: true,
    });
    await notification.save();

    if (req.user.deviceToken) {
      await sendPushNotification(req.user.deviceToken, "Offer Cancelled", notificationMessage, {
        targetScreen: "RefundDetails",
        payoutId,
      });
    }

    await sendEmail(
      req.user.email,
      "Offer Cancelled & Refund Processed",
      {
        userName: req.user.name || "User",
        message: notificationMessage,
        buttonText: "View Refund Details",
        buttonLink: `${process.env.FRONTEND_URL}/payments/payouts/history`
      }
    );

    return successResponse(res, "Offer cancelled and refund processed", {
      refundAmount,
      refundDetails: refund,
    });
  } catch (error) {
    console.error("Error processing cancellation and refund:", error);
    return errorResponse(res, error.message, 500);
  }
};

exports.createPaymentIntent = async (req, res) => {
  // Check authentication
  if (!req.user?.id) {
    return errorResponse(res, "Unauthorized: User not authenticated", 401);
  }

  const { amount, currency = "usd", metadata } = req.body;

  try {
    // Validate that the amount is provided
    if (!amount || isNaN(amount)) {
      return errorResponse(res, "Amount is required", 400);
    }

    // Add userId to metadata
    const updatedMetadata = { ...metadata, userId: req.user.id };

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects the amount in cents
      currency: currency,
      metadata: updatedMetadata, // Include userId and any additional metadata
    });

    // Send the client secret to the frontend
    return successResponse(res, "Payment intent created successfully", {
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    return errorResponse(res, "An error occurred while creating the payment intent", 500);
  }
};

/**
 * Confirms a Stripe payment intent and creates escrow records for deal transactions
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.paymentIntentId - Stripe payment intent ID
 * @param {string} [req.body.paymentMethodId] - Optional payment method ID
 * @param {string} [req.body.dealId] - Deal ID for escrow creation
 * @param {number} [req.body.escrowAmount] - Amount to hold in escrow
 * @param {Object} res - Express response object
 * @returns {Object} Payment confirmation result with status and details
 */
exports.confirmPayment = async (req, res) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, "Unauthorized: User not authenticated", 401);
    }

    const { paymentIntentId, paymentMethodId, dealId, escrowAmount } = req.body;

    // Validate required parameters
    if (!paymentIntentId) {
      return errorResponse(res, "Payment Intent ID is required", 400);
    }

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return errorResponse(res, "Payment intent not found", 404);
    }

    // Check if payment intent is already confirmed
    if (paymentIntent.status === 'succeeded') {
      return errorResponse(res, "Payment intent already confirmed", 400);
    }

    if (paymentIntent.status === 'canceled') {
      return errorResponse(res, "Payment intent has been canceled", 400);
    }

    let confirmedIntent;

    // Confirm the payment intent
    if (paymentMethodId) {
      // Confirm with a specific payment method
      confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } else {
      // Confirm without specifying payment method (assumes it's already attached)
      confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    }

    // Handle different payment statuses
    if (confirmedIntent.status === 'requires_action' || confirmedIntent.status === 'requires_source_action') {
      // Payment requires additional action (3D Secure, etc.)
      return successResponse(res, "Payment requires additional action", {
        status: 'requires_action',
        client_secret: confirmedIntent.client_secret,
        next_action: confirmedIntent.next_action
      });
    }

    if (confirmedIntent.status === 'succeeded') {
      // Payment succeeded - create escrow if dealId is provided
      if (dealId && escrowAmount) {
        try {
          const deal = await Deal.findById(dealId);
          if (deal) {
            // Create escrow record
            if (!deal.paymentInfo) {
              deal.paymentInfo = { transactions: [] };
            }
            
            deal.paymentInfo.transactions.push({
              paymentAmount: escrowAmount,
              paymentMethod: "CreditCard",
              transactionId: confirmedIntent.id,
              status: "Escrowed",
              paidAt: new Date(),
              type: "escrow",
            });

            deal.paymentInfo.paymentStatus = 'Paid';
            await deal.save();

            // Create earning record for creator (held in escrow)
            await Earning.create({
              user: deal.creatorId,
              amount: escrowAmount,
              deal: deal._id,
              paymentMethod: "CreditCard",
              transactionId: confirmedIntent.id,
              reference: "Escrow payment",
              status: "escrowed",
              createdAt: new Date(),
            });

            // Escrow successfully created
          }
        } catch (escrowError) {
          console.error('Error creating escrow:', escrowError);
          // Continue with response even if escrow creation fails
        }
      }

      // Notify user of successful payment
      if (req.user?.id) {
        await notifyUser(
          req.user.id,
          "Payment Confirmed",
          `Your payment of $${(confirmedIntent.amount / 100).toFixed(2)} has been confirmed.`,
          { 
            paymentIntentId: confirmedIntent.id,
            amount: (confirmedIntent.amount / 100).toString(),
            dealId: dealId || null
          }
        );
      }

      return successResponse(res, "Payment confirmed successfully", {
        status: 'succeeded',
        paymentIntent: {
          id: confirmedIntent.id,
          amount: confirmedIntent.amount,
          currency: confirmedIntent.currency,
          status: confirmedIntent.status
        }
      });
    }

    // Handle failed payments
    if (confirmedIntent.status === 'payment_failed') {
      return errorResponse(res, "Payment failed", 400, {
        decline_code: confirmedIntent.last_payment_error?.decline_code,
        details: confirmedIntent.last_payment_error?.message
      });
    }

    // Handle other statuses
    return successResponse(res, "Payment intent status retrieved", {
      status: confirmedIntent.status,
      paymentIntent: {
        id: confirmedIntent.id,
        amount: confirmedIntent.amount,
        currency: confirmedIntent.currency,
        status: confirmedIntent.status
      }
    });

  } catch (error) {
    console.error("Error confirming payment:", error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return errorResponse(res, "Payment failed", 400, {
        decline_code: error.decline_code,
        details: error.message
      });
    }

    if (error.type === 'StripeRateLimitError') {
      return errorResponse(res, "Too many requests, please try again later", 429);
    }

    if (error.type === 'StripeInvalidRequestError') {
      return errorResponse(res, "Invalid request", 400, {
        details: error.message
      });
    }

    return errorResponse(res, "An error occurred while confirming the payment", 500, {
      details: error.message
    });
  }
};

exports.getMarketerPayoutHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { startDate, endDate } = req.query;

    // Validate userId
    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Build the filter object
    const filter = { user: userId };

    if (startDate && endDate) {
      // Validate date format
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return errorResponse(res, "Invalid date format", 400);
      }
      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Fetch all payouts for the user (for currentWeekPayouts calculation)
    const allPayouts = await Payout.find({ user: userId }).lean();

    // Fetch filtered payouts within the date range
    const filteredPayouts = await Payout
      .find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "deal",
        select: "dealName dealNumber creatorId marketerId paymentInfo",
        populate: [
          { path: "creatorId", select: "userName name" },
          { path: "marketerId", select: "userName name" },
        ],
      })
      .populate({ path: "user", select: "userName name" })
      .lean(); // Use lean() to convert to plain JS objects

    // Map filtered payouts to include additional fields
    const enrichedPayouts = filteredPayouts.map(p => {
      const senderName =
        p.deal?.creatorId?.userName ||
        p.deal?.creatorId?.name ||
        "Unknown";
      return {
        ...p,
        senderName,
        paymentMethod: p.paymentMethod || "Unknown",
        dealNumber: p.deal?.dealNumber || "N/A",
        dealName: p.deal?.dealName || "Untitled Deal",
      };
    });

    // Calculate availableBalance based on the filtered payouts (within date range)
    const availableBalance = filteredPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate current week payouts (still based on allPayouts)
    const weekStart = moment().startOf("isoWeek").toDate();
    const currentWeekPayouts = allPayouts
      .filter(p => new Date(p.createdAt) >= weekStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return successResponse(res, "Payout history retrieved successfully", {
      payoutHistory: enrichedPayouts,
      availableBalance,
      currentWeekPayouts,
    });
  } catch (error) {
    console.error("Error retrieving payout history:", error.message, error.stack);
    // Return an empty response instead of an error to prevent frontend breaking
    return successResponse(res, "No payout history found for the given date range", {
      payoutHistory: [],
      availableBalance: 0,
      currentWeekPayouts: 0,
    });
  }
};



exports.getPayoutById = async (req, res) => {
  try {
    const { payoutId } = req.params; // This should be a valid ObjectId string
    if (!payoutId) {
      return errorResponse(res, "Payout ID is required in the URL", 400);
    }

    // Find the earning and populate referenced fields as needed.
    const payout = await payouts.findById(payoutId)
    .populate({
      path: 'deal', // Populate the 'deal' reference in the earning
      select: 'creatorId marketerId', // Get the creatorId or marketerId
      populate: [
        { path: 'creatorId', select: 'userName' }, // Populate creatorId's userName
        { path: 'marketerId', select: 'userName' }, // Populate marketerId's userName
        {
          path: 'paymentInfo.transactions',  // Populate paymentInfo.transactions
          select: 'transactionId' // Select transactionId field in transactions
        }
      ],
    })
    .exec();
  
  

    if (!payout) {
      return errorResponse(res, "Payout not found", 404);
    }

    // Compute senderName based on associated deal data.
    let senderName = "Unknown";
    if (payout.deal && payout.user) {
      const recipientId = payout.user.toString();
      const creatorId =
        payout.deal.creatorId && payout.deal.creatorId._id
          ? payout.deal.creatorId._id.toString()
          : payout.deal.creatorId?.toString();
      const marketerId =
        payout.deal.marketerId && payout.deal.marketerId._id
          ? payout.deal.marketerId._id.toString()
          : payout.deal.marketerId?.toString();

      if (recipientId === creatorId && payout.deal.marketerId) {
        senderName =
          payout.deal.marketerId.userName ||
          payout.deal.marketerId.name ||
          "Marketer";
      } else if (recipientId === marketerId && payout.deal.creatorId) {
        senderName =
          payout.deal.creatorId.userName ||
          payout.deal.creatorId.name ||
          "Creator";
      }
    }

    // Enrich the earning with the computed senderName.
    const enrichedPayout = {
      ...payout.toObject(),
      senderName,
    };

    return successResponse(res, "Payout details retrieved successfully", enrichedPayout);
  } catch (error) {
    console.error("Error retrieving payout by ID:", error);
    return handleServerError(res, error, "payout details retrieval");
  }
};



