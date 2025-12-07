#!/bin/bash
# GROBID Setup Verification Script
# Phase 10.94 - Enterprise Grade Deployment Verification
#
# Usage: ./scripts/verify-grobid-setup.sh

set -e

echo "=========================================="
echo "GROBID Setup Verification"
echo "Phase 10.94 - Enterprise Grade"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Test 1: Check Docker is installed
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    echo "   Install Docker: https://docs.docker.com/get-docker/"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Test 2: Check if GROBID container is running
echo "2. Checking GROBID container status..."
if docker ps | grep -q "vqmethod-grobid"; then
    echo -e "${GREEN}✓${NC} GROBID container is running"

    # Get container details
    CONTAINER_ID=$(docker ps --filter "name=vqmethod-grobid" --format "{{.ID}}")
    echo "   Container ID: $CONTAINER_ID"
    echo "   Status: $(docker ps --filter "name=vqmethod-grobid" --format "{{.Status}}")"
else
    echo -e "${RED}✗${NC} GROBID container is not running"
    echo "   Start GROBID: docker-compose -f docker-compose.dev.yml up -d grobid"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Test 3: Check GROBID health endpoint
echo "3. Checking GROBID health endpoint..."
if curl -s -f http://localhost:8070/api/isalive > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} GROBID health endpoint is responding"

    # Show response
    HEALTH_STATUS=$(curl -s http://localhost:8070/api/isalive)
    echo "   Response: $HEALTH_STATUS"
else
    echo -e "${RED}✗${NC} GROBID health endpoint is not responding"
    echo "   Ensure GROBID is fully started (can take ~60 seconds)"
    echo "   Check logs: docker logs vqmethod-grobid"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Test 4: Check environment variables
echo "4. Checking backend environment variables..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env file exists"

    # Check required variables
    if grep -q "GROBID_ENABLED" backend/.env; then
        GROBID_ENABLED=$(grep "GROBID_ENABLED" backend/.env | cut -d '=' -f 2)
        if [ "$GROBID_ENABLED" = "true" ]; then
            echo -e "${GREEN}✓${NC} GROBID_ENABLED=true"
        else
            echo -e "${YELLOW}!${NC} GROBID_ENABLED=$GROBID_ENABLED (should be 'true')"
        fi
    else
        echo -e "${RED}✗${NC} GROBID_ENABLED not found in .env"
        FAILURES=$((FAILURES + 1))
    fi

    if grep -q "GROBID_URL" backend/.env; then
        GROBID_URL=$(grep "GROBID_URL" backend/.env | cut -d '=' -f 2)
        echo "   GROBID_URL=$GROBID_URL"
    else
        echo -e "${YELLOW}!${NC} GROBID_URL not found (will use default)"
    fi
else
    echo -e "${RED}✗${NC} backend/.env file not found"
    echo "   Copy backend/.env.example to backend/.env and configure"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Test 5: Check NPM dependencies
echo "5. Checking NPM dependencies..."
if [ -f "backend/package.json" ]; then
    if grep -q "fast-xml-parser" backend/package.json; then
        echo -e "${GREEN}✓${NC} fast-xml-parser is in package.json"
    else
        echo -e "${RED}✗${NC} fast-xml-parser missing from package.json"
        echo "   Install: cd backend && npm install fast-xml-parser@^4.3.2"
        FAILURES=$((FAILURES + 1))
    fi

    if grep -q "form-data" backend/package.json; then
        echo -e "${GREEN}✓${NC} form-data is in package.json"
    else
        echo -e "${RED}✗${NC} form-data missing from package.json"
        echo "   Install: cd backend && npm install form-data@^4.0.0"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${RED}✗${NC} backend/package.json not found"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# Test 6: Check service files exist
echo "6. Checking GROBID service files..."
FILES_TO_CHECK=(
    "backend/src/config/grobid.config.ts"
    "backend/src/modules/literature/dto/grobid.dto.ts"
    "backend/src/modules/literature/services/grobid-extraction.service.ts"
    "backend/src/modules/literature/services/grobid-extraction.service.spec.ts"
)

ALL_FILES_EXIST=true
for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✓${NC} $FILE"
    else
        echo -e "${RED}✗${NC} $FILE missing"
        ALL_FILES_EXIST=false
        FAILURES=$((FAILURES + 1))
    fi
done
echo ""

# Test 7: Port availability check
echo "7. Checking port availability..."
if lsof -Pi :8070 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✓${NC} Port 8070 is in use (GROBID should be listening)"
else
    echo -e "${YELLOW}!${NC} Port 8070 is not in use"
    echo "   GROBID may not be running or not fully started"
fi
echo ""

# Final summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "GROBID is properly configured and ready to use."
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: cd backend && npm run start:dev"
    echo "  2. Test with a paper that has a PDF URL"
    echo "  3. Check logs for 'Tier 2.5: GROBID extracted X words'"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    echo ""
    echo "For help, see: PHASE_10.94_GROBID_IMPLEMENTATION_COMPLETE.md"
    exit 1
fi
