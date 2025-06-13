/* ────────────────────────────────────────────────────────────────
   USERS CONTROLLER  – Axees
   ───────────────────────────────────────────────────────────── */
const mongoose = require('mongoose');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcrypt');
// 👇 import the shared RAM store
const { syntheticUserStore } = require('./findController');
const { Types: { ObjectId } } = mongoose;

/* ─── 1. GET list (cursor) ────────────────────────────────────── */
exports.getAllUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const cursor = req.query.cursor;
    const viewer = req.query.viewerId;                   // 🆕  logged‑in user id (optional)

    /* base filters: only active creators */
    const filters = { status: 'active', userType: 'Creator' };
    if (tags.length) filters['creatorData.categories'] = { $in: tags };
    if (cursor) filters._id = { $gt: new ObjectId(cursor) };

    /* fetch creators ------------------------------------------------ */
    const docs = await User.find(filters)
      .sort({ _id: 1 })
      .limit(limit + 1)           // +1 => does another page exist?
      .lean();

    let items = docs.slice(0, limit);
    const nextCursor = docs.length > limit ? docs[limit]._id : null;

    /* if we know the viewer, fetch her favourites once -------------- */
    if (viewer && ObjectId.isValid(viewer)) {
      const viewerDoc = await User.findById(viewer, { favorites: 1 }).lean();
      const favIds = viewerDoc?.favorites?.map(id => id.toString()) ?? [];


      // attach a boolean flag to each creator
      items = items.map(it => ({
        ...it,
        favorites: favIds.includes(it._id.toString())     // 🆕
      }));
    }

    res.json({ items, nextCursor });
  } catch (err) {
    console.error('getAllUsers', err);
    res.status(500).json({ error: 'Server error' });
  }
};


/* ─── 2. CREATE ───────────────────────────────────────────────── */
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error('createUser', err);
    res.status(400).json({ error: err.message });
  }
};


/* ─── helper ────────────────────────────────────────────────────────── */
/**  Fix NaN / wrong types in the numeric follower fields so Mongoose
 *   never throws “Cast to Number failed”.  Returns a DEEP-cloned object
 *   that is safe to persist.                                            */
const sanitiseFollowers = (src) => {
  if (!src?.creatorData) return { ...src };

  const cd = { ...src.creatorData };

  // top-level totalFollowers
  cd.totalFollowers = Number.isFinite(cd.totalFollowers) ? cd.totalFollowers : 0;

  // per-platform followersCount
  cd.platforms = (Array.isArray(cd.platforms) ? cd.platforms : []).map(p => ({
    ...p,
    followersCount: Number.isFinite(p.followersCount) ? p.followersCount : 0
  }));

  return { ...src, creatorData: cd };
};


