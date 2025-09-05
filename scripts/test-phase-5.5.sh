#!/bin/bash

echo "========================================="
echo "Phase 5.5 Feature Testing Script"
echo "========================================="
echo

# Function to test a route
test_route() {
    local path=$1
    local description=$2
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003$path")
    
    if [ "$status" = "200" ]; then
        echo "✅ $description: $path"
    else
        echo "❌ $description: $path (Status: $status)"
    fi
}

# Function to check if file exists
check_file() {
    local filepath=$1
    local description=$2
    
    if [ -f "$filepath" ]; then
        echo "✅ $description exists"
    else
        echo "❌ $description missing"
    fi
}

echo "📱 Testing Authentication Pages (Phase 5.5 Section 1-2)..."
test_route "/auth/login" "Login Page"
test_route "/auth/register" "Registration Page"
test_route "/auth/forgot-password" "Forgot Password Page"
test_route "/auth/reset-password" "Reset Password Page"
test_route "/auth/verify-email" "Email Verification Page"
echo

echo "🧩 Testing Navigation Components (Phase 5.5)..."
check_file "frontend/components/navigation/Breadcrumbs.tsx" "Breadcrumbs Component"
check_file "frontend/components/navigation/CommandPalette.tsx" "Command Palette"
check_file "frontend/components/navigation/GlobalSearch.tsx" "Global Search"
check_file "frontend/components/navigation/MobileNav.tsx" "Mobile Navigation"
check_file "frontend/components/navigation/UserProfileMenu.tsx" "User Profile Menu"
check_file "frontend/components/navigation/ResearcherNavigation.tsx" "Researcher Navigation"
echo

echo "📄 Testing Essential Pages (Phase 5.5 Section 3)..."
test_route "/about" "About Page"
test_route "/contact" "Contact Page"
test_route "/privacy" "Privacy Policy Page"
test_route "/terms" "Terms of Service Page"
test_route "/help" "Help Page"
echo

echo "🎨 Testing Apple UI Components (Phase 5.5)..."
check_file "frontend/components/apple-ui/Button/Button.tsx" "Button Component"
check_file "frontend/components/apple-ui/TextField/TextField.tsx" "TextField Component"
check_file "frontend/components/apple-ui/Card/Card.tsx" "Card Component"
check_file "frontend/components/apple-ui/Badge/Badge.tsx" "Badge Component"
check_file "frontend/components/apple-ui/ProgressBar/ProgressBar.tsx" "ProgressBar Component"
check_file "frontend/components/apple-ui/ThemeToggle/ThemeToggle.tsx" "ThemeToggle Component"
echo

echo "💫 Testing Animation Components (Phase 5.5)..."
check_file "frontend/components/animations/Skeleton/SkeletonLoader.tsx" "Skeleton Loader"
check_file "frontend/components/animations/EmptyStates/EmptyState.tsx" "Empty States"
check_file "frontend/components/animations/Celebrations/SuccessAnimation.tsx" "Success Animation"
check_file "frontend/components/animations/MicroInteractions/HoverCard.tsx" "Hover Card Animation"
check_file "frontend/components/animations/GuidedWorkflows/OnboardingFlow.tsx" "Onboarding Flow"
echo

echo "🔐 Testing Authentication Features..."
check_file "frontend/hooks/auth/useLogin.ts" "Login Hook"
check_file "frontend/hooks/auth/useAuth.ts" "Auth Hook"
check_file "frontend/lib/auth/types.ts" "Auth Types"
check_file "frontend/components/auth/LoadingOverlay.tsx" "Loading Overlay"
check_file "frontend/components/auth/AuthError.tsx" "Auth Error Component"
echo

echo "🎯 Testing Icons (Phase 5.5)..."
check_file "frontend/components/icons/index.tsx" "Icon Components"
check_file "frontend/components/icons/GoogleIcon.tsx" "Google Icon"
check_file "frontend/components/icons/MicrosoftIcon.tsx" "Microsoft Icon"
check_file "frontend/components/icons/OrcidIcon.tsx" "Orcid Icon"
check_file "frontend/components/icons/AppleIcon.tsx" "Apple Icon"
check_file "frontend/components/icons/GitHubIcon.tsx" "GitHub Icon"
echo

echo "🎨 Testing CSS and Styling (Phase 5.5 Section 4)..."
check_file "frontend/styles/globals.css" "Global Styles"
check_file "frontend/tailwind.config.js" "Tailwind Config"
echo

echo "========================================="
echo "Phase 5.5 Feature Summary"
echo "========================================="