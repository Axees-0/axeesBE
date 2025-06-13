// scripts/backfill_tempusers.js
/* Quickly populates userNameCanonical on legacy rows */

require('dotenv').config();          // if you store MONGO_URI in .env
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/AxeesDB';

const canon = s =>
  s.normalize('NFKD')
   .replace(/\s+/g, '')
   .replace(/[^a-z0-9_]/gi, '')
   .toLowerCase();

(async () => {
  await mongoose.connect(MONGO);
  const col = mongoose.connection.collection('tempusers');

  const cursor = col.find({ userNameCanonical: { $in: [null, ''] } });

  let count = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc || !doc.userName) continue;

    await col.updateOne(
      { _id: doc._id },
      { $set: { userNameCanonical: canon(doc.userName) } }
    );
    count++;
  }
  console.log(`✅ Back-filled ${count} documents`);
  await mongoose.disconnect();
  process.exit(0);
})();
