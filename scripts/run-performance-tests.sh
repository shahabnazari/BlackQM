#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 3: Performance Testing Execution Script
# Enterprise-Grade Load & Stress Testing with K6
#
# Purpose: Execute comprehensive performance tests and generate reports
# Duration: 3-4 hours total
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
echo -e "${BLUE}║  Phase 10 Day 5.7 Stage 3: Performance Testing         ║${NC}"
echo -e "${BLUE}║  Enterprise-Grade Load & Stress Testing with K6         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"
echo ""

# Check K6 installation
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ K6 is not installed${NC}"
    echo ""
    echo "Install K6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   sudo apt-get install k6"
    echo "  Docker:  docker pull grafana/k6"
    echo ""
    echo "Visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi
echo -e "${GREEN}✅ K6 is installed ($(k6 version | head -n 1))${NC}"

# Check if backend is running
if ! lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Backend is not running on port 4000${NC}"
    echo "   Please start the backend with: cd backend && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running on port 4000${NC}"

# Check test files exist
if [ ! -f "backend/test/performance/k6-literature-search.js" ]; then
    echo -e "${RED}❌ K6 test files not found${NC}"
    echo "   Expected: backend/test/performance/k6-*.js"
    exit 1
fi
echo -e "${GREEN}✅ K6 test scripts found${NC}"

echo ""

# Get auth token (optional, needed for authenticated tests)
echo -e "${YELLOW}🔐 Authentication Setup${NC}"
echo ""
read -p "Do you have a valid JWT token for authenticated tests? (y/n): " has_token

AUTH_TOKEN=""
if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
    read -p "Enter JWT token: " AUTH_TOKEN
    echo -e "${GREEN}✅ Auth token set${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping authenticated tests (extraction scenarios)${NC}"
fi
echo ""

