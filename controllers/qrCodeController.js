/* ────────────────────────────────────────────────────────────────
   QR CODE CONTROLLER – Axees
   Handles QR code generation, tracking, and analytics
   ───────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const QRCodeModel = require('../models/QRCode');
const ghostAccountController = require('./ghostAccountController');

/* ─── Helper: Generate short URL ───────────────────────────────── */
const generateShortUrl = (qrCodeId) => {
  const baseUrl = process.env.BASE_URL || 'https://axees.app';
  return `${baseUrl}/q/${qrCodeId}`;
};

/* ─── Helper: Generate tracking URL ────────────────────────────── */
const generateTrackingUrl = (type, targetId, qrCodeId) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://app.axees.com';
  const paths = {
    profile: `/creator/${targetId}`,
    offer: `/offer/${targetId}`,
    deal: `/deal/${targetId}`,
    event: `/event/${targetId}`,
    campaign: `/campaign/${targetId}`
  };
  
  return `${baseUrl}${paths[type] || '/'}?qr=${qrCodeId}`;
};

/* ─── 1. Generate QR Code ──────────────────────────────────────── */
exports.generateQRCode = async (req, res) => {
  try {
    const { type, targetId, customUrl, options = {}, metadata = {} } = req.body;
    const userId = req.user.id;

    // Validate type
    const validTypes = ['profile', 'offer', 'deal', 'event', 'campaign'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid QR code type' 
      });
    }

    // Generate unique QR code ID
    const qrCodeId = uuidv4();
    
    // Generate URLs
    const shortUrl = generateShortUrl(qrCodeId);
    const trackingUrl = customUrl || generateTrackingUrl(type, targetId, qrCodeId);

    // QR code options
    const qrOptions = {
      width: options.size || 300,
      margin: 2,
      color: {
        dark: options.color || '#000000',
        light: options.backgroundColor || '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for logo overlay
    };

    // Generate QR code
    let qrCodeData;
    if (options.format === 'svg') {
      qrCodeData = await QRCode.toString(shortUrl, { 
        ...qrOptions, 
        type: 'svg' 
      });
    } else {
      // Default to base64 PNG
      qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
    }

    // Save QR code to database
    const qrCodeDoc = new QRCodeModel({
      qrCodeId,
      type,
      targetId,
      userId,
      shortUrl,
      trackingUrl,
      options: {
        size: options.size || 300,
        color: options.color || '#000000',
        backgroundColor: options.backgroundColor || '#FFFFFF',
        format: options.format || 'base64',
        hasLogo: options.logo || false
      },
      metadata: {
        ...metadata,
        createdBy: userId,
        createdAt: new Date()
      }
    });

    await qrCodeDoc.save();

    res.json({
      success: true,
      qrCodeId,
      qrCode: qrCodeData,
      shortUrl,
      trackingUrl,
      type,
      targetId
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate QR code' 
    });
  }
};

/* ─── 2. Get QR Code Details ───────────────────────────────────── */
exports.getQRCode = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCode = await QRCodeModel.findOne({ qrCodeId })
      .populate('userId', 'name email userType');

    if (!qrCode) {
      return res.status(404).json({ 
        success: false,
        error: 'QR code not found' 
      });
    }

    res.json({
      success: true,
      qrCode: {
        qrCodeId: qrCode.qrCodeId,
        type: qrCode.type,
        targetId: qrCode.targetId,
        shortUrl: qrCode.shortUrl,
        trackingUrl: qrCode.trackingUrl,
        scanCount: qrCode.scanCount,
        uniqueScanCount: qrCode.uniqueUsers.length,
        createdAt: qrCode.createdAt,
        lastScannedAt: qrCode.lastScannedAt,
        creator: qrCode.userId,
        options: qrCode.options
      }
    });

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve QR code' 
    });
  }
};

