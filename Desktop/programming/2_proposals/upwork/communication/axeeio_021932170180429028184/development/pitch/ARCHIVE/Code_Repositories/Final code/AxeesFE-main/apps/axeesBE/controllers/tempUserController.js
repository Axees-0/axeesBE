const TempUser = require("../models/TempUser");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { log } = require("../utils/logger");

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const responseCache = new Map();
const BATCH_SIZE = 50;

// Prefetch queue with parallel processing
const prefetchQueue = [];
let isProcessingQueue = false;
const MAX_PARALLEL_TASKS = 3;

/**
 * Process the prefetch queue with parallel execution
 */
const processPrefetchQueue = async () => {
  if (isProcessingQueue || prefetchQueue.length === 0) return;
  
  isProcessingQueue = true;
  try {
    while (prefetchQueue.length > 0) {
      const batch = prefetchQueue.splice(0, MAX_PARALLEL_TASKS);
      await Promise.all(batch.map(task => task()));
    }
  } catch (error) {
    log('error', 'Error processing prefetch queue', { error: error.message });
  } finally {
    isProcessingQueue = false;
  }
};

/**
 * Get cached data or fetch and cache with optimized query
 */
const getCachedData = async (key, fetchFn) => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  responseCache.set(key, {
    data,
    timestamp: Date.now()
  });
  return data;
};

/**
 * Optimized query projection for common fields
 */
const defaultProjection = {
  name: 1,
  userName: 1,
  avatarUrl: 1,
  status: 1,
  expiresAt: 1,
  'creatorData.categories': 1,
  'creatorData.platforms': 1,
  'creatorData.totalFollowers': 1,
  _id: 1
};

/**
 * Get active temp users with optimized querying and cursor-based pagination
 */
