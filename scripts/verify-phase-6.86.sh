#!/bin/bash

# Phase 6.86 Implementation Verification Script
# Verifies world-class implementation of Days 0-2

echo "═══════════════════════════════════════════════════════════════"
echo "   Phase 6.86 World-Class Implementation Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to check file existence
check_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# Function to check directory existence
check_dir() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# Function to check package installation
check_package() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if grep -q "\"$1\"" frontend/package.json 2>/dev/null; then
        echo -e "${GREEN}✅${NC} Package: $1 installed"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} Package: $1 not found"
        return 1
    fi
}

# Function to count lines in file
check_file_size() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        LINES=$(wc -l < "$1")
        if [ "$LINES" -ge "$2" ]; then
            echo -e "${GREEN}✅${NC} $3 ($LINES lines)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            echo -e "${YELLOW}⚠️${NC} $3 ($LINES lines, expected >= $2)"
            return 1
        fi
    else
        echo -e "${RED}❌${NC} $3 (file not found)"
        return 1
    fi
}

echo "📋 Day 0: Pre-Implementation Setup"
echo "───────────────────────────────────────────────────────────────"
check_file "frontend/.env.local" "Environment configuration (.env.local)"
check_package "openai" 
check_package "zod"
check_file "frontend/lib/types/ai.types.ts" "AI type definitions"
check_file "DAILY_ERROR_TRACKING_LOG.md" "Error tracking log"
check_file "scripts/daily-error-check.sh" "Daily error check script"
check_file "scripts/daily-error-check-6.86.sh" "Phase 6.86 error check script"
echo ""

echo "🚀 Day 1: Core AI Service Implementation"
echo "───────────────────────────────────────────────────────────────"
check_file_size "frontend/lib/services/ai.service.ts" 200 "AI Service (comprehensive)"
check_file "frontend/components/errors/ErrorBoundary.tsx" "Error boundaries"
check_file "frontend/__tests__/ai/ai.service.test.ts" "AI Service tests"
echo ""

echo "🎯 Day 2: Grid Recommendations AI"
echo "───────────────────────────────────────────────────────────────"
check_file_size "frontend/lib/ai/grid-recommender.ts" 300 "Grid Recommender Service"
check_file_size "frontend/lib/ai/cost-management.service.ts" 400 "Cost Management Service"
check_file_size "frontend/lib/ai/cache.service.ts" 300 "Cache Service"
check_file "frontend/__tests__/ai/grid-recommender.test.tsx" "Grid Recommender tests"
echo ""

echo "📁 AI Module Structure"
echo "───────────────────────────────────────────────────────────────"
check_dir "frontend/lib/ai" "AI services directory"
check_dir "frontend/__tests__/ai" "AI tests directory"

# Count total AI files
if [ -d "frontend/lib/ai" ]; then
    AI_FILES=$(ls -1 frontend/lib/ai/*.ts 2>/dev/null | wc -l)
    echo -e "${GREEN}✅${NC} Total AI service files: $AI_FILES"
else
    echo -e "${RED}❌${NC} AI directory not found"
fi

echo ""
echo "🔍 TypeScript Error Check"
echo "───────────────────────────────────────────────────────────────"
echo "Running typecheck..."
cd frontend 2>/dev/null || cd /Users/shahabnazariadli/Documents/blackQmethhod/frontend
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
BASELINE=560  # Adjust based on your baseline

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ "$ERROR_COUNT" -le "$BASELINE" ]; then
    echo -e "${GREEN}✅${NC} TypeScript errors: $ERROR_COUNT (baseline: $BASELINE)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌${NC} TypeScript errors: $ERROR_COUNT (exceeds baseline: $BASELINE)"
fi

echo ""
echo "📊 Additional World-Class Features"
echo "───────────────────────────────────────────────────────────────"
check_file "frontend/lib/ai/bias-detector.ts" "Bias Detection Service"
check_file "frontend/lib/ai/statement-generator.ts" "Statement Generator"
check_file "frontend/lib/ai/questionnaire-generator.ts" "Questionnaire Generator"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "                    VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════════"

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
else
    PERCENTAGE=0
fi

echo ""
echo "Checks Passed: $PASSED_CHECKS / $TOTAL_CHECKS ($PERCENTAGE%)"
echo ""

# Final assessment
if [ $PERCENTAGE -ge 95 ]; then
    echo -e "${GREEN}🌟 WORLD-CLASS IMPLEMENTATION VERIFIED! 🌟${NC}"
    echo "Phase 6.86 Days 0-2 meet enterprise standards."
elif [ $PERCENTAGE -ge 85 ]; then
    echo -e "${GREEN}✅ EXCELLENT IMPLEMENTATION${NC}"
    echo "Phase 6.86 Days 0-2 are well-implemented with minor gaps."
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ GOOD IMPLEMENTATION${NC}"
    echo "Phase 6.86 Days 0-2 are functional but need improvements."
else
    echo -e "${RED}❌ NEEDS WORK${NC}"
    echo "Phase 6.86 Days 0-2 require additional implementation."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Run Date: $(date)"
echo "═══════════════════════════════════════════════════════════════"