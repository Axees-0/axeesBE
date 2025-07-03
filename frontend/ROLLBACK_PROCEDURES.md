# Emergency Rollback Procedures - Multi-Phase Merges

**Created:** June 28, 2025 | **Updated:** July 3, 2025  
**Current Phase:** profile-replication-feature → galaxies-features-implementation  

⚠️ **USE ONLY IN EMERGENCY** - These procedures will undo merge operations

## Current State Summary (Phase 3)

- **Branch**: galaxies-features-implementation
- **Active Merge**: profile-replication-feature (in progress)
- **Last Stable Commit**: 4591f62 - Fix discover page filter interactions and cleanup
- **Backup Tags Available**: production-backup-20250703

## Pre-Rollback Checklist

Before executing any rollback, verify:
- [ ] You have confirmed the issue requires a full rollback
- [ ] Alternative fixes have been considered
- [ ] Stakeholders have been notified
- [ ] You have recent backups of current state

## Quick Reference - Emergency Commands

### 🚨 Emergency Rollback (Phase 3 - Current)
```bash
# Navigate to project
cd /home/Mike/projects/axees/axeesBE/frontend

# Abort current merge and rollback
git merge --abort
git reset --hard production-backup-20250703
```

### 🚨 Emergency Rollback (Phase 1 & 2)
```bash
# Rollback to production baseline
git checkout production-baseline
git reset --hard production-backup-20250703
git push --force origin production-baseline
```

### ⚠️ Verify Rollback Success
```bash
# Check current state
git log --oneline -5
git status

# Verify build works
npm run build:smart
```

## Detailed Rollback Procedures

### Option 1: Abort Current Merge (Recommended for Phase 3)

Use this when the current merge needs to be abandoned:

```bash
# 1. Navigate to frontend directory
cd /home/Mike/projects/axees/axeesBE/frontend

# 2. Abort the merge in progress
git merge --abort

# 3. Verify clean state
git status

# 4. Reset to known good state if needed
git reset --hard production-backup-20250703

# 5. Verify build works
npm run build:smart
```

### Option 2: Complete Branch Rollback (Previous Phases)

Use this when entire merge needs to be undone:

```bash
# 1. Navigate to frontend directory
cd /home/Mike/projects/axees/axeesBE/frontend

# 2. Ensure clean working directory
git status
# If there are uncommitted changes:
git add . && git commit -m "Save current work before rollback"

# 3. Switch to target branch
git checkout galaxies-features-implementation

# 4. Reset to backup tag
git reset --hard production-backup-20250703

# 5. Verify rollback state
git log --oneline -5
echo "Expected: Should see pre-merge commits"

# 6. Test build after rollback
npm run build:smart

# 7. Force push if successful (WARNING: Destructive)
git push --force origin galaxies-features-implementation
```

### Option 3: Netlify Deployment Rollback

To rollback practice site deployments:

```bash
# List all deploys for the practice site
NETLIFY_AUTH_TOKEN=nfp_eK5CfAHbJFiSjM2p8nrJznnMAiasaUtt8c96 netlify deploys:list --site a7351308-618e-4c10-8bf1-7222e9074e2f

# Restore a previous deploy (replace DEPLOY_ID with the desired deploy)
NETLIFY_AUTH_TOKEN=nfp_eK5CfAHbJFiSjM2p8nrJznnMAiasaUtt8c96 netlify deploy:restore DEPLOY_ID --site a7351308-618e-4c10-8bf1-7222e9074e2f
```

## Phase-Specific Rollback Information

### Phase 3 (Current): profile-replication-feature
- **Merge Status**: In progress with conflicts
- **Backup Strategy**: Merge abort + reset to production-backup-20250703
- **Files Modified**: Admin controllers, profile components, navigation

### Phase 2: investor-demo-only  
- **Merge Commit**: 17a69cb
- **Deploy ID**: 6866a5a564be6281e499c392
- **Preview URL**: https://phase2--polite-ganache-3a4e1b.netlify.app

### Phase 1: galaxies-features-implementation
- **Status**: No changes merged (already up-to-date)
- **Deploy ID**: 686699297824c05ce8cfee1e

## Rollback Validation Steps

After any rollback, perform these validation steps:

### 1. Build Verification
```bash
npm run build:smart
# Should complete without errors
```

### 2. Component Check
```bash
# Verify core components exist and work
ls -la components/
ls -la app/profile/

# Check for any missing files
npm run lint
```

### 3. Functionality Test
```bash
# Run available tests
npm test -- --watchAll=false --passWithNoTests
```

## Backup Tags Available

### Current Backups:
- `production-backup-20250703`: Pre-Phase 3 stable state
- `pre-merge-backup-galaxies`: Pre-galaxies merge backup
- `investor-demo-backup`: Pre-investor-demo merge backup

### Verification Commands
```bash
# Check tags exist
git tag -l "*backup*"

# View tag details
git show production-backup-20250703 --stat
```

## Emergency Contact Information

### If Rollback Fails
1. **Stop immediately** - Do not continue
2. **Document the error** - Save all error messages
3. **Create emergency backup** of current state:
   ```bash
   git branch emergency-backup-$(date +%Y%m%d-%H%M%S)
   ```

### Deployment Information
- **Netlify Dashboard**: https://app.netlify.com/teams/michael-abdo/sites
- **Practice Site ID**: a7351308-618e-4c10-8bf1-7222e9074e2f
- **Preview Site**: polite-ganache-3a4e1b
- **Auth Token Location**: `.env.local`

## Important Notes

- **NO DEPLOYMENT TO PRODUCTION** - only preview/practice sites affected
- Production remains stable at deployment 686466b31a5b739a56853be7  
- All changes are reversible with backup tags
- Rollbacks should be last resort - always try to fix forward when possible

## Post-Rollback Actions

### Immediate (Required)
- [ ] Verify the practice site is working correctly
- [ ] Update MERGE_RESULTS.md with rollback reason
- [ ] Create a new branch for fixing issues
- [ ] Plan remediation steps

### Short-term (Within 24 hours)
- [ ] Analyze root cause of issue that required rollback
- [ ] Plan corrective actions
- [ ] Document lessons learned
- [ ] Update merge procedures if needed

---

**Document Updated:** July 3, 2025  
**Tested:** All backup tags verified and accessible
