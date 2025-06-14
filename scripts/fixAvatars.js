#!/usr/bin/env node
/**
 * scripts/fixAvatars.js
 *
 * Re-generates missing / placeholder avatarUrl values for Creator accounts
 * and saves them back to the User collection.
 *
 *   node scripts/fixAvatars.js
 *
 * Requires: MONGO_URI in env (or tweak connect line)
 */
require('dotenv').config();

const mongoose = require('mongoose');
const axios    = require('axios');
const User     = require('../models/User');          // adjust path if needed

/* ───────── same regexes you use in findController ───────── */
const PLACEHOLDER_RX = /(picsum|unsplash|placeholder|pexels|dummyimage|example\.com)/i;
const TRUSTED_RX     = /(unavatar\.io|cloudinary\.com|res\.cloudinary\.com|cdn\.discordapp\.com)/i;

/* ───────── tiny helpers ───────── */
const dicebear   = h => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(h)}&radius=50`;
const HEAD       = (u,t=4_000) => axios.head(u,{timeout:t}).then(()=>true).catch(()=>false);
const provider   = (p,h)=>`https://unavatar.io/${p}/${h}`;
const generic    =  h =>`https://unavatar.io/${h}`;

/* ───────── avatar resolver (same logic you added earlier) ───────── */
async function resolveAvatar({ avatarUrl, userName, platforms=[] }) {
  // 0) keep it if it already looks OK
  if (avatarUrl && TRUSTED_RX.test(avatarUrl) && !PLACEHOLDER_RX.test(avatarUrl))
    return avatarUrl;

  // 1) try every platform/handle pair
  for (const { platform, handle } of platforms) {
    if (!platform || !handle) continue;
    const url = provider(platform, handle.replace(/^@/,''));
    if (await HEAD(url)) return url;
  }

  // 2) fallback: plain handle
  const h = (userName||'').replace(/^@/,'');
  if (h) {
    const url = generic(h);
    if (await HEAD(url)) return url;
  }

  // 3) final fallback: initials svg
  return dicebear(h || 'Anonymous');
}

/* ───────── main migration ───────── */
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔌 Mongo connected');

  // every Creator whose avatar is empty / placeholder / un-trusted
  const cursor = User.find({
    userType : 'Creator',
    $or: [
      { avatarUrl: { $exists: false } },
      { avatarUrl: '' },
      { avatarUrl: { $regex: PLACEHOLDER_RX } },
      { avatarUrl: { $not: TRUSTED_RX } }
    ]
  }).cursor();

  let touched = 0;
  for await (const usr of cursor) {
    const newUrl = await resolveAvatar({
      avatarUrl : usr.avatarUrl,
      userName  : usr.userName,
      platforms : usr.creatorData?.platforms || []
    });

    if (newUrl !== usr.avatarUrl) {
      await User.updateOne({ _id: usr._id }, { avatarUrl: newUrl });
      touched++;
      if (touched % 50 === 0) console.log(`→ fixed ${touched} so far…`);
    }
  }

  console.log(`🎉 done – updated ${touched} user(s)`);
  process.exit(0);
})().catch(err => {
  console.error('💥 fixAvatars crashed', err);
  process.exit(1);
});
