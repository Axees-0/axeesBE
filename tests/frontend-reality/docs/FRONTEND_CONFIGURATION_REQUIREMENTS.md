# Frontend Configuration Requirements

## Overview
This document outlines the specific configuration requirements for running the frontend bug hunting framework against the Axees React Native/Expo application.

## Prerequisites

### 1. Frontend Development Environment
```bash
# Node.js and npm (already available)
node --version  # Should be >= 16
npm --version   # Should be >= 8

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Navigate to frontend directory
cd /home/Mike/projects/axees/axeesBE/frontend

# Install dependencies
npm install
```

### 2. Required Environment Variables

#### Frontend Environment (.env in frontend directory)
```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Authentication
EXPO_PUBLIC_AUTH_ENABLED=true

# Development Mode
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_DEBUG_MODE=true

# Platform Configuration
EXPO_PUBLIC_PLATFORM=web
```

#### Test Framework Environment (.env in tests/frontend-reality)
```bash
# Frontend URL (matches Expo default)
FRONTEND_URL=http://localhost:19006

# Backend API URL for validation
BACKEND_API_URL=http://localhost:3000

# Test Credentials (MUST BE REAL)
TEST_EMAIL=your.test.user@example.com
TEST_PASSWORD=your_secure_test_password
TEST_PHONE=+1234567890
CREDENTIALS_CONFIGURED=true

# Environment Selection
ENVIRONMENT=development
```

## Frontend Server Management

### Starting the Frontend Server
```bash
# Method 1: Using the frontend server manager
node utils/frontend-server.js

# Method 2: Direct Expo command
cd /home/Mike/projects/axees/axeesBE/frontend
npm run web

# Method 3: Manual Expo start
cd /home/Mike/projects/axees/axeesBE/frontend
expo start --web --port 19006
```

### Health Check Commands
```bash
# Check if frontend is running
node utils/frontend-server.js --health

# Check frontend URL directly
curl http://localhost:19006

# Validate frontend connectivity
node test-auth-flow.js --credentials-only
```

## Route Configuration

### Required Frontend Routes
The following routes must be accessible for comprehensive testing:

#### Authentication Routes
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset
- `/reset-password` - Password reset confirmation

#### Main Application Routes
- `/` - Home/Dashboard
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/profile/edit` - Profile editing

#### Creator/Marketer Routes
- `/create-offer` - Offer creation
- `/offers` - Offer management
- `/deals` - Deal management
- `/create-campaign` - Campaign creation

#### Communication Routes
- `/chat` - Chat/messaging
- `/chat/room/test` - Test chat room
- `/messages` - Message center

#### Submission Routes
- `/submit-proof` - Proof submission
- `/milestones/setup` - Milestone setup

### Route Health Validation
```bash
# Test route accessibility
node utils/route-validator.js

