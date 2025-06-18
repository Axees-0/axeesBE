// Simple backend server - only essential routes
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Essential routes only
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const findRoutes = require('./routes/findRoutes');
const connectRoutes = require('./routes/connectRoutes');
const marketerDealRoutes = require('./routes/marketerDealRoutes');

const app = express();

// Connect to MongoDB
mongoose
  .connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/find', findRoutes);
app.use('/api', connectRoutes);
app.use('/api/deals', marketerDealRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date().toISOString() });
});

// Start server  
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Find API: http://localhost:${PORT}/api/find`);
});