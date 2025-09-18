#!/bin/bash

# Script to organize implementation documents into Main Docs folder
echo "Moving implementation documents to Main Docs folder..."

cd /Users/shahabnazariadli/Documents/blackQmethhod

# Phase 6.86 documents
echo "Moving Phase 6.86 documents..."
mv PHASE_6.86_COMPREHENSIVE.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_6.86_COMPREHENSIVE.md"
mv PHASE_6.86_RESTRUCTURED.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_6.86_RESTRUCTURED.md"  
mv PHASE_6.86_ADDITIONS_SUMMARY.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_6.86_ADDITIONS_SUMMARY.md"

# Phase 6.94 document
echo "Moving Phase 6.94 document..."
mv PHASE_6.94_COMPLETION_REPORT.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_6.94_COMPLETION_REPORT.md"

# Phase 7.5 documents
echo "Moving Phase 7.5 documents..."
mv PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_7.5_RESEARCH_LIFECYCLE_NAV.md"
mv RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md "Main Docs/" 2>/dev/null && echo "✓ Moved RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md"
mv NAVIGATION_IMPLEMENTATION_SUMMARY.md "Main Docs/" 2>/dev/null && echo "✓ Moved NAVIGATION_IMPLEMENTATION_SUMMARY.md"

# Phase 10 document
echo "Moving Phase 10 document..."
mv PHASE_10_PRE_PRODUCTION_READINESS.md "Main Docs/" 2>/dev/null && echo "✓ Moved PHASE_10_PRE_PRODUCTION_READINESS.md"

echo ""
echo "Documents moved successfully!"
echo ""
echo "Now updating references in PHASE_TRACKER.md..."
echo ""

# Display what's now in Main Docs
echo "Implementation documents now in Main Docs:"
ls "Main Docs/" | grep -E "PHASE_|NAVIGATION|LIFECYCLE" 

echo ""
echo "Done! All implementation documents are now properly organized in Main Docs folder."