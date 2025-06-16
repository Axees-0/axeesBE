const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require("bcryptjs");
const resolveAvatar = require('../utils/avatarResolver');
const saveTempUsers = require('../utils/saveTempUsers');
const { OpenAI } = require('openai');

// Initialize OpenAI client with fallback for testing
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
const collectExcludes = async ({ search, tags, max = 60, name = '', location = '' }) => {
  

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

const buildPrompt = ({ term, cats, limit, excludes = [], name = '', location = '', keywords = '', hashtags = '', contentTypes = [], platforms = [], ageRange = '', gender = '', audienceLocation = '', ethnicity = '' }) => {
  
  //NEW: let the caller decide – only cap at 24 to stay token-friendly
  const SAFE_MAX = 6;
  const max      = Math.min(limit, SAFE_MAX);
  const domain  = cats.length ? cats.join(", ") : "creators";
  const request = term
    ? `Return ${max} real, *currently active* MICRO-INFLUENCERS (under 1M followers per platform) strongly associated with “${term}”.`
    : `Return ${max} real, *currently active* MICRO-INFLUENCERS (under 1M followers per platform) whose content fits **any** of these categories: ${domain}.`;

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
      "bio": "",                     // 200-300 characters, English only, include authentic engagement focus
       "location": "",                // City, State/Country
       "city": "",                    // Primary city location
       "keywords": [],                // Content keywords
       "hashtags": [],                // Popular hashtags used
       "tags": [],
       "creatorData": {
         "handleName": "",
         "categories": [],
         "platforms": [
          { "platform": "", "handle": "", "followersCount": 0 }
         ],
        "totalFollowers": 0,
        "engagementRate": 0,         // Estimated engagement rate (1-10%)
        "authenticityScore": 0,      // Score 1-10 for authentic following
        "location": "",              // Creator's primary location
        "city": "",                  // Creator's primary city
        "keywords": [],              // Content keywords and topics
        "hashtags": [],              // Popular hashtags used
        "contentTypes": [],          // Types: reels, carousels, videos, stories
        "audienceDemographics": {    // Audience demographic breakdown
          "ageRange": "",            // Primary age range (e.g., "18-24", "25-34")
          "gender": "",              // Primary gender (e.g., "Female", "Male", "Mixed")
          "location": "",            // Primary audience location
          "ethnicity": ""            // Primary ethnicity/culture
        },
        "influencerTier": "",        // nano, micro, mid-tier based on followers
        "growthTrend": "",           // growing, stable, declining
        "audienceQuality": "",       // high, medium, low
        "lastActiveDate": "",        // Recent activity date
        "sponsoredContentPercentage": 0, // % of sponsored posts (0-100)
        "fraudScore": 0,             // Fraud risk score (1-10, lower is better)
        "suspiciousGrowthFlag": false, // Flag for suspicious growth patterns
        "achievements": "",          // 1-2 lines, plaintext
        "businessVentures": ""       // 1-2 lines, plaintext
       }
     }
   ],
   "normalizedTags": []
 }

${request}${excludeLine}${name ? `\nFocus on creators with names similar to "${name}".` : ''}${location ? `\nFocus on creators based in or near "${location}".` : ''}${keywords ? `\nInclude creators who use keywords: "${keywords}".` : ''}${hashtags ? `\nInclude creators who use hashtags: "${hashtags}".` : ''}${contentTypes.length ? `\nFocus on creators who produce: ${contentTypes.join(', ')}.` : ''}${platforms.length ? `\nOnly include creators active on: ${platforms.join(', ')}.` : ''}${ageRange ? `\nFocus on creators whose audience is primarily ${ageRange} years old.` : ''}${gender ? `\nFocus on creators whose audience is primarily ${gender}.` : ''}${audienceLocation ? `\nFocus on creators whose audience is primarily from ${audienceLocation}.` : ''}${ethnicity ? `\nFocus on creators whose audience is primarily ${ethnicity}.` : ''}

STRICT RULES
------------
1. “platforms” must include *every* major network the creator uses
   (Instagram, X/Twitter, TikTok, YouTube, Facebook …) **IMPORTANT**: Each platform MUST have followers LESS THAN 1M (1,000,000).
   - Maximum allowed: 999,999 followers per platform
   - If ANY platform has 1M+ followers, DO NOT include that influencer
   - Focus on micro-influencers (10K-100K) and mid-tier influencers (100K-999K)
2. “followersCount” must match the public number on the profile **today**.
   • Use exact numbers, e.g. 653200 for 653.2K followers
   • NEVER exceed 999999 for any single platform   
