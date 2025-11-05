#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 2 Phase 1: Automated Test Execution Script
# Enterprise-Grade Test Runner
#
# Purpose: Execute all automated tests for Stage 2 Phase 1 and generate reports
# Success Criteria: ≥90% test pass rate across all categories
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 10 Day 5.7 Stage 2 Phase 1: Automated Testing    ║${NC}"
echo -e "${BLUE}║  Enterprise-Grade Test Suite Execution                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}📋 Pre-Flight Checks${NC}"
echo "   Checking if backend is running on port 4000..."

if ! lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Backend is not running on port 4000${NC}"
    echo "   Please start the backend with: cd backend && npm run start:dev"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

echo -e "${YELLOW}📦 Installing Dependencies${NC}"
npm install --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create test results directory
mkdir -p test-results

##########################################################################
# CATEGORY 1: E2E Tests - Critical Path (Stage 1 Validation)
##########################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CATEGORY 1: E2E Tests - Critical Path Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if npm run test:e2e -- test/e2e/literature-critical-path.e2e-spec.ts 2>&1 | tee test-results/e2e-critical-path.log; then
    echo -e "${GREEN}✅ Critical Path E2E Tests: PASSED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Critical Path E2E Tests: FAILED${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

##########################################################################
# CATEGORY 2: E2E Tests - Comprehensive (Stage 2 Phase 1)
##########################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CATEGORY 2: E2E Tests - Comprehensive Coverage${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if npm run test:e2e -- test/e2e/literature-comprehensive.e2e-spec.ts 2>&1 | tee test-results/e2e-comprehensive.log; then
    echo -e "${GREEN}✅ Comprehensive E2E Tests: PASSED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Comprehensive E2E Tests: FAILED${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

##########################################################################
# CATEGORY 3: Unit Tests - Theme Extraction Service
##########################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CATEGORY 3: Unit Tests - Theme Extraction Service${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if npm run test -- src/modules/literature/services/__tests__/unified-theme-extraction.service.spec.ts --coverage 2>&1 | tee test-results/unit-theme-extraction.log; then
    echo -e "${GREEN}✅ Theme Extraction Unit Tests: PASSED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Theme Extraction Unit Tests: FAILED${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

##########################################################################
# CATEGORY 4: Integration Tests - Literature Pipeline
##########################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CATEGORY 4: Integration Tests - Literature Pipeline${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if npm run test:e2e -- test/integration/literature-pipeline.integration.spec.ts 2>&1 | tee test-results/integration-pipeline.log; then
    echo -e "${GREEN}✅ Pipeline Integration Tests: PASSED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Pipeline Integration Tests: FAILED${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

##########################################################################
# CATEGORY 5: Performance Tests - Load and Stress Testing
##########################################################################
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CATEGORY 5: Performance Tests - Load Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if npm run test:e2e -- test/performance/literature-performance.spec.ts 2>&1 | tee test-results/performance.log; then
    echo -e "${GREEN}✅ Performance Tests: PASSED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Performance Tests: FAILED${NC}"
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))
echo ""

##########################################################################
# FINAL REPORT
##########################################################################
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           STAGE 2 PHASE 1 TEST EXECUTION SUMMARY         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")

echo "   Total Test Suites:  $TOTAL_TESTS"
echo -e "   ${GREEN}Passed:            $PASSED_TESTS${NC}"
echo -e "   ${RED}Failed:            $FAILED_TESTS${NC}"
echo ""
echo "   Success Rate:       $SUCCESS_RATE%"
echo ""

# Determine overall status
if (( $(echo "$SUCCESS_RATE >= 90" | bc -l) )); then
    echo -e "${GREEN}✅ STAGE 2 PHASE 1: PASSED (≥90% success rate)${NC}"
    echo -e "${GREEN}🚀 Ready for Stage 2 Phase 2 (Manual Testing)${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ STAGE 2 PHASE 1: FAILED (<90% success rate)${NC}"
    echo -e "${RED}⚠️  Please review failed tests before proceeding${NC}"
    EXIT_CODE=1
fi

echo ""
echo "📋 Detailed test results available in: backend/test-results/"
echo ""

# Generate summary report
cat > test-results/summary.txt <<EOL
PHASE 10 DAY 5.7 STAGE 2 PHASE 1: AUTOMATED TESTING SUMMARY
===========================================================

Execution Date: $(date)

Test Categories:
1. E2E Tests - Critical Path: $([ $PASSED_TESTS -ge 1 ] && echo "✅ PASSED" || echo "❌ FAILED")
2. E2E Tests - Comprehensive: $([ $PASSED_TESTS -ge 2 ] && echo "✅ PASSED" || echo "❌ FAILED")
3. Unit Tests - Theme Extraction: $([ $PASSED_TESTS -ge 3 ] && echo "✅ PASSED" || echo "❌ FAILED")
4. Integration Tests - Pipeline: $([ $PASSED_TESTS -ge 4 ] && echo "✅ PASSED" || echo "❌ FAILED")
5. Performance Tests - Load: $([ $PASSED_TESTS -ge 5 ] && echo "✅ PASSED" || echo "❌ FAILED")

Overall Statistics:
-------------------
Total Test Suites: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS
Success Rate: $SUCCESS_RATE%

Overall Status: $([ $EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

Next Steps:
-----------
$([ $EXIT_CODE -eq 0 ] && echo "✅ Proceed to Stage 2 Phase 2 (Manual Testing)" || echo "⚠️  Fix failed tests before proceeding")

Test Logs:
----------
- Critical Path E2E: test-results/e2e-critical-path.log
- Comprehensive E2E: test-results/e2e-comprehensive.log
- Unit Tests: test-results/unit-theme-extraction.log
- Integration Tests: test-results/integration-pipeline.log
- Performance Tests: test-results/performance.log

EOL

echo "📄 Summary report saved to: backend/test-results/summary.txt"
echo ""

exit $EXIT_CODE