exports.getActiveTempUsers = async (filters = {}, lastId = null, limit = 20) => {
  const cacheKey = `active_users_${JSON.stringify(filters)}_${lastId}_${limit}`;
  
  return getCachedData(cacheKey, async () => {
    const query = {
      status: 'active',
      expiresAt: { $gt: new Date() },
      ...filters
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    const users = await TempUser.find(query)
      .select(defaultProjection)
      .sort({ _id: 1 })
      .limit(limit)
      .lean()
      .hint({ status: 1, expiresAt: 1 }); // Use the compound index

    // Prefetch next batch
    if (users.length === limit) {
      const lastUser = users[users.length - 1];
      queuePrefetchTask(async () => {
        const nextBatch = await TempUser.find({
          ...query,
          _id: { $gt: lastUser._id }
        })
        .select(defaultProjection)
        .sort({ _id: 1 })
        .limit(limit)
        .lean()
        .hint({ status: 1, expiresAt: 1 });

        responseCache.set(`${cacheKey}_next`, {
          data: nextBatch,
          timestamp: Date.now()
        });
      });
    }

    return users;
  });
};

/**
 * Get users by category with optimized querying
 */
exports.getUsersByCategory = async (category, lastId = null, limit = 20) => {
  const cacheKey = `category_${category}_${lastId}_${limit}`;
  
  return getCachedData(cacheKey, async () => {
    const query = {
      'creatorData.categories': category,
      status: 'active'
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    return TempUser.find(query)
      .select(defaultProjection)
      .sort({ _id: 1 })
      .limit(limit)
      .lean()
      .hint({ 'creatorData.categories': 1, status: 1 });
  });
};

/**
 * Get users by platform with optimized querying
 */
exports.getUsersByPlatform = async (platform, lastId = null, limit = 20) => {
  const cacheKey = `platform_${platform}_${lastId}_${limit}`;
  
  return getCachedData(cacheKey, async () => {
    const query = {
      'creatorData.platforms.platform': platform,
      status: 'active'
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    return TempUser.find(query)
      .select(defaultProjection)
      .sort({ _id: 1 })
      .limit(limit)
      .lean()
      .hint({ 'creatorData.platforms.platform': 1, status: 1 });
  });
};

/**
 * Batch get users by IDs
 */
exports.getUsersByIds = async (userIds) => {
  const cacheKey = `users_by_ids_${userIds.sort().join('_')}`;
  
  return getCachedData(cacheKey, async () => {
    return TempUser.find({ _id: { $in: userIds } })
      .select(defaultProjection)
      .lean();
  });
};

/**
 * Search users with optimized text search
 */
exports.searchUsers = async (searchTerm, lastId = null, limit = 20) => {
  const cacheKey = `search_${searchTerm}_${lastId}_${limit}`;
  
  return getCachedData(cacheKey, async () => {
    const query = {
      $text: { $search: searchTerm },
      status: 'active'
    };

    if (lastId) {
      query._id = { $gt: lastId };
    }

    return TempUser.find(query)
      .select(defaultProjection)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  });
};

/**
 * Check for duplicate users before saving
 */
const checkForDuplicates = async (userName) => {
  // Check for existing temp user
  const existingTempUser = await TempUser.findOne({
    userName,
    status: { $in: ['active', 'pending_offer'] }
  });
  
  if (existingTempUser) {
    return { 
      isDuplicate: true, 
      message: 'A temp user with this username already exists',
      existingUser: existingTempUser
    };
  }

  // Check for existing permanent user
  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    return { 
      isDuplicate: true, 
      message: 'A permanent user with this username already exists',
      existingUser
    };
  }

  return { isDuplicate: false };
};

/**
 * Convert a temp user to a permanent user when they receive an offer
 */
exports.convertTempUserToPermanent = async (userName) => {
  try {
    // Find the temp user
    const tempUser = await TempUser.findOne({ userName });
    if (!tempUser) {
      return { success: false, message: 'Temp user not found' };
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(userName);
    if (duplicateCheck.isDuplicate) {
      return { 
        success: false, 
        message: duplicateCheck.message,
        existingUser: duplicateCheck.existingUser
      };
    }

    // Prepare user data
    const { _id, searchQuery, searchTags, aiGenerated, generatedAt, expiresAt, status, ...userData } = tempUser.toObject();

    // Add required fields for permanent user
    const user = {
      ...userData,
      password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
      isActive: true,
      emailVerified: false,
      onboardingComplete: false
    };

    // Create new permanent user
    const newUser = new User(user);
    await newUser.save();

    // Update temp user status
    tempUser.status = 'converted';
    await tempUser.save();

    log('info', `Converted temp user ${userName} to permanent user`, { userId: newUser._id });
    
    return { 
      success: true, 
      userId: newUser._id,
      message: 'Successfully converted temp user to permanent user'
    };
  } catch (error) {
    log('error', 'Failed to convert temp user to permanent', { error: error.message });
    return { success: false, message: error.message };
  }
};

/**
 * Update temp user status when they receive an offer
 */
exports.updateTempUserStatus = async (userName, status) => {
  try {
    const tempUser = await TempUser.findOne({ userName });
    if (!tempUser) {
      return { success: false, message: 'Temp user not found' };
    }

    // Validate status transition
    const validTransitions = {
      'active': ['pending_offer', 'expired'],
      'pending_offer': ['converted', 'expired'],
      'converted': [],
      'expired': []
    };

    if (!validTransitions[tempUser.status].includes(status)) {
      return { 
        success: false, 
        message: `Invalid status transition from ${tempUser.status} to ${status}`
      };
    }

    tempUser.status = status;
    await tempUser.save();

    log('info', `Updated temp user ${userName} status to ${status}`);
    
    return { 
      success: true, 
      message: `Successfully updated temp user status to ${status}`
    };
  } catch (error) {
    log('error', 'Failed to update temp user status', { error: error.message });
    return { success: false, message: error.message };
  }
};

/**
 * Clean up expired temp users
 */
exports.cleanupExpiredTempUsers = async () => {
  try {
    const result = await TempUser.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { status: 'expired' }
      ]
    });

    log('info', `Cleaned up ${result.deletedCount} expired temp users`);
    
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    log('error', 'Failed to cleanup expired temp users', { error: error.message });
    return { success: false, message: error.message };
  }
};

/**
 * Prefetch common queries
 */
const prefetchCommonQueries = async () => {
  try {
    // Prefetch active temp users
    queuePrefetchTask(async () => {
      const activeUsers = await TempUser.find({ 
        status: 'active',
        expiresAt: { $gt: new Date() }
      }).lean();
      responseCache.set('active_temp_users', {
        data: activeUsers,
        timestamp: Date.now()
      });
    });

    // Prefetch users by popular categories
    queuePrefetchTask(async () => {
      const popularCategories = await TempUser.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$creatorData.categories' },
        { $group: { _id: '$creatorData.categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      for (const category of popularCategories) {
        const users = await TempUser.find({
          'creatorData.categories': category._id,
          status: 'active'
        }).lean();
        
        responseCache.set(`category_${category._id}`, {
          data: users,
          timestamp: Date.now()
        });
      }
    });

    // Prefetch users by platform
    queuePrefetchTask(async () => {
      const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'];
      for (const platform of platforms) {
        const users = await TempUser.find({
          'creatorData.platforms.platform': platform,
          status: 'active'
        }).lean();
        
        responseCache.set(`platform_${platform}`, {
          data: users,
          timestamp: Date.now()
        });
      }
    });
  } catch (error) {
    log('error', 'Error in prefetching common queries', { error: error.message });
  }
};

// Start prefetching when the server starts
prefetchCommonQueries();

/**
 * Add task to prefetch queue
 */
const queuePrefetchTask = (task) => {
  prefetchQueue.push(task);
  if (!isProcessingQueue) {
    processPrefetchQueue();
  }
}; 