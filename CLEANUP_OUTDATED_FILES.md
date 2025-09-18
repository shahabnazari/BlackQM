# Cleanup: Remove Outdated Implementation Files

## Files to Remove from Lead Folder

The following files in the `/Lead` folder are outdated and should be removed. The only source of truth is `PHASE_TRACKER.md` in the `Main Docs` folder.

### Outdated Files to Delete:
1. `/Lead/IMPLEMENTATION_PHASES.md` - 3,183 bytes
2. `/Lead/IMPLEMENTATION_PHASES_PART1.md` - 97,264 bytes  
3. `/Lead/IMPLEMENTATION_PHASES_PART1A.md` - 33,984 bytes
4. `/Lead/IMPLEMENTATION_PHASES_PART1B.md` - 58,657 bytes
5. `/Lead/IMPLEMENTATION_PHASES_PART2.md` - 40,559 bytes

## Manual Cleanup Instructions

Run these commands in your terminal:

```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod/Lead

# Remove each outdated file
rm -f IMPLEMENTATION_PHASES.md
rm -f IMPLEMENTATION_PHASES_PART1.md
rm -f IMPLEMENTATION_PHASES_PART1A.md
rm -f IMPLEMENTATION_PHASES_PART1B.md
rm -f IMPLEMENTATION_PHASES_PART2.md
```

Or remove all at once:
```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod/Lead
rm -f IMPLEMENTATION_PHASES*.md
```

## Verification After Cleanup

After removing these files, verify that:
1. No `IMPLEMENTATION_PHASES` files exist in the Lead folder
2. `PHASE_TRACKER.md` in Main Docs remains the sole source of truth

Check with:
```bash
ls -la /Users/shahabnazariadli/Documents/blackQmethhod/Lead | grep IMPLEMENTATION_PHASES
# Should return no results
```

## Current Source of Truth

✅ **Main Reference:** `/Main Docs/PHASE_TRACKER.md`
- Contains all phase implementations from 1 to 16
- Includes the newly added Phase 7.5 (Research Lifecycle Navigation)
- Has proper references to technical documentation

✅ **Supporting Documents Referenced in PHASE_TRACKER.md:**
- `/Main Docs/IMPLEMENTATION_GUIDE_PART1.md` through `PART5.md` (in Main Docs, not Lead)
- `/Main Docs/NAVIGATION_LIFECYCLE_TECHNICAL.md` (newly created for Phase 7.5)
- Various architecture documents in root folder

## Why This Cleanup is Important

1. **Single Source of Truth:** Having multiple versions of implementation phases causes confusion
2. **Version Control:** PHASE_TRACKER.md is the maintained and updated version
3. **Clarity:** Developers should only reference one authoritative document
4. **Maintenance:** Easier to update one document than multiple scattered files

## After Cleanup

Once these files are removed:
- All phase tracking is in `/Main Docs/PHASE_TRACKER.md`
- All implementation guides are in `/Main Docs/IMPLEMENTATION_GUIDE_PART*.md`
- The Lead folder contains only current working documents, not duplicates