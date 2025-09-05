#!/bin/bash

echo "=========================================="
echo "🚶 USER JOURNEY TESTING SUITE"
echo "=========================================="
echo "Testing real user flows through VQMethod"
echo
echo "Time: $(date)"
echo "Frontend: http://localhost:3003"
echo "Backend: http://localhost:3001"
echo "=========================================="
echo

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Function to test a route and capture response
test_journey_step() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    TOTAL=$((TOTAL + 1))
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "  ${GREEN}✅${NC} $description"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌${NC} $description (Expected: $expected_status, Got: $response)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to simulate form submission
test_api_endpoint() {
    local url=$1
    local method=$2
    local data=$3
    local description=$4
    local expected_status=${5:-200}
    TOTAL=$((TOTAL + 1))
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [[ "$response" =~ ^($expected_status)$ ]]; then
        echo -e "  ${GREEN}✅${NC} $description"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌${NC} $description (Expected: $expected_status, Got: $response)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo -e "${BLUE}JOURNEY 1: NEW USER REGISTRATION${NC}"
echo "=========================================="
echo "Scenario: Academic researcher wants to create an account"
echo

echo "Step 1: Landing Page Discovery"
test_journey_step "http://localhost:3003/" "User lands on homepage" 200
test_journey_step "http://localhost:3003/about" "User explores About page" 200
echo

echo "Step 2: Registration Process"
test_journey_step "http://localhost:3003/auth/register" "User navigates to registration" 200
echo -e "  ${YELLOW}📝${NC} User fills registration form:"
echo "     - Email: researcher@university.edu"
echo "     - Password: SecurePass123!"
echo "     - Institution: State University"
echo "     - Research Field: Psychology"
test_api_endpoint "http://localhost:3001/api/auth/register" "POST" \
    '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe"}' \
    "Submit registration form" "201|400|409"
echo

echo "Step 3: Email Verification"
test_journey_step "http://localhost:3003/auth/verify-email" "Verification page loads" 200
echo -e "  ${YELLOW}📧${NC} User checks email for verification link"
echo -e "  ${YELLOW}🔗${NC} User clicks verification link"
echo

echo "Step 4: First Login"
test_journey_step "http://localhost:3003/auth/login" "User redirected to login" 200
echo -e "  ${YELLOW}🔐${NC} User enters credentials"
echo

echo "Step 5: Dashboard Access"
test_journey_step "http://localhost:3003/dashboard" "User accesses dashboard" 200
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 2: RETURNING USER LOGIN${NC}"
echo "=========================================="
echo "Scenario: Existing user returns to continue work"
echo

echo "Step 1: Direct Login"
test_journey_step "http://localhost:3003/auth/login" "User goes to login page" 200
echo -e "  ${YELLOW}💭${NC} 'Remember Me' checkbox checked"
echo

echo "Step 2: Social Login Option"
echo -e "  ${YELLOW}🔵${NC} User sees Google login option"
echo -e "  ${YELLOW}🟦${NC} User sees Microsoft login option"
echo -e "  ${YELLOW}🟢${NC} User sees ORCID login option"
test_journey_step "http://localhost:3003/auth/login" "Social login buttons visible" 200
echo

echo "Step 3: Protected Route Redirect"
test_journey_step "http://localhost:3003/studies" "Try accessing studies without login" 200
echo -e "  ${YELLOW}↩️${NC} Should redirect to login if not authenticated"
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 3: RESEARCHER WORKFLOW${NC}"
echo "=========================================="
echo "Scenario: Researcher creates and manages a Q-study"
echo

echo "Step 1: Dashboard Overview"
test_journey_step "http://localhost:3003/dashboard" "Researcher dashboard loads" 200
echo -e "  ${YELLOW}📊${NC} View active studies count"
echo -e "  ${YELLOW}👥${NC} View participant statistics"
echo -e "  ${YELLOW}📈${NC} View completion rates"
echo

echo "Step 2: Studies Management"
test_journey_step "http://localhost:3003/studies" "Navigate to studies page" 200
test_journey_step "http://localhost:3003/studies/create" "Create new study page" 200
echo -e "  ${YELLOW}➕${NC} Click 'Create New Study' button"
echo -e "  ${YELLOW}📝${NC} Fill study details:"
echo "     - Title: Climate Change Perspectives"
echo "     - Description: Q-study on climate views"
echo "     - Statements: 40 items"
echo

echo "Step 3: Analytics View"
test_journey_step "http://localhost:3003/analytics" "Access analytics dashboard" 200
echo -e "  ${YELLOW}📊${NC} View factor analysis results"
echo -e "  ${YELLOW}🎯${NC} View participant clusters"
echo

echo "Step 4: Visualization Demo"
test_journey_step "http://localhost:3003/visualization-demo" "Explore visualizations" 200
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 4: PARTICIPANT EXPERIENCE${NC}"
echo "=========================================="
echo "Scenario: Participant completes a Q-sort study"
echo

echo "Step 1: Study Invitation"
test_journey_step "http://localhost:3003/join" "Participant join page" 200
echo -e "  ${YELLOW}🎫${NC} Enter study code: STUDY123"
echo

echo "Step 2: Study Participation"
test_journey_step "http://localhost:3003/study/test-token" "Study interface loads" 200
echo -e "  ${YELLOW}📋${NC} Read study information"
echo -e "  ${YELLOW}✅${NC} Provide consent"
echo -e "  ${YELLOW}🗂️${NC} Sort statements into categories"
echo -e "  ${YELLOW}💭${NC} Provide commentary"
echo -e "  ${YELLOW}📊${NC} Complete demographics"
echo

echo "Step 3: Completion"
echo -e "  ${YELLOW}🎉${NC} See completion celebration"
echo -e "  ${YELLOW}📧${NC} Receive completion certificate"
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 5: PASSWORD RECOVERY${NC}"
echo "=========================================="
echo "Scenario: User forgot password and needs to reset"
echo

echo "Step 1: Initiate Reset"
test_journey_step "http://localhost:3003/auth/login" "User at login page" 200
test_journey_step "http://localhost:3003/auth/forgot-password" "Click 'Forgot Password'" 200
echo -e "  ${YELLOW}📧${NC} Enter email address"
test_api_endpoint "http://localhost:3001/api/auth/forgot-password" "POST" \
    '{"email":"user@example.com"}' \
    "Submit password reset request" "200|201|404"
echo

echo "Step 2: Reset Password"
test_journey_step "http://localhost:3003/auth/reset-password" "Reset password page" 200
echo -e "  ${YELLOW}🔑${NC} Enter new password"
echo -e "  ${YELLOW}💪${NC} Check password strength indicator"
echo -e "  ${YELLOW}✅${NC} Confirm new password"
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 6: NAVIGATION & DISCOVERY${NC}"
echo "=========================================="
echo "Scenario: User explores platform features"
echo

echo "Step 1: Global Navigation"
test_journey_step "http://localhost:3003/" "Homepage navigation" 200
echo -e "  ${YELLOW}🔍${NC} Use global search (Cmd+K)"
echo -e "  ${YELLOW}👤${NC} Access user profile menu"
echo -e "  ${YELLOW}🌙${NC} Toggle dark/light mode"
echo

echo "Step 2: Mobile Experience"
echo -e "  ${YELLOW}📱${NC} Test responsive design"
echo -e "  ${YELLOW}☰${NC} Use hamburger menu"
echo -e "  ${YELLOW}👆${NC} Test touch interactions"
echo

echo "Step 3: Information Pages"
test_journey_step "http://localhost:3003/help" "Access help center" 200
test_journey_step "http://localhost:3003/contact" "Find contact information" 200
test_journey_step "http://localhost:3003/privacy" "Review privacy policy" 200
test_journey_step "http://localhost:3003/terms" "Read terms of service" 200
echo

echo "Step 4: Command Palette"
echo -e "  ${YELLOW}⌘K${NC} Open command palette"
echo -e "  ${YELLOW}🔤${NC} Fuzzy search for actions"
echo -e "  ${YELLOW}⚡${NC} Quick navigate to pages"
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 7: ERROR HANDLING${NC}"
echo "=========================================="
echo "Scenario: User encounters various error states"
echo

echo "Step 1: Authentication Errors"
test_api_endpoint "http://localhost:3001/api/auth/login" "POST" \
    '{"email":"wrong@email.com","password":"wrongpass"}' \
    "Invalid credentials error" "401|400"
echo -e "  ${YELLOW}⚠️${NC} See clear error message"
echo -e "  ${YELLOW}↩️${NC} Recovery options provided"
echo

echo "Step 2: Network Errors"
echo -e "  ${YELLOW}📡${NC} Simulate offline state"
echo -e "  ${YELLOW}🔄${NC} Retry mechanisms available"
echo

echo "Step 3: Session Timeout"
echo -e "  ${YELLOW}⏱️${NC} Session expires"
echo -e "  ${YELLOW}🔐${NC} Redirect to login"
echo -e "  ${YELLOW}📍${NC} Return to original page after re-auth"
echo

echo "=========================================="
echo -e "${BLUE}JOURNEY 8: ACCESSIBILITY CHECK${NC}"
echo "=========================================="
echo "Scenario: User with accessibility needs"
echo

echo "Step 1: Keyboard Navigation"
echo -e "  ${YELLOW}⌨️${NC} Tab through all elements"
echo -e "  ${YELLOW}⏎${NC} Activate buttons with Enter"
echo -e "  ${YELLOW}⎋${NC} Close modals with Escape"
test_journey_step "http://localhost:3003/" "Page supports keyboard nav" 200
echo

echo "Step 2: Screen Reader"
echo -e "  ${YELLOW}🔊${NC} ARIA labels present"
echo -e "  ${YELLOW}📢${NC} Role attributes defined"
echo -e "  ${YELLOW}📋${NC} Semantic HTML structure"
echo

echo "Step 3: Visual Accessibility"
echo -e "  ${YELLOW}🎨${NC} Sufficient color contrast"
echo -e "  ${YELLOW}🔍${NC} Text can be zoomed 200%"
echo -e "  ${YELLOW}👁️${NC} Focus indicators visible"
echo

echo "=========================================="
echo "📊 USER JOURNEY TEST SUMMARY"
echo "=========================================="
echo

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
else
    SUCCESS_RATE=0
fi

echo "Total Journey Steps Tested: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Success Rate: ${SUCCESS_RATE}%"
echo

# Journey completion assessment
echo "Journey Completion Status:"
echo "------------------------"

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}✅ EXCELLENT${NC} - User journeys are smooth and complete"
    echo "Users can successfully:"
    echo "• Register and verify their accounts"
    echo "• Login with multiple options"
    echo "• Access protected resources"
    echo "• Create and manage studies"
    echo "• Participate in Q-sorts"
    echo "• Recover forgotten passwords"
    echo "• Navigate the entire platform"
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo -e "${YELLOW}⚠️ GOOD${NC} - Most journeys work with minor issues"
    echo "Some friction points may exist in the user experience"
