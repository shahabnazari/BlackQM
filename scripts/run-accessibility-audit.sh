#!/bin/bash

###############################################################################
# Phase 10 Day 5.7 Stage 2 Phase 2: Accessibility Audit Script
# Automated Lighthouse Accessibility Testing
#
# Purpose: Run automated accessibility tests on all key pages
# Requirements: Chrome browser, Node.js, lighthouse CLI
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Accessibility Audit - Lighthouse Testing         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}⚠️  Lighthouse CLI not found. Installing...${NC}"
    npm install -g lighthouse
fi

# Check if frontend is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Frontend is not running on port 3000${NC}"
    echo "   Please start the frontend with: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Frontend is running${NC}"
echo ""

# Create reports directory
REPORT_DIR="frontend/lighthouse-reports"
mkdir -p "$REPORT_DIR"

# Test pages
PAGES=(
    "http://localhost:3000/discover/literature|literature-search"
    "http://localhost:3000/|home"
    "http://localhost:3000/auth/login|login"
)

TOTAL_PAGES=${#PAGES[@]}
PASSED_PAGES=0

echo -e "${YELLOW}📋 Testing $TOTAL_PAGES pages for accessibility...${NC}"
echo ""

for page_info in "${PAGES[@]}"; do
    IFS='|' read -r url name <<< "$page_info"

    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Testing: $name${NC}"
    echo -e "${BLUE}URL: $url${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

    # Run Lighthouse accessibility audit
    lighthouse "$url" \
        --only-categories=accessibility \
        --output=html \
        --output=json \
        --output-path="$REPORT_DIR/$name" \
        --chrome-flags="--headless" \
        --quiet 2>&1 | grep -E "(Accessibility|Performance|Best Practices|SEO)" || true

    # Extract accessibility score from JSON report
    if [ -f "$REPORT_DIR/$name.report.json" ]; then
        SCORE=$(node -e "console.log(Math.round(require('./$REPORT_DIR/$name.report.json').categories.accessibility.score * 100))")

        if [ "$SCORE" -ge 90 ]; then
            echo -e "${GREEN}✅ $name: $SCORE/100 - PASSED${NC}"
            ((PASSED_PAGES++))
        else
            echo -e "${RED}❌ $name: $SCORE/100 - FAILED${NC}"
        fi

        echo "   HTML Report: $REPORT_DIR/$name.report.html"
        echo "   JSON Report: $REPORT_DIR/$name.report.json"
    else
        echo -e "${RED}❌ Failed to generate report for $name${NC}"
    fi

    echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ACCESSIBILITY AUDIT SUMMARY              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "   Total Pages Tested: $TOTAL_PAGES"
echo -e "   ${GREEN}Passed (≥90):      $PASSED_PAGES${NC}"
echo -e "   ${RED}Failed (<90):      $((TOTAL_PAGES - PASSED_PAGES))${NC}"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_PAGES / $TOTAL_PAGES) * 100}")
echo "   Success Rate: $SUCCESS_RATE%"
echo ""

if (( $(echo "$SUCCESS_RATE >= 75" | bc -l) )); then
    echo -e "${GREEN}✅ ACCESSIBILITY AUDIT: PASSED (≥75% pages ≥90 score)${NC}"
    echo ""
    echo "📄 Detailed reports available in: $REPORT_DIR/"
    EXIT_CODE=0
else
    echo -e "${RED}❌ ACCESSIBILITY AUDIT: FAILED (<75% pages ≥90 score)${NC}"
    echo ""
    echo "📄 Review detailed reports in: $REPORT_DIR/"
    echo "   Focus on pages with scores <90"
    EXIT_CODE=1
fi

echo ""
echo -e "${YELLOW}💡 Tips for improving accessibility:${NC}"
echo "   1. Ensure all images have alt text"
echo "   2. Use semantic HTML (headings, landmarks)"
echo "   3. Maintain 4.5:1 color contrast ratio"
echo "   4. Add ARIA labels to interactive elements"
echo "   5. Test keyboard navigation (Tab, Enter, Space, Arrows)"
echo "   6. Verify screen reader compatibility"
echo ""

exit $EXIT_CODE
