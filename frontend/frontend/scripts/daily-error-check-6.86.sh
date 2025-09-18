#!/bin/bash
# Phase 6.86 Daily Error Check Script
# Enterprise-grade code quality enforcement

echo "========================================"
echo "PHASE 6.86 DAILY ERROR CHECK"
echo "Date: $(date)"
echo "========================================"
echo ""

# Navigate to frontend directory
cd frontend 2>/dev/null || { echo "❌ Frontend directory not found"; exit 1; }

# Run typecheck and capture output
echo "Running TypeScript type check..."
npm run typecheck 2>&1 | tee "../error-log-phase6.86-$(date +%Y%m%d-%H%M).txt"

# Count errors
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")

echo ""
echo "========================================"
echo "ERROR CHECK RESULTS"
echo "========================================"
echo "Total TypeScript Errors: $ERROR_COUNT"
echo ""

# Define baselines
PHASE_686_BASELINE=560
PHASE_694_BASELINE=47

# Check against Phase 6.86 baseline
if [ $ERROR_COUNT -gt $PHASE_686_BASELINE ]; then
    INCREASE=$((ERROR_COUNT - PHASE_686_BASELINE))
    echo "⚠️ WARNING: $INCREASE new errors since Phase 6.86 baseline ($PHASE_686_BASELINE)"
    
    # Check for critical increase
    if [ $INCREASE -gt 20 ]; then
        echo "❌ CRITICAL: More than 20 new errors detected!"
        echo "Action Required: Fix errors immediately before continuing"
        exit 1
    else
        echo "⚠️ Minor increase detected - fix at next checkpoint"
    fi
else
    echo "✅ PASSED: Within Phase 6.86 baseline ($ERROR_COUNT ≤ $PHASE_686_BASELINE)"
fi

echo ""
echo "========================================"
echo "FINAL STATUS"
echo "========================================"

if [ $ERROR_COUNT -le $PHASE_686_BASELINE ]; then
    echo "✅ Day 3-4 Phase 6.86: COMPLETE"
    echo "   Error Count: $ERROR_COUNT (Baseline: $PHASE_686_BASELINE)"
else
    echo "❌ Day 3-4 Phase 6.86: NEEDS FIX"
    echo "   Error Count: $ERROR_COUNT (Exceeds baseline: $PHASE_686_BASELINE)"
fi

echo ""
echo "Log saved to: error-log-phase6.86-$(date +%Y%m%d-%H%M).txt"
echo "========================================"
