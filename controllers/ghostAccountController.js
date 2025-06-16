const User = require('../models/User');
const Deal = require('../models/deal');
const Offer = require('../models/offer');
const crypto = require('crypto');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const { sendEmail } = require('../utils/emailHelper');
const jwt = require('jsonwebtoken');

/**
 * Ghost Account Controller
 * Handles creation and management of temporary ghost accounts
 * for users who receive offers/deals through QR codes without having an account
 */

// Create ghost account from QR code scan
exports.createGhostAccount = async (req, res) => {
  try {
    const { qrData, creatorInfo } = req.body;

    // Validate QR data
    if (!qrData || !qrData.type || !qrData.marketerId) {
      return errorResponse(res, "Invalid QR code data", 400);
    }

    // Verify the QR code is for ghost account creation
    if (qrData.type !== 'ghost_account' && qrData.type !== 'direct_offer') {
      return errorResponse(res, "QR code is not for account creation", 400);
    }

    // Check if creator already exists (by email or phone)
    let existingUser = null;
    if (creatorInfo.email) {
      existingUser = await User.findOne({ email: creatorInfo.email });
    } else if (creatorInfo.phone) {
      existingUser = await User.findOne({ phone: creatorInfo.phone });
    }

    if (existingUser) {
      // User already exists, return login prompt
      return successResponse(res, "User already exists", {
        userExists: true,
        userId: existingUser._id,
        message: "Please login to your existing account to proceed"
      });
    }

    // Generate unique ghost account identifier
    const ghostId = generateGhostId();
    const temporaryPassword = generateTemporaryPassword();

    // Create ghost account
    const ghostUser = new User({
      userName: creatorInfo.name || `ghost_${ghostId}`,
      email: creatorInfo.email || `ghost_${ghostId}@axees.temp`,
      phone: creatorInfo.phone,
      password: temporaryPassword,
      role: 'creator',
      accountType: 'ghost',
      isGhostAccount: true,
      ghostAccountData: {
        createdBy: qrData.marketerId,
        createdVia: 'qr_code',
        qrCodeId: qrData.qrCodeId,
        temporaryPassword: temporaryPassword, // Store temporarily, remove after conversion
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        convertedAt: null,
        originalOffer: qrData.offerId || null
      },
      emailVerified: false,
      phoneVerified: false,
      profileCompletion: {
        score: 10, // Minimal score for ghost accounts
        requiredFields: {
          basic: { completed: false },
          roleSpecific: { completed: false },
          verification: { completed: false },
          financial: { completed: false },
          preferences: { completed: false }
        }
      }
    });

    await ghostUser.save();

    // Generate temporary access token for ghost account
    const ghostToken = jwt.sign(
      { 
        id: ghostUser._id, 
        role: ghostUser.role,
        isGhost: true,
        expiresIn: '30d'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // If there's an associated offer, link it to the ghost account
    if (qrData.offerId) {
      await Offer.findByIdAndUpdate(qrData.offerId, {
        creatorId: ghostUser._id,
        'metadata.ghostAccount': true,
        'metadata.ghostAccountCreatedAt': new Date()
      });
    }

    // Send email if provided
    if (creatorInfo.email && creatorInfo.email.includes('@')) {
      await sendGhostAccountEmail(ghostUser, temporaryPassword, qrData);
    }

    return successResponse(res, "Ghost account created successfully", {
      ghostAccount: {
        id: ghostUser._id,
        userName: ghostUser.userName,
        email: ghostUser.email,
        isGhost: true,
        expiresAt: ghostUser.ghostAccountData.expiresAt
      },
      token: ghostToken,
      temporaryCredentials: {
        email: ghostUser.email,
        password: temporaryPassword
      },
      nextSteps: {
        immediate: "Review the offer or deal",
        required: "Add payment method to accept offers",
        conversion: "Complete profile to convert to full account"
      }
    });

  } catch (error) {
    console.error("Error creating ghost account:", error);
    return handleServerError(res, error);
  }
};

// Convert ghost account to full account
exports.convertGhostAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      password, 
      paymentMethodId,
      profileData 
    } = req.body;

    // Find ghost account
    const ghostUser = await User.findById(userId);
    if (!ghostUser || !ghostUser.isGhostAccount) {
      return errorResponse(res, "Not a ghost account or account not found", 404);
    }

    // Check if account has expired
    if (ghostUser.ghostAccountData.expiresAt < new Date()) {
      return errorResponse(res, "Ghost account has expired", 400);
    }

    // Validate required data for conversion
    if (!password || password.length < 8) {
      return errorResponse(res, "Valid password required (minimum 8 characters)", 400);
    }

    // Update account to full account
    ghostUser.password = password; // Will be hashed by pre-save hook
    ghostUser.isGhostAccount = false;
    ghostUser.accountType = 'full';
    ghostUser.ghostAccountData.convertedAt = new Date();
    
    // Remove temporary password
    ghostUser.ghostAccountData.temporaryPassword = undefined;

    // Update profile data if provided
    if (profileData) {
      if (profileData.name) ghostUser.name = profileData.name;
      if (profileData.bio) ghostUser.bio = profileData.bio;
      if (profileData.avatarUrl) ghostUser.avatarUrl = profileData.avatarUrl;
      
      // Update creator-specific data
      if (profileData.creatorData) {
        ghostUser.creatorData = {
          ...ghostUser.creatorData,
          ...profileData.creatorData
        };
      }
    }

    // Add payment method if provided
    if (paymentMethodId) {
      ghostUser.paymentMethods.push({
        id: paymentMethodId,
        type: 'card',
        isDefault: true,
        addedAt: new Date()
      });
    }

    // Recalculate profile completion
    ghostUser.calculateProfileCompletion();
    
    await ghostUser.save();

    // Generate new token for full account
    const fullToken = jwt.sign(
      { 
        id: ghostUser._id, 
        role: ghostUser.role,
        isGhost: false
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update any associated offers/deals
    await updateGhostAccountReferences(ghostUser._id);

    // Send welcome email
    if (ghostUser.email && !ghostUser.email.includes('@axees.temp')) {
      await sendWelcomeEmail(ghostUser);
    }

    return successResponse(res, "Ghost account converted successfully", {
      user: {
        id: ghostUser._id,
        userName: ghostUser.userName,
        email: ghostUser.email,
        role: ghostUser.role,
        profileCompletion: ghostUser.profileCompletion.score,
        isGhost: false
      },
      token: fullToken,
      message: "Your account has been upgraded to a full account"
    });

  } catch (error) {
    console.error("Error converting ghost account:", error);
    return handleServerError(res, error);
  }
};

// Get ghost account status
exports.getGhostAccountStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.isGhostAccount) {
      return successResponse(res, "Not a ghost account", {
        isGhost: false,
        accountType: user.accountType || 'full'
      });
    }

    // Calculate days until expiration
    const daysUntilExpiration = Math.ceil(
      (user.ghostAccountData.expiresAt - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Get associated offers/deals
    const [offers, deals] = await Promise.all([
      Offer.find({ creatorId: userId }).countDocuments(),
      Deal.find({ creatorId: userId }).countDocuments()
    ]);

    return successResponse(res, "Ghost account status retrieved", {
      isGhost: true,
      ghostAccountData: {
        createdAt: user.createdAt,
        expiresAt: user.ghostAccountData.expiresAt,
        daysUntilExpiration,
        createdVia: user.ghostAccountData.createdVia,
        hasExpired: daysUntilExpiration <= 0
      },
      accountActivity: {
        totalOffers: offers,
        totalDeals: deals,
        profileCompletion: user.profileCompletion.score
      },
      conversionRequired: {
        steps: [
          { step: "Set password", completed: false },
          { step: "Verify email", completed: user.emailVerified },
          { step: "Add payment method", completed: user.paymentMethods.length > 0 },
          { step: "Complete profile", completed: user.profileCompletion.score >= 60 }
        ],
        benefits: [
          "Accept and negotiate offers",
          "Receive payments",
          "Build your creator profile",
          "Access full platform features"
        ]
      }
    });

  } catch (error) {
    console.error("Error getting ghost account status:", error);
    return handleServerError(res, error);
  }
};

