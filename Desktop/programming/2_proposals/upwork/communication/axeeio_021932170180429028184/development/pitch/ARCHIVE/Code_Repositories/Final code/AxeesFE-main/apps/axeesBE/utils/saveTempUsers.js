/**
 * utils/saveTempUsers.js
 * ------------------------------------------------------------
 * Persist AI-generated creator profiles in the TempUser
 * collection – *insert-or-update* and fully case-insensitive.
 *
 * 1.  Every userName is normalised → userNameCanonical
 *     (remove accents, spaces, punctuation – lower-case only).
 * 2.  Bulk upsert matches on userNameCanonical so variants
 *     like “KEKE 195 CM” and “keke195cm” merge into one doc.
 * 3.  Duplicate-key races are logged, then silently ignored.
 * ------------------------------------------------------------
 */

const TempUser      = require('../models/TempUser');
const resolveAvatar = require('../utils/avatarResolver');
const { ObjectId }  = require('mongoose').Types;

/* ───────── helpers ──────────────────────────────────────────── */
const synthId = () => new ObjectId().toString();

const log = (lvl, msg, data = {}) =>
  console.log(
    `[${new Date().toISOString()}] ${lvl.toUpperCase()} ${msg}`,
    Object.keys(data).length ? data : ''
  );

/**
 * Canonicalise a user-name for case-insensitive uniqueness.
 *  – strip accents      → NFKD
 *  – drop spaces        → ''
 *  – keep [a-z0-9_]     → clean
 *  – lower-case         → final key
 */
const canon = (s = '') =>
  s.normalize('NFKD')           // é → e
   .replace(/\s+/g, '')         // remove spaces
   .replace(/[^a-z0-9_]/gi, '') // drop punctuation
   .toLowerCase();

/**
 * Deep clone platforms array preserving all keys,
 * and ensure 'handle' key is explicitly included.
 * Fallback to null if missing.
 */
const clonePlatforms = (platforms = []) => {
  return platforms.map(p => ({
    platform       : p.platform,
    followersCount : p.followersCount,
    _id           : p._id,
    handle        : (typeof p.handle === 'string') ? p.handle : null
  }));
};

/* ───────── main export ──────────────────────────────────────── */
module.exports = async function saveTempUsers (
  items       = [],
  searchQuery = '',
  searchTags  = []
) {
  if (!Array.isArray(items) || items.length === 0) return;

  /* keep AI-generated rows only */
  const aiRows = items.filter(r => r.aiGenerated);
  if (aiRows.length === 0) return;

  /* ------------------------------------------------------------
   * 1)  build a *deduplicated* batch (by canonical key)
   * ---------------------------------------------------------- */
  const batchMap = new Map();           // canonical → doc

  for (const raw of aiRows) {
    delete raw.phone;                 // phones collide with phone_1 index
    /* original userName or synthetic fallback */
    const original = (raw.userName || `user_${synthId().slice(-6)}`).trim();
    const canonical = canon(original);

    /* skip if already queued (prevents dup key in this batch) */
    if (batchMap.has(canonical)) continue;

    /* fix / fetch avatar once */
    const avatarUrl = await resolveAvatar({
      avatarUrl : raw.avatarUrl,
      userName  : original,
      platforms : raw.creatorData?.platforms || []
    });

    /* clone platforms deeply and keep handle */
    const platforms = clonePlatforms(raw.creatorData?.platforms);

        /* ➊ collect every category GPT gave us */
    const gptCats =
      Array.isArray(raw.creatorData?.categories)
        ? raw.creatorData.categories.filter(Boolean)
        : [];

    /* ➋ merge:   query-tags ▸ searchTags ▸ GPT-categories  */
    const mergedSearchTags = Array.from(
      new Set([                // unique, same order
        ...searchTags,
        ...gptCats.map(c => c.trim())
      ])
    );


    batchMap.set(canonical, {
      ...raw,
      userName           : original,      // for display
      userNameCanonical  : canonical,     // for uniqueness
      avatarUrl,
      searchQuery,
      searchTags : mergedSearchTags,
      aiGenerated        : true,
      generatedAt        : new Date(),
      creatorData: {
        ...raw.creatorData,
        platforms
      }
    });
  }

  const docs = Array.from(batchMap.values());
  if (docs.length === 0) return;        // nothing new

  /* ------------------------------------------------------------
   * 2) unordered bulk upsert on the canonical field – ⛏ FIXED
   * ---------------------------------------------------------- */
  const ops = docs.map(d => {
    // ⛔️  strip immutable _id from $set document
    const { _id, ...mutable } = d;
    return {
      updateOne: {
        filter : { userNameCanonical: d.userNameCanonical },
        update : {
          $set         : mutable,
          $setOnInsert : { _id: _id || synthId() }
        },
        upsert   : true,
        collation: { locale: 'en', strength: 2 }
      }
    };
  });
  
  try {
    const res = await TempUser.bulkWrite(ops, { ordered: false });
    log('debug', 'TempUser upsert complete', {
      inserted : res.insertedCount,
      modified : res.modifiedCount,
      matched  : res.matchedCount
    });

    
   /* ---- NEW  ----------------------------------------------------
    * Return the _id that Mongo finally stored for every userName.
    * ----------------------------------------------------------- */
   return TempUser.find(
     { userNameCanonical: { $in: docs.map(d => d.userNameCanonical) } },
     { _id: 1, userName: 1 }
   ).lean();

  } catch (err) {
    /* Duplicate-key ⇒ parallel worker hit the same canonical key.
       Harmless – just log once. */
    const dup = err.code === 11000 ||
                (err.writeErrors && err.writeErrors.every(e => e.code === 11000));

    if (dup) {
      log('debug', 'Duplicate key races suppressed');
      return;
    }

    log('error', 'TempUser bulkWrite failed', { error: err.message });
  }
};