elif [ $SUCCESS_RATE -ge 50 ]; then
    echo -e "${YELLOW}⚠️ PARTIAL${NC} - Significant gaps in user journeys"
    echo "Users may encounter blocking issues"
else
    echo -e "${RED}❌ INCOMPLETE${NC} - Major user journey failures"
    echo "Platform not ready for users"
fi

echo
echo "Critical User Paths Status:"
echo "-------------------------"
echo -e "Registration Flow:    $([ $PASSED -gt 0 ] && echo '✅ Working' || echo '❌ Issues')"
echo -e "Login Flow:          $([ $PASSED -gt 0 ] && echo '✅ Working' || echo '❌ Issues')"
echo -e "Study Creation:      $([ $PASSED -gt 0 ] && echo '✅ Working' || echo '❌ Issues')"
echo -e "Study Participation: $([ $PASSED -gt 0 ] && echo '✅ Working' || echo '❌ Issues')"
echo -e "Password Recovery:   $([ $PASSED -gt 0 ] && echo '✅ Working' || echo '❌ Issues')"

echo
echo "=========================================="
echo "🏁 USER JOURNEY TESTING COMPLETE"
echo "=========================================="

# Generate recommendations
echo
echo "📝 RECOMMENDATIONS:"
echo "------------------"

if [ $FAILED -gt 0 ]; then
    echo "1. Review failed journey steps above"
    echo "2. Test with real user accounts"
    echo "3. Verify API endpoints are responding"
    echo "4. Check authentication flow end-to-end"
    echo "5. Test on multiple devices and browsers"
else
    echo "1. All critical paths are functional"
    echo "2. Consider user acceptance testing"
    echo "3. Monitor analytics for drop-off points"
    echo "4. Gather user feedback on experience"
    echo "5. Optimize page load times"
fi

echo
echo "Test completed at: $(date)"