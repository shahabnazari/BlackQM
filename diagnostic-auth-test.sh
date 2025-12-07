#!/bin/bash

# Authentication Test Script
# Tests the complete authentication flow from login to protected endpoint access

set -e  # Exit on error

echo "🔐 === AUTHENTICATION DIAGNOSTIC TEST ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:4000"
TEST_EMAIL="researcher@test.com"
TEST_PASSWORD="password123"

echo "📋 Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Test Email:  $TEST_EMAIL"
echo ""

# Step 1: Check backend health
echo "🏥 STEP 1: Checking backend health..."
HEALTH_RESPONSE=$(curl -s "${BACKEND_URL}/api/health" 2>/dev/null || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == "FAILED" ]]; then
    echo -e "${RED}❌ Backend is not responding!${NC}"
    echo "   Please start the backend server first:"
    echo "   cd backend && npm run start:dev"
    exit 1
fi

HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "ERROR")

if [[ "$HEALTH_STATUS" == "healthy" ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo "$HEALTH_RESPONSE" | jq '.'
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "$HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Step 2: Test login endpoint
echo "🔑 STEP 2: Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" \
    2>/dev/null)

# Extract HTTP status
HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
    echo -e "${GREEN}✅ Login successful${NC}"

    # Extract token (try both accessToken and access_token)
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.accessToken // .access_token' 2>/dev/null || echo "")

    if [[ -z "$ACCESS_TOKEN" ]] || [[ "$ACCESS_TOKEN" == "null" ]]; then
        echo -e "${RED}❌ No access_token in response!${NC}"
        echo "Response body:"
        echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
        exit 1
    fi

    echo -e "${GREEN}✅ Access token received${NC}"
    echo "Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
    echo "Token length: ${#ACCESS_TOKEN} characters"

    # Decode token payload
    TOKEN_PARTS=(${ACCESS_TOKEN//./ })
    if [[ ${#TOKEN_PARTS[@]} -eq 3 ]]; then
        echo -e "${GREEN}✅ Token structure valid (3 parts)${NC}"

        # Decode payload
        PAYLOAD=$(echo "${TOKEN_PARTS[1]}" | base64 -d 2>/dev/null || echo "DECODE_FAILED")

        if [[ "$PAYLOAD" != "DECODE_FAILED" ]]; then
            echo ""
            echo "📋 Token Payload:"
            echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"

            # Check expiration
            EXP=$(echo "$PAYLOAD" | jq -r '.exp' 2>/dev/null || echo "")
            if [[ -n "$EXP" ]] && [[ "$EXP" != "null" ]]; then
                CURRENT_TIME=$(date +%s)
                TIME_UNTIL_EXPIRY=$((EXP - CURRENT_TIME))

                if [[ $TIME_UNTIL_EXPIRY -lt 0 ]]; then
                    echo -e "${RED}❌ TOKEN IS ALREADY EXPIRED!${NC}"
                    echo "   Expired $((-TIME_UNTIL_EXPIRY)) seconds ago"
                elif [[ $TIME_UNTIL_EXPIRY -lt 300 ]]; then
                    echo -e "${YELLOW}⚠️  TOKEN EXPIRES SOON!${NC}"
                    echo "   Expires in $TIME_UNTIL_EXPIRY seconds"
                else
                    echo -e "${GREEN}✅ Token is valid${NC}"
                    echo "   Expires in $TIME_UNTIL_EXPIRY seconds ($(($TIME_UNTIL_EXPIRY / 60)) minutes)"
                fi
            else
                echo -e "${YELLOW}⚠️  No expiration field in token${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Invalid token structure (${#TOKEN_PARTS[@]} parts, expected 3)${NC}"
    fi
else
    echo -e "${RED}❌ Login failed with HTTP $HTTP_STATUS${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    exit 1
fi
echo ""

# Step 3: Test protected endpoint (library)
echo "🔒 STEP 3: Testing protected endpoint (GET /api/literature/library)..."
LIBRARY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X GET "${BACKEND_URL}/api/literature/library" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    2>/dev/null)

HTTP_STATUS=$(echo "$LIBRARY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LIBRARY_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo -e "${GREEN}✅ Protected endpoint accessible!${NC}"
    echo "Response preview:"
    echo "$RESPONSE_BODY" | jq '. | {papers: (.papers | length), total: .total}' 2>/dev/null || echo "$RESPONSE_BODY"
elif [[ "$HTTP_STATUS" == "401" ]]; then
    echo -e "${RED}❌ AUTHENTICATION FAILED (HTTP 401)${NC}"
    echo -e "${RED}This is the bug you're experiencing!${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo "🔍 Possible causes:"
    echo "  1. Token signature validation failing (JWT_SECRET mismatch)"
    echo "  2. Token expired immediately after creation"
    echo "  3. JwtStrategy not properly configured"
    echo "  4. User account inactive in database"
else
    echo -e "${YELLOW}⚠️  Unexpected HTTP status: $HTTP_STATUS${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi
echo ""

# Step 4: Test another protected endpoint (save paper)
echo "📝 STEP 4: Testing protected endpoint (POST /api/literature/save)..."
SAVE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "${BACKEND_URL}/api/literature/save" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "id": "test-paper-001",
        "title": "Test Paper for Authentication Diagnostic",
        "abstract": "This is a test paper created to verify authentication is working.",
        "source": "test",
        "authors": ["Test Author"],
        "year": 2025
    }' \
    2>/dev/null)

HTTP_STATUS=$(echo "$SAVE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$SAVE_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "201" ]]; then
    echo -e "${GREEN}✅ Paper save successful!${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
elif [[ "$HTTP_STATUS" == "401" ]]; then
    echo -e "${RED}❌ AUTHENTICATION FAILED (HTTP 401)${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${YELLOW}⚠️  HTTP status: $HTTP_STATUS${NC}"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
fi
echo ""

# Summary
echo "📊 === SUMMARY ==="
echo ""
if [[ "$HTTP_STATUS" == "401" ]]; then
    echo -e "${RED}🚨 AUTHENTICATION IS BROKEN${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Check backend JWT_SECRET in backend/.env"
    echo "  2. Check JWT configuration in backend/src/modules/auth/auth.module.ts"
    echo "  3. Add logging to backend/src/modules/auth/strategies/jwt.strategy.ts"
    echo "  4. Check user database: npx prisma studio"
    echo "  5. Verify token expiration isn't 0 seconds"
else
    echo -e "${GREEN}✅ AUTHENTICATION IS WORKING!${NC}"
    echo ""
    echo "The backend authentication is functioning correctly."
    echo "The issue might be:"
    echo "  1. Frontend token storage/retrieval"
    echo "  2. Frontend request interceptor not adding header"
    echo "  3. CORS blocking Authorization header"
fi
echo ""
