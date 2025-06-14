// tools/sync-indexes.js
require('dotenv').config();                 // if you keep Mongo URI in .env
const mongoose = require('mongoose');

const User = require('../models/User');     // adjust if your path differs

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.syncIndexes();                 // ← builds text index we added
  console.log('✅  User indexes synced');
  await mongoose.disconnect();
})();
