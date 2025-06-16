// Simple QR code generation
// For production, install: npm install qrcode
// const QRCode = require('qrcode');
const User = require('../models/User');
const Deal = require('../models/deal');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
const crypto = require('crypto');

// Simple QR code generation fallback using public API
const generateQRCode = async (text, options = {}) => {
  try {
    // If QRCode library is available, use it
    // For now, return a placeholder data URL and the raw URL
    const size = options.width || 256;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    
    return {
      dataUrl: `data:image/png;base64,${Buffer.from('QR-CODE-PLACEHOLDER').toString('base64')}`, // Placeholder
      buffer: Buffer.from('QR-CODE-PLACEHOLDER'),
      apiUrl: qrApiUrl, // For actual QR generation
      text: text
    };
  } catch (error) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

/**
 * Dual-Purpose QR Code Controller
 * Generates QR codes for:
 * 1. User profiles (profile sharing, connection requests)
 * 2. Deal tracking (deal status, payment verification)
 */

// Generate a secure token for QR code data
const generateSecureToken = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  hash.update(process.env.QR_CODE_SECRET || 'default-qr-secret');
  return hash.digest('hex').substring(0, 16);
};

// Generate user profile QR code
exports.generateUserProfileQR = async (req, res) => {
  try {
    const userId = req.user.id;
    const { purpose = 'profile', expiresIn = 24 } = req.body; // hours

    const user = await User.findById(userId).select('userName email userType profilePicture');
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Create QR code data
    const qrData = {
      type: 'user_profile',
      purpose,
      userId: user._id.toString(),
      userName: user.userName,
      userType: user.userType,
      timestamp: Date.now(),
      expiresAt: Date.now() + (expiresIn * 60 * 60 * 1000),
      token: generateSecureToken({ userId, purpose })
    };

    // Encode data based on purpose
    let qrUrl;
    switch (purpose) {
      case 'connect':
        qrUrl = `${process.env.FRONTEND_URL}/connect/${user._id}?token=${qrData.token}`;
        break;
      case 'profile':
        qrUrl = `${process.env.FRONTEND_URL}/profile/${user._id}?token=${qrData.token}`;
        break;
      case 'contact':
        qrUrl = `${process.env.FRONTEND_URL}/contact/${user._id}?token=${qrData.token}`;
        break;
      default:
        qrUrl = `${process.env.FRONTEND_URL}/user/${user._id}`;
    }

    // Generate QR code options
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#430B92', // Axees brand color
        light: '#FFFFFF'
      },
      width: 256
    };

    // Generate QR code
    const qrResult = await generateQRCode(qrUrl, qrOptions);

    // Store QR code metadata
    user.qrCodeData = {
      lastGenerated: new Date(),
      purpose,
      expiresAt: new Date(qrData.expiresAt),
      token: qrData.token
    };
    await user.save();

    return successResponse(res, "User profile QR code generated successfully", {
      qrCode: {
        dataUrl: qrResult.dataUrl,
        buffer: qrResult.buffer.toString('base64'),
        apiUrl: qrResult.apiUrl, // For frontend to generate actual QR code
        purpose,
        expiresAt: new Date(qrData.expiresAt),
        shareUrl: qrUrl
      },
      user: {
        id: user._id,
        userName: user.userName,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error("Error generating user profile QR code:", error);
    return handleServerError(res, error);
  }
};

// Generate deal tracking QR code
exports.generateDealQR = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { includePayment = false, includeStatus = true } = req.body;

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email')
      .populate('marketerId', 'userName email');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Check authorization
    const isCreator = deal.creatorId._id.toString() === req.user.id;
    const isMarketer = deal.marketerId._id.toString() === req.user.id;
    
    if (!isCreator && !isMarketer) {
      return errorResponse(res, "Unauthorized access to deal", 403);
    }

    // Create QR code data
    const qrData = {
      type: 'deal_tracking',
      dealId: deal._id.toString(),
      dealNumber: deal.dealNumber,
      dealName: deal.dealName,
      status: deal.status,
      timestamp: Date.now(),
      token: generateSecureToken({ dealId, userId: req.user.id })
    };

    // Include payment info if requested and authorized
    if (includePayment && (isCreator || isMarketer)) {
      qrData.payment = {
        status: deal.paymentInfo?.paymentStatus,
        amount: deal.paymentInfo?.paymentAmount,
        currency: 'USD'
      };
    }

    // Generate tracking URL
    const trackingUrl = `${process.env.FRONTEND_URL}/deal/track/${deal._id}?token=${qrData.token}`;

    // QR code options with deal-specific styling
    const qrOptions = {
      errorCorrectionLevel: 'H', // Higher correction for deal tracking
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };

    // Generate QR code
    const qrResult = await generateQRCode(trackingUrl, qrOptions);

    // Update deal with QR code metadata
    if (!deal.qrCodeData) {
      deal.qrCodeData = {};
    }
    deal.qrCodeData.lastGenerated = new Date();
    deal.qrCodeData.generatedBy = req.user.id;
    deal.qrCodeData.token = qrData.token;
    await deal.save();

    return successResponse(res, "Deal QR code generated successfully", {
      qrCode: {
        dataUrl: qrResult.dataUrl,
        buffer: qrResult.buffer.toString('base64'),
        apiUrl: qrResult.apiUrl, // For frontend to generate actual QR code
        trackingUrl,
        includesPayment: includePayment,
        includesStatus: includeStatus
      },
      deal: {
        id: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        status: deal.status,
        creator: deal.creatorId.userName,
        marketer: deal.marketerId.userName
      }
    });

  } catch (error) {
    console.error("Error generating deal QR code:", error);
    return handleServerError(res, error);
  }
};

