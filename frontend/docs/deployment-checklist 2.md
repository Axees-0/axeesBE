# Production Deployment Checklist

## Pre-Deployment (30 min before)

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] ESLint clean: `npm run lint`
- [ ] Bundle size < 5MB: `npm run analyze`

### Performance Verification  
- [ ] Run performance audit: `node perf-audit.js`
- [ ] Load time < 3 seconds ✅
- [ ] No memory leaks in DevTools
- [ ] Test on throttled 3G network

### Security Checks
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] Auth rate limiting tested
- [ ] CORS properly configured

### Manual Testing
- [ ] Login flow (both success and failure)
- [ ] Protected routes redirect properly
- [ ] Payment flow works (if applicable)
- [ ] Mobile responsive design verified

## Deployment Steps

### 1. Prepare Release
```bash
# Create release tag
git tag -a v1.0.x -m "Release notes here"
git push origin v1.0.x

# Update version in package.json
npm version patch

# Generate release notes
git log --oneline --decorate --no-merges v1.0.{x-1}..v1.0.x
```

### 2. Environment Setup
- [ ] Verify all env vars in deployment platform:
  ```
  EXPO_PUBLIC_SENTRY_DSN
  EXPO_PUBLIC_API_URL
  EXPO_PUBLIC_FIREBASE_*
  NODE_ENV=production
  ```
- [ ] Update Sentry release version
- [ ] Clear CDN cache if needed

### 3. Deploy
```bash
# Build production bundle
npm run build:prod

# Deploy to hosting
npm run deploy

# Verify deployment
curl -I https://app.axees.com
```

### 4. Post-Deployment Verification (First 15 min)

#### Immediate Checks
- [ ] Site loads without errors
- [ ] Login works with test account
- [ ] Check browser console for errors
- [ ] Verify version number updated

#### Monitoring
- [ ] Watch Sentry dashboard for new errors
- [ ] Check server CPU/memory usage
- [ ] Monitor API response times
- [ ] Verify no 404s for assets

#### User Flow Testing
- [ ] New user registration
- [ ] Existing user login
- [ ] Navigate all main routes
- [ ] Test on mobile device

## Rollback Plan

### When to Rollback
- Critical functionality broken
- Error rate > 5% of requests
- Performance degraded > 50%
- Security vulnerability discovered

### How to Rollback
```bash
# 1. Switch to previous version
git checkout v1.0.{x-1}

# 2. Emergency deploy
npm run deploy:emergency

# 3. Notify team
# 4. Investigate issue offline
```

## Communication Plan

### Before Deploy
- [ ] Notify team in #deployments channel
- [ ] Schedule during low-traffic window
- [ ] Have on-call engineer ready

### After Deploy
- [ ] Post deployment summary
- [ ] Share key metrics
- [ ] Document any issues

### If Issues Arise
1. Post in #incidents immediately
2. Begin investigation
3. Make rollback decision within 10 min
4. Update status every 30 min

## Smoke Tests

### Critical Paths (Must Work)
1. **Authentication**
   - Login with phone/password
   - Logout clears session
   - Protected routes enforce auth

2. **Core Features**
   - Browse content
   - Send messages
   - View notifications
   - Update profile

3. **Performance**
   - Page loads < 3 seconds
   - No JavaScript errors
   - Images load properly

### Nice to Have (Can Fix Forward)
- Minor UI alignment issues
- Non-critical console warnings
- Feature flags for new features

## Success Metrics

### Technical
- [ ] Zero critical errors in first hour
- [ ] Performance metrics maintained
- [ ] No increase in 4xx/5xx errors
- [ ] Memory usage stable

### Business
- [ ] User engagement unchanged
- [ ] Conversion rates stable
- [ ] No spike in support tickets
- [ ] Core features functioning

## Lessons Learned

After each deployment, document:
1. What went well
2. What could improve
3. Any surprises
4. Time estimates accuracy

## Emergency Contacts

- **DevOps Lead**: (Name/Contact)
- **Backend Team**: (Name/Contact)
- **Product Owner**: (Name/Contact)
- **Customer Support**: (Name/Contact)

---

⚠️ **Remember**: A boring deployment is a good deployment. No heroes needed.