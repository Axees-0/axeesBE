require('dotenv').config();
const mongoose = require('mongoose');
const { responseCache } = require('../controllers/findController');  // adjust path
const TempUser = require('../models/TempUser');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected, flushing …');

  responseCache.clear();
  const res = await TempUser.deleteMany({ aiGenerated: true });

  console.log('responseCache cleared.');
  console.log(`${res.deletedCount} TempUser docs removed.`);
  await mongoose.disconnect();
})();
