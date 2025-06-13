const axios = require('axios');

const PLACEHOLDER_RX = /(picsum|unsplash|placeholder|pexels|dummyimage|example\.com)/i;
const TRUSTED_RX     = /(unavatar\.io|cloudinary\.com|res\.cloudinary\.com|cdn.discordapp\.com)/i;

/* DiceBear initials fallback */
const dicebear = (h = 'Anonymous') =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(h)}&radius=50`;

/* "HEAD or fail" helper (4 s timeout) */
const ok = (u, t = 4_000) =>
  axios.head(u, { timeout: t }).then(r => r.status === 200).catch(() => false);

/* build URL that **never** gives a generic logo */
const providerUrl = (p, h) => `https://unavatar.io/${p}/${h}?fallback=404`;
const plainUrl    =  h     => `https://unavatar.io/${h}?fallback=404`;

/**
 * Try, in order:
 *   0. keep the existing URL if it’s already valid & trusted
 *   1. every (platform, handle) pair via unavatar  (real avatar or 404)
 *   2. bare handle via unavatar                     (real avatar or 404)
 *   3. DiceBear initials                            (guaranteed)
 */
module.exports = async function resolveAvatar ({
  avatarUrl = '',
  userName  = '',
  platforms = []
} = {}) {

  if (avatarUrl && TRUSTED_RX.test(avatarUrl) && !PLACEHOLDER_RX.test(avatarUrl))
    return avatarUrl;

  /* 1 — explicit platform handles */
  for (const { platform, handle } of platforms) {
    if (!platform || !handle) continue;
    const url = providerUrl(platform.toLowerCase(), handle.replace(/^@/, ''));
    if (await ok(url)) return url;
  }

  /* 2 — bare handle */
  const bare = userName.replace(/^@/, '');
  if (bare) {
    const url = plainUrl(bare);
    if (await ok(url)) return url;
  }

  /* 3 — initials */
  return dicebear(bare || 'Anonymous');
};
