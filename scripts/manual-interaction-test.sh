#!/bin/bash

echo "================================================"
echo "🖱️ MANUAL INTERACTION TEST GUIDE"
echo "================================================"
echo "This script will guide you through manual testing"
echo "of VQMethod's interactive features"
echo
echo "Frontend: http://localhost:3003"
echo "Backend: http://localhost:3001"
echo "================================================"
echo

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to wait for user confirmation
confirm_step() {
    echo -e "${GREEN}Press ENTER when complete, or type 'skip' to skip${NC}"
    read response
    if [ "$response" = "skip" ]; then
        echo -e "${YELLOW}⚠️ Step skipped${NC}"
        return 1
    fi
    return 0
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 1: AUTHENTICATION FLOW${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}1.1 Registration Form Validation${NC}"
echo "📍 Navigate to: http://localhost:3003/auth/register"
echo
echo "Test the following:"
echo "• [ ] Email field shows error for invalid format"
echo "• [ ] Password strength indicator updates as you type"
echo "• [ ] Password must be at least 8 characters"
echo "• [ ] Confirm password must match"
echo "• [ ] Terms checkbox is required"
echo "• [ ] Submit button is disabled until form is valid"
confirm_step

echo -e "${CYAN}1.2 Login Page Interactions${NC}"
echo "📍 Navigate to: http://localhost:3003/auth/login"
echo
echo "Test the following:"
echo "• [ ] Password visibility toggle (eye icon) works"
echo "• [ ] 'Remember Me' checkbox can be checked/unchecked"
echo "• [ ] Social login buttons are visible (Google, Microsoft, ORCID)"
echo "• [ ] 'Forgot Password' link works"
echo "• [ ] Error message appears for invalid credentials"
echo "• [ ] Loading state shows during submission"
confirm_step

echo -e "${CYAN}1.3 Password Reset Flow${NC}"
echo "📍 Navigate to: http://localhost:3003/auth/forgot-password"
echo
echo "Test the following:"
echo "• [ ] Email field validates format"
echo "• [ ] Success message appears after submission"
echo "• [ ] Rate limiting message if submitted too quickly"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 2: NAVIGATION SYSTEM${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}2.1 Global Search (Command Palette)${NC}"
echo "📍 From any page, press: Cmd+K (Mac) or Ctrl+K (Windows)"
echo
echo "Test the following:"
echo "• [ ] Command palette opens with keyboard shortcut"
echo "• [ ] Search input is auto-focused"
echo "• [ ] Typing filters results in real-time"
echo "• [ ] Arrow keys navigate results"
echo "• [ ] Enter key selects highlighted item"
echo "• [ ] Escape key closes the palette"
echo "• [ ] Recent searches appear at top"
confirm_step

echo -e "${CYAN}2.2 User Profile Menu${NC}"
echo "📍 Click the user avatar/menu in top right"
echo
echo "Test the following:"
echo "• [ ] Dropdown menu appears on click"
echo "• [ ] Shows user name and email"
echo "• [ ] Theme toggle switches between light/dark"
echo "• [ ] Settings link is clickable"
echo "• [ ] Logout option is present"
echo "• [ ] Click outside closes the menu"
confirm_step

echo -e "${CYAN}2.3 Breadcrumb Navigation${NC}"
echo "📍 Navigate to: http://localhost:3003/studies/create"
echo
echo "Test the following:"
echo "• [ ] Breadcrumbs show: Home > Studies > Create"
echo "• [ ] Each breadcrumb segment is clickable"
echo "• [ ] Hover shows tooltip/preview"
echo "• [ ] Current page is highlighted differently"
confirm_step

echo -e "${CYAN}2.4 Mobile Navigation${NC}"
echo "📍 Resize browser to mobile width (< 768px)"
echo
echo "Test the following:"
echo "• [ ] Hamburger menu appears"
echo "• [ ] Click opens slide-out navigation"
echo "• [ ] Swipe gesture closes menu (if on touch device)"
echo "• [ ] Menu items are touch-optimized size"
echo "• [ ] Active page is highlighted"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 3: THEME & VISUAL FEATURES${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}3.1 Dark Mode Toggle${NC}"
echo "📍 Find the theme toggle (sun/moon icon)"
echo
echo "Test the following:"
echo "• [ ] Click toggles between light and dark themes"
echo "• [ ] All text remains readable in both modes"
echo "• [ ] No harsh contrast issues"
echo "• [ ] Theme preference persists after refresh"
echo "• [ ] Smooth transition animation"
confirm_step

echo -e "${CYAN}3.2 Loading States${NC}"
echo "📍 Submit a form or navigate between pages"
echo
echo "Test the following:"
echo "• [ ] Skeleton screens appear while loading"
echo "• [ ] Loading spinners on buttons during submission"
echo "• [ ] Progress bars for multi-step processes"
echo "• [ ] No layout shift when content loads"
confirm_step

echo -e "${CYAN}3.3 Empty States${NC}"
echo "📍 Navigate to: http://localhost:3003/studies (when no studies exist)"
echo
echo "Test the following:"
echo "• [ ] Friendly empty state illustration"
echo "• [ ] Clear call-to-action button"
echo "• [ ] Helpful message explaining what to do"
echo "• [ ] No broken layouts or errors"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 4: INTERACTIVE COMPONENTS${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}4.1 Button States${NC}"
echo "📍 Find various buttons throughout the app"
echo
echo "Test the following:"
echo "• [ ] Hover state changes appearance"
echo "• [ ] Active/pressed state is visible"
echo "• [ ] Disabled buttons look disabled"
echo "• [ ] Loading buttons show spinner"
echo "• [ ] Focus outline appears on tab navigation"
confirm_step

echo -e "${CYAN}4.2 Form Fields${NC}"
echo "📍 Navigate to any form (login, register, etc.)"
echo
echo "Test the following:"
echo "• [ ] Focus state highlights field"
echo "• [ ] Labels float up when typing (if applicable)"
echo "• [ ] Error messages appear below fields"
echo "• [ ] Success checkmarks for valid input"
echo "• [ ] Tab key moves between fields correctly"
confirm_step

echo -e "${CYAN}4.3 Cards & Containers${NC}"
echo "📍 Navigate to: http://localhost:3003/dashboard"
echo
echo "Test the following:"
echo "• [ ] Cards have subtle shadows/borders"
echo "• [ ] Hover effects on interactive cards"
echo "• [ ] Proper spacing between elements"
echo "• [ ] Content doesn't overflow containers"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 5: RESPONSIVE DESIGN${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}5.1 Breakpoint Testing${NC}"
echo "Test at these widths:"
echo
echo "📱 Mobile (320px - 768px):"
echo "• [ ] Single column layout"
echo "• [ ] Touch-friendly button sizes"
echo "• [ ] No horizontal scrolling"
echo "• [ ] Readable text size"
confirm_step

echo "💻 Tablet (768px - 1024px):"
echo "• [ ] Two column layouts where appropriate"
echo "• [ ] Navigation adapts correctly"
echo "• [ ] Images scale properly"
confirm_step

echo "🖥️ Desktop (1024px+):"
echo "• [ ] Full multi-column layouts"
echo "• [ ] Sidebar navigation visible"
echo "• [ ] Maximum content width maintained"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 6: ACCESSIBILITY${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}6.1 Keyboard Navigation${NC}"
echo "📍 Put away your mouse and use only keyboard"
echo
echo "Test the following:"
echo "• [ ] Tab through all interactive elements"
echo "• [ ] Focus indicators are always visible"
echo "• [ ] Enter/Space activate buttons"
echo "• [ ] Escape closes modals/dropdowns"
echo "• [ ] No keyboard traps"
echo "• [ ] Skip links available"
confirm_step

echo -e "${CYAN}6.2 Screen Reader (Optional)${NC}"
echo "📍 Enable screen reader (VoiceOver, NVDA, JAWS)"
echo
echo "Test the following:"
echo "• [ ] All images have alt text"
echo "• [ ] Form fields have labels"
echo "• [ ] Buttons have descriptive text"
echo "• [ ] Page structure makes sense"
echo "• [ ] Error messages are announced"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 7: ERROR HANDLING${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}7.1 Form Validation Errors${NC}"
echo "📍 Submit forms with invalid data"
echo
echo "Test the following:"
echo "• [ ] Clear error messages appear"
echo "• [ ] Fields are highlighted in red"
echo "• [ ] Errors explain how to fix the issue"
echo "• [ ] Errors disappear when corrected"
confirm_step

echo -e "${CYAN}7.2 Network Errors${NC}"
echo "📍 Disconnect internet or stop backend server"
echo
echo "Test the following:"
echo "• [ ] Friendly error message appears"
echo "• [ ] Retry button is available"
echo "• [ ] No data is lost"
echo "• [ ] App doesn't crash"
confirm_step

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}TEST 8: PERFORMANCE${NC}"
echo -e "${BLUE}================================================${NC}"
echo

