#!/bin/bash

# Phase 6.86/7.5 Documentation Cleanup Script
# This script cleans up outdated files and organizes implementation documents

echo "=== Phase Documentation Cleanup ==="
echo "Date: $(date)"
echo "=================================="

# Remove outdated IMPLEMENTATION_PHASES files from Lead folder
echo ""
echo "Removing outdated files from Lead folder..."
rm -f "Lead/IMPLEMENTATION_PHASES_PART1.md"
rm -f "Lead/IMPLEMENTATION_PHASES_PART2.md"
echo "✅ Outdated Lead folder files removed"

# Remove old Phase 6.86 files from root (already moved to Main Docs)
echo ""
echo "Cleaning up root directory..."
rm -f "PHASE_6.86_COMPREHENSIVE.md"
rm -f "PHASE_6.86_RESTRUCTURED.md"  
rm -f "PHASE_6.86_ADDITIONS_SUMMARY.md"
rm -f "RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md"
rm -f "NAVIGATION_LIFECYCLE_TECHNICAL.md"
echo "✅ Root directory cleaned (files moved to Main Docs)"

# Remove other outdated Phase files from root
echo ""
echo "Removing outdated Phase files from root..."
rm -f "PHASE_6.5_IMPLEMENTATION_COMPLETE.md"
rm -f "PHASE_6.6_SUMMARY.md"
rm -f "PHASE_6.6_VERIFICATION_REPORT.md"
rm -f "PHASE_6.7_BACKEND_INTEGRATION.md"
rm -f "PHASE_6.7_COMPLETION_REPORT.md"
rm -f "PHASE_6.7_VERIFICATION_REPORT.md"
rm -f "PHASE_6.85_COMPLETE.md"
rm -f "PHASE_6.85_CRITICAL_FIXES_COMPLETE.md"
rm -f "PHASE_6.85_FINAL_IMPLEMENTATION_STATUS.md"
rm -f "PHASE_6.85_IMPLEMENTATION_COMPLETE.md"
rm -f "PHASE_6.85_UI_PREVIEW_EXCELLENCE.md"
rm -f "PHASE_6.8_INTEGRATION_FIX_REPORT.md"
rm -f "PHASE_6.8_PREVIEW_FEATURE_COMPLETE.md"
rm -f "PHASE_6.8_RESTORE_POINT.md"
rm -f "PHASE_6.8_TEST_REPORT.md"
echo "✅ Outdated Phase files removed"

# Remove analysis and report files that are outdated
echo ""
echo "Removing outdated analysis files..."
rm -f "PERFORMANCE_ANALYSIS_REPORT.md"
rm -f "PERFORMANCE_OPTIMIZATION_RESULTS.md"
rm -f "ROOT_CAUSE_ANALYSIS_STALLING.md"
rm -f "SERVER_MANAGER_ANALYSIS.md"
rm -f "SERVER_MANAGER_TEST_REPORT.md"
rm -f "WEBSITE_HEALTH_REPORT.md"
echo "✅ Outdated analysis files removed"

# List what should remain in Main Docs
echo ""
echo "=== Files now in Main Docs folder ==="
ls -la "Main Docs/" | grep -E "(PHASE_6.86|PHASE_7.5|LIFECYCLE|NAVIGATION)" | head -10

echo ""
echo "=== Cleanup Complete ==="
echo "All implementation documents are now properly organized in Main Docs folder"
echo ""
echo "Next steps:"
echo "1. Review Main Docs/PHASE_TRACKER.md for all phase references"
echo "2. Use Main Docs/PHASE_6.86_COMPREHENSIVE.md for AI implementation"
echo "3. Use Main Docs/RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md for navigation"
echo "4. Commit changes with message: 'Reorganize implementation docs to Main Docs folder'"