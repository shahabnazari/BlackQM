#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 2 Phase 4: Edge Case Testing Execution Script
# Enterprise-Grade Boundary Validation
#
# Purpose: Execute automated edge case tests and guide manual testing
# Duration: 2-3 hours (automated: 30 min, manual: 2 hours)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 10 Day 5.7 Stage 2 Phase 4: Edge Case Testing   ║${NC}"
echo -e "${BLUE}║  Enterprise-Grade Boundary Validation                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"
echo ""

# Check if frontend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Frontend is not running on port 3000${NC}"
    echo "   Please start the frontend with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"

# Check if backend is running
if ! lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Backend is not running on port 4000${NC}"
    echo "   Please start the backend with: cd backend && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running on port 4000${NC}"

# Check test files exist
if [ ! -f "backend/test/edge-cases/edge-case-validation.spec.ts" ]; then
    echo -e "${RED}❌ Edge case test file not found${NC}"
    echo "   Expected: backend/test/edge-cases/edge-case-validation.spec.ts"
    exit 1
fi
echo -e "${GREEN}✅ Edge case test suite found${NC}"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}EDGE CASE TESTING WORKFLOW${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

PS3="Select testing mode: "
options=(
    "Run Automated Edge Case Tests (30 minutes)"
    "Manual Testing Guide - Data Extremes (45 minutes)"
    "Manual Testing Guide - Network Chaos (45 minutes)"
    "Manual Testing Guide - Concurrent Operations (30 minutes)"
    "View Full Edge Case Testing Guide"
    "Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "Run Automated Edge Case Tests (30 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}AUTOMATED EDGE CASE TESTS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Running 13 automated edge case tests..."
            echo ""

            cd backend

            # Run edge case tests
            npm run test -- test/edge-cases/edge-case-validation.spec.ts

            TEST_EXIT_CODE=$?

            if [ $TEST_EXIT_CODE -eq 0 ]; then
                echo ""
                echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
                echo -e "${GREEN}✅ ALL AUTOMATED EDGE CASE TESTS PASSED${NC}"
                echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
                echo ""
                echo "Tests Covered:"
                echo "  ✅ EDGE-001: 100+ authors handling"
                echo "  ✅ EDGE-002: Missing abstract handling"
                echo "  ✅ EDGE-003: Single paper extraction"
                echo "  ✅ EDGE-004: Invalid DOI handling"
                echo "  ✅ EDGE-005: Long title handling"
                echo "  ✅ EDGE-006: Special characters & injection prevention"
                echo "  ✅ EDGE-007: Empty/null sources validation"
                echo "  ✅ EDGE-008: Concurrent operations"
                echo "  ✅ EDGE-009: Zero-result searches"
                echo "  ✅ EDGE-010: Missing year handling"
                echo "  ✅ EDGE-011: Empty authors array"
                echo "  ✅ EDGE-012: Large abstract handling"
                echo "  ✅ EDGE-013: Missing required fields validation"
                echo ""
                echo "Next Steps:"
                echo "  1. Complete manual testing (options 2-4)"
                echo "  2. Review edge case testing guide for full coverage"
                echo ""
            else
                echo ""
                echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
                echo -e "${RED}❌ SOME AUTOMATED TESTS FAILED${NC}"
                echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
                echo ""
                echo "Please review test output above for failures."
                echo "Address critical issues before proceeding to manual tests."
                echo ""
            fi

            cd ..
            read -p "Press Enter to continue..."
            ;;
        "Manual Testing Guide - Data Extremes (45 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}MANUAL TESTING: DATA EXTREMES${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📖 Test scenarios for extreme data conditions:"
            echo ""
            echo "Test 1.1: Paper with 100+ Authors"
            echo "  - Search: 'ATLAS Collaboration Higgs boson'"
            echo "  - Validate: Author list truncated with expand option"
            echo ""
            echo "Test 1.2: Paper with No Abstract"
            echo "  - Search: 'economics methodology' (Crossref)"
            echo "  - Validate: System detects missing abstract, skips gracefully"
            echo ""
            echo "Test 1.3: Search with 10K Results"
            echo "  - Search: 'machine learning' (multiple sources)"
            echo "  - Validate: Pagination works, no memory leak"
            echo ""
            echo "Test 1.4: Extraction with 1 Paper"
            echo "  - Select: Single paper for theme extraction"
            echo "  - Validate: 3-8 themes generated, proper provenance"
            echo ""
            echo "Test 1.5: Extraction with 100 Papers"
            echo "  - Select: 100 papers (if possible)"
            echo "  - Validate: Warning shown, sampling option offered"
            echo ""
            echo "Test 1.6: Video-Only Extraction"
            echo "  - Add: 3 YouTube videos, 0 papers"
            echo "  - Validate: Extraction works, video-specific themes"
            echo ""
            echo "📄 Full guide: backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md"
            echo "   Part 1: Data Extremes Testing (lines 33-290)"
            echo ""
            echo -e "${YELLOW}Action: Complete all 6 tests and record ratings${NC}"
            echo "Target: ≥5/6 tests with rating ≥2 (83% pass rate)"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Manual Testing Guide - Network Chaos (45 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}MANUAL TESTING: NETWORK CHAOS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📖 Test scenarios for network failures:"
            echo ""
            echo "Test 2.1: Network Disconnect During Search"
            echo "  - Start search, then disconnect Wi-Fi"
            echo "  - Validate: Error toast shown, retry option available"
            echo ""
            echo "Test 2.2: Network Disconnect During Extraction"
            echo "  - Start extraction, disconnect at 40% progress"
            echo "  - Validate: Partial results saved, retry option offered"
            echo ""
            echo "Test 2.3: OpenAI API Rate Limit (429 Error)"
            echo "  - Trigger rapid extractions until rate limit hit"
            echo "  - Validate: Automatic retry with exponential backoff"
            echo ""
            echo "Test 2.4: API Timeout (>2 minutes)"
            echo "  - Start 10+ paper extraction"
            echo "  - Validate: Timeout set to ≥10 minutes, partial results if timeout"
            echo ""
            echo "📄 Full guide: backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md"
            echo "   Part 2: Network Chaos Testing (lines 292-445)"
            echo ""
            echo -e "${YELLOW}Testing Tools:${NC}"
            echo "  - macOS: Turn off Wi-Fi to simulate disconnect"
            echo "  - Chrome DevTools: Network tab → Throttling → Offline"
            echo "  - Chrome DevTools: Network tab → Slow 3G for timeout testing"
            echo ""
            echo -e "${YELLOW}Action: Complete all 4 tests and record ratings${NC}"
            echo "Target: ≥3/4 tests with rating ≥2 (75% pass rate)"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Manual Testing Guide - Concurrent Operations (30 minutes)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}MANUAL TESTING: CONCURRENT OPERATIONS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📖 Test scenarios for concurrent operations:"
            echo ""
            echo "Test 3.1: Two Simultaneous Theme Extractions"
            echo "  - Open app in 2 browser tabs"
            echo "  - Start extraction in both simultaneously"
            echo "  - Validate: Both complete independently, correct rate limiting"
            echo ""
            echo "Test 3.2: Browser Tab Closure During Extraction"
            echo "  - Start extraction, close tab at 30% progress"
            echo "  - Reopen app and check library/history"
            echo "  - Validate: Background processing or partial results saved"
            echo ""
            echo "Test 3.3: Session Timeout During Long Extraction"
            echo "  - Start 25-paper extraction (takes >5 minutes)"
            echo "  - JWT token may expire during extraction"
            echo "  - Validate: Token refresh or graceful session expiration"
            echo ""
            echo "📄 Full guide: backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md"
            echo "   Part 3: Concurrent Operations Testing (lines 447-559)"
            echo ""
            echo -e "${YELLOW}Action: Complete all 3 tests and record ratings${NC}"
            echo "Target: ≥2/3 tests with rating ≥2 (67% pass rate)"
            echo ""
            read -p "Press Enter to continue..."
            ;;
        "View Full Edge Case Testing Guide")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}FULL EDGE CASE TESTING GUIDE${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📚 Documentation:"
            echo ""
            echo "Main Guide:"
            echo "  📄 backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md"
            echo "     Complete edge case testing procedures and rating scales"
            echo ""
            echo "Test Data:"
            echo "  📄 backend/test/edge-cases/test-data/100-papers-payload.json"
            echo "     Sample payload for large-scale extraction testing"
            echo ""
            echo "Automated Tests:"
            echo "  📄 backend/test/edge-cases/edge-case-validation.spec.ts"
            echo "     13 automated boundary condition tests"
            echo ""
            echo "Guide Structure:"
            echo "  - Part 1: Data Extremes (6 tests, 45 min)"
            echo "  - Part 2: Network Chaos (4 tests, 45 min)"
            echo "  - Part 3: Concurrent Operations (3 tests, 30 min)"
            echo "  - Part 4: Malformed Data (3 tests, 30 min)"
            echo ""
            echo -e "${YELLOW}Opening guide...${NC}"

            if command -v code &> /dev/null; then
                code backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md
            elif command -v open &> /dev/null; then
                open backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md
            else
                cat backend/test/edge-cases/STAGE2_PHASE4_EDGE_CASE_TESTING_GUIDE.md | less
            fi

            echo ""
            read -p "Press Enter to continue..."
            ;;
        "Exit")
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}EDGE CASE TESTING SESSION COMPLETE${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📋 Remember to:"
            echo "  1. Complete all automated tests (13 tests)"
            echo "  2. Complete manual testing (16 tests across 4 parts)"
            echo "  3. Calculate overall success rate"
            echo "  4. Document critical issues"
            echo "  5. Update Phase Tracker with results"
            echo ""
            echo "Success Criteria:"
            echo "  ✅ Automated tests: 100% pass rate (13/13)"
            echo "  ✅ Manual tests: ≥90% pass rate (14/16 tests with rating ≥2)"
            echo "  ✅ No crashes or data corruption"
            echo "  ✅ All edge cases degrade gracefully"
            echo ""
            echo "Next Step: Stage 3 (Cross-Cutting Concerns)"
            echo "  - Performance testing with K6"
            echo "  - Security testing with OWASP ZAP"
            echo "  - Browser compatibility testing"
            echo ""
            break
            ;;
        *)
            echo -e "${RED}Invalid option $REPLY${NC}"
            ;;
    esac
done