// Handle offer creation for ghost accounts
exports.createOfferForGhost = async (req, res) => {
  try {
    const { 
      ghostAccountId,
      offerData,
      marketerId 
    } = req.body;

    // Verify ghost account exists
    const ghostUser = await User.findById(ghostAccountId);
    if (!ghostUser || !ghostUser.isGhostAccount) {
      return errorResponse(res, "Invalid ghost account", 404);
    }

    // Create offer linked to ghost account
    const offer = new Offer({
      ...offerData,
      creatorId: ghostAccountId,
      marketerId: marketerId || req.user.id,
      status: 'sent',
      metadata: {
        ...offerData.metadata,
        ghostAccount: true,
        requiresAccountConversion: true
      }
    });

    await offer.save();

    // Send notification to ghost account (if email exists)
    if (ghostUser.email && !ghostUser.email.includes('@axees.temp')) {
      await sendOfferNotificationToGhost(ghostUser, offer);
    }

    return successResponse(res, "Offer created for ghost account", {
      offer: {
        id: offer._id,
        status: offer.status,
        creatorId: offer.creatorId,
        requiresConversion: true
      },
      ghostAccountStatus: {
        id: ghostUser._id,
        email: ghostUser.email,
        needsConversion: true
      }
    });

  } catch (error) {
    console.error("Error creating offer for ghost account:", error);
    return handleServerError(res, error);
  }
};

