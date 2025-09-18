# Implementation Documents Organization

## ✅ Documents That Should Be in Main Docs

All implementation-related documents that help build the website should be in the `Main Docs` folder for better organization and single source of truth.

## 📁 Files to Move from Root to Main Docs

### Phase 6.86 Documents
```bash
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_6.86_COMPREHENSIVE.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_6.86_RESTRUCTURED.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_6.86_ADDITIONS_SUMMARY.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
```

### Phase 6.94 Document
```bash
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_6.94_COMPLETION_REPORT.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
```

### Phase 7.5 Documents
```bash
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
mv /Users/shahabnazariadli/Documents/blackQmethhod/RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
mv /Users/shahabnazariadli/Documents/blackQmethhod/NAVIGATION_IMPLEMENTATION_SUMMARY.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
```

### Phase 10 Document
```bash
mv /Users/shahabnazariadli/Documents/blackQmethhod/PHASE_10_PRE_PRODUCTION_READINESS.md "/Users/shahabnazariadli/Documents/blackQmethhod/Main Docs/"
```

## ✅ Updates Made to PHASE_TRACKER.md

The following references have been updated in PHASE_TRACKER.md to point to the correct location in Main Docs:

1. **Phase 6.86 References Added:**
   - `[Comprehensive Plan](./PHASE_6.86_COMPREHENSIVE.md)`
   - `[Restructured Plan](./PHASE_6.86_RESTRUCTURED.md)`
   - `[Additions Summary](./PHASE_6.86_ADDITIONS_SUMMARY.md)`

2. **Phase 6.94 Reference Updated:**
   - Changed from `../PHASE_6.94_COMPLETION_REPORT.md` to `./PHASE_6.94_COMPLETION_REPORT.md`

3. **Phase 7.5 References Updated:**
   - Changed from `../RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md` to `./RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md`
   - Changed from `../PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md` to `./PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md`

## 📋 Organization Principles

### What Goes in Main Docs:
1. **Phase Implementation Plans** (PHASE_*.md)
2. **Architecture Documents** (*_ARCHITECTURE.md)
3. **Implementation Guides** (IMPLEMENTATION_GUIDE_PART*.md)
4. **Technical Specifications** (*_TECHNICAL.md)
5. **Phase Tracker** (PHASE_TRACKER.md)

### What Stays in Root:
1. **Scripts** (*.js, *.sh)
2. **Configuration Files** (*.json, *.config.*)
3. **README Files**
4. **Quick Reference Files**

## 🎯 Benefits of This Organization

1. **Single Source of Truth**: All implementation docs in one place
2. **Better Discovery**: Developers know where to look
3. **Cleaner Root**: Root directory not cluttered with documentation
4. **Consistent References**: All relative paths work correctly
5. **Version Control**: Easier to track changes to implementation docs

## 📝 Current Main Docs Structure

After moving these files, Main Docs will contain:
```
Main Docs/
├── PHASE_TRACKER.md (master reference)
├── IMPLEMENTATION_GUIDE_PART1.md
├── IMPLEMENTATION_GUIDE_PART2.md
├── IMPLEMENTATION_GUIDE_PART3.md
├── IMPLEMENTATION_GUIDE_PART4.md
├── IMPLEMENTATION_GUIDE_PART5.md
├── NAVIGATION_LIFECYCLE_TECHNICAL.md
├── PHASE_6.86_COMPREHENSIVE.md
├── PHASE_6.86_RESTRUCTURED.md
├── PHASE_6.86_ADDITIONS_SUMMARY.md
├── PHASE_6.94_COMPLETION_REPORT.md
├── PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md
├── RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md
├── NAVIGATION_IMPLEMENTATION_SUMMARY.md
├── PHASE_10_PRE_PRODUCTION_READINESS.md
└── ... other implementation docs
```

## ⚠️ Files to Remove from Lead Folder

These outdated files in `/Lead` should be deleted:
- IMPLEMENTATION_PHASES.md
- IMPLEMENTATION_PHASES_PART1.md
- IMPLEMENTATION_PHASES_PART1A.md
- IMPLEMENTATION_PHASES_PART1B.md
- IMPLEMENTATION_PHASES_PART2.md

```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod/Lead
rm -f IMPLEMENTATION_PHASES*.md
```

## ✅ Final Status

Once the moves are complete:
- **All implementation documents** will be in `Main Docs/`
- **PHASE_TRACKER.md** will have correct references
- **No duplicate** implementation guides
- **Clear organization** for developers