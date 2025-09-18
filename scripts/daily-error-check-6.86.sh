#!/bin/bash
# Phase 6.86 Daily Error Check Script
# Save as: scripts/daily-error-check-6.86.sh

echo "=== PHASE 6.86 DAILY ERROR CHECK ==="
echo "Date: $(date)"
echo "=================================="

# Change to frontend directory
cd /Users/shahabnazariadli/Documents/blackQmethhod/frontend

# Run typecheck and save to log
npm run typecheck 2>&1 | tee "../error-log-phase6.86-$(date +%Y%m%d-%H%M).txt"

# Count errors
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
echo ""
echo "Total TypeScript Errors: $ERROR_COUNT"

# Check against baseline
BASELINE=829  # Current baseline as of Phase 6.86 start
if [ $ERROR_COUNT -gt $BASELINE ]; then
    echo "❌ FAILED: $ERROR_COUNT errors (exceeds baseline of $BASELINE)"
    echo "Action Required: Fix $(($ERROR_COUNT - $BASELINE)) errors immediately"
    exit 1
else
    echo "✅ PASSED: $ERROR_COUNT errors (within baseline of $BASELINE)"
fi

# Check for new errors in today's files
echo ""
echo "Checking today's modified files..."
cd /Users/shahabnazariadli/Documents/blackQmethhod
git diff --name-only | grep -E "\.(ts|tsx)$" | while read file; do
    if [ -f "$file" ]; then
        echo "Checking: $file"
        npx tsc --noEmit "$file" 2>&1 | grep -q "error TS" && echo "  ⚠️ Has errors" || echo "  ✅ Clean"
    fi
done

echo ""
echo "=== END OF ERROR CHECK ==="