3. “totalFollowers” **must equal** the sum of all followersCount numbers.
4. “bio” length 200–300 characters; no hashtags, no links, no emojis.
5.  Add one concise sentence each for “achievements” and “businessVentures”.
6.  No fabricated data – if something is unknown, omit the field.
7.  Return **exactly ${max}** items.
8.  PRIORITIZE authentic micro-influencers with high engagement rates over follower count.
9.  For each creator, add realistic "engagementRate" (1-10%) and "authenticityScore" (1-10) in creatorData.
10. Include relevant "keywords" array (3-5 content keywords) and "hashtags" array (popular hashtags without #).
11. Add "contentTypes" array from: reels, carousels, videos, stories, posts, live-streams.
12. Include "audienceDemographics" with ageRange (18-24, 25-34, 35-44, etc), gender, location, ethnicity.`;
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
const sendDbPayload = async ({ searchRaw, tagList, limit, cursor, res, t0, nameSearch = '', locationSearch = '', citySearch = '', keywords = '', hashtags = '', contentTypes = [], platforms = [], ageRange = '', gender = '', audienceLocation = '', ethnicity = '' }) => {
  const expandedTags = validateAndExpandCategories(tagList);

  /* --- build enhanced Mongo filter with name and location support ---- */
  const baseFilter = {
    status: 'active',
    userType: 'Creator',
    ...(cursor && { _id: { $gt: cursor } })
  };
  
  // Build complex $or conditions
  const orConditions = [];
  
  // Text search
  if (searchRaw) baseFilter.$text = { $search: searchRaw };
  
  // Name search
  if (nameSearch) {
    const nameRegex = new RegExp(nameSearch, 'i');
    orConditions.push(
      { name: nameRegex },
      { userName: nameRegex },
      { 'creatorData.handleName': nameRegex }
    );
  }
  
  // Location/City search
  if (locationSearch || citySearch) {
    const locationRegex = new RegExp(locationSearch || citySearch, 'i');
    orConditions.push(
      { location: locationRegex },
      { city: locationRegex },
      { 'creatorData.location': locationRegex },
      { 'creatorData.city': locationRegex }
    );
  }
  
  // Tag-based search
  if (tagList.length) {
    orConditions.push(
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
    );
  }
  
  // Keyword search
  if (keywords) {
    const keywordRegex = new RegExp(keywords, 'i');
    orConditions.push(
      { bio: keywordRegex },
      { 'creatorData.keywords': keywordRegex },
      { 'creatorData.description': keywordRegex }
    );
  }
  
  // Hashtag search
  if (hashtags) {
    const hashtagArray = hashtags.split(',').map(h => h.trim().replace(/^#/, ''));
    orConditions.push(
      { 'creatorData.hashtags': { $in: hashtagArray } },
      { hashtags: { $in: hashtagArray } }
    );
  }
  
  // Platform filter
  if (platforms.length) {
    orConditions.push(
      { 'creatorData.platforms.platform': { $in: platforms } }
    );
  }
  
  // Content type filter
  if (contentTypes.length) {
    orConditions.push(
      { 'creatorData.contentTypes': { $in: contentTypes } },
      { contentTypes: { $in: contentTypes } }
    );
  }
  
  // Audience Demographics Filters
  if (ageRange) {
    orConditions.push(
      { 'creatorData.audienceDemographics.ageRange': new RegExp(ageRange, 'i') },
      { 'audienceDemographics.ageRange': new RegExp(ageRange, 'i') }
    );
  }
  
  if (gender) {
    orConditions.push(
      { 'creatorData.audienceDemographics.gender': new RegExp(gender, 'i') },
      { 'audienceDemographics.gender': new RegExp(gender, 'i') }
    );
  }
  
  if (audienceLocation) {
    const audienceLocationRegex = new RegExp(audienceLocation, 'i');
    orConditions.push(
      { 'creatorData.audienceDemographics.location': audienceLocationRegex },
      { 'audienceDemographics.location': audienceLocationRegex }
    );
  }
  
  if (ethnicity) {
    orConditions.push(
      { 'creatorData.audienceDemographics.ethnicity': new RegExp(ethnicity, 'i') },
      { 'audienceDemographics.ethnicity': new RegExp(ethnicity, 'i') }
    );
  }
  
  if (orConditions.length > 0) {
    baseFilter.$or = orConditions;
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
  const nameSearch = decodeURIComponent((req.query.name || '').trim());
  const locationSearch = decodeURIComponent((req.query.location || '').trim());
  const citySearch = decodeURIComponent((req.query.city || '').trim());
  
  // Platform & Content Filters
  const keywords = decodeURIComponent((req.query.keywords || '').trim());
  const hashtags = decodeURIComponent((req.query.hashtags || '').trim());
  const contentTypes = (req.query.contentTypes || '').split(',').filter(Boolean);
  const platforms = (req.query.platforms || '').split(',').filter(Boolean);
  
  // Audience Demographics Filters
  const ageRange = decodeURIComponent((req.query.ageRange || '').trim());
  const gender = decodeURIComponent((req.query.gender || '').trim());
  const audienceLocation = decodeURIComponent((req.query.audienceLocation || '').trim());
  const ethnicity = decodeURIComponent((req.query.ethnicity || '').trim());
  
  // Influencer Size & Growth Filters
  const followerMin = parseInt(req.query.followerMin || '0', 10);
  const followerMax = parseInt(req.query.followerMax || '999999', 10);
  const influencerTier = decodeURIComponent((req.query.influencerTier || '').trim()); // nano, micro, mid-tier
  const growthTrend = decodeURIComponent((req.query.growthTrend || '').trim()); // growing, stable, declining
  
  // Engagement & Quality Metrics
  const engagementMin = parseFloat(req.query.engagementMin || '0');
  const engagementMax = parseFloat(req.query.engagementMax || '10');
  const authenticityMin = parseInt(req.query.authenticityMin || '1', 10);
  const audienceQuality = decodeURIComponent((req.query.audienceQuality || '').trim()); // high, medium, low
  
  // Activity & Content Behavior
  const recentActivity = req.query.recentActivity === 'true'; // active in last 30 days
  const sponsoredContentMax = parseFloat(req.query.sponsoredContentMax || '100'); // max % of sponsored posts
  
  // Fraud & Authenticity Detection
  const fraudDetection = req.query.fraudDetection === 'true'; // enable fraud filtering
  const suspiciousGrowth = req.query.suspiciousGrowth === 'false'; // exclude suspicious growth patterns
  
  // Competitive Insights
  const competitorAnalysis = req.query.competitorAnalysis === 'true'; // enable competitor insights
  const audienceOverlap = req.query.audienceOverlap === 'true'; // analyze audience overlap
  const competitorIds = (req.query.competitorIds || '').split(',').filter(Boolean); // competitor IDs for comparison
  
  const fixCase = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const canon   = s => s.replace(/\b(one|1st)\b/i, '1').replace(/\b(two|2nd)\b/i, '2');
 

  const tagList = (req.query.tags || '')
  .split(',')
  .map(t => singular(fixCase(canon(t.trim()))))  // ← include plural-collapse here
  .filter(Boolean);

  /* ➋ decide AI branch */
  const aiRequested = String(req.query.ai || '0') === '1';
  const aiMode      = aiRequested && (
    searchRaw.length > 0 || 
    tagList.length > 0 || 
    nameSearch.length > 0 || 
    locationSearch.length > 0 || 
    citySearch.length > 0 ||
    keywords.length > 0 ||
    hashtags.length > 0 ||
    contentTypes.length > 0 ||
    platforms.length > 0 ||
    ageRange.length > 0 ||
    gender.length > 0 ||
    audienceLocation.length > 0 ||
    ethnicity.length > 0 ||
    followerMin > 0 || followerMax < 999999 ||
    influencerTier.length > 0 ||
    growthTrend.length > 0 ||
    engagementMin > 0 || engagementMax < 10 ||
    authenticityMin > 1 ||
    audienceQuality.length > 0 ||
    recentActivity ||
    sponsoredContentMax < 100 ||
    fraudDetection ||
    !suspiciousGrowth
  );

  const cursor = toObjectId(req.query.cursor);
  if (!global.__aiBatchCache) global.__aiBatchCache = new Map();
  const aiBatchCache = global.__aiBatchCache;
  if (!global.__aiBatchInflight) global.__aiBatchInflight = new Map();
  const inflight = global.__aiBatchInflight;

  log('info', aiMode ? '🤖 AI-only request' : '📦 DB-only request', { 
    search: searchRaw, 
    name: nameSearch,
    location: locationSearch,
    city: citySearch,
    keywords,
    hashtags,
    contentTypes,
    platforms,
    ageRange,
    gender,
    audienceLocation,
    ethnicity,
    tags: tagList, 
    limit, 
    cursor: cursor?.toString() || null 
  });

  /* ───────── 2A) DB-ONLY branch ────────────── */
  if (!aiMode) {
    const expandedTags = validateAndExpandCategories(tagList);
    const baseFilter = { status: 'active', userType: 'Creator', ...(cursor && { _id: { $gt: cursor } }) };
    
    // Build complex $or conditions
    const orConditions = [];
    
    // Text search
    if (searchRaw) baseFilter.$text = { $search: searchRaw };
    
    // Name search
    if (nameSearch) {
      const nameRegex = new RegExp(nameSearch, 'i');
      orConditions.push(
        { name: nameRegex },
        { userName: nameRegex },
        { 'creatorData.handleName': nameRegex }
      );
    }
    
    // Location/City search
    if (locationSearch || citySearch) {
      const locationRegex = new RegExp(locationSearch || citySearch, 'i');
      orConditions.push(
        { location: locationRegex },
        { city: locationRegex },
        { 'creatorData.location': locationRegex },
        { 'creatorData.city': locationRegex }
      );
    }
    
    // Tag-based search
    if (tagList.length) {
      orConditions.push(
        { 'creatorData.categories': { $in: expandedTags } },
        { 'creatorData.nicheTopics': { $in: expandedTags } },
        { tags: { $in: expandedTags } },
        { searchTags: { $in: expandedTags } },
        ...tagList.map(tag => ({ $or: [ { bio: { $regex: tag, $options: 'i' } }, { 'creatorData.handleName': { $regex: tag, $options: 'i' } } ] }))
      );
    }
    
    // Keyword search
    if (keywords) {
      const keywordRegex = new RegExp(keywords, 'i');
      orConditions.push(
        { bio: keywordRegex },
        { 'creatorData.keywords': keywordRegex },
        { 'creatorData.description': keywordRegex }
      );
    }
    
    // Hashtag search
    if (hashtags) {
      const hashtagArray = hashtags.split(',').map(h => h.trim().replace(/^#/, ''));
      orConditions.push(
        { 'creatorData.hashtags': { $in: hashtagArray } },
        { hashtags: { $in: hashtagArray } }
      );
    }
    
    // Platform filter
    if (platforms.length) {
      orConditions.push(
        { 'creatorData.platforms.platform': { $in: platforms } }
      );
    }
    
    // Content type filter
    if (contentTypes.length) {
      orConditions.push(
        { 'creatorData.contentTypes': { $in: contentTypes } },
        { contentTypes: { $in: contentTypes } }
      );
    }
    
    // Audience Demographics Filters
    if (ageRange) {
      orConditions.push(
        { 'creatorData.audienceDemographics.ageRange': new RegExp(ageRange, 'i') },
        { 'audienceDemographics.ageRange': new RegExp(ageRange, 'i') }
      );
    }
    
    if (gender) {
      orConditions.push(
        { 'creatorData.audienceDemographics.gender': new RegExp(gender, 'i') },
        { 'audienceDemographics.gender': new RegExp(gender, 'i') }
      );
    }
    
    if (audienceLocation) {
      const audienceLocationRegex = new RegExp(audienceLocation, 'i');
      orConditions.push(
        { 'creatorData.audienceDemographics.location': audienceLocationRegex },
        { 'audienceDemographics.location': audienceLocationRegex }
      );
    }
    
    if (ethnicity) {
      orConditions.push(
        { 'creatorData.audienceDemographics.ethnicity': new RegExp(ethnicity, 'i') },
        { 'audienceDemographics.ethnicity': new RegExp(ethnicity, 'i') }
      );
    }
    
    // Size & Growth Filters
    if (followerMin > 0 || followerMax < 999999) {
      baseFilter['creatorData.totalFollowers'] = { 
        $gte: followerMin, 
        $lte: followerMax 
      };
    }
    
    if (influencerTier) {
      orConditions.push(
        { 'creatorData.influencerTier': new RegExp(influencerTier, 'i') }
      );
    }
    
    if (growthTrend) {
      orConditions.push(
        { 'creatorData.growthTrend': new RegExp(growthTrend, 'i') }
      );
    }
    
    // Engagement & Quality Filters
    if (engagementMin > 0 || engagementMax < 10) {
      baseFilter['creatorData.engagementRate'] = { 
        $gte: engagementMin, 
        $lte: engagementMax 
      };
    }
    
    if (authenticityMin > 1) {
      baseFilter['creatorData.authenticityScore'] = { $gte: authenticityMin };
    }
    
    if (audienceQuality) {
      orConditions.push(
        { 'creatorData.audienceQuality': new RegExp(audienceQuality, 'i') }
      );
    }
    
    // Activity & Content Behavior Filters
    if (recentActivity) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      baseFilter['creatorData.lastActiveDate'] = { $gte: thirtyDaysAgo };
    }
    
    if (sponsoredContentMax < 100) {
      baseFilter['creatorData.sponsoredContentPercentage'] = { $lte: sponsoredContentMax };
    }
    
    // Fraud & Authenticity Detection
    if (fraudDetection) {
      baseFilter['creatorData.fraudScore'] = { $lte: 3 }; // Low fraud score
    }
    
    if (!suspiciousGrowth) {
      baseFilter['creatorData.suspiciousGrowthFlag'] = { $ne: true };
    }
    
    if (orConditions.length > 0) {
      baseFilter.$or = orConditions;
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
            const excludes = await collectExcludes({ 
              search: searchRaw, 
              tags: tagList, 
              max: 300,
              name: nameSearch,
              location: locationSearch || citySearch
            });
            const prompt = buildPrompt({ 
              term: searchRaw || null, 
              cats: validateAndExpandCategories(tagList), 
              limit: batchSize, 
              excludes,
              name: nameSearch || null,
              location: locationSearch || citySearch || null,
              keywords: keywords || null,
              hashtags: hashtags || null,
              contentTypes: contentTypes,
              platforms: platforms,
              ageRange: ageRange || null,
              gender: gender || null,
              audienceLocation: audienceLocation || null,
              ethnicity: ethnicity || null
            });
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
                await sendDbPayload({ searchRaw, tagList, limit, cursor, res, t0, nameSearch, locationSearch, citySearch, keywords, hashtags, contentTypes, platforms, ageRange, gender, audienceLocation, ethnicity });
                return;
              }
              throw err;
            }
            let parsed = parseAI(chat.choices[0].message.content);
            let rawItems = Array.isArray(parsed.items) ? parsed.items : [];
            if (rawItems.length === 0) {
              log('warn', '⚠️  parse failed – retrying with 6 items');
              const retryPrompt = buildPrompt({ 
                term: searchRaw || null, 
                cats: validateAndExpandCategories(tagList), 
                limit: 6, 
                excludes,
                name: nameSearch || null,
                location: locationSearch || citySearch || null,
                keywords: keywords || null,
                hashtags: hashtags || null,
                contentTypes: contentTypes,
                platforms: platforms,
                ageRange: ageRange || null,
                gender: gender || null,
                audienceLocation: audienceLocation || null,
                ethnicity: ethnicity || null
              });
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
            let finalCreators = [...uniq.values()];
            
            // Apply competitive insights if requested
            if (competitorAnalysis && competitorIds.length > 0) {
              log('info', 'Processing competitive insights', { competitorCount: competitorIds.length });
              
              finalCreators = await Promise.all(finalCreators.map(async (creator) => {
                try {
                  // Generate comprehensive competitive analysis
                  const [audienceOverlapResult, competitorTracking, competitiveInsights] = await Promise.all([
                    audienceOverlap ? analyzeAudienceOverlap(creator._id, competitorIds) : Promise.resolve(null),
                    trackCompetitorHistory(creator._id, competitorIds, 'ai-search'),
                    generateCompetitiveInsights(creator, competitorIds)
                  ]);

                  // Add competitive insights to creator data
                  creator.competitiveAnalysis = {
                    audienceOverlap: audienceOverlapResult || { overlapAnalysis: [], totalOverlapScore: 0 },
                    competitorTracking,
                    insights: competitiveInsights,
                    analysisTimestamp: new Date().toISOString(),
                    competitorCount: competitorIds.length
                  };

                  // Calculate competitive score (affects ranking)
                  const competitiveScore = calculateCompetitiveScore(creator, audienceOverlapResult);
                  creator.competitiveScore = competitiveScore;

                  return creator;
                } catch (error) {
                  log('error', 'Error processing competitive insights for creator', { 
                    creatorId: creator._id, 
                    error: error.message 
                  });
                  // Return creator without competitive analysis if error occurs
                  return creator;
                }
              }));

              // Re-sort by competitive score if competitive analysis was applied
              finalCreators.sort((a, b) => (b.competitiveScore || 0) - (a.competitiveScore || 0));
            }
            
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


// Helper to estimate engagement quality based on follower count
const getEngagementTier = (totalFollowers) => {
  if (totalFollowers < 10000) return 'nano';
  if (totalFollowers < 50000) return 'micro-low';
  if (totalFollowers < 100000) return 'micro-high';
  if (totalFollowers < 500000) return 'mid-tier';
  if (totalFollowers < 1000000) return 'macro';
  return 'mega'; // Should not reach here with our 1M limit
};

// Enhanced engagement rate calculator
const calculateEngagementRate = (likes = 0, comments = 0, shares = 0, followers = 1) => {
  if (followers === 0) return 0;
  const totalEngagement = likes + comments + (shares * 2); // Weight shares more heavily
  const rate = (totalEngagement / followers) * 100;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
};

// Calculate expected engagement range for influencer tier
const getExpectedEngagementRange = (tier, followers) => {
  const ranges = {
    'nano': { min: 4.0, max: 8.0 },
    'micro-low': { min: 3.5, max: 7.0 },
    'micro-high': { min: 2.5, max: 5.5 },
    'mid-tier': { min: 1.5, max: 4.0 },
    'macro': { min: 1.0, max: 3.0 }
  };
  return ranges[tier] || { min: 1.0, max: 3.0 };
};

// Follower reachability metrics calculator
const calculateReachabilityMetrics = (platforms = [], totalFollowers = 0) => {
  if (!platforms.length || totalFollowers === 0) {
    return { reachabilityScore: 0, platformDiversity: 0, crossPlatformReach: 0 };
  }

  // Platform diversity score (more platforms = better reach)
  const platformDiversity = Math.min(platforms.length / 4, 1) * 100; // Max 4 platforms for 100%
  
  // Cross-platform reach calculation
  const avgFollowersPerPlatform = totalFollowers / platforms.length;
  const crossPlatformReach = platforms.reduce((sum, platform) => {
    const platformWeight = getPlatformWeight(platform.platform);
    return sum + (platform.followersCount * platformWeight);
  }, 0) / totalFollowers;
  
  // Overall reachability score
  const reachabilityScore = (platformDiversity * 0.4) + (crossPlatformReach * 0.6);
  
  return {
    reachabilityScore: Math.round(reachabilityScore * 100) / 100,
    platformDiversity: Math.round(platformDiversity * 100) / 100,
    crossPlatformReach: Math.round(crossPlatformReach * 100) / 100,
    avgFollowersPerPlatform: Math.round(avgFollowersPerPlatform)
  };
};

// Platform weight for reachability calculation
const getPlatformWeight = (platform) => {
  const weights = {
    'Instagram': 1.2,
    'TikTok': 1.1,
    'YouTube': 1.3,
    'Twitter': 0.9,
    'Facebook': 0.8,
    'LinkedIn': 0.7
  };
  return weights[platform] || 1.0;
};

// Advanced fraud detection algorithms
const detectFakeFollowers = (user) => {
  const platforms = user.creatorData?.platforms || [];
  const totalFollowers = user.creatorData?.totalFollowers || 0;
  const engagementRate = user.creatorData?.engagementRate || 0;
  
  let fraudScore = 0;
  const flags = [];
  
  // 1. Engagement vs Followers Mismatch
  const tier = getEngagementTier(totalFollowers);
  const expectedRange = getExpectedEngagementRange(tier);
  if (engagementRate < expectedRange.min * 0.5) {
    fraudScore += 2;
    flags.push('Low engagement for follower count');
  }
  
  // 2. Suspicious follower distribution across platforms
  if (platforms.length > 1) {
    const followerCounts = platforms.map(p => p.followersCount).sort((a, b) => b - a);
    const ratio = followerCounts[0] / (followerCounts[1] || 1);
    if (ratio > 10) {
      fraudScore += 1;
      flags.push('Uneven follower distribution across platforms');
    }
  }
  
  // 3. Round number patterns (often indicates bought followers)
  const hasRoundNumbers = platforms.some(p => {
    const followers = p.followersCount;
    return followers > 1000 && (followers % 1000 === 0 || followers % 5000 === 0);
  });
  if (hasRoundNumbers && totalFollowers > 50000) {
    fraudScore += 1;
    flags.push('Suspicious round follower numbers');
  }
  
  // 4. Growth pattern analysis
  const growthTrend = user.creatorData?.growthTrend;
  if (growthTrend === 'explosive' || user.creatorData?.suspiciousGrowthFlag) {
    fraudScore += 2;
    flags.push('Suspicious growth patterns detected');
  }
  
  // 5. Platform-specific anomalies
  const instagramData = platforms.find(p => p.platform === 'Instagram');
  if (instagramData && instagramData.followersCount > 100000 && engagementRate < 1.0) {
    fraudScore += 1;
    flags.push('Instagram engagement too low for follower count');
  }
  
  return {
    fraudScore: Math.min(fraudScore, 10), // Cap at 10
    riskLevel: fraudScore <= 2 ? 'low' : fraudScore <= 5 ? 'medium' : 'high',
    flags,
    recommendation: fraudScore <= 2 ? 'approved' : fraudScore <= 5 ? 'review' : 'reject'
  };
};

// Growth pattern analysis
const analyzeGrowthPatterns = (user) => {
  const platforms = user.creatorData?.platforms || [];
  const totalFollowers = user.creatorData?.totalFollowers || 0;
  const growthTrend = user.creatorData?.growthTrend || 'stable';
  
  const analysis = {
    pattern: growthTrend,
    healthScore: 5, // 1-10 scale
    indicators: [],
    predictions: {}
  };
  
  // Analyze growth health based on patterns
  switch (growthTrend) {
    case 'growing':
      analysis.healthScore = totalFollowers < 100000 ? 8 : 7;
      analysis.indicators.push('Positive organic growth');
      analysis.predictions.nextMonth = 'continued growth';
      break;
    case 'stable':
      analysis.healthScore = 6;
      analysis.indicators.push('Consistent audience retention');
      analysis.predictions.nextMonth = 'stable performance';
      break;
    case 'declining':
      analysis.healthScore = 3;
      analysis.indicators.push('Audience loss detected');
      analysis.predictions.nextMonth = 'potential recovery needed';
      break;
    case 'explosive':
      analysis.healthScore = 2;
      analysis.indicators.push('Rapid growth - investigate for authenticity');
      analysis.predictions.nextMonth = 'high volatility expected';
      break;
  }
  
  // Platform-specific growth analysis
  const platformGrowth = platforms.map(platform => {
    const weight = getPlatformWeight(platform.platform);
    const expectedGrowth = platform.followersCount * 0.05; // 5% monthly growth is healthy
    
    return {
      platform: platform.platform,
      current: platform.followersCount,
      healthIndicator: weight > 1.0 ? 'strong platform' : 'weaker platform',
      growthPotential: expectedGrowth * weight
    };
  });
  
  analysis.platformBreakdown = platformGrowth;
  
  return analysis;
};

// Audience quality assessment
const assessAudienceQuality = (user) => {
  const platforms = user.creatorData?.platforms || [];
  const engagementRate = user.creatorData?.engagementRate || 0;
  const authenticityScore = user.creatorData?.authenticityScore || 5;
  const audienceDemographics = user.creatorData?.audienceDemographics || {};
  
  let qualityScore = 0;
  const factors = [];
  
  // 1. Engagement quality (40% weight)
  const engagementQuality = Math.min(engagementRate / 5 * 4, 4); // Max 4 points
  qualityScore += engagementQuality;
  factors.push(`Engagement: ${engagementRate}%`);
  
  // 2. Authenticity score (30% weight)
  const authenticityQuality = (authenticityScore / 10) * 3; // Max 3 points
  qualityScore += authenticityQuality;
  factors.push(`Authenticity: ${authenticityScore}/10`);
  
  // 3. Platform diversity (20% weight)
  const platformDiversity = Math.min(platforms.length / 3 * 2, 2); // Max 2 points
  qualityScore += platformDiversity;
  factors.push(`Platform diversity: ${platforms.length} platforms`);
  
  // 4. Demographic clarity (10% weight)
  const hasDemographics = Object.values(audienceDemographics).some(val => val && val.length > 0);
  const demographicQuality = hasDemographics ? 1 : 0;
  qualityScore += demographicQuality;
  factors.push(`Demographics: ${hasDemographics ? 'clear' : 'unclear'}`);
  
  const finalScore = Math.round(qualityScore * 10) / 10;
  
  return {
    score: finalScore,
    maxScore: 10,
    percentage: Math.round((finalScore / 10) * 100),
    grade: finalScore >= 8 ? 'A' : finalScore >= 6 ? 'B' : finalScore >= 4 ? 'C' : 'D',
    factors,
    recommendation: finalScore >= 7 ? 'High quality audience' : 
                   finalScore >= 5 ? 'Good audience quality' : 
                   'Low audience quality - review needed'
  };
};

// Audience overlap analysis for competitive insights
const analyzeAudienceOverlap = async (influencerId, competitorIds) => {
  if (!competitorIds.length) {
    return { overlapAnalysis: [], totalOverlapScore: 0 };
  }

  try {
    // Fetch influencer and competitors data
    const [influencer, competitors] = await Promise.all([
      User.findById(influencerId).lean(),
      User.find({ _id: { $in: competitorIds } }).lean()
    ]);

    if (!influencer) return { overlapAnalysis: [], totalOverlapScore: 0 };

    const overlapAnalysis = competitors.map(competitor => {
      const influencerPlatforms = influencer.creatorData?.platforms || [];
      const competitorPlatforms = competitor.creatorData?.platforms || [];
      
      // Calculate platform overlap
      const sharedPlatforms = influencerPlatforms.filter(ip => 
        competitorPlatforms.some(cp => cp.platform === ip.platform)
      );
      
      // Calculate audience demographics overlap
      const influencerDemo = influencer.creatorData?.audienceDemographics || {};
      const competitorDemo = competitor.creatorData?.audienceDemographics || {};
      
      let demographicOverlap = 0;
      let matchedFields = 0;
      
      ['ageRange', 'gender', 'location', 'ethnicity'].forEach(field => {
        if (influencerDemo[field] && competitorDemo[field]) {
          matchedFields++;
          if (influencerDemo[field].toLowerCase() === competitorDemo[field].toLowerCase()) {
            demographicOverlap++;
          }
        }
      });
      
      const demographicScore = matchedFields > 0 ? (demographicOverlap / matchedFields) * 100 : 0;
      
      // Calculate content category overlap
      const influencerCategories = [
        ...(influencer.creatorData?.categories || []),
        ...(influencer.tags || [])
      ].map(c => c.toLowerCase());
      
      const competitorCategories = [
        ...(competitor.creatorData?.categories || []),
        ...(competitor.tags || [])
      ].map(c => c.toLowerCase());
      
      const sharedCategories = influencerCategories.filter(ic => 
        competitorCategories.includes(ic)
      );
      
      const categoryOverlap = influencerCategories.length > 0 ? 
        (sharedCategories.length / influencerCategories.length) * 100 : 0;
      
      // Calculate follower range overlap
      const influencerFollowers = influencer.creatorData?.totalFollowers || 0;
      const competitorFollowers = competitor.creatorData?.totalFollowers || 0;
      const followerRatio = Math.min(influencerFollowers, competitorFollowers) / 
                           Math.max(influencerFollowers, competitorFollowers);
      const followerOverlap = followerRatio * 100;
      
      // Overall overlap score
      const overallScore = (
        (sharedPlatforms.length / Math.max(influencerPlatforms.length, 1)) * 30 +
        (demographicScore * 0.25) +
        (categoryOverlap * 0.25) +
        (followerOverlap * 0.20)
      );
      
      return {
        competitorId: competitor._id,
        competitorName: competitor.name,
        competitorUserName: competitor.userName,
        overlapScore: Math.round(overallScore * 100) / 100,
        sharedPlatforms: sharedPlatforms.map(p => p.platform),
        demographicOverlap: Math.round(demographicScore * 100) / 100,
        categoryOverlap: Math.round(categoryOverlap * 100) / 100,
        followerOverlap: Math.round(followerOverlap * 100) / 100,
        sharedCategories,
        competitorFollowers,
        riskLevel: overallScore > 70 ? 'high' : overallScore > 40 ? 'medium' : 'low'
      };
    });

    const totalOverlapScore = overlapAnalysis.length > 0 ? 
      overlapAnalysis.reduce((sum, analysis) => sum + analysis.overlapScore, 0) / overlapAnalysis.length : 0;

    return {
      overlapAnalysis: overlapAnalysis.sort((a, b) => b.overlapScore - a.overlapScore),
      totalOverlapScore: Math.round(totalOverlapScore * 100) / 100,
      highestOverlap: overlapAnalysis.length > 0 ? overlapAnalysis[0] : null,
      recommendation: totalOverlapScore > 60 ? 'High competition detected' : 
                     totalOverlapScore > 30 ? 'Moderate competition' : 'Low competition'
    };
  } catch (error) {
    log('error', 'Error in audience overlap analysis', { error: error.message });
    return { overlapAnalysis: [], totalOverlapScore: 0, error: error.message };
  }
};

// Competitor influencer history tracking
const trackCompetitorHistory = async (influencerId, competitorIds, actionType = 'search') => {
  if (!competitorIds.length) return { tracked: false };

  try {
    // Create or update competitor tracking record
    const trackingData = {
      influencerId,
      competitorIds,
      actionType,
      timestamp: new Date(),
      searchContext: {
        totalCompetitors: competitorIds.length,
        actionDate: new Date().toISOString()
      }
    };

    // Store in a simple format for now (could be enhanced with a dedicated collection)
    log('info', 'Competitor tracking recorded', trackingData);
    
    // Could implement actual database storage here:
    // await CompetitorTracking.create(trackingData);
    
    return { 
      tracked: true, 
      competitorCount: competitorIds.length,
      lastTracked: new Date().toISOString()
    };
  } catch (error) {
    log('error', 'Error tracking competitor history', { error: error.message });
    return { tracked: false, error: error.message };
  }
};

// Competitive intelligence insights aggregator
const generateCompetitiveInsights = async (influencer, competitorIds) => {
  if (!competitorIds.length) {
    return { insights: [], summary: 'No competitors provided for analysis' };
  }

  try {
    const competitors = await User.find({ _id: { $in: competitorIds } }).lean();
    const influencerData = influencer.creatorData || {};
    
    const insights = [];
    
    // Engagement rate comparison
    const influencerEngagement = influencerData.engagementRate || 0;
    const competitorEngagements = competitors.map(c => c.creatorData?.engagementRate || 0);
    const avgCompetitorEngagement = competitorEngagements.length > 0 ? 
      competitorEngagements.reduce((sum, rate) => sum + rate, 0) / competitorEngagements.length : 0;
    
    if (influencerEngagement > avgCompetitorEngagement) {
      insights.push({
        type: 'advantage',
        metric: 'engagement',
        message: `${influencer.name} has ${((influencerEngagement / avgCompetitorEngagement - 1) * 100).toFixed(1)}% higher engagement than competitors`,
        score: influencerEngagement,
        benchmark: avgCompetitorEngagement
      });
    } else if (avgCompetitorEngagement > 0) {
      insights.push({
        type: 'opportunity',
        metric: 'engagement',
        message: `Engagement rate is ${((avgCompetitorEngagement / influencerEngagement - 1) * 100).toFixed(1)}% below competitor average`,
        score: influencerEngagement,
        benchmark: avgCompetitorEngagement
      });
    }

    // Follower count positioning
    const influencerFollowers = influencerData.totalFollowers || 0;
    const competitorFollowers = competitors.map(c => c.creatorData?.totalFollowers || 0);
    const avgCompetitorFollowers = competitorFollowers.length > 0 ?
      competitorFollowers.reduce((sum, count) => sum + count, 0) / competitorFollowers.length : 0;
    
    const followerRanking = competitorFollowers.filter(count => count > influencerFollowers).length + 1;
    
    insights.push({
      type: 'positioning',
      metric: 'followers',
      message: `Ranks #${followerRanking} out of ${competitors.length + 1} influencers by follower count`,
      score: influencerFollowers,
      benchmark: avgCompetitorFollowers,
      ranking: followerRanking
    });

    // Platform coverage analysis
    const influencerPlatforms = influencerData.platforms?.map(p => p.platform) || [];
    const competitorPlatformCoverage = competitors.map(c => {
      const platforms = c.creatorData?.platforms?.map(p => p.platform) || [];
      return { name: c.name, platforms };
    });
    
    const allPlatforms = [...new Set([
      ...influencerPlatforms,
      ...competitorPlatformCoverage.flatMap(c => c.platforms)
    ])];
    
    const missingPlatforms = allPlatforms.filter(platform => 
      !influencerPlatforms.includes(platform) &&
      competitorPlatformCoverage.some(c => c.platforms.includes(platform))
    );
    
    if (missingPlatforms.length > 0) {
      insights.push({
        type: 'opportunity',
        metric: 'platforms',
        message: `Consider expanding to: ${missingPlatforms.join(', ')}`,
        missingPlatforms,
        currentPlatforms: influencerPlatforms
      });
    }

    // Authenticity score comparison
    const influencerAuthenticity = influencerData.authenticityScore || 0;
    const competitorAuthenticity = competitors.map(c => c.creatorData?.authenticityScore || 0);
    const avgCompetitorAuthenticity = competitorAuthenticity.length > 0 ?
      competitorAuthenticity.reduce((sum, score) => sum + score, 0) / competitorAuthenticity.length : 0;
    
    if (influencerAuthenticity > avgCompetitorAuthenticity) {
      insights.push({
        type: 'advantage',
        metric: 'authenticity',
        message: `Authenticity score is ${(influencerAuthenticity - avgCompetitorAuthenticity).toFixed(1)} points above competitor average`,
        score: influencerAuthenticity,
        benchmark: avgCompetitorAuthenticity
      });
    }

    const summary = `Analysis of ${competitors.length} competitors reveals ${insights.filter(i => i.type === 'advantage').length} competitive advantages and ${insights.filter(i => i.type === 'opportunity').length} growth opportunities.`;

    return {
      insights,
      summary,
      competitorCount: competitors.length,
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    log('error', 'Error generating competitive insights', { error: error.message });
    return { insights: [], summary: 'Error generating competitive analysis', error: error.message };
  }
};

