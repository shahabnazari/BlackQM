#!/bin/bash

###############################################################################
# Phase 10.93 Day 9 - Cross-Browser Test Execution Script
#
# Automates cross-browser testing across Chrome, Firefox, Safari, Edge,
# and mobile browsers. Collects performance metrics and generates reports.
#
# Usage:
#   ./scripts/run-cross-browser-tests.sh [options]
#
# Options:
#   --all              Run all browsers (default)
#   --chrome           Run Chrome only
#   --firefox          Run Firefox only
#   --safari           Run Safari only
#   --edge             Run Edge only
#   --mobile           Run mobile browsers only
#   --headed           Run in headed mode (see browser)
#   --debug            Enable debug mode
#   --report           Generate HTML report
#
# Examples:
#   ./scripts/run-cross-browser-tests.sh --all --report
#   ./scripts/run-cross-browser-tests.sh --chrome --headed
#   ./scripts/run-cross-browser-tests.sh --mobile --debug
#
# @since Phase 10.93 Day 9
# @author VQMethod Team
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
RUN_ALL=false
RUN_CHROME=false
RUN_FIREFOX=false
RUN_SAFARI=false
RUN_EDGE=false
RUN_MOBILE=false
HEADED=false
DEBUG=false
GENERATE_REPORT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      RUN_ALL=true
      shift
      ;;
    --chrome)
      RUN_CHROME=true
      shift
      ;;
    --firefox)
      RUN_FIREFOX=true
      shift
      ;;
    --safari)
      RUN_SAFARI=true
      shift
      ;;
    --edge)
      RUN_EDGE=true
      shift
      ;;
    --mobile)
      RUN_MOBILE=true
      shift
      ;;
    --headed)
      HEADED=true
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --report)
      GENERATE_REPORT=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# If no specific browser selected, run all
if [ "$RUN_ALL" = false ] && [ "$RUN_CHROME" = false ] && [ "$RUN_FIREFOX" = false ] && [ "$RUN_SAFARI" = false ] && [ "$RUN_EDGE" = false ] && [ "$RUN_MOBILE" = false ]; then
  RUN_ALL=true
fi

# Print header
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 10.93 Day 9 - Cross-Browser Testing Suite             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Must be run from project root${NC}"
  exit 1
fi

# Navigate to frontend directory
cd frontend || exit 1

# Check if Playwright is installed
if ! npm list @playwright/test > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing Playwright...${NC}"
  npm install --save-dev @playwright/test
  npx playwright install
fi

# Create test results directory
mkdir -p test-results/cross-browser
mkdir -p test-results/screenshots
mkdir -p playwright-report

# Build Playwright command
PLAYWRIGHT_CMD="npx playwright test e2e/cross-browser-theme-extraction.spec.ts"

# Add headed mode if requested
if [ "$HEADED" = true ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --headed"
fi

# Add debug mode if requested
if [ "$DEBUG" = true ]; then
  PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --debug"
fi

# Start development server in background
echo -e "${BLUE}Starting development server...${NC}"
npm run dev > /dev/null 2>&1 &
DEV_SERVER_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
sleep 5

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}Error: Development server failed to start${NC}"
  kill $DEV_SERVER_PID 2> /dev/null || true
  exit 1
fi

echo -e "${GREEN}Server is ready!${NC}"
echo ""

# Function to run tests for a specific browser
run_browser_tests() {
  local browser=$1
  local project=$2

  echo -e "${BLUE}Testing $browser...${NC}"

  if $PLAYWRIGHT_CMD --project="$project" --reporter=json --output=test-results/cross-browser/$browser.json; then
    echo -e "${GREEN}✓ $browser tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $browser tests failed${NC}"
    return 1
  fi
}

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run tests for each browser
if [ "$RUN_ALL" = true ] || [ "$RUN_CHROME" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_browser_tests "Chrome" "chromium"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_FIREFOX" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_browser_tests "Firefox" "firefox"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_SAFARI" = true ]; then
  # Check if running on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_browser_tests "Safari" "webkit"; then
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
  else
    echo -e "${YELLOW}Skipping Safari (macOS only)${NC}"
    echo ""
  fi
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_EDGE" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if run_browser_tests "Edge" "edge"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

if [ "$RUN_ALL" = true ] || [ "$RUN_MOBILE" = true ]; then
  TOTAL_TESTS=$((TOTAL_TESTS + 2))

  if run_browser_tests "Mobile Chrome" "Mobile Chrome"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""

  if run_browser_tests "Mobile Safari" "Mobile Safari"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
fi

# Stop development server
echo -e "${YELLOW}Stopping development server...${NC}"
kill $DEV_SERVER_PID 2> /dev/null || true

# Generate HTML report if requested
if [ "$GENERATE_REPORT" = true ]; then
  echo -e "${BLUE}Generating HTML report...${NC}"
  npx playwright show-report playwright-report
fi

# Print summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Browsers Tested:  $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:                $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed:                $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ All cross-browser tests passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Check logs above for details.${NC}"
  echo ""
  exit 1
fi