echo -e "${CYAN}8.1 Page Load Times${NC}"
echo "📍 Navigate between different pages"
echo
echo "Test the following:"
echo "• [ ] Pages load in under 3 seconds"
echo "• [ ] No visible layout shifts"
echo "• [ ] Images load progressively"
echo "• [ ] Fonts don't cause text to jump"
confirm_step

echo -e "${CYAN}8.2 Interaction Responsiveness${NC}"
echo "📍 Click buttons and interact with UI"
echo
echo "Test the following:"
echo "• [ ] Buttons respond immediately to clicks"
echo "• [ ] No lag when typing in fields"
echo "• [ ] Smooth animations (no jank)"
echo "• [ ] Dropdowns open instantly"
confirm_step

echo
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ MANUAL TESTING COMPLETE!${NC}"
echo -e "${GREEN}================================================${NC}"
echo

echo "Summary of Manual Tests:"
echo "------------------------"
echo "1. Authentication Flow - Form validation, login, password reset"
echo "2. Navigation System - Search, menus, breadcrumbs, mobile nav"
echo "3. Theme & Visual - Dark mode, loading states, empty states"
echo "4. Interactive Components - Buttons, forms, cards"
echo "5. Responsive Design - Mobile, tablet, desktop layouts"
echo "6. Accessibility - Keyboard nav, screen reader support"
echo "7. Error Handling - Validation errors, network errors"
echo "8. Performance - Load times, responsiveness"
echo

echo -e "${PURPLE}ADDITIONAL MANUAL TESTS TO CONSIDER:${NC}"
echo "• Test with different browsers (Chrome, Safari, Firefox, Edge)"
echo "• Test on actual mobile devices (iOS, Android)"
echo "• Test with slow network (Chrome DevTools throttling)"
echo "• Test with different user roles (admin, researcher, participant)"
echo "• Test data persistence (refresh, logout/login)"
echo "• Test concurrent sessions (multiple tabs)"
echo

echo -e "${YELLOW}RECORD ANY ISSUES FOUND:${NC}"
echo "Create GitHub issues for any bugs discovered during testing"
echo "Include steps to reproduce, expected vs actual behavior"
echo

echo "Test completed at: $(date)"