// Calculate competitive score for ranking
const calculateCompetitiveScore = (creator, audienceOverlapData) => {
  let score = 0;
  const creatorData = creator.creatorData || {};

  // Base score from engagement and authenticity
  const engagementRate = creatorData.engagementRate || 0;
  const authenticityScore = creatorData.authenticityScore || 0;
  score += (engagementRate * 10) + authenticityScore; // Max ~180 points

  // Deduct points for high audience overlap (more competition)
  if (audienceOverlapData && audienceOverlapData.totalOverlapScore) {
    const overlapPenalty = audienceOverlapData.totalOverlapScore * 0.5; // Max penalty ~50 points
    score -= overlapPenalty;
  }

  // Bonus for platform diversity
  const platforms = creatorData.platforms || [];
  score += platforms.length * 5; // Up to 20 points for 4+ platforms

  // Bonus for low fraud score
  const fraudScore = creatorData.fraudScore || 5;
  score += (10 - fraudScore) * 2; // Up to 10 points

  // Growth trend bonus
  const growthTrend = creatorData.growthTrend || 'stable';
  if (growthTrend === 'growing') score += 15;
  else if (growthTrend === 'stable') score += 5;

  return Math.round(score * 100) / 100;
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
  
  // ENFORCE 1M FOLLOWER LIMIT PER PLATFORM
  const hasValidPlatforms = (user.creatorData?.platforms || []).every(platform => {
    // Each platform must have followers under 1M (1,000,000)
    return platform.followersCount <= 1000000;
  });
  if (!hasValidPlatforms) {
    log('debug', `Rejecting influencer ${user.userName} - exceeds 1M follower limit`, {
      platforms: user.creatorData?.platforms
    });
    return false;
  }
  
  // Validate authenticity metrics if provided
  const engagementRate = user.creatorData?.engagementRate || 0;
  const authenticityScore = user.creatorData?.authenticityScore || 0;
  
  // Log engagement tier for monitoring
  const tier = getEngagementTier(user.creatorData?.totalFollowers || 0);
  log('debug', `Influencer ${user.userName} - Tier: ${tier}, Engagement: ${engagementRate}%, Authenticity: ${authenticityScore}/10`);
  
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
