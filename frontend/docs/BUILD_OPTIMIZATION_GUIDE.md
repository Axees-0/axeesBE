# Build Optimization Guide

## ⚠️ Critical Build Information

### Problem Identified
- Full cache-clear builds (`-c` flag) take 56+ seconds and timeout
- Metro bundler with 3,800+ modules causes excessive build times
- Resource competition from other processes compounds the issue

### Solution Implemented
We've optimized the build process by defaulting to incremental builds.

## Build Commands

### For Regular Builds (Recommended)
```bash
npm run export:web
```
- Uses incremental compilation
- Build time: ~8-10 seconds
- Preserves Metro cache

### For Clean Builds (Use Sparingly)
```bash
npm run export:web:clean
```
- Clears all caches
- Build time: 50-60 seconds
- Only use when dependencies change significantly

## Pre-Build Checklist

1. **Free System Resources**
   ```bash
   # Check memory availability
   free -h
   
   # Kill unnecessary processes
   sudo pkill -f "jest-worker"
   ```

2. **Clear Specific Caches Only**
   ```bash
   # Clear only Metro cache if needed
   rm -rf .expo/web/cache/*
   ```

3. **Use Build Monitoring**
   ```bash
   # Monitor build with timeout extension
   timeout 300 npm run export:web
   ```

## Deployment Process

### Standard Deployment
```bash
# Build incrementally
npm run export:web

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Emergency Deployment
If builds are timing out:
1. Use pre-built assets from `dist-new` or `dist`
2. Deploy directly without rebuilding
3. Schedule a proper build during low-usage hours

## Performance Optimization Tips

1. **Reduce Bundle Size**
   - Run `npm run analyze` to identify large dependencies
   - Consider lazy loading heavy components
   - Remove unused dependencies

2. **Optimize Metro Config**
   - Limit watched directories in metro.config.js
   - Exclude unnecessary file types

3. **Resource Management**
   - Close other development servers before building
   - Ensure at least 4GB RAM available
   - Use SSD for faster file operations

## Monitoring Build Health

### Weekly Tasks
- [ ] Check average build times
- [ ] Review bundle size trends
- [ ] Clean old cache directories

### Monthly Tasks
- [ ] Run full clean build to test
- [ ] Update dependencies incrementally
- [ ] Analyze and remove unused packages

## Emergency Contacts
If builds consistently fail:
1. Check this guide first
2. Review recent dependency changes
3. Consider reverting to last known good configuration

---
Last Updated: June 2024
Build Time Baseline: 8-10s (incremental), 50-60s (clean)