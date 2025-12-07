#!/bin/bash

# ============================================
# Phase 10.106 - Phase 1 Test Execution Script
# Netflix-Grade Quality Standards
# ============================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🚀 PHASE 10.106 - PHASE 1 TEST EXECUTION"
echo "   Netflix-Grade | Strict Mode | Full Integration"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

echo "🔍 Running pre-flight checks..."
echo ""

# Phase 10.106: Use configurable API base URL (default 3001 for dev, 4000 for test)
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
echo "   🌐 API Base URL: $API_BASE_URL"

# Check if backend is running (try both common ports)
echo "   Checking backend status..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    API_BASE_URL="http://localhost:3001"
    echo "   ✅ Backend running on port 3001"
elif curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    API_BASE_URL="http://localhost:4000"
    echo "   ✅ Backend running on port 4000"
else
    echo "   ❌ Backend is not running on port 3001 or 4000!"
    echo "   📌 Start backend with: cd backend && npm run start:dev"
    exit 1
fi
export API_BASE_URL
echo ""

# Check Node.js version
echo "   Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   ✅ Node.js: $NODE_VERSION"
echo ""

# Check TypeScript compiler
echo "   Checking TypeScript compiler..."
if ! npx tsc --version > /dev/null 2>&1; then
    echo "   ❌ TypeScript compiler not found!"
    exit 1
fi
echo "   ✅ TypeScript compiler ready"
echo ""

# ============================================
# COMPILE TEST RUNNER
# ============================================

echo "🔨 Compiling test runner (Strict Mode)..."
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend

# Compile with strict mode
if ! npx tsc src/scripts/phase-10.106-test-runner.ts --strict --esModuleInterop --skipLibCheck --outDir dist/scripts; then
    echo "❌ Compilation failed!"
    exit 1
fi
echo "✅ Compilation successful"
echo ""

# ============================================
# CREATE OUTPUT DIRECTORY
# ============================================

echo "📁 Preparing output directory..."
mkdir -p /Users/shahabnazariadli/Documents/blackQmethhod/test-results/phase-10.106
echo "✅ Output directory ready"
echo ""

# ============================================
# AUTHENTICATION
# ============================================

echo "🔐 Authenticating..."

# Check if JWT_TOKEN is already set
if [ -z "$JWT_TOKEN" ]; then
    echo "   No JWT_TOKEN environment variable found"
    echo "   Attempting to login with test credentials..."

    # Create login payload
    cat > /tmp/login.json << 'EOF'
{
  "email": "phase1test@blackqmethod.com",
  "password": "Phase1Test2025"
}
EOF

    # Login and extract token (using detected API_BASE_URL)
    JWT_TOKEN=$(curl -s -X POST "${API_BASE_URL}/api/auth/login" \
      -H "Content-Type: application/json" \
      -d @/tmp/login.json | jq -r '.accessToken')

    if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
        echo "   ❌ Failed to obtain JWT token!"
        echo "   Please set JWT_TOKEN environment variable manually"
        exit 1
    fi

    export JWT_TOKEN
    echo "   ✅ Authentication successful"
else
    echo "   ✅ Using existing JWT_TOKEN from environment"
fi
echo ""

# ============================================
# EXECUTE TESTS
# ============================================

echo "🧪 Executing Phase 1 tests..."
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Run the test runner with JWT token
JWT_TOKEN=$JWT_TOKEN node dist/scripts/phase-10.106-test-runner.js

# Capture exit code
TEST_EXIT_CODE=$?

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# ============================================
# POST-TEST ANALYSIS
# ============================================

echo "📊 Test Results:"
echo ""

cd /Users/shahabnazariadli/Documents/blackQmethhod/test-results/phase-10.106

# Count result files
RESULT_COUNT=$(ls -1 test-*.json 2>/dev/null | wc -l)
echo "   📄 Result files generated: $RESULT_COUNT"
echo ""

# Check for summary
if [ -f "phase-1-summary.json" ]; then
    echo "   ✅ Summary report: phase-1-summary.json"
    echo ""

    # Extract key metrics using jq (if available)
    if command -v jq &> /dev/null; then
        PASSED=$(jq -r '.passed' phase-1-summary.json)
        FAILED=$(jq -r '.failed' phase-1-summary.json)
        ERRORS=$(jq -r '.errors' phase-1-summary.json)
        DURATION=$(jq -r '.totalDuration' phase-1-summary.json)

        echo "   📈 Test Statistics:"
        echo "      ✅ Passed: $PASSED"
        echo "      ❌ Failed: $FAILED"
        echo "      🔴 Errors: $ERRORS"
        echo "      ⏱️  Duration: ${DURATION}s"
        echo ""

        # Check Netflix-grade criteria
        HTTP_429_OK=$(jq -r '.netflixGradeCriteria.zeroHttp429Errors' phase-1-summary.json)
        PUBMED_OK=$(jq -r '.netflixGradeCriteria.pubmedReturningPapers' phase-1-summary.json)
        ALL_PASS=$(jq -r '.netflixGradeCriteria.allTestsPassed' phase-1-summary.json)

        echo "   🎯 Netflix-Grade Criteria:"
        [ "$HTTP_429_OK" = "true" ] && echo "      ✅ Zero HTTP 429 Errors" || echo "      ❌ HTTP 429 Errors Detected"
        [ "$PUBMED_OK" = "true" ] && echo "      ✅ PubMed Returning Papers" || echo "      ❌ PubMed Not Working"
        [ "$ALL_PASS" = "true" ] && echo "      ✅ All Tests Passed" || echo "      ❌ Some Tests Failed"
        echo ""
    fi
else
    echo "   ⚠️  No summary report found"
    echo ""
fi

# ============================================
# FINAL STATUS
# ============================================

echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ PHASE 1 TESTS COMPLETED SUCCESSFULLY"
    echo ""
    echo "   Next Steps:"
    echo "   1. Review detailed results in test-results/phase-10.106/"
    echo "   2. Proceed to Phase 2 (Remaining Individual Sources)"
    echo ""
else
    echo "❌ PHASE 1 TESTS FAILED"
    echo ""
    echo "   Next Steps:"
    echo "   1. Review test failures in test-results/phase-10.106/"
    echo "   2. Check backend logs for errors"
    echo "   3. Fix issues before proceeding to Phase 2"
    echo ""
fi

echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

exit $TEST_EXIT_CODE
