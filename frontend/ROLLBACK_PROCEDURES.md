# Rollback Procedures - Phase 1 Practice Deployment

## Current State Summary

- **Branch**: production-baseline
- **Last Commit**: 4591f62 - Fix discover page filter interactions and cleanup
- **Backup Tag**: production-backup-20250703
- **Practice Site**: axees-qa-fixes-v2
- **Deploy ID**: 686697d0ebff2b4e3bc80c70
- **Deploy URL**: https://686697d0ebff2b4e3bc80c70--axees-qa-fixes-v2.netlify.app

## Rollback Scenarios

### 1. Code Rollback (Git)

If issues are found and you need to revert to the backup state:

```bash
# Option A: Reset to backup tag (destructive - removes commits)
git reset --hard production-backup-20250703

# Option B: Revert commits (preserves history)
git revert HEAD
git commit -m "Revert Phase 1 changes due to issues"

# Option C: Create a new branch from backup
git checkout -b rollback-branch production-backup-20250703
```

### 2. Netlify Deployment Rollback

To rollback the practice site deployment:

```bash
# List all deploys for the practice site
NETLIFY_AUTH_TOKEN=nfp_eK5CfAHbJFiSjM2p8nrJznnMAiasaUtt8c96 netlify deploys:list --site a7351308-618e-4c10-8bf1-7222e9074e2f

# Restore a previous deploy (replace DEPLOY_ID with the desired deploy)
NETLIFY_AUTH_TOKEN=nfp_eK5CfAHbJFiSjM2p8nrJznnMAiasaUtt8c96 netlify deploy:restore DEPLOY_ID --site a7351308-618e-4c10-8bf1-7222e9074e2f
```

### 3. Quick Emergency Rollback

If you need to quickly restore functionality:

```bash
# 1. Checkout the backup tag
git checkout production-backup-20250703

# 2. Build the project
npm run export:web

# 3. Deploy to practice site
cd dist
NETLIFY_AUTH_TOKEN=nfp_eK5CfAHbJFiSjM2p8nrJznnMAiasaUtt8c96 netlify deploy --site a7351308-618e-4c10-8bf1-7222e9074e2f --dir . --prod --message "Emergency rollback to production-backup-20250703"
```

## Important Files Backup

Key files that were modified in this phase:
- `app/discover.tsx` - Filter interaction fixes
- `package.json` - Dependency updates
- Multiple archive files were removed (84MB cleanup)

## Testing Before Rollback

Before rolling back, ensure you:
1. Document the specific issues encountered
2. Take screenshots if UI issues
3. Save error logs
4. Note which functionality is broken

## Post-Rollback Steps

After rollback:
1. Verify the practice site is working correctly
2. Update MERGE_RESULTS.md with rollback reason
3. Create a new branch for fixing issues
4. Plan remediation steps

## Contact Information

- Netlify Dashboard: https://app.netlify.com/teams/michael-abdo/sites
- Practice Site ID: a7351308-618e-4c10-8bf1-7222e9074e2f
- Auth Token Location: `.env.local`

## Notes

- These procedures are for the PRACTICE site only
- Production remains untouched at deployment 686466b31a5b739a56853be7
- All changes are reversible
- The backup tag `production-backup-20250703` preserves the pre-merge state