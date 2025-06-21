/**
 * Simple Test Backend Server
 * 
 * Starts a minimal backend for testing frontend connectivity
 * without all the complex dependencies
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'axees-test-backend'
    });
});

// Auth endpoints for testing
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple test authentication
    if (email && password) {
        if (email === 'test@axees.com' && password === 'test123') {
            res.json({
                success: true,
                token: 'test-jwt-token-' + Date.now(),
                user: {
                    id: 'test-user-123',
                    email: email,
                    name: 'Test User'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'Email and password required'
        });
    }
});

app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    
    if (email && password && name) {
        res.json({
            success: true,
            message: 'Registration successful',
            user: {
                id: 'new-user-' + Date.now(),
                email: email,
                name: name
            }
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Email, password, and name required'
        });
    }
});

// User endpoints
app.get('/api/users/profile', (req, res) => {
    res.json({
        id: 'test-user-123',
        email: 'test@axees.com',
        name: 'Test User',
        profileComplete: false
    });
});

// Generic API route
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Axees Test Backend API',
        version: '1.0.0',
        endpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/users/profile'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Axees test backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth login: http://localhost:${PORT}/api/auth/login`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down test backend...');
    process.exit(0);
});

module.exports = app;