# Production Troubleshooting Runbook

## Quick Reference
**When shit hits the fan, start here.**

### 🔴 Site is Down
1. Check deployment logs: `npm run logs:prod`
2. Check Sentry for crash errors
3. Roll back if needed: `npm run deploy:rollback`
4. Clear CDN cache if static assets issue

### 🐌 Site is Slow
1. Run performance audit: `node perf-audit.js`
2. Check bundle size: `npm run analyze`
3. Look for N+1 queries in API logs
4. Check if Firebase is rate limiting

### 🚫 Users Can't Login
1. Check AuthRateLimiter - might be locked out
2. Verify Firebase Auth is operational
3. Check network tab for 403s vs 401s
4. Clear AsyncStorage: `localStorage.clear()`

### 🧭 Navigation Issues
1. Enable NavigationDebugger in dev
2. Check AuthGuard protected routes
3. Look for redirect loops in console
4. Verify route exists in file system

## Common Issues & Solutions

### 1. White Screen of Death
**Symptoms**: Blank page, no error messages
**Likely Causes**:
- JavaScript syntax error in production build
- Missing environment variables
- CORS issues with API

**Fix**:
```bash
# Check browser console
# Look for Sentry alerts
# Verify .env.production has all vars
# Test with: NODE_ENV=production npm run web
```

### 2. "Too Many Login Attempts" 
**Symptoms**: User locked out even after waiting
**Cause**: AuthRateLimiter not clearing

**Fix**:
```javascript
// In browser console:
localStorage.removeItem('axees_token');
localStorage.removeItem('axees_user');
// User should try different phone number
// Or wait full 5 minutes
```

### 3. Firebase Messaging Errors
**Symptoms**: Console errors about messaging/permission-blocked
**Cause**: User denied notifications or browser doesn't support

**Fix**:
- These are filtered in Sentry (ignore)
- Not critical for app function
- User can re-enable in browser settings

### 4. Expo Router 404s
**Symptoms**: Routes work in dev but not prod
**Cause**: Case sensitivity or special characters

**Fix**:
- Check exact file names (case matters!)
- No spaces in route names
- Use web-safe characters only

### 5. Memory Leaks
**Symptoms**: App slows down over time
**Likely Causes**:
- Event listeners not cleaned up
- Timers/intervals not cleared
- Large arrays in state

**Fix**:
```javascript
// Add to suspected components:
useEffect(() => {
  return () => {
    // Cleanup code here
  };
}, []);
```

## Performance Debugging

### Check Current Performance
```bash
node perf-audit.js
# Should output metrics < 3s total load
```

### Find Heavy Components
```javascript
// Add to any component:
console.time('ComponentName');
// ... component code ...
console.timeEnd('ComponentName');
```

### Bundle Analysis
```bash
npm run build
npm run analyze
# Look for:
# - Duplicate dependencies
# - Large libraries that could be replaced
# - Unused exports
```

## Error Tracking

### Sentry Dashboard
1. Filter by: Production environment
2. Look for: Error spikes after deploys
3. Group by: User ID to find affected users
4. Check: Breadcrumbs for user actions

### Manual Error Testing
```javascript
// Force an error to test Sentry:
throw new Error('Test Sentry Integration');
```

## Deployment Checklist

### Before Deploy
- [ ] Run tests: `npm test`
- [ ] Check bundle size: `npm run analyze`
- [ ] Test auth flow manually
- [ ] Verify env vars in deployment platform

### After Deploy
- [ ] Check Sentry for new errors (first 10 min)
- [ ] Run performance audit
- [ ] Test critical user flows
- [ ] Monitor server resources

## Emergency Contacts

### Critical Issues
1. Check Sentry alerts
2. Review deployment logs
3. Contact on-call engineer
4. Prepare rollback if needed

### Rollback Procedure
```bash
# 1. Identify last working commit
git log --oneline -10

# 2. Create rollback branch
git checkout -b emergency-rollback <commit-hash>

# 3. Deploy immediately
npm run deploy:emergency

# 4. Investigate offline
```

## Monitoring Commands

### Real-time Logs
```bash
# API logs
npm run logs:api

# Client errors
npm run logs:client

# Performance metrics
npm run metrics:live
```

### Health Checks
```bash
# API health
curl https://api.axees.com/health

# CDN status
curl -I https://cdn.axees.com/app.js

# Database connection
npm run db:ping
```

## Prevention Tips

1. **Always test on slow 3G** before deploying
2. **Monitor bundle size** - set 5MB limit
3. **Add feature flags** for risky changes
4. **Use Sentry releases** to track deploys
5. **Keep 24hr rollback window**

---

Remember: Most "emergencies" aren't. Take a breath, check the logs, and fix forward when possible. Rollback is last resort.