// Scan and verify QR code
exports.scanQRCode = async (req, res) => {
  try {
    const { qrData, token } = req.body;

    if (!qrData || !token) {
      return errorResponse(res, "QR data and token are required", 400);
    }

    // Parse QR data
    let parsedData;
    try {
      if (typeof qrData === 'string') {
        // Extract ID from URL format
        const urlMatch = qrData.match(/\/(user|profile|connect|contact|deal\/track)\/([a-f0-9]{24})/);
        if (urlMatch) {
          const [, type, id] = urlMatch;
          parsedData = { type: type.includes('deal') ? 'deal' : 'user', id };
        } else {
          throw new Error("Invalid QR code format");
        }
      } else {
        parsedData = qrData;
      }
    } catch (parseError) {
      return errorResponse(res, "Invalid QR code data", 400);
    }

    // Verify based on type
    if (parsedData.type === 'user') {
      const user = await User.findById(parsedData.id)
        .select('userName email userType profilePicture bio qrCodeData');

      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      // Verify token if QR code data exists
      if (user.qrCodeData && user.qrCodeData.token) {
        const expectedToken = generateSecureToken({ 
          userId: parsedData.id, 
          purpose: user.qrCodeData.purpose 
        });
        
        if (token !== expectedToken) {
          return errorResponse(res, "Invalid QR code token", 401);
        }

        // Check expiration
        if (user.qrCodeData.expiresAt && new Date() > new Date(user.qrCodeData.expiresAt)) {
          return errorResponse(res, "QR code has expired", 401);
        }
      }

      return successResponse(res, "User QR code verified successfully", {
        type: 'user_profile',
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          userType: user.userType,
          profilePicture: user.profilePicture,
          bio: user.bio,
          canConnect: req.user.id !== user._id.toString()
        },
        actions: {
          viewProfile: `/api/users/${user._id}`,
          sendMessage: `/api/chats/initiate`,
          connect: `/api/users/connect/${user._id}`
        }
      });

    } else if (parsedData.type === 'deal') {
      const deal = await Deal.findById(parsedData.id)
        .populate('creatorId', 'userName email')
        .populate('marketerId', 'userName email')
        .populate('milestones');

      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify token
      const expectedToken = generateSecureToken({ 
        dealId: parsedData.id, 
        userId: deal.qrCodeData?.generatedBy 
      });
      
      if (token !== expectedToken) {
        return errorResponse(res, "Invalid QR code token", 401);
      }

      // Check access rights
      const isParticipant = 
        deal.creatorId._id.toString() === req.user.id ||
        deal.marketerId._id.toString() === req.user.id;

      const responseData = {
        type: 'deal_tracking',
        deal: {
          id: deal._id,
          dealNumber: deal.dealNumber,
          dealName: deal.dealName,
          status: deal.status,
          createdAt: deal.createdAt,
          creator: {
            id: deal.creatorId._id,
            userName: deal.creatorId.userName
          },
          marketer: {
            id: deal.marketerId._id,
            userName: deal.marketerId.userName
          }
        }
      };

      // Include sensitive data only for participants
      if (isParticipant) {
        responseData.deal.payment = {
          status: deal.paymentInfo?.paymentStatus,
          amount: deal.paymentInfo?.paymentAmount,
          escrowStatus: deal.paymentInfo?.escrowStatus
        };
        responseData.deal.milestones = deal.milestones.map(m => ({
          id: m._id,
          title: m.title,
          status: m.status,
          amount: m.amount,
          dueDate: m.dueDate
        }));
        responseData.actions = {
          viewDetails: `/api/marketer/deals/${deal._id}`,
          updateStatus: `/api/marketer/deals/${deal._id}/status`,
          viewPayment: `/api/payments/deals/${deal._id}`
        };
      } else {
        responseData.deal.isPublic = true;
        responseData.message = "Limited access - you are not a participant in this deal";
      }

      return successResponse(res, "Deal QR code verified successfully", responseData);
    }

    return errorResponse(res, "Invalid QR code type", 400);

  } catch (error) {
    console.error("Error scanning QR code:", error);
    return handleServerError(res, error);
  }
};

