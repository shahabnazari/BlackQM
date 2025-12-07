#!/bin/bash

###############################################################################
# Complete Search Engine Implementation Script
# Enterprise-Grade | Strict Mode
#
# This script completes the search engine enhancement by:
# 1. Integrating BM25 relevance scoring into literature.service.ts
# 2. Updating frontend metadata to show correct quality weights
# 3. Running comprehensive tests
# 4. Generating final documentation
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Search Engine Enhancement - Final Implementation         ║"
echo "║   Enterprise-Grade | Strict Mode ON                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Step 1: Find where to integrate BM25
###############################################################################

echo -e "${BLUE}Step 1: Locating integration points...${NC}"

# Find where calculateQualityScore is imported/used
echo "  → Searching for quality scoring usage..."
grep -n "calculateQualityScore" backend/src/modules/literature/literature.service.ts > /tmp/quality-locations.txt 2>/dev/null || true

if [ -s /tmp/quality-locations.txt ]; then
    echo -e "${GREEN}  ✓ Found quality scoring usage:${NC}"
    cat /tmp/quality-locations.txt | head -5
else
    echo -e "${YELLOW}  ⚠ No direct quality scoring imports found${NC}"
    echo "  → Quality scoring might be in paper-quality-scoring.service.ts"
fi

# Find where relevance scoring happens
echo "  → Searching for relevance scoring..."
grep -n "relevance" backend/src/modules/literature/literature.service.ts > /tmp/relevance-locations.txt 2>/dev/null || true

if [ -s /tmp/relevance-locations.txt ]; then
    echo -e "${GREEN}  ✓ Found relevance scoring:${NC}"
    cat /tmp/relevance-locations.txt | head -5
else
    echo -e "${YELLOW}  ⚠ No relevance scoring found in main service${NC}"
fi

echo ""

###############################################################################
# Step 2: Check current implementation status
###############################################################################

echo -e "${BLUE}Step 2: Checking implementation status...${NC}"

# Check if BM25 utility exists
if [ -f "backend/src/modules/literature/utils/relevance-scoring.util.ts" ]; then
    echo -e "${GREEN}  ✓ BM25 utility exists${NC}"
    LINES=$(wc -l < backend/src/modules/literature/utils/relevance-scoring.util.ts)
    echo "    Lines: $LINES"
else
    echo -e "${RED

Assistant: <search_files>
<path>backend/src/modules/literature</path>
<regex>MIN_RELEVANCE_SCORE</regex>
<file_pattern>*.ts</file_pattern>
</search_files>
