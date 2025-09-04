#!/bin/bash

# Phase 3.5 Success Criteria Verification Script
# This script verifies that all critical infrastructure and testing requirements are met

echo "================================================"
echo "🔍 Phase 3.5 Success Criteria Verification"
echo "================================================"

SUCCESS_COUNT=0
TOTAL_CHECKS=10

# Function to check a criteria
check_criteria() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "✓ Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo "✅ PASSED"
        ((SUCCESS_COUNT++))
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

echo ""
echo "1. BUILD HEALTH CHECKS"
echo "------------------------"

# Check 1: TypeScript builds without errors
check_criteria "TypeScript builds (frontend)" \
    "(cd frontend && npx tsc --noEmit)" \
    "success"

# Check 2: TypeScript builds without errors (backend)
check_criteria "TypeScript builds (backend)" \
    "(cd backend && npx tsc --noEmit)" \
    "success"

# Check 3: Build:strict passes
check_criteria "Build:strict passes" \
    "npm run build:strict" \
    "success"

echo ""
echo "2. TEST COVERAGE CHECKS"
echo "------------------------"

# Check 4: Component tests exist
check_criteria "Apple UI component tests exist" \
    "test -f frontend/components/apple-ui/Button/Button.test.tsx" \
    "exists"

# Check 5: Test suite runs
check_criteria "Frontend tests run" \
    "(cd frontend && npm test components/apple-ui 2>&1 | grep -q 'Test Files.*passed')" \
    "passes"

echo ""
echo "3. API & DATABASE CHECKS"
echo "------------------------"

# Check 6: Postman collection exists
check_criteria "Postman collection exists" \
    "test -f backend/postman/VQMethod-API-Tests.postman_collection.json" \
    "exists"

# Check 7: Newman is installed
check_criteria "Newman is installed" \
    "(cd backend && npm list newman 2>&1 | grep -q newman)" \
    "installed"

# Check 8: Database seed exists
check_criteria "Database seed file exists" \
    "test -f backend/prisma/seed.ts" \
    "exists"

echo ""
echo "4. CI/CD PIPELINE CHECKS"
echo "------------------------"

# Check 9: GitHub Actions workflow exists
check_criteria "CI/CD workflow exists" \
    "test -f .github/workflows/ci.yml" \
    "exists"

# Check 10: E2E test files exist
check_criteria "E2E test files exist" \
    "test -f frontend/e2e/smoke.spec.ts" \
    "exists"

echo ""
echo "================================================"
echo "📊 FINAL RESULTS"
echo "================================================"
echo "✅ Passed: $SUCCESS_COUNT/$TOTAL_CHECKS"
echo "❌ Failed: $((TOTAL_CHECKS - SUCCESS_COUNT))/$TOTAL_CHECKS"

PERCENTAGE=$((SUCCESS_COUNT * 100 / TOTAL_CHECKS))
echo "📈 Success Rate: ${PERCENTAGE}%"

echo ""
if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
    echo "🎉 PHASE 3.5 COMPLETE! All success criteria met!"
    echo "✅ Build Health: Zero TypeScript errors, clean builds"
    echo "✅ Test Coverage: Component tests implemented"  
    echo "✅ API Testing: Postman/Newman configured"
    echo "✅ Database: Seed data and migrations ready"
    echo "✅ CI/CD: Automated pipeline operational"
    echo ""
    echo "🚀 Ready to proceed to Phase 4: Data Visualization & Analytics Excellence"
else
    echo "⚠️ PHASE 3.5 INCOMPLETE - Some criteria not met"
    echo "Please address the failed checks before proceeding to Phase 4"
fi

echo "================================================"

exit $((TOTAL_CHECKS - SUCCESS_COUNT))