// Get QR code history for user
exports.getQRCodeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's QR codes
    const user = await User.findById(userId).select('qrCodeData');
    
    // Get deals where user generated QR codes
    const deals = await Deal.find({
      $or: [
        { creatorId: userId },
        { marketerId: userId }
      ],
      'qrCodeData.generatedBy': userId
    }).select('dealNumber dealName qrCodeData createdAt');

    const history = {
      profile: user?.qrCodeData ? {
        lastGenerated: user.qrCodeData.lastGenerated,
        purpose: user.qrCodeData.purpose,
        expiresAt: user.qrCodeData.expiresAt,
        isExpired: user.qrCodeData.expiresAt ? new Date() > new Date(user.qrCodeData.expiresAt) : false
      } : null,
      deals: deals.map(deal => ({
        dealId: deal._id,
        dealNumber: deal.dealNumber,
        dealName: deal.dealName,
        generatedAt: deal.qrCodeData.lastGenerated,
        generatedBy: deal.qrCodeData.generatedBy
      }))
    };

    return successResponse(res, "QR code history retrieved successfully", history);

  } catch (error) {
    console.error("Error retrieving QR code history:", error);
    return handleServerError(res, error);
  }
};

// Bulk generate QR codes for multiple deals
exports.bulkGenerateDealQRs = async (req, res) => {
  try {
    const { dealIds } = req.body;

    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      return errorResponse(res, "Deal IDs array is required", 400);
    }

    const results = [];
    const errors = [];

    for (const dealId of dealIds) {
      try {
        const deal = await Deal.findById(dealId);
        
        if (!deal) {
          errors.push({ dealId, error: "Deal not found" });
          continue;
        }

        // Check authorization
        const isParticipant = 
          deal.creatorId.toString() === req.user.id ||
          deal.marketerId.toString() === req.user.id;
        
        if (!isParticipant) {
          errors.push({ dealId, error: "Unauthorized" });
          continue;
        }

        // Generate QR code
        const token = generateSecureToken({ dealId, userId: req.user.id });
        const trackingUrl = `${process.env.FRONTEND_URL}/deal/track/${dealId}?token=${token}`;
        
        const qrOptions = {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 200
        };

        const qrResult = await generateQRCode(trackingUrl, qrOptions);

        // Update deal
        if (!deal.qrCodeData) {
          deal.qrCodeData = {};
        }
        deal.qrCodeData.lastGenerated = new Date();
        deal.qrCodeData.generatedBy = req.user.id;
        deal.qrCodeData.token = token;
        await deal.save();

        results.push({
          dealId: deal._id,
          dealNumber: deal.dealNumber,
          qrCode: qrResult.dataUrl,
          apiUrl: qrResult.apiUrl,
          trackingUrl
        });

      } catch (dealError) {
        errors.push({ dealId, error: dealError.message });
      }
    }

    return successResponse(res, "Bulk QR code generation completed", {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error("Error in bulk QR code generation:", error);
    return handleServerError(res, error);
  }
};

module.exports = exports;