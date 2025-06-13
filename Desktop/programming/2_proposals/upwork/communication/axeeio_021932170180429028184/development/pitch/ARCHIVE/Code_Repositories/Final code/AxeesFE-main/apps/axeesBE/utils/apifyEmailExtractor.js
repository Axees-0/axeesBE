// utils/apifyEmailExtractor.js (v2 – fire-and-forget)
import { ApifyClient } from 'apify-client';
import asyncLib   from 'async';        // CJS → default export
const { queue } = asyncLib;

const client   = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const ACTOR_ID = 'bhansalisoft/all-in-one-social-media-email-scraper';

// ────────────────────────────────────────────────────────────────
// 1)  tiny backlog with 5 concurrent runs
// ────────────────────────────────────────────────────────────────
const runner = queue(async (job, done) => {
  try {
    const { handle, platformUrl, cb } = job;

    const input = {
      Keyword       : handle,
      social_network: platformUrl,
      Country       : 'www',
      Email_Type    : '0',
      proxySettings : { useApifyProxy: false },
      // optional: maxResults: 1, timeout: 120
    };

    // ① start → wait max 90 s
    const run = await client.actor(ACTOR_ID).call(input, { waitSecs: 90 });

    // ② fetch dataset if run succeeded
    if (run.status === 'SUCCEEDED') {
      const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems({ clean: true });
      const hit = items.find(i => i.email || i.Email);
      cb(null, hit ? (hit.email || hit.Email) : null);
    } else {
      cb(null, null);                         // no e-mail found
    }
  } catch (err) {
    cb(err);
  } finally {
    done();
  }
}, 5);  // max_parallel_runs

// ────────────────────────────────────────────────────────────────
// 2) public wrapper used by findController
// ────────────────────────────────────────────────────────────────
export const fetchEmail = (handle, platformUrl) => new Promise((res) => {
  runner.push({ handle, platformUrl, cb: (_, email) => res(email) });
  // return null now – caller won’t block
  res(null);
});
