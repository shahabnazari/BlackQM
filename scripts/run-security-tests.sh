#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 3: Security Testing Execution Script
# Enterprise-Grade Security Validation with OWASP ZAP
#
# Purpose: Execute comprehensive security tests and generate reports
# Duration: 2-3 hours
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 10 Day 5.7 Stage 3: Security Testing            ║${NC}"
echo -e "${BLUE}║  Enterprise-Grade Security Validation                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"
echo ""

# Check if frontend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Frontend is not running on port 3000${NC}"
    echo "   Please start the frontend with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"

# Check if backend is running
if ! lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Backend is not running on port 4000${NC}"
    echo "   Please start the backend with: cd backend && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running on port 4000${NC}"

echo ""

# Create results directory
RESULTS_DIR="security-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}📁 Results directory: $RESULTS_DIR${NC}"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECURITY TESTING MENU${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

PS3="Select test option: "
options=(
    "Run OWASP ZAP Baseline Scan (Quick - 10 min)"
    "Run OWASP ZAP Full Active Scan (Comprehensive - 60 min)"
    "Manual OWASP Top 10 Testing Checklist"
    "Run Dependency Security Audit (npm audit)"
    "Test Authentication & Authorization"
    "Test Injection Vulnerabilities"
    "Test Security Headers"
    "View Security Testing Guide"
    "Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "Run OWASP ZAP Baseline Scan (Quick - 10 min)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}OWASP ZAP BASELINE SCAN${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""

            # Check for Docker
            if ! command -v docker &> /dev/null; then
                echo -e "${RED}❌ Docker is not installed${NC}"
                echo "   Install Docker from: https://www.docker.com/get-started"
                read -p "Press Enter to continue..."
                continue
            fi

            echo "Running ZAP baseline scan on http://localhost:3000"
            echo "Duration: ~10 minutes"
            echo ""

            docker run -v "$(pwd)/$RESULTS_DIR:/zap/wrk/:rw" \
                -t zaproxy/zap-stable \
                zap-baseline.py \
                -t http://host.docker.internal:3000 \
                -g gen.conf \
                -r baseline-report.html \
                || true

            if [ -f "$RESULTS_DIR/baseline-report.html" ]; then
                echo ""
                echo -e "${GREEN}✅ Baseline Scan Complete${NC}"
                echo "Report: $RESULTS_DIR/baseline-report.html"
                echo ""

                # Open report if possible
                if command -v open &> /dev/null; then
                    open "$RESULTS_DIR/baseline-report.html"
                fi
            fi

            read -p "Press Enter to continue..."
            ;;

        "Run OWASP ZAP Full Active Scan (Comprehensive - 60 min)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}OWASP ZAP FULL ACTIVE SCAN${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo -e "${RED}⚠️  WARNING: This scan will:${NC}"
            echo "   • Submit malicious payloads to all forms"
            echo "   • Attempt SQL injection, XSS, command injection"
            echo "   • May trigger rate limits or alarms"
            echo "   • Duration: 60+ minutes"
            echo ""
            read -p "Continue? (y/n): " confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                continue
            fi

            # Check for Docker
            if ! command -v docker &> /dev/null; then
                echo -e "${RED}❌ Docker is not installed${NC}"
                read -p "Press Enter to continue..."
                continue
            fi

            echo ""
            echo "Running ZAP full active scan on http://localhost:3000"
            echo ""

            docker run -v "$(pwd)/$RESULTS_DIR:/zap/wrk/:rw" \
                -t zaproxy/zap-stable \
                zap-full-scan.py \
                -t http://host.docker.internal:3000 \
                -g gen.conf \
                -r full-scan-report.html \
                || true

            if [ -f "$RESULTS_DIR/full-scan-report.html" ]; then
                echo ""
                echo -e "${GREEN}✅ Full Scan Complete${NC}"
                echo "Report: $RESULTS_DIR/full-scan-report.html"
                echo ""

                # Open report
                if command -v open &> /dev/null; then
                    open "$RESULTS_DIR/full-scan-report.html"
                fi
            fi

            read -p "Press Enter to continue..."
            ;;

        "Manual OWASP Top 10 Testing Checklist")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}OWASP TOP 10 MANUAL TESTING CHECKLIST${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📚 OWASP Top 10 (2021) Testing Guide:"
            echo ""
            echo "1. ✅ Broken Access Control"
            echo "   Test: Try accessing other users' data"
            echo "   curl -H \"Authorization: Bearer \$TOKEN\" \\"
            echo "     http://localhost:4000/api/users/other_user_id"
            echo ""
            echo "2. ✅ Cryptographic Failures"
            echo "   Test: Verify password hashing in database"
            echo "   psql -d vqmethod_db -c \"SELECT email, password FROM users LIMIT 1;\""
            echo ""
            echo "3. ✅ Injection"
            echo "   Test: SQL injection in search"
            echo "   curl -X POST http://localhost:4000/api/literature/search/public \\"
            echo "     -d '{\"query\":\"test'\'' OR 1=1--\",\"sources\":[\"arxiv\"]}'"
            echo ""
            echo "4. ✅ Insecure Design"
            echo "   Test: Account enumeration"
            echo "   curl -X POST http://localhost:4000/api/auth/forgot-password \\"
            echo "     -d '{\"email\":\"nonexistent@test.com\"}'"
            echo ""
            echo "5. ✅ Security Misconfiguration"
            echo "   Test: Security headers"
            echo "   curl -I http://localhost:3000 | grep -E 'X-Frame|CSP|HSTS'"
            echo ""
            echo "📄 Full testing guide:"
            echo "   backend/test/security/STAGE3_SECURITY_TESTING_GUIDE.md"
            echo "   (See Part 3: Manual Security Testing - line 350+)"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Run Dependency Security Audit (npm audit)")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}DEPENDENCY SECURITY AUDIT${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "Running npm audit on backend and frontend..."
            echo ""

            # Backend audit
            echo -e "${MAGENTA}▶ Backend Dependencies${NC}"
            cd backend
            npm audit --json > "../$RESULTS_DIR/backend-audit.json"
            npm audit
            BACKEND_EXIT=$?
            cd ..
            echo ""

            # Frontend audit
            echo -e "${MAGENTA}▶ Frontend Dependencies${NC}"
            cd frontend
            npm audit --json > "../$RESULTS_DIR/frontend-audit.json"
            npm audit
            FRONTEND_EXIT=$?
            cd ..
            echo ""

            if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
                echo -e "${GREEN}✅ No vulnerabilities found${NC}"
            else
                echo -e "${YELLOW}⚠️  Vulnerabilities detected - review reports${NC}"
            fi

            echo ""
            echo "Reports saved:"
            echo "  • $RESULTS_DIR/backend-audit.json"
            echo "  • $RESULTS_DIR/frontend-audit.json"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Test Authentication & Authorization")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}AUTHENTICATION & AUTHORIZATION TESTS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""

            # Test 1: Access without token
            echo "Test 1: Accessing protected endpoint without token"
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/papers)
            if [ "$RESPONSE" = "401" ]; then
                echo -e "  ${GREEN}✅ PASS${NC} - Returns 401 Unauthorized"
            else
                echo -e "  ${RED}❌ FAIL${NC} - Returns $RESPONSE (expected 401)"
            fi
            echo ""

            # Test 2: Access with invalid token
            echo "Test 2: Accessing protected endpoint with invalid token"
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
                -H "Authorization: Bearer invalid_token_12345" \
                http://localhost:4000/api/papers)
            if [ "$RESPONSE" = "401" ]; then
                echo -e "  ${GREEN}✅ PASS${NC} - Returns 401 Unauthorized"
            else
                echo -e "  ${RED}❌ FAIL${NC} - Returns $RESPONSE (expected 401)"
            fi
            echo ""

            # Test 3: Weak password acceptance
            echo "Test 3: Weak password acceptance test"
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
                -X POST http://localhost:4000/api/auth/register \
                -H "Content-Type: application/json" \
                -d '{"email":"weak@test.com","password":"123","name":"Test"}')
            if [ "$RESPONSE" = "400" ]; then
                echo -e "  ${GREEN}✅ PASS${NC} - Weak password rejected (400)"
            else
                echo -e "  ${YELLOW}⚠️  WARNING${NC} - Returns $RESPONSE (should reject weak passwords)"
            fi
            echo ""

            echo -e "${GREEN}Authentication & Authorization Tests Complete${NC}"
            read -p "Press Enter to continue..."
            ;;

        "Test Injection Vulnerabilities")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}INJECTION VULNERABILITY TESTS${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""

            # Test 1: SQL Injection
            echo "Test 1: SQL Injection in search"
            RESPONSE=$(curl -s -X POST http://localhost:4000/api/literature/search/public \
                -H "Content-Type: application/json" \
                -d '{"query":"test'\'' OR 1=1--","sources":["arxiv"],"limit":10}')

            if echo "$RESPONSE" | grep -q "error\|syntax"; then
                echo -e "  ${RED}❌ POTENTIAL VULNERABILITY${NC} - SQL error detected"
                echo "  Response: $RESPONSE"
            else
                echo -e "  ${GREEN}✅ PASS${NC} - Query treated as literal string"
            fi
            echo ""

            # Test 2: XSS
            echo "Test 2: XSS in paper title (requires auth token)"
            echo "  Skipped (requires manual testing with authenticated session)"
            echo ""

            # Test 3: Command Injection
            echo "Test 3: Command injection patterns"
            RESPONSE=$(curl -s -X POST http://localhost:4000/api/literature/search/public \
                -H "Content-Type: application/json" \
                -d '{"query":"test; ls -la","sources":["arxiv"],"limit":10}')

            if echo "$RESPONSE" | grep -q "ls\|directory\|file"; then
                echo -e "  ${RED}❌ CRITICAL VULNERABILITY${NC} - Command execution detected"
            else
                echo -e "  ${GREEN}✅ PASS${NC} - Command characters safely handled"
            fi
            echo ""

            echo -e "${GREEN}Injection Tests Complete${NC}"
            read -p "Press Enter to continue..."
            ;;

        "Test Security Headers")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}SECURITY HEADERS AUDIT${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""

            echo "Checking security headers on http://localhost:3000"
            echo ""

            HEADERS=$(curl -s -I http://localhost:3000)

            # Check X-Frame-Options
            if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
                echo -e "✅ ${GREEN}X-Frame-Options${NC}: $(echo "$HEADERS" | grep -i "X-Frame-Options")"
            else
                echo -e "❌ ${RED}X-Frame-Options${NC}: Missing (allows clickjacking)"
            fi

            # Check Content-Security-Policy
            if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
                echo -e "✅ ${GREEN}Content-Security-Policy${NC}: Present"
            else
                echo -e "❌ ${RED}Content-Security-Policy${NC}: Missing (XSS risk)"
            fi

            # Check Strict-Transport-Security
            if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
                echo -e "✅ ${GREEN}Strict-Transport-Security${NC}: Present"
            else
                echo -e "⚠️  ${YELLOW}Strict-Transport-Security${NC}: Missing (HTTPS not enforced)"
            fi

            # Check X-Content-Type-Options
            if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
                echo -e "✅ ${GREEN}X-Content-Type-Options${NC}: Present"
            else
                echo -e "⚠️  ${YELLOW}X-Content-Type-Options${NC}: Missing (MIME sniffing risk)"
            fi

            echo ""
            echo -e "${GREEN}Security Headers Audit Complete${NC}"
            read -p "Press Enter to continue..."
            ;;

        "View Security Testing Guide")
            echo ""
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${BLUE}SECURITY TESTING GUIDE${NC}"
            echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "📚 Documentation:"
            echo "  📄 backend/test/security/STAGE3_SECURITY_TESTING_GUIDE.md"
            echo ""
            echo "📖 Guide Contents:"
            echo "  • Part 1: OWASP ZAP Setup"
            echo "  • Part 2: Automated Security Scanning"
            echo "  • Part 3: Manual OWASP Top 10 Testing"
            echo "  • Part 4: Security Test Results Template"
            echo ""
            echo "Opening guide..."

            if command -v code &> /dev/null; then
                code backend/test/security/STAGE3_SECURITY_TESTING_GUIDE.md
            elif command -v open &> /dev/null; then
                open backend/test/security/STAGE3_SECURITY_TESTING_GUIDE.md
            else
                cat backend/test/security/STAGE3_SECURITY_TESTING_GUIDE.md | less
            fi

            echo ""
            read -p "Press Enter to continue..."
            ;;

        "Exit")
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}SECURITY TESTING SESSION COMPLETE${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo ""
            if [ -d "$RESULTS_DIR" ] && [ "$(ls -A $RESULTS_DIR)" ]; then
                echo "📊 Results saved to: $RESULTS_DIR"
                echo ""
                echo "Files created:"
                ls -lh "$RESULTS_DIR" 2>/dev/null || echo "  (no files generated)"
                echo ""
            fi
            echo "📋 Success Criteria:"
            echo "  ✅ Zero critical/high vulnerabilities"
            echo "  ⚠️  <10 medium vulnerabilities (documented)"
            echo "  ✅ OWASP Top 10 compliance ≥80%"
            echo ""
            echo "Next Step: Browser Compatibility Testing"
            echo ""
            break
            ;;
        *)
            echo -e "${RED}Invalid option $REPLY${NC}"
            ;;
    esac
done
