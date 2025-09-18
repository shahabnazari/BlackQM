#!/bin/bash
# Phase 6.86 Pre-Flight Check Script
# Run this BEFORE starting Day 0 implementation

echo "================================================"
echo "   PHASE 6.86 PRE-FLIGHT CHECK"
echo "   $(date)"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
PREFLIGHT_PASS=true

# Function to check and report
check_status() {
    local check_name=$1
    local check_command=$2
    local expected=$3
    
    echo -n "Checking $check_name... "
    
    result=$(eval $check_command 2>&1)
    
    if [[ "$result" == *"$expected"* ]] || [[ "$result" == "$expected" ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        PREFLIGHT_PASS=false
        return 1
    fi
}

echo ""
echo "1. TYPESCRIPT BASELINE CHECK"
echo "----------------------------"
ERROR_COUNT=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")
echo "Current TypeScript errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -gt 47 ]; then
    echo -e "${RED}❌ CRITICAL: Error count ($ERROR_COUNT) exceeds baseline (47)${NC}"
    echo "Fix existing errors before starting Phase 6.86"
    PREFLIGHT_PASS=false
else
    echo -e "${GREEN}✅ Error count within baseline${NC}"
fi

echo ""
echo "2. ENVIRONMENT CHECK"
echo "--------------------"
# Check Node version
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]]; then
    echo -e "${GREEN}✅ Node version compatible${NC}"
else
    echo -e "${YELLOW}⚠️  Node version may cause issues${NC}"
fi

# Check npm version
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"

# Check TypeScript version
TS_VERSION=$(npx tsc --version 2>&1 | cut -d' ' -f2)
echo "TypeScript version: $TS_VERSION"

echo ""
echo "3. DEPENDENCY CHECK"
echo "-------------------"
# Check if dependencies are up to date
echo "Checking for outdated packages..."
OUTDATED=$(npm outdated 2>&1 | wc -l)
if [ "$OUTDATED" -gt 1 ]; then
    echo -e "${YELLOW}⚠️  $((OUTDATED-1)) packages are outdated${NC}"
    echo "Consider running: npm update"
else
    echo -e "${GREEN}✅ All packages up to date${NC}"
fi

echo ""
echo "4. GIT STATUS CHECK"
echo "-------------------"
# Check for uncommitted changes
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
else
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo "Consider committing or stashing before starting"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
if [[ $CURRENT_BRANCH == "main" ]] || [[ $CURRENT_BRANCH == "master" ]]; then
    echo -e "${YELLOW}⚠️  On main branch - create feature branch${NC}"
    echo "Suggested: git checkout -b feature/phase-6.86-ai"
fi

echo ""
echo "5. CONFIGURATION CHECK"
echo "----------------------"
# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local exists - ensure it's backed up${NC}"
    # Create backup
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "Backup created: .env.local.backup.$(date +%Y%m%d-%H%M%S)"
else
    echo -e "${GREEN}✅ No existing .env.local${NC}"
fi

# Check if required directories exist
echo "Checking required directories..."
DIRS=("frontend/lib/services" "frontend/lib/ai" "frontend/lib/types" "frontend/components/ai")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir exists"
    else
        echo "  ⚠️  $dir missing - will be created"
        mkdir -p "$dir"
    fi
done

echo ""
echo "6. VS CODE SETTINGS"
echo "-------------------"
if [ -f ".vscode/settings.json" ]; then
    # Check for TypeScript strict settings
    if grep -q "enableProjectDiagnostics" .vscode/settings.json; then
        echo -e "${GREEN}✅ VS Code TypeScript diagnostics enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  VS Code TypeScript diagnostics not configured${NC}"
        echo "Add typescript.tsserver.experimental.enableProjectDiagnostics: true"
    fi
else
    echo -e "${YELLOW}⚠️  No VS Code settings found${NC}"
    echo "Consider adding .vscode/settings.json for better type checking"
fi

echo ""
echo "7. TESTING INFRASTRUCTURE"
echo "-------------------------"
# Check if test command works
if npm run test -- --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Test infrastructure available${NC}"
else
    echo -e "${RED}❌ Test command not working${NC}"
    PREFLIGHT_PASS=false
fi

echo ""
echo "8. CREATE ERROR TRACKING"
echo "------------------------"
# Create error tracking file
ERROR_LOG_FILE="PHASE_6.86_ERROR_LOG.md"
if [ ! -f "$ERROR_LOG_FILE" ]; then
    cat > "$ERROR_LOG_FILE" << EOF
# Phase 6.86 Error Tracking Log

## Baseline
- Date: $(date)
- Initial TypeScript Errors: $ERROR_COUNT
- Target: ≤ 47 errors

## Day 0 Tracking
| Time | Errors | New | Fixed | Notes |
|------|--------|-----|-------|-------|
| $(date +%H:%M) | $ERROR_COUNT | 0 | 0 | Baseline |

## Day 1 Tracking
| Time | Errors | New | Fixed | Notes |
|------|--------|-----|-------|-------|
| TBD | - | - | - | - |
EOF
    echo -e "${GREEN}✅ Error tracking log created${NC}"
else
    echo -e "${GREEN}✅ Error tracking log exists${NC}"
fi

echo ""
echo "================================================"
echo "   PRE-FLIGHT CHECK SUMMARY"
echo "================================================"

if $PREFLIGHT_PASS; then
    echo -e "${GREEN}"
    echo "✅ PRE-FLIGHT CHECK PASSED!"
    echo ""
    echo "You are ready to start Phase 6.86 Day 0"
    echo "Next steps:"
    echo "1. Create feature branch: git checkout -b feature/phase-6.86-ai"
    echo "2. Start Day 0 monitoring: ./scripts/day0-monitor.sh"
    echo "3. Begin implementation following PHASE_6.86_COMPREHENSIVE.md"
    echo -e "${NC}"
    
    # Create success marker
    touch .phase-6.86-preflight-passed
    exit 0
else
    echo -e "${RED}"
    echo "❌ PRE-FLIGHT CHECK FAILED!"
    echo ""
    echo "Fix the issues above before starting Phase 6.86"
    echo "Critical issues must be resolved first"
    echo -e "${NC}"
    exit 1
fi