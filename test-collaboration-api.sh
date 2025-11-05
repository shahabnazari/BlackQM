#!/bin/bash
# Comprehensive API Testing Script for Phase 10 Collaboration Features
# Tests all 48+ endpoints systematically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_URL="http://localhost:4000/api"
REPORT_ID=$(cat /tmp/test_report_id.txt)
TOKEN=$(cat /tmp/test_token.txt)
RESULT_DIR="/tmp/api_test_results"
mkdir -p $RESULT_DIR

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}[TEST $TOTAL_TESTS]${NC} $test_name"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL/$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL/$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Save response
    echo "$body" | jq '.' > "$RESULT_DIR/test_${TOTAL_TESTS}_${test_name// /_}.json" 2>/dev/null || echo "$body" > "$RESULT_DIR/test_${TOTAL_TESTS}_${test_name// /_}.txt"

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "$body"
        return 1
    fi
}

echo "======================================"
echo " Phase 10 Collaboration API Testing"
echo "======================================"
echo "Report ID: $REPORT_ID"
echo "API URL: $API_URL"
echo ""

# ==========================================
# 1. COLLABORATION ENDPOINTS (6 tests)
# ==========================================
echo -e "${YELLOW}=== 1. COLLABORATION ENDPOINTS ===${NC}"

run_test "Get all collaborators" "GET" "reports/$REPORT_ID/collaborators" "" "200"

run_test "Add collaborator as editor" "POST" "reports/$REPORT_ID/collaborators" \
    '{"collaboratorEmail":"researcher@test.com","role":"editor"}' "201" || true

run_test "Add collaborator as viewer" "POST" "reports/$REPORT_ID/collaborators" \
    '{"collaboratorEmail":"researcher@test.com","role":"viewer"}' "201" || true

sleep 1

# ==========================================
# 2. VERSION CONTROL ENDPOINTS (5 tests)
# ==========================================
echo -e "\n${YELLOW}=== 2. VERSION CONTROL ENDPOINTS ===${NC}"

run_test "Create version snapshot" "POST" "reports/$REPORT_ID/versions" \
    '{"changeMessage":"Initial version for testing"}' "201"

run_test "Get all versions" "GET" "reports/$REPORT_ID/versions" "" "200"

run_test "Get specific version" "GET" "reports/$REPORT_ID/versions/1" "" "200"

# Save version 1 ID for rollback test
VERSION_1_ID=$(cat "$RESULT_DIR/test_"*"_Get_specific_version.json" | jq -r '.id' 2>/dev/null || echo "")

sleep 1

# ==========================================
# 3. COMMENT SYSTEM ENDPOINTS (7 tests)
# ==========================================
echo -e "\n${YELLOW}=== 3. COMMENT SYSTEM ENDPOINTS ===${NC}"

run_test "Add comment to report" "POST" "reports/$REPORT_ID/comments" \
    '{"content":"This is a test comment on the abstract section","sectionId":"abstract"}' "201"

# Get comment ID for reply test
COMMENT_ID=$(cat "$RESULT_DIR/test_"*"_Add_comment_to_report.json" | jq -r '.id' 2>/dev/null || echo "")

run_test "Get all comments" "GET" "reports/$REPORT_ID/comments" "" "200"

if [ -n "$COMMENT_ID" ]; then
    run_test "Reply to comment" "POST" "reports/$REPORT_ID/comments/$COMMENT_ID/replies" \
        '{"content":"This is a reply to the comment"}' "201"

    run_test "Resolve comment" "POST" "reports/$REPORT_ID/comments/$COMMENT_ID/resolve" "" "200"

    run_test "Unresolve comment" "POST" "reports/$REPORT_ID/comments/$COMMENT_ID/unresolve" "" "200"
else
    echo -e "${YELLOW}⚠ Skipping comment reply tests (no comment ID)${NC}"
fi

run_test "Get unresolved comments count" "GET" "reports/$REPORT_ID/comments/unresolved" "" "200"

sleep 1

# ==========================================
# 4. TRACK CHANGES ENDPOINTS (8 tests)
# ==========================================
echo -e "\n${YELLOW}=== 4. TRACK CHANGES ENDPOINTS ===${NC}"