# Create results directory
RESULTS_DIR="performance-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}📁 Results directory: $RESULTS_DIR${NC}"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}PERFORMANCE TESTING MENU${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

PS3="Select test scenario: "
options=(
    "Run All Tests (3+ hours, comprehensive)"
    "Test 1: Literature Search Load Test (10 min)"
    "Test 2: Theme Extraction Load Test (15 min, requires auth)"
    "Test 3: Mixed Workload Test (20 min, realistic usage)"
    "Test 4: Stress Test - Breaking Point (15 min)"
    "View Performance Testing Guide"
    "Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "Run All Tests (3+ hours, comprehensive)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}RUNNING ALL PERFORMANCE TESTS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "This will run all performance tests sequentially."
            echo "Estimated duration: 3+ hours"
            echo ""
            read -p "Continue? (y/n): " confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                continue
            fi

            # Test 1: Literature Search
            echo ""
            echo -e "${MAGENTA}▶ Test 1/4: Literature Search Load Test${NC}"
            k6 run --out json="$RESULTS_DIR/search-results.json" \
                backend/test/performance/k6-literature-search.js \
                | tee "$RESULTS_DIR/search-output.log"

            # Test 2: Theme Extraction (if auth token available)
            if [ -n "$AUTH_TOKEN" ]; then
                echo ""
                echo -e "${MAGENTA}▶ Test 2/4: Theme Extraction Load Test${NC}"
                k6 run -e AUTH_TOKEN="$AUTH_TOKEN" \
                    --out json="$RESULTS_DIR/extraction-results.json" \
                    backend/test/performance/k6-theme-extraction.js \
                    | tee "$RESULTS_DIR/extraction-output.log"
            else
                echo ""
                echo -e "${YELLOW}⚠️  Skipping Test 2 (no auth token)${NC}"
            fi

            # Test 3: Mixed Workload
            echo ""
            echo -e "${MAGENTA}▶ Test 3/4: Mixed Workload Test${NC}"
            k6 run -e AUTH_TOKEN="$AUTH_TOKEN" \
                --out json="$RESULTS_DIR/mixed-results.json" \
                backend/test/performance/k6-mixed-workload.js \
                | tee "$RESULTS_DIR/mixed-output.log"

            # Test 4: Stress Test
            echo ""
            echo -e "${MAGENTA}▶ Test 4/4: Stress Test${NC}"
            k6 run --out json="$RESULTS_DIR/stress-results.json" \
                backend/test/performance/k6-stress-test.js \
                | tee "$RESULTS_DIR/stress-output.log"

            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}✅ ALL PERFORMANCE TESTS COMPLETE${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Results saved to: $RESULTS_DIR"
            echo ""
            ;;

        "Test 1: Literature Search Load Test (10 min)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}TEST 1: LITERATURE SEARCH LOAD TEST${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Objective: Validate search endpoint under 50 concurrent users"
            echo "Duration: ~10 minutes"
            echo "SLA: p95 < 3s, error rate < 1%"
            echo ""

            k6 run --out json="$RESULTS_DIR/search-results.json" \
                backend/test/performance/k6-literature-search.js \
                | tee "$RESULTS_DIR/search-output.log"

            echo ""
            echo -e "${GREEN}✅ Search Load Test Complete${NC}"
            echo "Results: $RESULTS_DIR/search-results.json"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Test 2: Theme Extraction Load Test (15 min, requires auth)")
            echo ""
            if [ -z "$AUTH_TOKEN" ]; then
                echo -e "${RED}❌ This test requires a JWT token${NC}"
                echo ""
                read -p "Enter JWT token: " AUTH_TOKEN
                if [ -z "$AUTH_TOKEN" ]; then
                    echo -e "${RED}No token provided, skipping test${NC}"
                    read -p "Press Enter to continue..."
                    continue
                fi
            fi

            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}TEST 2: THEME EXTRACTION LOAD TEST${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "⚠️  WARNING: This test makes real OpenAI API calls"
            echo "Estimated cost: $2-5 for full test run"
            echo ""
            echo "Objective: Validate extraction under concurrent load"
            echo "Duration: ~15 minutes"
            echo "SLA: p95 < 30s, error rate < 2%, no rate limit violations"
            echo ""
            read -p "Continue? (y/n): " confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                continue
            fi

            k6 run -e AUTH_TOKEN="$AUTH_TOKEN" \
                --out json="$RESULTS_DIR/extraction-results.json" \
                backend/test/performance/k6-theme-extraction.js \
                | tee "$RESULTS_DIR/extraction-output.log"

            echo ""
            echo -e "${GREEN}✅ Extraction Load Test Complete${NC}"
            echo "Results: $RESULTS_DIR/extraction-results.json"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Test 3: Mixed Workload Test (20 min, realistic usage)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}TEST 3: MIXED WORKLOAD TEST${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Objective: Simulate realistic PhD researcher workflow"
            echo "Duration: ~20 minutes"
            echo "Traffic: 25 concurrent users across 5 scenarios"
            echo "SLA: All endpoints meet individual SLAs"
            echo ""

            k6 run -e AUTH_TOKEN="$AUTH_TOKEN" \
                --out json="$RESULTS_DIR/mixed-results.json" \
                backend/test/performance/k6-mixed-workload.js \
                | tee "$RESULTS_DIR/mixed-output.log"

            echo ""
            echo -e "${GREEN}✅ Mixed Workload Test Complete${NC}"
            echo "Results: $RESULTS_DIR/mixed-results.json"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Test 4: Stress Test - Breaking Point (15 min)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}TEST 4: STRESS TEST - BREAKING POINT ANALYSIS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Objective: Identify system breaking point"
            echo "Duration: ~15 minutes"
            echo "Load: Ramps from 0 → 200 concurrent users"
            echo "Expected: Graceful degradation, no crashes"
            echo ""
            read -p "Continue? This will stress the system. (y/n): " confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                continue
            fi

            k6 run --out json="$RESULTS_DIR/stress-results.json" \
                backend/test/performance/k6-stress-test.js \
                | tee "$RESULTS_DIR/stress-output.log"

            echo ""
            echo -e "${GREEN}✅ Stress Test Complete${NC}"
            echo "Results: $RESULTS_DIR/stress-results.json"
            echo ""
            echo -e "${YELLOW}📊 Analyze results to determine:${NC}"
            echo "  1. Comfortable capacity (0-5% error rate)"
            echo "  2. Degraded capacity (5-15% error rate)"
            echo "  3. Breaking point (>15% error rate)"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "View Performance Testing Guide")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}PERFORMANCE TESTING GUIDE${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📚 Documentation:"
            echo "  📄 backend/test/performance/STAGE3_PERFORMANCE_TESTING_GUIDE.md"
            echo ""
            echo "🧪 Test Scripts:"
            echo "  📄 backend/test/performance/k6-literature-search.js"
            echo "  📄 backend/test/performance/k6-theme-extraction.js"
            echo "  📄 backend/test/performance/k6-mixed-workload.js"
            echo "  📄 backend/test/performance/k6-stress-test.js"
            echo ""
            echo "Opening guide..."

            if command -v code &> /dev/null; then
                code backend/test/performance/STAGE3_PERFORMANCE_TESTING_GUIDE.md
            elif command -v open &> /dev/null; then
                open backend/test/performance/STAGE3_PERFORMANCE_TESTING_GUIDE.md
            else
                cat backend/test/performance/STAGE3_PERFORMANCE_TESTING_GUIDE.md | less
            fi

            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Exit")
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}PERFORMANCE TESTING SESSION COMPLETE${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            if [ -d "$RESULTS_DIR" ] && [ "$(ls -A $RESULTS_DIR)" ]; then
                echo "📊 Results saved to: $RESULTS_DIR"
                echo ""
                echo "Files created:"
                ls -lh "$RESULTS_DIR"
                echo ""
            fi
            echo "📋 Next Steps:"
            echo "  1. Analyze test results for SLA compliance"
            echo "  2. Identify performance bottlenecks"
            echo "  3. Document capacity limits"
            echo "  4. Proceed to Security Testing (OWASP ZAP)"
            echo ""
            echo "Success Criteria Checklist:"
            echo "  ✅ Search: p95 < 3s, error rate < 1%"
            echo "  ✅ Extraction: p95 < 30s, error rate < 2%"
            echo "  ✅ Mixed: All scenarios meet SLAs"
            echo "  ✅ Stress: Graceful degradation, no crashes"
            echo ""
            break
            ;;
        *)
            echo -e "${RED}Invalid option $REPLY${NC}"
            ;;
    esac
done
