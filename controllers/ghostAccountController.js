/* ────────────────────────────────────────────────────────────────
   GHOST ACCOUNT CONTROLLER – Axees
   Handles temporary/guest account functionality
   ───────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const User = require('../models/User');
const GhostAccount = require('../models/GhostAccount');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/* ─── Helper: Generate ghost token ──────────────────────────────── */
const generateGhostToken = (ghostId) => {
  return jwt.sign(
    { 
      ghostId,
      type: 'ghost',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    },
    process.env.JWT_SECRET || 'your-secret-key'
  );
};

/* ─── 1. Create Ghost Account ──────────────────────────────────── */
exports.createGhostAccount = async (req, res) => {
  try {
    const { email, name, source, metadata } = req.body;

    // Generate unique ghost ID
    const ghostId = `ghost_${uuidv4()}`;

    // Create ghost account
    const ghostAccount = new GhostAccount({
      ghostId,
      email,
      name: name || `Guest User ${Date.now()}`,
      source: source || 'direct_link',
      metadata: {
        ...metadata,
        createdAt: new Date(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      activities: [{
        action: 'account_created',
        timestamp: new Date(),
        details: { source }
      }]
    });

    await ghostAccount.save();

    // Generate token for ghost account
    const token = generateGhostToken(ghostId);

    res.status(201).json({
      success: true,
      ghostId,
      token,
      expiresAt: ghostAccount.expiresAt,
      account: {
        ghostId: ghostAccount.ghostId,
        name: ghostAccount.name,
        email: ghostAccount.email
      }
    });

  } catch (error) {
    console.error('Create ghost account error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create ghost account' 
    });
  }
};

/* ─── 2. Get Ghost Account Details ─────────────────────────────── */
exports.getGhostAccount = async (req, res) => {
  try {
    const { ghostId } = req.params;

    const ghostAccount = await GhostAccount.findOne({ ghostId })
      .select('-activities -metadata.ipAddress');

    if (!ghostAccount) {
      return res.status(404).json({ 
        success: false,
        error: 'Ghost account not found' 
      });
    }

    // Check if expired
    if (ghostAccount.expiresAt < new Date()) {
      return res.status(410).json({ 
        success: false,
        error: 'Ghost account has expired' 
      });
    }

    res.json({
      success: true,
      account: ghostAccount
    });

  } catch (error) {
    console.error('Get ghost account error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve ghost account' 
    });
  }
};

/* ─── 3. Convert Ghost to Real Account ─────────────────────────── */
exports.convertToRealAccount = async (req, res) => {
  try {
    const { ghostId } = req.params;
    const { phone, password, email, name, userType } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone and password are required' 
      });
    }

    // Find ghost account
    const ghostAccount = await GhostAccount.findOne({ ghostId });
    if (!ghostAccount) {
      return res.status(404).json({ 
        success: false,
        error: 'Ghost account not found' 
      });
    }

    // Check if already converted
    if (ghostAccount.convertedToUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'Ghost account already converted' 
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      phone,
      password: hashedPassword,
      email: email || ghostAccount.email,
      name: name || ghostAccount.name,
      userType: userType || 'Creator',
      status: 'active',
      isPhoneVerified: false,
      createdFrom: 'ghost_conversion',
      ghostAccountId: ghostId,
      metadata: {
        convertedAt: new Date(),
        originalSource: ghostAccount.source,
        ...ghostAccount.metadata
      }
    });

    await newUser.save();

    // Update ghost account
    ghostAccount.convertedToUserId = newUser._id;
    ghostAccount.convertedAt = new Date();
    ghostAccount.activities.push({
      action: 'converted_to_user',
      timestamp: new Date(),
      details: { userId: newUser._id }
    });
    await ghostAccount.save();

    // Generate JWT for new user
    const token = jwt.sign(
      { 
        id: newUser._id,
        phone: newUser.phone,
        userType: newUser.userType 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Account converted successfully',
      user: {
        id: newUser._id,
        phone: newUser.phone,
        email: newUser.email,
        name: newUser.name,
        userType: newUser.userType
      },
      token
    });

  } catch (error) {
    console.error('Convert ghost account error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to convert ghost account' 
    });
  }
};

/* ─── 4. Delete Ghost Account ──────────────────────────────────── */
exports.deleteGhostAccount = async (req, res) => {
  try {
    const { ghostId } = req.params;

    // Only allow deletion by admin or system
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to delete ghost accounts' 
      });
    }

    const result = await GhostAccount.deleteOne({ ghostId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Ghost account not found' 
      });
    }

    res.status(204).send();

  } catch (error) {
    console.error('Delete ghost account error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete ghost account' 
    });
  }
};

/* ─── 5. Get Analytics ─────────────────────────────────────────── */
exports.getAnalytics = async (req, res) => {
  try {
    // Only allow analytics access to admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to view analytics' 
      });
    }

    const { startDate, endDate, source } = req.query;

    // Build query
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (source) query.source = source;

    // Get analytics data
    const [
      totalCreated,
      totalConverted,
      bySource,
      recentActivity
    ] = await Promise.all([
      // Total created
      GhostAccount.countDocuments(query),
      
      // Total converted
      GhostAccount.countDocuments({
        ...query,
        convertedToUserId: { $exists: true }
      }),
      
      // By source
      GhostAccount.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            converted: {
              $sum: { $cond: [{ $ifNull: ['$convertedToUserId', false] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Recent activity
      GhostAccount.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('ghostId name source createdAt convertedAt')
    ]);

    // Calculate conversion rate
    const conversionRate = totalCreated > 0 
      ? (totalConverted / totalCreated * 100).toFixed(2) 
      : 0;

    // Format by source data
    const sourceStats = {};
    bySource.forEach(item => {
      sourceStats[item._id] = {
        created: item.count,
        converted: item.converted,
        conversionRate: item.count > 0 
          ? (item.converted / item.count * 100).toFixed(2) 
          : 0
      };
    });

    res.json({
      success: true,
      analytics: {
        totalCreated,
        totalConverted,
        conversionRate: parseFloat(conversionRate),
        bySource: sourceStats,
        recentActivity,
        dateRange: {
          start: startDate || 'all time',
          end: endDate || 'present'
        }
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

/* ─── Track Ghost Account Activity ─────────────────────────────── */
exports.trackActivity = async (ghostId, action, details = {}) => {
  try {
    await GhostAccount.updateOne(
      { ghostId },
      {
        $push: {
          activities: {
            action,
            timestamp: new Date(),
            details
          }
        },
        $set: { lastActivityAt: new Date() }
      }
    );
  } catch (error) {
    console.error('Track activity error:', error);
  }
};