/* ─── MAIN: GET /api/users/:userId  (permanent | synthetic | temp) ───── */
exports.getUserByIdOrTemp = async (req, res) => {
  const userId = req.params.userId;

  /* 1 — permanent (already in “users”) ---------------------------------- */
  if (mongoose.Types.ObjectId.isValid(userId)) {
    const real = await User.findById(userId).lean();
    if (real) return res.json(real);
  }

  /* 2 — synthetic profile (generated for cursor paging) ----------------- */
 const synth = syntheticUserStore.get(userId);
 if (synth) {
   // the cache may contain either { profile } or the raw object
   const rawProfile0 = synth.profile ?? synth;

// remove empty / duplicate-prone phone numbers
const rawProfile  = { ...rawProfile0 };
if (!rawProfile.phone || typeof rawProfile.phone !== "string" || !rawProfile.phone.trim()) {
  delete rawProfile.phone;
}
   try {
     const safeProfile = sanitiseFollowers(rawProfile);
     delete safeProfile.phone;             // keep unique phone index happy

      /* 2a  upsert into tempusers – keeps BE link backwards-compatible */
      await TempUser.updateOne(
        { _id: safeProfile._id },
        {
          $setOnInsert: {
            ...safeProfile,
            aiGenerated: false,         // pure random, not from OpenAI
            searchQuery: '',
            searchTags: [],
            generatedAt: new Date()
          }
        },
        { upsert: true }
      );

      /* 2b  upsert into users so offers / favourites can resolve it */
      const randPwd = await bcrypt.hash(
        Math.random().toString(36).slice(-8), 10
      );

      await User.updateOne(
        { _id: safeProfile._id },
        {
          $setOnInsert: {
            ...safeProfile,
            password: randPwd,
            userType: 'Creator',
            status: 'active',
            onboardingComplete: false
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('❗ upsert of synthetic profile failed', err.message);
    }

    return res.json(rawProfile);         // FE keeps the exact same data
  }

  /* 3 — TempUser (auto-promote on first visit) -------------------------- */
  const temp = await TempUser.findById(userId).lean();
  if (!temp) return res.status(404).json({ message: 'User not found' });

  try {
    const { _id, searchQuery, searchTags,
      aiGenerated, generatedAt, ...rest } = temp;

    const pwd = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

    const promoted = await User.create({
      ...sanitiseFollowers(rest),
      _id,
      password: pwd,
      userType: 'Creator',
      status: 'active',
      onboardingComplete: false
    });

    await TempUser.deleteOne({ _id });
    return res.json(promoted);
  } catch (err) {
    console.error('auto-promotion failed → falling back to temp', err.message);
    return res.json(temp);                          // still open the profile
  }
};

/* ─── 3. GET by ID ────────────────────────────────────────────── */
//  exports.getUserById = async (req, res) => {
//    try {
//      const user = await User.findById(req.params.userId);
//      if (!user) return res.status(404).json({ error: 'Not found' });
//      res.json(user);
//    } catch (err) {
//      console.error('getUserById', err);
//      res.status(500).json({ error: 'Server error' });
//    }
//  };

/* ─── 4. REPLACE (PUT) ────────────────────────────────────────── */
exports.replaceUser = async (req, res) => {
  try {
    const user = await User.findOneAndReplace(
      { _id: req.params.userId },
      req.body,
      { new: true, runValidators: true, overwrite: true }
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Replaced', user });
  } catch (err) {
    console.error('replaceUser', err);
    res.status(400).json({ error: err.message });
  }
};

/* ─── 5. UPDATE (PATCH) ───────────────────────────────────────── */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated', user });
  } catch (err) {
    console.error('updateUser', err);
    res.status(400).json({ error: err.message });
  }
};

/* ─── 6. DELETE (soft) ────────────────────────────────────────── */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'deleted', deletedAt: new Date() },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', user });
  } catch (err) {
    console.error('deleteUser', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { creatorId } = req.body;

    if (!userId || !creatorId)
      return res.status(400).json({ error: 'userId and creatorId are required' });

    const viewer = await User.findById(userId);
    if (!viewer) return res.status(404).json({ error: 'Viewer not found' });

    const op = viewer.favorites?.includes(creatorId) ? '$pull' : '$addToSet';
    await User.updateOne({ _id: userId }, { [op]: { favorites: creatorId } });

    /* fetch the *new* favourites list in one extra round‑trip */
    const updated = await User.findById(userId, { favorites: 1 }).lean();

    res.json({ favorites: updated.favorites ?? [] });
  } catch (err) {
    console.error('toggleFavorite', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─── 8. Hide creator ────────────────────────────────────────── */
exports.hideCreator = async (req, res) => {
  try {
    const { viewerId } = req.params;
    const { creatorId } = req.body;

    const creator = await User.findById(creatorId);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    await User.updateOne(
      { _id: creatorId },
      { $addToSet: { hiddenBy: viewerId } }
    );

    res.json({ message: 'Creator hidden' });
  } catch (err) {
    console.error('hideCreator', err);
    res.status(500).json({ error: 'Server error' });
  }
};
