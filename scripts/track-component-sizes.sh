#!/bin/bash
# Phase 10.91 Day 1 Step 2: Component Size Tracking Script
# Tracks literature page component sizes to ensure < 400 lines

echo "=================================================="
echo "   Literature Page Component Size Report"
echo "   Phase 10.91 - Technical Debt Tracking"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check file size and colorize
check_size() {
    local file=$1
    local limit=$2
    
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        filename=$(basename "$file")
        
        if [ $lines -gt $limit ]; then
            echo -e "${RED}❌ $filename: $lines lines (OVER by $((lines - limit)))${NC}"
        elif [ $lines -gt $((limit - 50)) ]; then
            echo -e "${YELLOW}⚠️  $filename: $lines lines (close to limit)${NC}"
        else
            echo -e "${GREEN}✅ $filename: $lines lines${NC}"
        fi
    else
        echo -e "${RED}❌ $filename: FILE NOT FOUND${NC}"
    fi
}

echo "🎯 TARGET: page.tsx < 300 lines"
check_size "frontend/app/(researcher)/discover/literature/page.tsx" 300
echo ""

echo "🎯 TARGET: Components < 400 lines"
check_size "frontend/components/literature/PaperCard.tsx" 400
check_size "frontend/components/literature/ProgressiveLoadingIndicator.tsx" 400
check_size "frontend/components/literature/AcademicResourcesPanel.tsx" 400
check_size "frontend/components/literature/AlternativeSourcesPanel.tsx" 400
check_size "frontend/components/literature/SocialMediaPanel.tsx" 400
check_size "frontend/app/(researcher)/discover/literature/components/SearchSection/SearchBar.tsx" 400
check_size "frontend/app/(researcher)/discover/literature/components/PaperCard.tsx" 400
echo ""

echo "=================================================="
echo "   Summary"
echo "=================================================="

# Count total lines in main page
if [ -f "frontend/app/(researcher)/discover/literature/page.tsx" ]; then
    total_lines=$(wc -l < "frontend/app/(researcher)/discover/literature/page.tsx")
    echo "Main page.tsx: $total_lines lines"
    
    if [ $total_lines -gt 3000 ]; then
        echo -e "${RED}Status: CRITICAL - Needs refactoring${NC}"
    elif [ $total_lines -gt 1000 ]; then
        echo -e "${YELLOW}Status: HIGH - Significant refactoring needed${NC}"
    elif [ $total_lines -gt 500 ]; then
        echo -e "${YELLOW}Status: MEDIUM - Some refactoring needed${NC}"
    else
        echo -e "${GREEN}Status: GOOD - Under control${NC}"
    fi
fi

echo ""
echo "Run this script anytime: ./scripts/track-component-sizes.sh"
echo "=================================================="

