#!/bin/bash
# Daily Implementation Audit Script
# Runs the mandatory 3-step completion protocol for any phase

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get phase and day from arguments or prompt
PHASE=${1:-"6.86"}
DAY=${2:-$(date +%d)}

echo -e "${BLUE}========================================"
echo "   DAILY IMPLEMENTATION AUDIT"
echo "   Phase: $PHASE | Day: $DAY"
echo "   Date: $(date)"
echo -e "========================================${NC}\n"

# STEP 1: ERROR CHECK (5:00 PM)
echo -e "${YELLOW}STEP 1: ERROR CHECK${NC}"
echo "Running TypeScript type check..."
cd frontend 2>/dev/null || cd ../frontend 2>/dev/null || { echo -e "${RED}❌ Frontend directory not found${NC}"; exit 1; }

# Run typecheck and save to log
npm run typecheck 2>&1 | tee "../error-log-phase${PHASE}-day${DAY}-$(date +%Y%m%d-%H%M).txt"

# Count errors
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")

# Determine baseline based on phase
if [[ "$PHASE" == "6.86" ]]; then
    BASELINE=560
else
    BASELINE=47
fi

echo -e "\nTypeScript Errors: ${ERROR_COUNT}"
echo "Baseline: ${BASELINE}"

if [ $ERROR_COUNT -gt $BASELINE ]; then
    echo -e "${RED}❌ ERROR GATE FAILED: $ERROR_COUNT errors exceed baseline of $BASELINE${NC}"
    GATE1_PASS=false
else
    echo -e "${GREEN}✅ ERROR GATE PASSED: Within baseline${NC}"
    GATE1_PASS=true
fi

# STEP 2: SECURITY & QUALITY AUDIT (5:30 PM)
echo -e "\n${YELLOW}STEP 2: SECURITY & QUALITY AUDIT${NC}"
echo "Running audit checklist..."

AUDIT_PASS=true

# Check for API keys in frontend
echo -n "Checking for API keys in frontend code... "
if grep -r "dangerouslyAllowBrowser\|OPENAI_API_KEY\|sk-" frontend/lib frontend/app 2>/dev/null | grep -v "node_modules" | grep -q .; then
    echo -e "${RED}❌ FOUND API KEYS IN FRONTEND${NC}"
    AUDIT_PASS=false
else
    echo -e "${GREEN}✅ Clean${NC}"
fi

# Check for any types
echo -n "Checking for 'any' types in today's files... "
ANY_COUNT=$(git diff --name-only | xargs grep -h ": any\|<any>" 2>/dev/null | wc -l || echo "0")
if [ $ANY_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $ANY_COUNT uses of 'any' type${NC}"
else
    echo -e "${GREEN}✅ No 'any' types${NC}"
fi

# Check for silent error catches
echo -n "Checking for silent error catches... "
if git diff --name-only | xargs grep -h "catch.*{.*}" 2>/dev/null | grep -q "return \(\[\]\|{}\|null\|undefined\)"; then
    echo -e "${YELLOW}⚠️ Silent error catches found${NC}"
else
    echo -e "${GREEN}✅ Proper error handling${NC}"
fi

# Check for authentication on new API routes
echo -n "Checking API route authentication... "
API_FILES=$(find frontend/app/api -name "*.ts" -newer /tmp/.audit_timestamp 2>/dev/null || echo "")
if [ ! -z "$API_FILES" ]; then
    for file in $API_FILES; do
        if ! grep -q "auth\|Auth\|session\|Session" "$file"; then
            echo -e "${RED}❌ Unauthenticated API route: $file${NC}"
            AUDIT_PASS=false
        fi
    done
else
    echo -e "${GREEN}✅ No new API routes${NC}"
fi

# STEP 3: DOCUMENTATION CHECK (6:00 PM)
echo -e "\n${YELLOW}STEP 3: DOCUMENTATION STATUS${NC}"

echo "Phase Tracker Update Required:"
echo "- [ ] Mark completed tasks with [x]"
echo "- [ ] Document any issues found"
echo "- [ ] Note security/quality concerns"
echo "- [ ] Update implementation status"

# FINAL SUMMARY
echo -e "\n${BLUE}========================================"
echo "        AUDIT SUMMARY"
echo -e "========================================${NC}"

if [ "$GATE1_PASS" = true ] && [ "$AUDIT_PASS" = true ]; then
    echo -e "${GREEN}✅ ALL GATES PASSED - Ready to proceed${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ GATES FAILED - Issues must be fixed${NC}"
    echo -e "\nRequired Actions:"
    
    if [ "$GATE1_PASS" = false ]; then
        echo "1. Fix TypeScript errors to meet baseline"
    fi
    
    if [ "$AUDIT_PASS" = false ]; then
        echo "2. Fix security/quality issues identified above"
    fi
    
    echo "3. Re-run audit after fixes"
    EXIT_CODE=1
fi

echo -e "\nAudit log saved to: error-log-phase${PHASE}-day${DAY}-$(date +%Y%m%d-%H%M).txt"

# Update timestamp for next run
touch /tmp/.audit_timestamp

exit $EXIT_CODE