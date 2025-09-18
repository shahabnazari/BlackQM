#!/bin/bash

# Daily Error Check Script for VQMethod Development
# Run this script at the end of each implementation day

echo "================================================"
echo "📊 DAILY ERROR CHECK - $(date '+%Y-%m-%d %H:%M')"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p error-logs

# Generate timestamp for log file
TIMESTAMP=$(date +%Y%m%d-%H%M)
LOG_FILE="error-logs/error-log-${TIMESTAMP}.txt"

# Change to frontend directory
cd frontend

# Run typecheck and capture output
echo "Running TypeScript type check..."
npm run typecheck 2>&1 | tee "${LOG_FILE}"

# Count total errors
ERROR_COUNT=$(grep -c "error TS" "${LOG_FILE}" 2>/dev/null || echo "0")

# Get error breakdown by type
echo ""
echo "📈 ERROR BREAKDOWN BY TYPE:"
echo "----------------------------"
grep -oE "error TS[0-9]+" "${LOG_FILE}" 2>/dev/null | sort | uniq -c | sort -rn || echo "No errors found!"

# Summary
echo ""
echo "================================================"
echo "📊 SUMMARY"
echo "================================================"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCESS: No TypeScript errors found!${NC}"
else
    echo -e "${RED}❌ ERRORS FOUND: ${ERROR_COUNT} TypeScript errors detected${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Review errors in: ${LOG_FILE}"
    echo "2. Fix Priority 1 (CRITICAL) errors immediately"
    echo "3. Update DAILY_ERROR_TRACKING_LOG.md"
    echo "4. Commit fixes before proceeding"
fi

# Check against baseline (47 errors from Phase 6.94)
BASELINE=47
echo ""
if [ "$ERROR_COUNT" -gt "$BASELINE" ]; then
    INCREASE=$((ERROR_COUNT - BASELINE))
    echo -e "${RED}⚠️  WARNING: Error count increased by ${INCREASE} from baseline (${BASELINE})${NC}"
    echo "   This must be fixed before continuing implementation!"
elif [ "$ERROR_COUNT" -lt "$BASELINE" ]; then
    DECREASE=$((BASELINE - ERROR_COUNT))
    echo -e "${GREEN}📉 IMPROVEMENT: Error count decreased by ${DECREASE} from baseline (${BASELINE})${NC}"
fi

# Save summary to tracking file
echo "" >> ../DAILY_ERROR_TRACKING_LOG.md
echo "| Auto | $(date '+%Y-%m-%d') | $(date '+%H:%M') | - | - | - | ${ERROR_COUNT} | - | Automated check | - |" >> ../DAILY_ERROR_TRACKING_LOG.md

echo ""
echo "Log saved to: ${LOG_FILE}"
echo "Tracking updated in: DAILY_ERROR_TRACKING_LOG.md"
echo ""
echo "================================================"
echo "Remember: Every error fixed today prevents 10 tomorrow!"
echo "================================================"