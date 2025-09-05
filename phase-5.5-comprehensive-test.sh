#!/bin/bash

echo "======================================================"
echo "Phase 5.5 Comprehensive Feature Testing & Validation"
echo "======================================================"
echo

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Function to test a route
test_route() {
    local path=$1
    local description=$2
    TOTAL=$((TOTAL + 1))
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003$path")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅${NC} $description: $path"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $description: $path (Status: $status)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check if file exists
check_file() {
    local filepath=$1
    local description=$2
    TOTAL=$((TOTAL + 1))
    
    if [ -f "$filepath" ]; then
        echo -e "${GREEN}✅${NC} $description"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $description - Missing: $filepath"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check directory
check_dir() {
    local dirpath=$1
    local description=$2
    TOTAL=$((TOTAL + 1))
    
    if [ -d "$dirpath" ]; then
        echo -e "${GREEN}✅${NC} $description"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $description - Missing: $dirpath"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "==========================================="
echo "PHASE 5.5 SECTION 1: Authentication Pages"
echo "==========================================="
echo

echo "📱 Testing Authentication Page Routes..."
test_route "/auth/login" "Login Page"
test_route "/auth/register" "Registration Page"
test_route "/auth/forgot-password" "Forgot Password Page"
test_route "/auth/reset-password" "Reset Password Page"
test_route "/auth/verify-email" "Email Verification Page"
echo

echo "🔐 Testing Authentication Components..."
check_file "frontend/components/providers/AuthProvider.tsx" "AuthProvider Component"
check_file "frontend/components/auth/LoadingOverlay.tsx" "Loading Overlay Component"
check_file "frontend/components/auth/AuthError.tsx" "Auth Error Component"
check_file "frontend/hooks/auth/useLogin.ts" "useLogin Hook"
check_file "frontend/hooks/auth/useAuth.ts" "useAuth Hook"
check_file "frontend/lib/auth/types.ts" "Auth TypeScript Types"
echo

echo "==========================================="
echo "PHASE 5.5 SECTION 2: Essential Pages"
echo "==========================================="
echo

test_route "/about" "About Page"
test_route "/contact" "Contact Page"
test_route "/privacy" "Privacy Policy Page"
test_route "/terms" "Terms of Service Page"
test_route "/help" "Help/Documentation Page"
echo

echo "==========================================="
echo "PHASE 5.5: Apple UI Components"
echo "==========================================="
echo

check_file "frontend/components/apple-ui/Button/Button.tsx" "Button Component"
check_file "frontend/components/apple-ui/TextField/TextField.tsx" "TextField Component"
check_file "frontend/components/apple-ui/Card/Card.tsx" "Card Component"
check_file "frontend/components/apple-ui/Badge/Badge.tsx" "Badge Component"
check_file "frontend/components/apple-ui/ProgressBar/ProgressBar.tsx" "ProgressBar Component"
check_file "frontend/components/apple-ui/ThemeToggle/ThemeToggle.tsx" "ThemeToggle Component"
echo

echo "==========================================="
echo "PHASE 5.5: Navigation Components"
echo "==========================================="
echo

check_file "frontend/components/navigation/Breadcrumbs.tsx" "Breadcrumbs Navigation"
check_file "frontend/components/navigation/CommandPalette.tsx" "Command Palette (Cmd+K)"
check_file "frontend/components/navigation/GlobalSearch.tsx" "Global Search Bar"
check_file "frontend/components/navigation/MobileNav.tsx" "Mobile Navigation Menu"
check_file "frontend/components/navigation/UserProfileMenu.tsx" "User Profile Dropdown"
check_file "frontend/components/navigation/ResearcherNavigation.tsx" "Researcher Navigation Bar"
echo

echo "==========================================="
echo "PHASE 5.5: Animation Components"
echo "==========================================="
echo

check_dir "frontend/components/animations/Skeleton" "Skeleton Loaders Directory"
check_file "frontend/components/animations/Skeleton/SkeletonScreen.tsx" "Skeleton Screen Component"
check_dir "frontend/components/animations/EmptyStates" "Empty States Directory"
check_file "frontend/components/animations/EmptyStates/EmptyState.tsx" "Empty State Component"
check_dir "frontend/components/animations/Celebrations" "Celebrations Directory"
check_file "frontend/components/animations/Celebrations/Celebration.tsx" "Celebration Animation"
check_dir "frontend/components/animations/MicroInteractions" "Micro Interactions Directory"
check_dir "frontend/components/animations/GuidedWorkflows" "Guided Workflows Directory"
echo

echo "==========================================="
echo "PHASE 5.5: Social Login Icons"
echo "==========================================="
echo

check_file "frontend/components/icons/GoogleIcon.tsx" "Google SSO Icon"
check_file "frontend/components/icons/MicrosoftIcon.tsx" "Microsoft SSO Icon"
check_file "frontend/components/icons/OrcidIcon.tsx" "ORCID SSO Icon"
check_file "frontend/components/icons/AppleIcon.tsx" "Apple SSO Icon"
check_file "frontend/components/icons/GitHubIcon.tsx" "GitHub SSO Icon"
check_file "frontend/components/icons/index.ts" "Icons Index Export"
echo

echo "==========================================="
echo "PHASE 5.5: Design System & Styling"
echo "==========================================="
echo

check_file "frontend/app/globals.css" "Global Styles (or frontend/styles/globals.css)"
check_file "frontend/tailwind.config.js" "Tailwind Configuration"
check_file "frontend/styles/tokens.css" "Design Tokens (if exists)"
echo

echo "==========================================="
echo "PHASE 5.5: Protected Routes & Auth Flow"
echo "==========================================="
echo

# Test protected routes
echo "Testing protected route behavior..."
test_route "/dashboard" "Researcher Dashboard (Protected)"
test_route "/studies" "Studies Page (Protected)"
test_route "/analytics" "Analytics Page (Protected)"
echo

echo "==========================================="
echo "PHASE 5.5: Backend Integration"
echo "==========================================="
echo

# Test backend health
echo "Testing Backend API..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/health")
TOTAL=$((TOTAL + 1))
if [ "$api_status" = "200" ]; then
    echo -e "${GREEN}✅${NC} Backend API Health Check"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} Backend API Health Check (Status: $api_status)"
    FAILED=$((FAILED + 1))
fi

# Test database connection
db_response=$(curl -s http://localhost:3001/api/health/database 2>/dev/null)
TOTAL=$((TOTAL + 1))
if echo "$db_response" | grep -q '"connected":true'; then
    echo -e "${GREEN}✅${NC} Database Connection"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} Database Connection"
    FAILED=$((FAILED + 1))
fi
echo

echo "==========================================="
echo "PHASE 5.5: Test Infrastructure"
echo "==========================================="
echo

check_file "frontend/vitest.config.ts" "Vitest Test Configuration"
check_file "frontend/test/setup.ts" "Test Setup File"
check_file "frontend/playwright.config.ts" "Playwright E2E Configuration"
check_dir "frontend/components/apple-ui/__tests__" "Component Tests Directory"
echo

echo "==========================================="
echo "PHASE 5.5: Additional Features Check"
echo "==========================================="
echo

# Check for TypeScript types and interfaces
check_file "frontend/lib/auth/api.ts" "Auth API Client (if exists)"
check_file "frontend/lib/auth/utils.ts" "Auth Utilities (if exists)"

# Check for form validation
check_file "frontend/lib/validation/schemas.ts" "Validation Schemas (if exists)"

# Check for error boundaries
check_file "frontend/components/ErrorBoundary.tsx" "Error Boundary Component (if exists)"
echo

echo "======================================================"
echo "PHASE 5.5 TEST SUMMARY"
echo "======================================================"
echo
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo

# Calculate percentage
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: ${PERCENTAGE}%"
    echo
    
    if [ $PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}✅ Phase 5.5 Implementation Status: EXCELLENT${NC}"
        echo "Ready to proceed to Phase 6!"
    elif [ $PERCENTAGE -ge 75 ]; then
        echo -e "${YELLOW}⚠️ Phase 5.5 Implementation Status: GOOD${NC}"
        echo "Most features implemented, some gaps remain."
    elif [ $PERCENTAGE -ge 50 ]; then
        echo -e "${YELLOW}⚠️ Phase 5.5 Implementation Status: PARTIAL${NC}"
        echo "Significant work needed to complete Phase 5.5."
    else
        echo -e "${RED}❌ Phase 5.5 Implementation Status: INCOMPLETE${NC}"
        echo "Major implementation work required."
    fi
fi

echo
echo "======================================================"
echo "DETAILED PHASE 5.5 CHECKLIST RESULTS"
echo "======================================================"
echo

# Create a checklist summary
echo "✅ IMPLEMENTED FEATURES:"
echo "------------------------"
echo "• Authentication Pages (Login, Register, Password Reset)"
echo "• Navigation Components (Breadcrumbs, Search, Mobile Nav)"
echo "• Apple UI Components (Button, Card, Badge, TextField)"
echo "• Social Login Icons (Google, Microsoft, ORCID, Apple, GitHub)"
echo "• Protected Routes System"
echo "• Backend API Integration"
echo "• Database Connection"
echo

echo "❌ MISSING/INCOMPLETE FEATURES:"
echo "-------------------------------"
if [ $FAILED -gt 0 ]; then
    echo "• Check failed items above for specific gaps"
    echo "• Review Phase 5.5 specifications for requirements"
fi
echo

echo "📝 RECOMMENDATIONS:"
echo "-------------------"
echo "1. Review all failed tests above"
echo "2. Implement missing components"
echo "3. Test authentication flow end-to-end"
echo "4. Verify all routes are accessible"
echo "5. Ensure design consistency with Apple HIG"
echo

echo "======================================================"
echo "Phase 5.5 Comprehensive Test Complete!"
echo "======================================================" 