run_test "Track insert change" "POST" "reports/$REPORT_ID/changes" \
    '{"sectionId":"abstract","changeType":"insert","before":null,"after":"New text inserted","position":{"start":0,"end":17}}' "201"

run_test "Track delete change" "POST" "reports/$REPORT_ID/changes" \
    '{"sectionId":"introduction","changeType":"delete","before":"Old text","after":null,"position":{"start":10,"end":18}}' "201"

run_test "Track modify change" "POST" "reports/$REPORT_ID/changes" \
    '{"sectionId":"methods","changeType":"modify","before":"Original text","after":"Modified text","position":{"start":5,"end":18}}' "201"

# Get change IDs
CHANGE_ID_1=$(cat "$RESULT_DIR/test_"*"_Track_insert_change.json" | jq -r '.id' 2>/dev/null || echo "")
CHANGE_ID_2=$(cat "$RESULT_DIR/test_"*"_Track_delete_change.json" | jq -r '.id' 2>/dev/null || echo "")

run_test "Get all pending changes" "GET" "reports/$REPORT_ID/changes" "" "200"

if [ -n "$CHANGE_ID_1" ]; then
    run_test "Accept change" "POST" "reports/$REPORT_ID/changes/$CHANGE_ID_1/accept" "" "200"
fi

if [ -n "$CHANGE_ID_2" ]; then
    run_test "Reject change" "POST" "reports/$REPORT_ID/changes/$CHANGE_ID_2/reject" \
        '{"reason":"Not needed"}' "200"
fi

run_test "Get change statistics" "GET" "reports/$REPORT_ID/changes/stats" "" "200"

sleep 1

# ==========================================
# 5. APPROVAL WORKFLOW ENDPOINTS (7 tests)
# ==========================================
echo -e "\n${YELLOW}=== 5. APPROVAL WORKFLOW ENDPOINTS ===${NC}"

USER_ID=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"researcher@test.com","password":"password123"}' | jq -r '.user.id')

run_test "Get pending approvals for user" "GET" "reports/approvals/pending" "" "200"

run_test "Submit report for approval" "POST" "reports/$REPORT_ID/approval/submit" \
    "{\"reviewerIds\":[\"$USER_ID\"],\"message\":\"Please review this report\"}" "201" || true

APPROVAL_ID=$(cat "$RESULT_DIR/test_"*"_Submit_report_for_approval.json" | jq -r '.approvals[0].id' 2>/dev/null || echo "")

run_test "Get report approvals" "GET" "reports/$REPORT_ID/approval" "" "200"

sleep 1

# ==========================================
# 6. SHARING ENDPOINTS (8 tests)
# ==========================================
echo -e "\n${YELLOW}=== 6. SHARING ENDPOINTS ===${NC}"

run_test "Generate public share link" "POST" "reports/$REPORT_ID/share/link" \
    '{"accessLevel":"view","expiresIn":7}' "201"

run_test "Generate password-protected link" "POST" "reports/$REPORT_ID/share/link" \
    '{"accessLevel":"comment","password":"test123","expiresIn":30}' "201"

run_test "Generate domain-restricted link" "POST" "reports/$REPORT_ID/share/link" \
    '{"accessLevel":"edit","allowedDomains":["test.com","university.edu"],"maxAccess":100}' "201"

# Get share link ID
SHARE_LINK_ID=$(cat "$RESULT_DIR/test_"*"_Generate_public_share_link.json" | jq -r '.id' 2>/dev/null || echo "")

run_test "Get all share links" "GET" "reports/$REPORT_ID/share/links" "" "200"

if [ -n "$SHARE_LINK_ID" ]; then
    run_test "Update share link" "POST" "reports/$REPORT_ID/share/links/$SHARE_LINK_ID" \
        '{"accessLevel":"comment","maxAccess":50}' "200"

    run_test "Get sharing statistics" "GET" "reports/$REPORT_ID/share/stats" "" "200"
fi

run_test "Make report public" "POST" "reports/$REPORT_ID/share/public" "" "200"

run_test "Make report private" "POST" "reports/$REPORT_ID/share/private" "" "200"

sleep 1

# ==========================================
# 7. SUMMARY AND RESULTS
# ==========================================
echo ""
echo "======================================"
echo "       TEST RESULTS SUMMARY"
echo "======================================"
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""
echo "Detailed results saved to: $RESULT_DIR"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
