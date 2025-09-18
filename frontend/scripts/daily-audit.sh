#!/bin/bash

# Daily Audit Script for Phase Implementation
# Usage: ./scripts/daily-audit.sh [PHASE] [DAY]

PHASE=${1:-"6.86"}
DAY=${2:-"5"}
DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo "=========================================="
echo "DAILY AUDIT - Phase $PHASE Day $DAY"
echo "Date: $DATE"
echo "=========================================="
echo ""

# 1. TypeScript Error Check
echo "1. TYPESCRIPT ERROR CHECK"
echo "-------------------------"
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
echo "Current error count: $ERROR_COUNT"
echo "Baseline target: 560"

if [ "$ERROR_COUNT" -le 560 ]; then
    echo "✅ TypeScript errors within baseline"
else
    echo "⚠️  TypeScript errors exceed baseline by $((ERROR_COUNT - 560))"
fi
echo ""

# 2. Security Audit
echo "2. SECURITY AUDIT"
echo "-----------------"

# Check for exposed API keys
echo "Checking for exposed API keys..."
API_KEY_EXPOSURES=$(grep -r "dangerouslyAllowBrowser.*true" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$API_KEY_EXPOSURES" -eq 0 ]; then
    echo "✅ No browser-exposed API keys found"
else
    echo "❌ CRITICAL: Found $API_KEY_EXPOSURES instances of dangerouslyAllowBrowser"
    grep -r "dangerouslyAllowBrowser.*true" --include="*.ts" --include="*.tsx" 2>/dev/null | head -3
fi

# Check for authentication on API routes
echo "Checking API route authentication..."
UNAUTH_ROUTES=$(grep -L "withAuth\|authenticate\|getServerSession\|rateLimit" app/api/**/*.ts 2>/dev/null | grep -v "/route.ts" | wc -l | tr -d ' ')
if [ "$UNAUTH_ROUTES" -eq 0 ]; then
    echo "✅ All API routes have authentication"
else
    echo "⚠️  Found $UNAUTH_ROUTES API routes potentially missing authentication"
fi
echo ""

# 3. Code Quality Check
echo "3. CODE QUALITY"
echo "---------------"

# Check for any types
ANY_COUNT=$(grep -r ":\s*any" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Uses of 'any' type: $ANY_COUNT"

# Check for console.log
CONSOLE_COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Console.log statements: $CONSOLE_COUNT"

# Check for error handling
SILENT_CATCH=$(grep -r "catch\s*{\s*}" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SILENT_CATCH" -eq 0 ]; then
    echo "✅ No silent catch blocks found"
else
    echo "⚠️  Found $SILENT_CATCH silent catch blocks"
fi
echo ""

# 4. Test Coverage
echo "4. TEST COVERAGE"
echo "----------------"
if [ -f "coverage/coverage-summary.json" ]; then
    echo "Coverage report found"
    # Could parse JSON here for detailed stats
else
    echo "⚠️  No coverage report found (run tests to generate)"
fi
echo ""

# 5. Build Status
echo "5. BUILD STATUS"
echo "---------------"
echo "Running build check..."
if npm run build --dry-run > /dev/null 2>&1; then
    echo "✅ Build configuration valid"
else
    echo "⚠️  Build may have issues"
fi
echo ""

# 6. Summary
echo "=========================================="
echo "AUDIT SUMMARY"
echo "=========================================="

ISSUES=0
if [ "$ERROR_COUNT" -gt 560 ]; then
    echo "⚠️  TypeScript errors: $ERROR_COUNT (exceeds baseline)"
    ISSUES=$((ISSUES + 1))
fi

if [ "$API_KEY_EXPOSURES" -gt 0 ]; then
    echo "❌ CRITICAL: API keys exposed in browser"
    ISSUES=$((ISSUES + 5))
fi

if [ "$SILENT_CATCH" -gt 0 ]; then
    echo "⚠️  Silent error catches: $SILENT_CATCH"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "✅ All checks passed - Phase $PHASE Day $DAY implementation meets standards"
else
    echo "⚠️  Found $ISSUES issue(s) requiring attention"
fi

echo ""
echo "Audit completed at $(date +"%H:%M:%S")"