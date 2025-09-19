#!/bin/bash

# AI Performance Testing Script
# Tests all AI endpoints to ensure <3s response time

echo "========================================="
echo "AI ENDPOINT PERFORMANCE TESTING"
echo "Target: All responses < 3 seconds"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
API_URL="http://localhost:3001/api/ai"

# Get JWT token (you need to set this)
JWT_TOKEN=${JWT_TOKEN:-"your-jwt-token-here"}

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    # Make the request and measure time
    start_time=$(date +%s.%N)
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "${API_URL}${endpoint}" 2>/dev/null)
    
    end_time=$(date +%s.%N)
    
    # Extract HTTP status code
    http_code=$(echo "$response" | tail -n 1)
    
    # Calculate response time
    response_time=$(echo "$end_time - $start_time" | bc)
    
    # Check if response time is under 3 seconds
    if (( $(echo "$response_time < 3" | bc -l) )); then
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            echo -e "${GREEN}✓${NC} ${response_time}s (HTTP $http_code)"
        else
            echo -e "${YELLOW}⚠${NC} ${response_time}s (HTTP $http_code - Check auth/data)"
        fi
    else
        echo -e "${RED}✗${NC} ${response_time}s (HTTP $http_code) - EXCEEDS 3s!"
    fi
}

echo ""
echo "1. Testing Statement Generation"
echo "--------------------------------"
test_endpoint "/generate-statements" "POST" \
    '{"topic":"Climate change","count":5}' \
    "Generate Statements"

echo ""
echo "2. Testing Grid Recommendations"
echo "--------------------------------"
test_endpoint "/grid/recommend" "POST" \
    '{"studyTopic":"Environmental attitudes","expectedStatements":30}' \
    "Grid Recommendations"

echo ""
echo "3. Testing Questionnaire Generation"
echo "-----------------------------------"
test_endpoint "/questionnaire/generate" "POST" \
    '{"studyTopic":"User Experience","questionCount":5,"questionTypes":["likert","multipleChoice"]}' \
    "Generate Questions"

echo ""
echo "4. Testing Bias Detection"
echo "-------------------------"
test_endpoint "/detect-bias" "POST" \
    '{"statements":["Climate change is a hoax","The environment needs protection"],"analysisDepth":"quick"}' \
    "Quick Bias Check"

test_endpoint "/detect-bias" "POST" \
    '{"statements":["Climate change is a hoax","The environment needs protection"],"analysisDepth":"comprehensive"}' \
    "Comprehensive Bias"

echo ""
echo "5. Testing Response Analysis"
echo "----------------------------"
test_endpoint "/analyze-responses" "POST" \
    '{"responses":[{"participantId":"p1","qsort":[1,2,3,4,5]}],"analysisTypes":["patterns","quality"]}' \
    "Response Analysis"

echo ""
echo "6. Testing Participant Assistance"
echo "---------------------------------"
test_endpoint "/participant-assistance" "POST" \
    '{"participantId":"p1","stage":"qsort","question":"How should I sort?"}' \
    "Participant Help"

echo ""
echo "7. Testing Smart Validation"
echo "---------------------------"
test_endpoint "/smart-validation" "POST" \
    '{"formData":{"email":"test@example.com"},"adaptiveMode":true}' \
    "Smart Validation"

echo ""
echo "========================================="
echo "PERFORMANCE TEST SUMMARY"
echo "========================================="
echo ""
echo "Note: Ensure backend is running on port 3001"
echo "Set JWT_TOKEN environment variable for auth"
echo ""
echo "Target: All responses should be < 3 seconds"
echo "If any endpoints exceed 3s, optimization needed"
echo "========================================="