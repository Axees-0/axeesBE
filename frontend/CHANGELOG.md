# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-07-02

### Changed - Deployment Script Consolidation

#### Duplicates Removed
1. **`direct-deploy.js`** → Canonicalized in `deploy.js`
   - 90% overlap with deploy-final-dual.js
   - Same dual deployment logic with minor cosmetic differences
   
2. **`deploy-both-versions.sh`** → Canonicalized in `deploy-simple-dual.js`
   - 80% overlap - identical logic in different languages (Bash vs JavaScript)
   - JavaScript version retained for consistency and better error handling

3. **`auto-deploy.js`** → Functionality merged into `deploy.js`
   - Was a subset of deploy-final-dual.js (single package only)
   - Now available via `--qa-only` flag in unified script

4. **`deploy-via-api.sh`** → Archived (incomplete implementation)
   - Never implemented actual API deployment
   - Only printed manual instructions

5. **`direct-netlify-upload.js`** → Archived (incomplete implementation)
   - Attempted various API endpoints but incomplete
   - No working deployment functionality

#### Canonical Implementation
- **Primary script**: `scripts/deployment/deploy.js`
  - Supports both dual and single package deployment
  - Usage:
    - `node deploy.js` - Deploy both packages
    - `node deploy.js --qa-only` - Deploy only QA fixes
    - `node deploy.js --stable-only` - Deploy only stable version
  - Features: colored output, comprehensive error handling, results saving

#### Unique Scripts Retained
- `deploy-simple-dual.js` - Simplified dual deployment alternative
- `deploy-dual-correct.sh` - Builds stable from git history (unique functionality)
- `auto-netlify-deploy.js` - Uses Netlify API instead of CLI (different approach)
- `deploy-to-specific-site.js` - Site-specific deployment (specialized use case)
- `force-netlify-deploy.js` - Multiple deployment trigger methods (troubleshooting tool)
- `simple-deploy.js` - Alternative platforms support (Surge.sh, local server)

### Benefits
1. **Reduced confusion**: 5 duplicate scripts removed
2. **Single source of truth**: One canonical implementation
3. **Better maintainability**: Fewer scripts to update
4. **Preserved functionality**: All unique features consolidated
5. **Cleaner codebase**: Archived scripts moved to `.deprecated/`