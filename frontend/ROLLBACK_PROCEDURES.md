# Emergency Rollback Procedures

**Created:** June 28, 2025  
**For Merge:** galaxies-features-implementation → investor-demo-only  
**Merge Commits:** 45e57ec, 826b7c4

⚠️ **USE ONLY IN EMERGENCY** - These procedures will undo the merge operation

## Pre-Rollback Checklist

Before executing any rollback, verify:
- [ ] You have confirmed the issue requires a full rollback
- [ ] Alternative fixes have been considered
- [ ] Stakeholders have been notified
- [ ] You have recent backups of current state

## Quick Reference - Emergency Commands

### 🚨 Emergency Rollback (Immediate)
```bash
# Navigate to project
cd /home/Mike/projects/axees/axeesBE/frontend

# Rollback to pre-merge state immediately
git checkout investor-demo-only
git reset --hard investor-demo-backup
git push --force origin investor-demo-only
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

### Option 1: Complete Branch Rollback (Recommended)

Use this when the entire merge needs to be undone:

```bash
# 1. Navigate to frontend directory
cd /home/Mike/projects/axees/axeesBE/frontend

# 2. Ensure clean working directory
git status
# If there are uncommitted changes:
git add . && git commit -m "Save current work before rollback"

# 3. Switch to investor-demo-only branch
git checkout investor-demo-only

# 4. Reset to pre-merge backup tag
git reset --hard investor-demo-backup

# 5. Verify rollback state
git log --oneline -5
echo "Expected: Should see original investor-demo commits before merge"

# 6. Test build after rollback
npm run build:smart

# 7. If everything works, force push to update remote
# WARNING: This will overwrite remote history
git push --force origin investor-demo-only
```

### Option 2: Selective Revert (Alternative)

Use this to keep merge history but revert changes:

```bash
# 1. Navigate to frontend directory
cd /home/Mike/projects/axees/axeesBE/frontend

# 2. Switch to investor-demo-only branch
git checkout investor-demo-only

# 3. Revert the merge commit (creates new commit)
git revert 45e57ec -m 1

# 4. If there are additional commits, revert them too
git revert 826b7c4

# 5. Resolve any conflicts and commit
git add .
git commit -m "Revert merge of galaxies-features-implementation"

# 6. Push the revert commits
git push origin investor-demo-only
```

### Option 3: Branch Reconstruction

Use this if tags are missing or corrupted:

```bash
# 1. Find the last good commit before merge
git log --oneline --graph

# 2. Look for commit before: "Merge branch 'galaxies-features-implementation'"
# This should be around commit d6ee4f9 or similar

# 3. Reset to that commit
git reset --hard <LAST_GOOD_COMMIT_HASH>

# 4. Verify and test
npm run build:smart

# 5. Force push if successful
git push --force origin investor-demo-only
```

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

# Check demo functionality if available
npm run demo:test 2>/dev/null || echo "Demo tests not available"
```

## Branch Recovery After Rollback

### Recover Galaxies Branch (if needed)
```bash
# Switch to galaxies branch
git checkout galaxies-features-implementation

# Reset to backup if needed
git reset --hard pre-merge-backup-galaxies

# Or verify it's still intact
git log --oneline -5
```

### Re-attempt Merge (After Fixes)
```bash
# Only after identifying and fixing the root issue:

# 1. Switch to target branch
git checkout investor-demo-only

# 2. Ensure clean state
git status

# 3. Merge with strategy
git merge --no-ff galaxies-features-implementation

# 4. Resolve any conflicts carefully
# 5. Test thoroughly before pushing
```

## Emergency Contact Information

### If Rollback Fails
1. **Stop immediately** - Do not continue
2. **Document the error** - Save all error messages
3. **Create emergency backup** of current state:
   ```bash
   git branch emergency-backup-$(date +%Y%m%d-%H%M%S)
   ```
4. **Contact senior developer** for assistance

### Backup Tags Available
- `investor-demo-backup`: Pre-merge state of investor-demo-only
- `pre-merge-backup-galaxies`: Pre-merge state of galaxies-features-implementation

### Verification Commands
```bash
# Check tags exist
git tag -l "*backup*"

# View tag details
git show investor-demo-backup --stat
git show pre-merge-backup-galaxies --stat
```

## Post-Rollback Actions

### Immediate (Required)
- [ ] Notify team of rollback completion
- [ ] Update deployment pipeline to use rolled-back version
- [ ] Test in staging environment
- [ ] Monitor for any issues

### Short-term (Within 24 hours)
- [ ] Analyze root cause of issue that required rollback
- [ ] Plan corrective actions
- [ ] Document lessons learned
- [ ] Update merge procedures if needed

### Long-term
- [ ] Implement fixes for identified issues
- [ ] Re-test merge strategy in isolated environment  
- [ ] Plan re-merge when ready

## Prevention for Future Merges

### Enhanced Testing
- Always run full build before merge completion
- Test critical functionality in isolated environment
- Validate performance impact before production

### Better Backup Strategy
- Create tags before any major merge
- Test rollback procedures before production merges
- Document all critical dependencies

---

⚠️ **Remember:** Rollbacks should be last resort. Always try to fix forward when possible.

**Document Updated:** June 28, 2025  
**Tested:** Backup tags verified and accessible