#!/bin/bash
#
# Simple GROBID Test Script
# Tests GROBID container is running and responding
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          GROBID Simple Health Check Test                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Check container is running
echo -e "${BLUE}[1/3]${NC} Checking Docker container status..."
if /Applications/Docker.app/Contents/Resources/bin/docker ps | grep -q "vqmethod-grobid"; then
    echo -e "${GREEN}✅ GROBID container is running${NC}"
    /Applications/Docker.app/Contents/Resources/bin/docker ps | grep grobid | head -1
else
    echo -e "${RED}❌ GROBID container is NOT running${NC}"
    exit 1
fi

echo ""

# Test 2: Check health endpoint
echo -e "${BLUE}[2/3]${NC} Testing GROBID health endpoint..."
HEALTH=$(curl -s http://localhost:8070/api/isalive)
if [ "$HEALTH" = "true" ]; then
    echo -e "${GREEN}✅ GROBID health check passed${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}❌ GROBID health check failed${NC}"
    echo "Response: $HEALTH"
    exit 1
fi

echo ""

# Test 3: Check GROBID version/info
echo -e "${BLUE}[3/3]${NC} Getting GROBID version info..."
VERSION=$(curl -s http://localhost:8070/api/version 2>/dev/null || echo "Version endpoint not available")
echo "GROBID Version Response: $VERSION"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL TESTS PASSED                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}GROBID is ready for PDF extraction!${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend server: ${BLUE}cd backend && npm run start:dev${NC}"
echo "2. Watch for log: ${GREEN}'GROBID Service initialized: enabled=true'${NC}"
echo "3. Run E2E tests: ${BLUE}cd backend && ts-node scripts/test-grobid-extraction-e2e.ts${NC}"
echo ""