# Validate specific routes
node -e "
const RouteValidator = require('./utils/route-validator');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const validator = new RouteValidator(page);
  
  const routes = ['/login', '/dashboard', '/create-offer'];
  for (const route of routes) {
    const valid = await validator.validateRoute(route);
    console.log(\`\${route}: \${valid ? 'VALID' : 'INVALID'}\`);
  }
  
  await browser.close();
})();
"
```

## Selector Configuration

### Frontend-Specific Selectors
The framework includes fallback selectors for common elements. Update these in your test modules if the frontend uses different patterns:

#### Common Element Patterns
```javascript
// Login form elements
emailInput: [
  '[data-testid="email"]',
  '[data-testid="email-input"]', 
  '#email',
  'input[type="email"]',
  'input[name="email"]'
],

// Navigation elements
dashboardLink: [
  '[data-testid="dashboard-link"]',
  'a[href="/dashboard"]',
  '[aria-label="Dashboard"]',
  'nav a:contains("Dashboard")'
],

// Form submission
submitButton: [
  '[data-testid="submit"]',
  '[data-testid="submit-button"]',
  'button[type="submit"]',
  '.submit-button'
]
```

### Adding New Selectors
To add selectors for new frontend elements:

1. **Identify the element** in browser dev tools
2. **Add to appropriate test module** (authentication-flow-bugs.js, form-data-bugs.js, etc.)
3. **Use fallback strategy** with multiple selector options
4. **Test selector resilience** by changing one selector and ensuring tests still pass

## Network Configuration

### Port Configuration
- **Frontend**: `19006` (Expo default)
- **Backend**: `3000` (API server)
- **WebSocket**: `3000` (same as backend)

### Firewall/Security Settings
```bash
# Ensure ports are accessible
sudo ufw allow 19006  # Frontend
sudo ufw allow 3000   # Backend

# Check port availability
netstat -tulpn | grep :19006
netstat -tulpn | grep :3000
```

## Common Issues and Solutions

### 1. Frontend Server Won't Start
```bash
# Check for port conflicts
lsof -i :19006

# Kill existing processes
kill -9 $(lsof -t -i:19006)

# Clear Expo cache
cd /home/Mike/projects/axees/axeesBE/frontend
expo start --clear
```

### 2. Routes Return 404
```bash
# Check frontend compilation
cd /home/Mike/projects/axees/axeesBE/frontend
npm run web

# Verify route configuration in app.json
cat app.json | grep -A 10 "expo"

# Check React Router configuration
grep -r "createBrowserRouter\|Routes\|Route" app/
```

### 3. Authentication Issues
```bash
# Verify backend API is running
curl http://localhost:3000/api/health

# Test authentication endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check CORS configuration
curl -H "Origin: http://localhost:19006" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login
```

### 4. Test Credentials Invalid
```bash
# Validate credentials with backend
node test-auth-flow.js --credentials-only

# Create test user in backend
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@axees.com",
    "password": "SecurePassword123",
    "phone": "+1234567890",
    "name": "Test User"
  }'
```

## Testing Workflow

### 1. Pre-flight Checks
```bash
# Step 1: Start backend server
cd /home/Mike/projects/axees/axeesBE
npm start

# Step 2: Start frontend server
node tests/frontend-reality/utils/frontend-server.js

# Step 3: Validate credentials
node tests/frontend-reality/test-auth-flow.js --credentials-only

# Step 4: Run comprehensive tests
node tests/frontend-reality/run-comprehensive-bug-hunt.js
```

### 2. Monitoring During Tests
```bash
# Monitor frontend server health
watch -n 5 "curl -s -o /dev/null -w '%{http_code}' http://localhost:19006"

# Monitor backend API health
watch -n 5 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"

# Check test lock status
node tests/frontend-reality/utils/check-locks.js
```

### 3. Clean Shutdown
```bash
# Stop frontend server
node tests/frontend-reality/utils/frontend-server.js --stop

# Clean up test locks
node tests/frontend-reality/utils/check-locks.js --clean

# Stop backend server
pkill -f "node.*app.js"
```

## Performance Considerations

### Resource Usage
- **Frontend build**: ~2GB RAM, 30-60 seconds compilation
- **Test execution**: ~1GB RAM, 5-30 minutes depending on scope
- **Browser instances**: ~200MB RAM per instance

### Optimization Settings
```bash
# Frontend environment variables for testing
export NODE_OPTIONS="--max-old-space-size=4096"
export EXPO_DEVTOOLS=false
export CI=true
export EXPO_SKIP_UPDATE_CHECK=true
```

## Deployment-Specific Configuration

### Staging Environment
```bash
# Update .env for staging
ENVIRONMENT=staging
FRONTEND_URL=https://staging.axees.com
BACKEND_API_URL=https://staging-api.axees.com
```

### Production Environment
```bash
# Production configuration (use with extreme caution)
ENVIRONMENT=production
FRONTEND_URL=https://axees.com
BACKEND_API_URL=https://api.axees.com

# Enable production safety mode
PRODUCTION_MODE=true
PRODUCTION_RATE_LIMIT=2000
```

## Troubleshooting Commands

### Quick Diagnostics
```bash
# Full system check
./run-diagnostics.sh

# Frontend-specific diagnostics
node -e "
const config = require('./config');
const frontendServer = require('./utils/frontend-server');

console.log('Configuration:', {
  frontendUrl: config.frontendUrl,
  environment: config.config.environment,
  credentialsConfigured: config.config.credentialsConfigured
});

frontendServer.checkHealth().then(healthy => {
  console.log('Frontend Health:', healthy ? 'HEALTHY' : 'UNHEALTHY');
});
"
```

### Log Files
- Frontend logs: Console output from `expo start`
- Test logs: `./test-execution.log`
- Error screenshots: `./debug-*.png`

## Integration Points

### Backend Dependencies
- Authentication API (`/api/auth/login`)
- User management API (`/api/users`)
- Health check endpoint (`/api/health`)
- WebSocket connection (`ws://localhost:3000`)

### External Services
- Stripe integration (for payment tests)
- Firebase (for messaging tests)
- File upload services (for proof submission tests)

## Next Steps

1. **Configure Environment**: Set up all required environment variables
2. **Start Services**: Launch both backend and frontend servers
3. **Validate Setup**: Run health checks and credential validation
4. **Execute Tests**: Run comprehensive bug hunting framework
5. **Monitor Results**: Check test results and debug any failures