// Check if email/phone is associated with ghost account
exports.checkGhostAccount = async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return errorResponse(res, "Email or phone required", 400);
    }

    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;
    query.isGhostAccount = true;

    const ghostAccount = await User.findOne(query);

    if (!ghostAccount) {
      return successResponse(res, "No ghost account found", {
        hasGhostAccount: false
      });
    }

    return successResponse(res, "Ghost account found", {
      hasGhostAccount: true,
      ghostAccountId: ghostAccount._id,
      needsConversion: true,
      expiresAt: ghostAccount.ghostAccountData.expiresAt,
      hasOffers: await Offer.countDocuments({ creatorId: ghostAccount._id }) > 0
    });

  } catch (error) {
    console.error("Error checking ghost account:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const generateGhostId = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const generateTemporaryPassword = () => {
  return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
};

const sendGhostAccountEmail = async (ghostUser, temporaryPassword, qrData) => {
  const emailContent = {
    to: ghostUser.email,
    subject: 'Your Axees Account Has Been Created',
    html: `
      <h2>Welcome to Axees!</h2>
      <p>A marketer has created an account for you to review their offer.</p>
      
      <h3>Your Temporary Login Credentials:</h3>
      <p><strong>Email:</strong> ${ghostUser.email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Login to review the offer</li>
        <li>Set your own password</li>
        <li>Add payment method to accept offers</li>
        <li>Complete your profile to unlock all features</li>
      </ol>
      
      <p><strong>Important:</strong> This temporary account will expire in 30 days if not converted.</p>
      
      <a href="${process.env.FRONTEND_URL}/login?ghost=true&email=${ghostUser.email}" 
         style="background-color: #430B92; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
        Login to Your Account
      </a>
    `
  };

  await sendEmail(emailContent);
};

const sendWelcomeEmail = async (user) => {
  const emailContent = {
    to: user.email,
    subject: 'Welcome to Axees - Account Upgraded!',
    html: `
      <h2>Congratulations, ${user.userName}!</h2>
      <p>Your Axees account has been successfully upgraded to a full account.</p>
      
      <h3>What's Next?</h3>
      <ul>
        <li>Complete your profile to attract more opportunities</li>
        <li>Review and respond to offers</li>
        <li>Start building your creator portfolio</li>
      </ul>
      
      <a href="${process.env.FRONTEND_URL}/dashboard" 
         style="background-color: #430B92; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
        Go to Dashboard
      </a>
    `
  };

  await sendEmail(emailContent);
};

const sendOfferNotificationToGhost = async (ghostUser, offer) => {
  const emailContent = {
    to: ghostUser.email,
    subject: 'New Offer Waiting for You on Axees',
    html: `
      <h2>You Have a New Offer!</h2>
      <p>A marketer has sent you an offer worth $${offer.paymentTerms?.amount || 0}.</p>
      
      <p>To accept this offer, you'll need to:</p>
      <ol>
        <li>Login to your account</li>
        <li>Set up your payment method</li>
        <li>Review and accept the offer</li>
      </ol>
      
      <a href="${process.env.FRONTEND_URL}/offers/${offer._id}?ghost=true" 
         style="background-color: #430B92; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
        View Offer
      </a>
    `
  };

  await sendEmail(emailContent);
};

const updateGhostAccountReferences = async (userId) => {
  // Update offers
  await Offer.updateMany(
    { creatorId: userId },
    { 
      $set: { 'metadata.ghostAccount': false },
      $unset: { 'metadata.requiresAccountConversion': 1 }
    }
  );

  // Update deals
  await Deal.updateMany(
    { creatorId: userId },
    { 
      $set: { 'metadata.ghostAccountConverted': true },
      $unset: { 'metadata.ghostAccount': 1 }
    }
  );
};

module.exports = exports;