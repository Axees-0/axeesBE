const express = require('express');
const app = express();

const tempUserRoutes = require('./routes/tempUser');

// Register routes
app.use('/api/temp-users', tempUserRoutes);

// ... rest of existing code ... 