#!/bin/bash

# Test all routes to ensure correct routing configuration
# Uses proper Next.js route group conventions (parentheses don't appear in URLs)

echo "========================================="
echo "VQMethod Route Testing Script"
echo "========================================="
echo

# Function to test a route
test_route() {
    local path=$1
    local expected=$2
    local description=$3
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003$path")
    
    if [ "$status" = "$expected" ]; then
        echo "✅ $description: $path - $status OK"
    else
        echo "❌ $description: $path - $status (Expected: $expected)"
    fi
}

echo "📋 Testing Public Pages..."
test_route "/" "200" "Homepage"
test_route "/about" "200" "About Page"
test_route "/contact" "200" "Contact Page"
test_route "/privacy" "200" "Privacy Policy"
test_route "/terms" "200" "Terms of Service"
test_route "/help" "200" "Help Page"
echo

echo "🔐 Testing Authentication Pages..."
test_route "/auth/login" "200" "Login Page"
test_route "/auth/register" "200" "Register Page"
test_route "/auth/forgot-password" "200" "Forgot Password"
test_route "/auth/reset-password" "200" "Reset Password"
test_route "/auth/verify-email" "200" "Verify Email"
echo

echo "👥 Testing Participant Flow..."
test_route "/join" "200" "Join Study"
test_route "/study/test-token" "200" "Study Participation"
echo

echo "🔬 Testing Researcher Pages (No /researcher prefix)..."
test_route "/dashboard" "200" "Researcher Dashboard"
test_route "/studies" "200" "Studies Management"
test_route "/analytics" "200" "Analytics Page"
test_route "/visualization-demo" "200" "Visualization Demo"
echo

echo "❌ Testing Incorrect Routes (Should fail)..."
test_route "/researcher/dashboard" "404" "Old Dashboard URL (Should 404)"
test_route "/researcher/studies" "404" "Old Studies URL (Should 404)"
echo

echo "🔧 Testing Backend API..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/health")
if [ "$api_status" = "200" ]; then
    echo "✅ Backend API: http://localhost:3001/api/health - 200 OK"
else
    echo "❌ Backend API: http://localhost:3001/api/health - $api_status"
fi

db_status=$(curl -s http://localhost:3001/api/health/database | grep -q '"connected":true' && echo "OK" || echo "FAIL")
if [ "$db_status" = "OK" ]; then
    echo "✅ Database Connection: Connected"
else
    echo "❌ Database Connection: Failed"
fi
echo

echo "========================================="
echo "Route Test Complete!"
echo "========================================="
echo
echo "📝 Summary:"
echo "- Public pages: Accessible at root level"
echo "- Auth pages: Accessible at /auth/*"
echo "- Participant pages: Accessible at /join and /study/*"
echo "- Researcher pages: Accessible WITHOUT /researcher prefix"
echo "  (Route groups with parentheses are organizational only)"
echo
echo "🔄 Correct Login Flow:"
echo "1. User logs in at /auth/login"
echo "2. Redirect to /dashboard (NOT /researcher/dashboard)"
echo "3. Navigate using links without /researcher prefix"