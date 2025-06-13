const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const User = require('../models/User');
const TempUser = require('../models/TempUser'); // Model for temporary AI-generated users
const bcrypt = require("bcryptjs");
// ✅ correct
const resolveAvatar = require('../utils/avatarResolver');
// top of file
const saveTempUsers = require('../utils/saveTempUsers');





const { OpenAI } = require('openai');
// Add a check to make the controller more robust for testing
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : { chat: { completions: { create: async () => ({ choices: [{ message: { content: '{}' } }] }) } } };

// ────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────

/**
 * Safely convert any value to a valid ObjectId or return null.
 * Prevents CastErrors when an invalid id (e.g. "1") is passed.
 */
const toObjectId = (val) => {
  if (!val) return null;
  try {
    // quick reject non‑hex strings to save cpu
    if (typeof val === 'string' && val.length !== 24) return null;
    return ObjectId.isValid(val) ? new ObjectId(val) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Generate a forward‑only cursor that is guaranteed to be valid and
 * DOES NOT rely on the (now deprecated) multi‑argument ObjectId ctor.
 */
const futureCursor = (secsAhead = 1) =>
  ObjectId.createFromTime(Math.floor(Date.now() / 1000) + secsAhead);



/* === tiny coloured log helper =========================================== */
const clr = {
  grey: s => `\x1b[90m${s}\x1b[0m`,
  blue: s => `\x1b[34m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  warn: s => `\x1b[33m${s}\x1b[0m`,
  err: s => `\x1b[31m${s}\x1b[0m`,
  time: s => `\x1b[36m${s}\x1b[0m`
};
const log = (lvl, msg, data = {}) =>
  console.log(`${clr.grey(`[${new Date().toISOString()}]`)} ${lvl.toUpperCase()} ${msg}`,
    Object.keys(data).length ? data : '');


/* === fall-back categories (if no tags provided) ========================== */
const DEFAULT_CATEGORIES = [
  'Racing', 'Motorsports', 'Speed', 'Track Days', 'Drifting',
  'Car Culture', 'Car Reviews', 'Speed Challenges', 'Automotive',
  'Sports', 'Lifestyle', 'Events', 'Culture', 'Challenges', 'Reviews'
];

/* ------------------------------------------------------------------------ */
/*  NO MORE HARD-CODED CATEGORY MAPS                                        */
/* ------------------------------------------------------------------------ */
/**
 * We now keep exactly what the caller (or the last OpenAI response)
 * provides – **no implicit “related” expansion**.
 *
 * @param {string[]} categories  user-supplied / query-string tags
 * @param {string[]=} aiTags     optional `normalizedTags` returned by OpenAI
 */
    const validateAndExpandCategories = (categories = [], aiTags = []) => {
    const merged = [...categories, ...aiTags]
    .map(t => t && singular(t))       // ← collapse plurals
    .map(t => t && t.trim())          // keep existing trim
    .filter(Boolean);

  if (!merged.length) return DEFAULT_CATEGORIES.slice(0, 5);  // safe fallback

  return Array.from(new Set(merged));   // unique, literal list
};


const areCategoriesRelated = (a = '', b = '') => {
  const clean = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const A = clean(a);
  const B = clean(b);
  return A.includes(B) || B.includes(A);
};

/* == in-memory store for cursor-generated (synthetic) users ============== */
const syntheticUserStore = new Map();   // id → { profile , ts }


// 👇  so other controllers can read it
module.exports.syntheticUserStore = syntheticUserStore;


/* === utility to generate synthetic Mongo _id ============================= */
const synthId = () => new ObjectId().toString();



/* === Detailed logger for OpenAI errors ==================================== */
const logOpenAIError = (error, prompt, context = {}) => {
  // Create a detailed error log entry
  const errorDetails = {
    message: error.message,
    code: error.code,
    type: error.type,
    stack: error.stack?.substring(0, 500),
    statusCode: error.status || error.statusCode,
    promptLength: prompt?.length || 0,
    promptExcerpt: prompt?.substring(0, 200) + '...',
    ...context
  };

  // Log the error with all available details
  log('error', clr.err(`❌ OpenAI API error: ${error.message}`), errorDetails);

  // Also log to a separate file for easier debugging
  console.error(`\n[${new Date().toISOString()}] OPENAI ERROR:`, JSON.stringify(errorDetails, null, 2));
};

/* === Cache for common searches and fallback results ====================== */
/* ────── 100 % CACHE-FREE MODE ──────
   Response-cache & prefetch become inert.   */
const responseCache = new Map();
/* every existing “cleanupCache, clearAllCache, prefetch… etc.” call
   will now be a harmless no-op, so you don’t have to touch the rest
   of the controller. */
const TEMPERATURE = 0.4;      // global – used by every OpenAI call

const CACHE_TTL   = 60 * 60 * 1000;        // 1-hour TTL for cleanup


/**
+ * Return up to `max` names / usernames that already exist in User or TempUser
+ * and are relevant to the current query.  We pass this list to GPT so it
+ * won’t repeat the same creators.
+ *
+ * @param {Object} opts
+ * @param {string} opts.search
+ * @param {string[]} opts.tags
+ * @param {number} [opts.max=60]   hard cap to keep token-cost negligible
+ * @returns {Promise<string[]>}
+ */
const collectExcludes = async ({ search, tags, max = 60 }) => {
  

  /* ---------------- filter -------------- */
  const baseFilter = { status: 'active', userType: 'Creator' };
  const $or = [];

  /* ① literal search-term (searchQuery / searchTags saved earlier) */
  if (search) {
    const rx = mkRegex(search);
    $or.push(
      { name: rx },
      { userName: rx },
      { searchQuery: rx },
      { searchTags: { $in: [search] } }
    );
  }

/* ② topic match – fuzzy (“Martial Art” ≈ “Martial Arts”) */
  const expandedTags = validateAndExpandCategories(tags);

  expandedTags.forEach(t => {
    const rx = new RegExp(`\\b${t}s?\\b`, 'i');    // optional trailing “s”
    $or.push(
      { 'creatorData.categories': rx },
      { tags: rx },
      { 'creatorData.nicheTopics': rx },
      { searchTags: rx }
    );
  });

  if ($or.length) baseFilter.$or = $or;

  const proj = { _id: 0, name: 1, userName: 1 };
  const [users, temps] = await Promise.all([
    User.find(baseFilter,  proj).limit(max).lean(),
    TempUser.find(baseFilter, proj).limit(max).lean()
  ]);

  const out = new Set();
  [...users, ...temps].forEach(u => {
    if (u.name)                 out.add(u.name);
    if (u.userName)             out.add(u.userName.replace(/^@/, ''));
  });
  return Array.from(out).slice(0, max);
};


/** collapse plurals so “Martial Arts” → “Martial Art”, “Sports” → “Sport” */
function singular (s = '') {
  return s
    .replace(/\barts\b/ig  , 'art')
    .replace(/\bsports\b/ig, 'sport')
    .trim();
}

const buildPrompt = ({ term, cats, limit, excludes = [] }) => {
  
  //NEW: let the caller decide – only cap at 24 to stay token-friendly
  const SAFE_MAX = 6;
  const max      = Math.min(limit, SAFE_MAX);
  const domain  = cats.length ? cats.join(", ") : "creators";
  const request = term
    ? `Return ${max} real, *currently active* social-media creators strongly associated with “${term}”.`
    : `Return ${max} real, *currently active* social-media creators whose content fits **any** of these categories: ${domain}.`;

    const excludeLine =
    excludes.length
      ? `\nDo NOT return any creator whose name **or** userName matches one of these (case-insensitive): ${excludes.join(', ')}.`
      : '';


  return `
You are an API. Output **one single JSON object** – absolutely no markdown fences, no comments.

 Format **exactly**:

 {
   "items": [
     {
       "_id": "",
       "name": "",
       "userName": "",
       "email": "",
       "phone": "",
       "avatarUrl": "",               // Active Person avatar URL shouldn't throw 404
      "bio": "",                     // 200-300 characters, English only
       "tags": [],
       "creatorData": {
         "handleName": "",
         "categories": [],
         "platforms": [
          { "platform": "", "handle": "", "followersCount": 0 }
         ],
        "totalFollowers": 0,
        "achievements": "",          // 1-2 lines, plaintext
        "businessVentures": ""       // 1-2 lines, plaintext
       }
     }
   ],
   "normalizedTags": []
 }

${request}${excludeLine}

STRICT RULES
------------
1. “platforms” must include *every* major network the creator uses
   (Instagram, X/Twitter, TikTok, YouTube, Facebook …) having followers less than 1M for example, 999K no more than that otherwise skip that influencers.
2. “followersCount” must match the public number on the profile **today**.
   • Use *millions* with one-decimal precision, e.g. 653.2 M → 653200000  
   • If the network hides decimals, round to the nearest thousand.   
3. “totalFollowers” **must equal** the sum of all followersCount numbers.
4. “bio” length 200–300 characters; no hashtags, no links, no emojis.
5.  Add one concise sentence each for “achievements” and “businessVentures”.
6.  No fabricated data – if something is unknown, omit the field.
7.  Return **exactly ${max}** items.`;
};


/* === strip markdown fences & parse JSON ================================== */
const parseAI = raw => {
  try {
    // Log the raw response for debugging
    log('debug', 'Raw OpenAI response received', {
      responseLength: raw?.length || 0,
      firstChars: raw?.substring(0, 100)
    });

    // First, attempt to clean up any obvious JSON issues
    raw = raw.trim()
      // Remove markdown code fences
      .replace(/^\s*```json?[\s\n]*/i, '')
      .replace(/^\s*```/, '')
      .replace(/```$/, '')
      // Strip any line with a comment
      //.replace(/\/\/.*$/gm, '')
      // Remove any special quotes if they exist
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    // Another cleaning pass for common issues
    let cleaned = "";
    let inString = false;
    let escapeNext = false;

    // Character by character processing to handle JSON edge cases
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];

      // Handle string boundaries and escaped characters
      if (char === '"' && !escapeNext) {
        inString = !inString;
        cleaned += char;
      } else if (char === '\\') {
        escapeNext = true;
        cleaned += char;
      } else if (inString || (char !== '/' && char !== '\r')) {
        // Only add the character if we're in a string or it's not a comment start
        if (escapeNext) {
          escapeNext = false;
        }
        cleaned += char;
      }
    }

    log('debug', 'Cleaned JSON before parsing', {
      cleanedLength: cleaned.length,
      originalLength: raw.length
    });

    // Attempt to parse the cleaned JSON
    const parsed = JSON.parse(cleaned || '{}');

    // Log the parsed structure
    log('debug', 'Parsed OpenAI response', {
      itemCount: parsed.items?.length || 0,
      hasNormalizedTags: !!parsed.normalizedTags
    });

    return parsed;
  } catch (e) {
    // If parsing fails, try a more aggressive approach
    try {
      log('warn', 'First parsing attempt failed, trying more aggressive cleaning', { error: e.message });

      // Find everything between the first { and the last }
      const match = raw.match(/\{(.|\n)*\}/);
      if (match) {
        const jsonCandidate = match[0];
        log('debug', 'Extracted JSON candidate', { length: jsonCandidate.length });

        // Try to parse the extracted JSON
        const parsed = JSON.parse(jsonCandidate);

        log('debug', 'Successfully parsed with aggressive cleaning', {
          itemCount: parsed.items?.length || 0,
          hasNormalizedTags: !!parsed.normalizedTags
        });

        return parsed;
      }
    } catch (e2) {
      log('warn', 'Aggressive cleaning also failed', { error: e2.message });
    }

    // If all parsing attempts failed, log the error and return empty object
    log('warn', clr.warn('⚠️  Could not parse AI JSON'), {
      error: e.message,
      raw: raw?.substring(0, 500)
    });
    return {};
  }
};

/* === build a safe case-insensitive RegExp for Mongo ======================= */
const mkRegex = str =>
  new RegExp(str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');


// ────────────────────────────────────────────────────────────────
// Helper – build & send the DB payload (also used by AI-timeout)
// ────────────────────────────────────────────────────────────────
const sendDbPayload = async ({ searchRaw, tagList, limit, cursor, res, t0 }) => {
  const expandedTags = validateAndExpandCategories(tagList);

  /* --- build Mongo filter (EXACT copy of the old DB branch) ---- */
  const baseFilter = {
    status: 'active',
    userType: 'Creator',
    ...(cursor && { _id: { $gt: cursor } })
  };
  if (searchRaw) baseFilter.$text = { $search: searchRaw };
  if (tagList.length) {
    baseFilter.$or = [
      { 'creatorData.categories': { $in: expandedTags } },
      { 'creatorData.nicheTopics': { $in: expandedTags } },
      { tags: { $in: expandedTags } },
      { searchTags: { $in: expandedTags } },
      ...tagList.map(tag => ({
        $or: [
          { bio: { $regex: tag, $options: 'i' } },
          { 'creatorData.handleName': { $regex: tag, $options: 'i' } }
        ]
      }))
    ];
  }

  /* ---------- fetch TempUser & User, merge, sort --------------- */
  const tagOr = baseFilter.$or || null;
  if (tagOr) delete baseFilter.$or;

  const tempFilter = {
    ...baseFilter,
    $and: [
      ...(tagOr ? [{ $or: tagOr }] : []),
      { $or: [ { userType: 'Creator' }, { userType: { $exists: false } } ] }
    ]
  };
  const realFilter = { ...baseFilter, ...(tagOr ? { $or: tagOr } : {}) };

  const [temp, real] = await Promise.all([
    TempUser.find(tempFilter).sort({ _id: 1 }).limit(limit * 2).lean(),
    User.find(realFilter ).sort({ _id: 1 }).limit(limit * 2).lean()
  ]);

  const seen = new Map();
  [...temp, ...real].forEach(u => {
    const k = (u.userName || '').toLowerCase();
    if (k && !seen.has(k)) seen.set(k, u);
  });

  let creators = [...seen.values()];
  creators.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

  if (tagList.length || searchRaw) {
    const isExact = c => {
      const cats = [
        ...(c.creatorData?.categories || []),
        ...(c.tags || []),
        ...(c.creatorData?.nicheTopics || [])
      ];
      return cats.some(cat => expandedTags.includes(cat));
    };
    creators = [...creators.filter(isExact), ...creators.filter(c => !isExact(c))];
  }

  const more  = creators.length > limit;
  const items = creators.slice(0, limit);
  const next  = more ? items[items.length - 1]._id : null;

  res.json({
    items,
    normalizedTags: expandedTags,
    relatedTags: { mainCategories: expandedTags, subCategories: [], allRelatedTags: expandedTags, currentTags: tagList },
    nextCursor: next,
    totalItems: 1000,
    hasMore: more,
    endNote: more ? undefined : 'No more influencers found',
    uniquePerCursor: true,
    source: 'db',
    stats: { db: creators.length, ai: 0, dummy: 0 }
  });
  log('info', clr.green('✅ DB payload sent'), { ms: Date.now() - t0, returned: items.length });
};



/* ==========================================================================
   GET /api/find  – two-phase search
   ======================================================================== */
exports.searchCreators = async (req, res) => {
  const buildSearchKey = (q, tags) => `${(q || '').toLowerCase()}::${[...tags].sort().join(',').toLowerCase()}`;
  const sliceByCursor = (list, curId) => {
    if (!curId) return [0, list.slice(0)];
    const idx = list.findIndex(u => u._id.toString() === curId.toString());
    return idx === -1 ? [0, list.slice(0)] : [idx + 1, list.slice(idx + 1)];
  };

  /* ───────── 1) parse & normalise params ─────────────────────────── */
  const t0    = Date.now();
  const limit = Math.min(Math.max(parseInt(req.query.limit || '6', 10), 1), 50);

  /* ➊ read search term & tags FIRST -------------------------------- */
  const searchRaw = decodeURIComponent((req.query.search || '').trim());
  const fixCase = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const canon   = s => s.replace(/\b(one|1st)\b/i, '1').replace(/\b(two|2nd)\b/i, '2');
 

  const tagList = (req.query.tags || '')
  .split(',')
  .map(t => singular(fixCase(canon(t.trim()))))  // ← include plural-collapse here
  .filter(Boolean);

  /* ➋ decide AI branch */
  const aiRequested = String(req.query.ai || '0') === '1';
  const aiMode      = aiRequested && (searchRaw.length > 0 || tagList.length > 0);

  const cursor = toObjectId(req.query.cursor);
  if (!global.__aiBatchCache) global.__aiBatchCache = new Map();
  const aiBatchCache = global.__aiBatchCache;
  if (!global.__aiBatchInflight) global.__aiBatchInflight = new Map();
  const inflight = global.__aiBatchInflight;

  log('info', aiMode ? '🤖 AI-only request' : '📦 DB-only request', { search: searchRaw, tags: tagList, limit, cursor: cursor?.toString() || null });

  /* ───────── 2A) DB-ONLY branch ────────────── */
  if (!aiMode) {
    const expandedTags = validateAndExpandCategories(tagList);
    const baseFilter = { status: 'active', userType: 'Creator', ...(cursor && { _id: { $gt: cursor } }) };
    if (searchRaw) baseFilter.$text = { $search: searchRaw };
    if (tagList.length) {
      baseFilter.$or = [
        { 'creatorData.categories': { $in: expandedTags } },
        { 'creatorData.nicheTopics': { $in: expandedTags } },
        { tags: { $in: expandedTags } },
        { searchTags: { $in: expandedTags } },
        ...tagList.map(tag => ({ $or: [ { bio: { $regex: tag, $options: 'i' } }, { 'creatorData.handleName': { $regex: tag, $options: 'i' } } ] }))
      ];
    }
    const tagOr  = baseFilter.$or || null;
    if (tagOr) delete baseFilter.$or;
    const tempFilter = { ...baseFilter, $and: [ ...(tagOr ? [{ $or: tagOr }] : []), { $or: [ { userType: 'Creator' }, { userType: { $exists: false } } ] } ] };
    const realFilter = { ...baseFilter, ...(tagOr ? { $or: tagOr } : {}) };
    const [temp, real] = await Promise.all([
      TempUser.find(tempFilter).sort({ _id: 1 }).limit(limit * 2).lean(),
      User.find(realFilter ).sort({ _id: 1 }).limit(limit * 2).lean()
    ]);
    const seen = new Map();
    [...temp, ...real].forEach(u => {
      const k = (u.userName || '').toLowerCase();
      if (k && !seen.has(k)) seen.set(k, u);
    });
    let creators = [...seen.values()];
    creators.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
    if (tagList.length || searchRaw) {
      const isExact = c => {
        const cats = [ ...(c.creatorData?.categories || []), ...(c.tags || []), ...(c.creatorData?.nicheTopics || []) ];
        return cats.some(cat => expandedTags.includes(cat));
      };
      creators = [...creators.filter(isExact), ...creators.filter(c => !isExact(c))];
    }
    const more   = creators.length > limit;
    const items  = creators.slice(0, limit);
    const next   = more ? items[items.length - 1]._id : null;
    res.json({ items, normalizedTags: expandedTags, relatedTags: { mainCategories: expandedTags, subCategories: [], allRelatedTags: expandedTags, currentTags: tagList }, nextCursor: next, totalItems: 1000, hasMore : more, endNote : more ? undefined : 'No more influencers found', uniquePerCursor: true, source: 'db', stats: { db: creators.length, ai: 0, dummy: 0 } });
    log('info', clr.green('✅ DB payload sent'), { ms: Date.now() - t0, returned: items.length });
    return;
  }

  /* ───────── 2B) AI-ONLY branch ──────────── */
  try {
    const key            = buildSearchKey(searchRaw, tagList);
    let   cachedCreators = aiBatchCache.get(key) || [];
    let   totalItems     = 1000;

    /* SINGLE-FLIGHT */
    if (!cachedCreators.length) {
      if (inflight.has(key)) {
        await inflight.get(key);
        cachedCreators = aiBatchCache.get(key) || [];
      } else {
        const p = (async () => {
          try {
            const OPENAI_TIMEOUT = 45_000;
            const batchSize = Math.min(limit * 2, 12);
            const excludes = await collectExcludes({ search: searchRaw, tags: tagList, max: 300 });
            const prompt = buildPrompt({ term: searchRaw || null, cats: validateAndExpandCategories(tagList), limit: batchSize, excludes });
            log('debug', 'Full GPT prompt', { prompt });
            let chat;
            try {
              chat = await openai.chat.completions.create({
                model           : 'gpt-4o-mini',
                temperature     : TEMPERATURE,
                max_tokens      : 4000,
                response_format : { type: 'json_object' },
                messages: [ { role: 'system', content: 'Return ONLY valid JSON of real social-media creators.' }, { role: 'user', content: prompt } ]
              }, { timeout: OPENAI_TIMEOUT });
            } catch (err) {
            if (
              err.name === 'TimeoutError' ||               // SDK-level
              /timed out/i.test(err.message || '') ||      // network-level
              err.code === 'ETIMEDOUT'
            ) {
                log('warn', '⏰ OpenAI 58s timeout – using DB fallback');
                await sendDbPayload({ searchRaw, tagList, limit, cursor, res, t0 });
                return;
              }
              throw err;
            }
            let parsed = parseAI(chat.choices[0].message.content);
            let rawItems = Array.isArray(parsed.items) ? parsed.items : [];
            if (rawItems.length === 0) {
              log('warn', '⚠️  parse failed – retrying with 6 items');
              const retryPrompt = buildPrompt({ term: searchRaw || null, cats: validateAndExpandCategories(tagList), limit: 6, excludes });
              const retryChat = await openai.chat.completions.create({
                model           : 'gpt-4o-mini',
                temperature     : TEMPERATURE,
                max_tokens      : 4000,
                response_format : { type: 'json_object' },
                messages: [ { role: 'system', content: 'Return ONLY valid JSON of real social-media creators.' }, { role: 'user', content: retryPrompt } ]
              }, { timeout: OPENAI_TIMEOUT });
              parsed   = parseAI(retryChat.choices[0].message.content);
              rawItems = Array.isArray(parsed.items) ? parsed.items : [];
            }
            const enriched = await Promise.all(rawItems.map(async c => ({ ...c, _id: synthId(), avatarUrl: await resolveAvatar({ avatarUrl: c.avatarUrl, userName : c.userName, platforms: c.creatorData?.platforms || [] }), userType: 'Creator', isActive: true, aiGenerated: true })));
             const synonymisedTags = tagList.map(t =>
                t.toLowerCase() === 'mma' ? 'mixed martial arts' : t);
              const good = enriched.filter(u => isValidAIInfluencer(u, synonymisedTags));
              log('debug', `GPT gave ${rawItems.length}, valid=${good.length}`);

            const uniq = new Map();
            good.forEach(u => { const k = (u.userName || '').toLowerCase(); if (!uniq.has(k)) uniq.set(k, u); });
            const finalCreators = [...uniq.values()];
            aiBatchCache.set(key, finalCreators);
            const saved = await saveTempUsers(
            finalCreators,
            searchRaw,
            validateAndExpandCategories(tagList)          // ← canonical list
          ) || [];
            // map userName → _id that Mongo actually stored
            const idMap = new Map(saved.map(u => [u.userName.toLowerCase(), u._id.toString()]));

            // swap any stale IDs so frontend gets the real one
            finalCreators.forEach(c => {
              const real = idMap.get(c.userName.toLowerCase());
              if (real) c._id = real;
                // keep the live profile cache in sync
          // (wrap in {profile: …} so the user-controller can read it)
          syntheticUserStore.set(c._id.toString(), { profile: c });
            });

            return finalCreators;
          } finally {
            inflight.delete(key);
          }
        })();
        inflight.set(key, p);
        cachedCreators = await p;
      }
    }

    /* paginate cached */
    const [, tail]   = sliceByCursor(cachedCreators, cursor);
    const pageItems  = tail.slice(0, limit);
    let   more       = tail.length > limit;
    let   nextCursorAI = more ? pageItems[pageItems.length - 1]._id : null;
    if (!more && cachedCreators.length < limit * 2) {
      more          = true;
      nextCursorAI  = futureCursor();
      aiBatchCache.delete(key);
      totalItems   = cachedCreators.length + limit;
    }
    log('info', clr.green('✅ AI payload sent'), { ms: Date.now() - t0, returned: pageItems.length });
    const payload = { items: pageItems, normalizedTags: validateAndExpandCategories(tagList), relatedTags: { mainCategories: tagList, subCategories: [], allRelatedTags: tagList, currentTags: tagList }, nextCursor: nextCursorAI, totalItems, hasMore: more, endNote: more ? undefined : 'No more influencers found', uniquePerCursor: true, source: 'ai', stats: { db: 0, ai: cachedCreators.length, dummy: 0 } };
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.write(JSON.stringify(payload));
    return res.end();
  } catch (err) {
    logOpenAIError(err, 'ai-branch', { search: searchRaw, tags: tagList });
    if (!res.headersSent) res.status(500).json({ message: 'AI fetch failed', err: err.message });
  }
};







/* ==========================================================================
   POST /api/find/refresh – disabled (no DB writes)
   ======================================================================== */
exports.manualRefresh = (_req, res) => {
  res.status(501).json({ message: 'Disabled – no-DB variant' });
};






/* ==========================================================================
   Move temp user to permanent User collection when they receive an offer
   ======================================================================== */
exports.moveTempUserToPermanent = async (userName) => {
  try {
    // Find the temp user
    const tempUser = await TempUser.findOne({ userName }).lean();
    if (!tempUser) {
      return { success: false, message: 'Temp user not found' };
    }

    // Prepare for User collection
    const { _id, searchQuery, searchTags, aiGenerated, generatedAt, expiresAt, ...userData } = tempUser;

    // Add required fields for User collection
    const user = {
      ...userData,
      userType: 'Creator',
      status: 'active',
      password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
      onboardingComplete: false
    };

    // Create new User
    const newUser = new User(user);
    await newUser.save();

    // Delete from temp collection
    await TempUser.deleteOne({ userName });

    return { success: true, userId: newUser._id };
  } catch (error) {
    log('error', 'Failed to move temp user to permanent', { error });
    return { success: false, message: error.message };
  }
};

/* ==========================================================================
   Cleanup function for cache maintenance - run via cron
   ======================================================================== */
exports.cleanupCache = () => {
  const now = Date.now();
  let expiredCount = 0;

  responseCache.forEach((value, key) => {
    if (value.timestamp + CACHE_TTL < now) {
      responseCache.delete(key);
      expiredCount++;
    }
  });

  log('info', `Cache cleanup: removed ${expiredCount} expired entries`);
  return expiredCount;
};

/* ==========================================================================
   Clear all cache entries - use when starting server
   ======================================================================== */
exports.clearAllCache = () => {
  const count = responseCache.size;
  responseCache.clear();
  log('info', `🧹 Cache completely cleared, removed ${count} entries`);
  return count;
};


// Add a helper to validate AI/synthetic influencer authenticity and relevance
const isValidAIInfluencer = (user, searchTags) => {
  // Must have a realistic name (at least two words, not generic)
  if (!user.name || user.name.split(' ').length < 2) return false;
    // Avatar will be normalised later; accept empty for now
  // (resolveAvatar() fills a default png)
  if (!user.avatarUrl) user.avatarUrl = '';

  // need **at least ONE** platform/handle
  if (!(user.creatorData?.platforms || []).some(p => p.handle && p.platform))
    return false;

  // need at least 10 k followers
  if ( (user.creatorData?.totalFollowers||0) < 1e4 ) return false;
  // Must have at least one social platform with a handle
  if (!user.creatorData?.platforms || !user.creatorData.platforms.some(p => p.handle && p.platform)) return false;
  // Must have a category/tag that matches the search
  // category must be **related** (uses the new fuzzy helper)
  const expandedSearch = validateAndExpandCategories(searchTags);
  const catHit = (user.creatorData?.categories || [])
    .concat(user.tags || [])
    .concat(user.creatorData?.nicheTopics || [])
    .some(cat => expandedSearch.some(t => areCategoriesRelated(cat, t)));
  // if GPT didn't supply categories _or_ tags, don't fail hard
  if (expandedSearch.length && (user.creatorData?.categories?.length ||
                                user.tags?.length ||
                                user.creatorData?.nicheTopics?.length)) {
    if (!catHit) return false;
  }
  return true;
};

/* === quick “good-enough” topic match  =============================== */
const isRoughlyRelevant = (user, searchTags) => {
  const cats = [
    ...(user.creatorData?.categories || []),
    ...(user.tags || [])
  ].map(c => c.toLowerCase());

  const search = validateAndExpandCategories(searchTags)
                   .map(c => c.toLowerCase());

  // do any of the creator’s cats appear in the expanded search set?
  return cats.some(c => search.includes(c));
};