/* ─── 3. Track QR Code Scan ────────────────────────────────────── */
exports.trackScan = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const { userAgent, ipAddress, location, ghostAccountId } = req.body;

    // Find QR code
    const qrCode = await QRCodeModel.findOne({ qrCodeId });
    if (!qrCode) {
      return res.status(404).json({ 
        success: false,
        error: 'QR code not found' 
      });
    }

    // Track scan
    const scanData = {
      timestamp: new Date(),
      userAgent: userAgent || req.headers['user-agent'],
      ipAddress: ipAddress || req.ip,
      location,
      userId: req.user?.id,
      ghostAccountId
    };

    qrCode.scans.push(scanData);
    qrCode.scanCount += 1;
    qrCode.lastScannedAt = new Date();

    // Track unique users
    const userIdentifier = req.user?.id || ghostAccountId || ipAddress;
    if (userIdentifier && !qrCode.uniqueUsers.includes(userIdentifier)) {
      qrCode.uniqueUsers.push(userIdentifier);
    }

    await qrCode.save();

    // Create ghost account if user is not logged in
    let ghostAccount = null;
    if (!req.user && !ghostAccountId) {
      const ghostResult = await ghostAccountController.createGhostAccount({
        body: {
          source: 'qr_code',
          metadata: {
            qrCodeId,
            qrType: qrCode.type,
            targetId: qrCode.targetId
          }
        },
        headers: req.headers,
        ip: req.ip
      }, {
        status: () => ({ json: (data) => data }),
        json: (data) => data
      });

      if (ghostResult.success) {
        ghostAccount = {
          ghostId: ghostResult.ghostId,
          token: ghostResult.token
        };
      }
    }

    // Track activity for existing ghost account
    if (ghostAccountId) {
      await ghostAccountController.trackActivity(ghostAccountId, 'qr_scan', {
        qrCodeId,
        qrType: qrCode.type,
        targetId: qrCode.targetId
      });
    }

    res.json({
      success: true,
      redirectUrl: qrCode.trackingUrl,
      ghostAccount,
      qrType: qrCode.type,
      targetId: qrCode.targetId
    });

  } catch (error) {
    console.error('Track scan error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to track scan' 
    });
  }
};

/* ─── 4. Get QR Code Analytics ─────────────────────────────────── */
exports.getAnalytics = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const { startDate, endDate } = req.query;

    // Find QR code
    const qrCode = await QRCodeModel.findOne({ qrCodeId });
    if (!qrCode) {
      return res.status(404).json({ 
        success: false,
        error: 'QR code not found' 
      });
    }

    // Check authorization
    if (qrCode.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to view analytics' 
      });
    }

    // Filter scans by date range
    let filteredScans = qrCode.scans;
    if (startDate || endDate) {
      filteredScans = qrCode.scans.filter(scan => {
        const scanDate = new Date(scan.timestamp);
        if (startDate && scanDate < new Date(startDate)) return false;
        if (endDate && scanDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Calculate analytics
    const analytics = {
      totalScans: filteredScans.length,
      uniqueScans: new Set(filteredScans.map(s => s.userId || s.ghostAccountId || s.ipAddress)).size,
      
      // Scans by date
      scansByDate: filteredScans.reduce((acc, scan) => {
        const date = new Date(scan.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
      
      // Scans by location (if available)
      scansByLocation: filteredScans
        .filter(s => s.location)
        .reduce((acc, scan) => {
          const key = `${scan.location.latitude},${scan.location.longitude}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      
      // Device types
      scansByDevice: filteredScans.reduce((acc, scan) => {
        const ua = scan.userAgent?.toLowerCase() || '';
        let device = 'unknown';
        if (ua.includes('mobile')) device = 'mobile';
        else if (ua.includes('tablet')) device = 'tablet';
        else if (ua.includes('desktop')) device = 'desktop';
        
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {}),
      
      // Conversion tracking
      conversions: {
        ghostToUser: 0, // This would need to be tracked separately
        views: filteredScans.length,
        actions: 0 // This would need to be tracked based on user actions
      },
      
      // Time-based patterns
      scansByHour: filteredScans.reduce((acc, scan) => {
        const hour = new Date(scan.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {}),
      
      // Recent scans
      recentScans: filteredScans
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
        .map(scan => ({
          timestamp: scan.timestamp,
          location: scan.location,
          device: scan.userAgent?.includes('mobile') ? 'mobile' : 'desktop'
        }))
    };

    res.json({
      success: true,
      qrCodeId,
      analytics,
      dateRange: {
        start: startDate || qrCode.createdAt,
        end: endDate || new Date()
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve analytics' 
    });
  }
};

/* ─── 5. Get User's QR Codes ───────────────────────────────────── */
exports.getUserQRCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (type) query.type = type;

    // Get total count
    const totalCount = await QRCodeModel.countDocuments(query);

    // Get paginated results
    const qrCodes = await QRCodeModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('qrCodeId type targetId shortUrl scanCount createdAt lastScannedAt');

    res.json({
      success: true,
      qrCodes,
      pagination: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get user QR codes error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve QR codes' 
    });
  }
};

/* ─── 6. Delete QR Code ────────────────────────────────────────── */
exports.deleteQRCode = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const userId = req.user.id;

    // Find QR code
    const qrCode = await QRCodeModel.findOne({ qrCodeId });
    if (!qrCode) {
      return res.status(404).json({ 
        success: false,
        error: 'QR code not found' 
      });
    }

    // Check authorization
    if (qrCode.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to delete this QR code' 
      });
    }

    await QRCodeModel.deleteOne({ qrCodeId });

    res.status(204).send();

  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete QR code' 
    });
  }
};