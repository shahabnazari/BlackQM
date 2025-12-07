#!/bin/bash

# 150-Word Threshold Verification Script
# Tests that ALL sources use 150-word threshold

echo "======================================"
echo "150-Word Threshold Verification"
echo "======================================"
echo ""

SERVICES_DIR="src/modules/literature/services"
TOTAL_EXPECTED=16
ERRORS=0

echo "Test 1: Count all isPaperEligible calls with 150 threshold..."
COUNT_150=$(grep -r "isPaperEligible.*150" $SERVICES_DIR | wc -l | tr -d ' ')
echo "Found: $COUNT_150 instances with 150-word threshold"
echo "Expected: $TOTAL_EXPECTED instances"

if [ "$COUNT_150" -eq "$TOTAL_EXPECTED" ]; then
    echo "✅ PASS: All $TOTAL_EXPECTED instances use 150-word threshold"
else
    echo "❌ FAIL: Expected $TOTAL_EXPECTED but found $COUNT_150"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Test 2: Check for any remaining default calls (should be 0)..."
DEFAULT_CALLS=$(grep -r "isPaperEligible(wordCount)" $SERVICES_DIR | grep -v "isPaperEligible(wordCount," | wc -l | tr -d ' ')
echo "Found: $DEFAULT_CALLS default calls (without explicit threshold)"
echo "Expected: 0"

if [ "$DEFAULT_CALLS" -eq "0" ]; then
    echo "✅ PASS: No default calls remaining"
else
    echo "❌ FAIL: Found $DEFAULT_CALLS calls still using default 1000-word threshold"
    echo "Problematic calls:"
    grep -r "isPaperEligible(wordCount)" $SERVICES_DIR | grep -v "isPaperEligible(wordCount,"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Test 3: Verify each service file..."
SERVICES=(
    "arxiv.service.ts"
    "semantic-scholar.service.ts"
    "sage.service.ts"
    "wiley.service.ts"
    "taylor-francis.service.ts"
    "eric.service.ts"
    "ieee.service.ts"
    "nature.service.ts"
    "scopus.service.ts"
    "web-of-science.service.ts"
    "pubmed.service.ts"
    "pmc.service.ts"
    "crossref.service.ts"
    "core.service.ts"
    "springer.service.ts"
)

for service in "${SERVICES[@]}"; do
    SERVICE_FILE="$SERVICES_DIR/$service"
    if grep -q "isPaperEligible.*150" "$SERVICE_FILE"; then
        echo "  ✅ $service - Uses 150-word threshold"
    else
        echo "  ❌ $service - MISSING 150-word threshold!"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    echo "======================================"
    echo ""
    echo "Summary:"
    echo "  • 16 instances updated ✅"
    echo "  • 0 default calls remaining ✅"
    echo "  • All 15 services verified ✅"
    echo ""
    echo "Next step: Restart backend and test search!"
    exit 0
else
    echo "❌ $ERRORS TEST(S) FAILED!"
    echo "======================================"
    echo ""
    echo "Please review the errors above and fix them."
    exit 1
fi


