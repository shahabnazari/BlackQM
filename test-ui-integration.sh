#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "  FRONTEND UI INTEGRATION TEST - PHASE 10.6 VALIDATION"
echo "═══════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0
TOTAL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_file() {
  local file=$1
  local desc=$2
  TOTAL=$((TOTAL + 1))

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $desc - File not found: $file"
    FAIL=$((FAIL + 1))
  fi
}

function test_content() {
  local file=$1
  local pattern=$2
  local desc=$3
  TOTAL=$((TOTAL + 1))

  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $desc - Pattern not found in $file"
    FAIL=$((FAIL + 1))
  fi
}

function test_count() {
  local file=$1
  local pattern=$2
  local expected=$3
  local desc=$4
  TOTAL=$((TOTAL + 1))

  local count=$(grep -c "$pattern" "$file" 2>/dev/null)
  if [ "$count" -eq "$expected" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $desc (found $count)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $desc - Expected $expected, found $count"
    FAIL=$((FAIL + 1))
  fi
}

echo "TEST 1: Core Component Files"
echo "─────────────────────────────────────────────────────────"
test_file "frontend/app/(researcher)/discover/literature/page.tsx" "Main literature page exists"
test_file "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "AcademicResourcesPanel component exists"
test_file "frontend/app/(researcher)/discover/literature/components/PaperCard.tsx" "PaperCard component exists"
test_file "frontend/app/(researcher)/discover/literature/components/SearchSection/SearchBar.tsx" "SearchBar component exists"
test_file "frontend/app/(researcher)/discover/literature/components/SearchSection/FilterPanel.tsx" "FilterPanel component exists"
test_file "frontend/app/(researcher)/discover/literature/components/SearchSection/SearchResultsDisplay.tsx" "SearchResultsDisplay component exists"
echo ""

echo "TEST 2: Academic Sources Configuration"
echo "─────────────────────────────────────────────────────────"
test_count "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "id: '" 19 "19 academic sources in UI"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "semantic_scholar" "Semantic Scholar source present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "taylor_francis" "Taylor & Francis source present (Day 13)"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "web_of_science" "Web of Science source present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "ieee_xplore" "IEEE Xplore source present"
echo ""

echo "TEST 3: Type Definitions"
echo "─────────────────────────────────────────────────────────"
test_file "frontend/lib/types/literature.types.ts" "Literature types file exists"
test_content "frontend/lib/types/literature.types.ts" "taylor_francis" "Taylor & Francis in fullTextSource union"
test_content "frontend/lib/types/literature.types.ts" "web_of_science" "Web of Science in fullTextSource union"
test_content "frontend/lib/types/literature.types.ts" "sage" "SAGE in fullTextSource union"
echo ""

echo "TEST 4: API Service Integration"
echo "─────────────────────────────────────────────────────────"
test_file "frontend/lib/services/literature-api.service.ts" "Literature API service exists"
test_content "frontend/lib/services/literature-api.service.ts" "taylor_francis" "Taylor & Francis in API service types"
test_content "frontend/lib/services/literature-api.service.ts" "searchLiterature" "searchLiterature method exists"
test_content "frontend/lib/services/literature-api.service.ts" "extractThemesAcademic" "extractThemesAcademic method exists"
echo ""

echo "TEST 5: Hook Integration"
echo "─────────────────────────────────────────────────────────"
test_file "frontend/lib/hooks/useSearch.ts" "useSearch hook exists"
test_file "frontend/lib/hooks/usePaperManagement.ts" "usePaperManagement hook exists"
test_file "frontend/lib/hooks/useThemeExtractionHandlers.ts" "useThemeExtractionHandlers hook exists"
echo ""

echo "TEST 6: Store Integration"
echo "─────────────────────────────────────────────────────────"
test_file "frontend/lib/stores/literature-search.store.ts" "Literature search store exists"
test_file "frontend/lib/stores/literature-theme.store.ts" "Literature theme store exists"
echo ""

echo "TEST 7: Component Imports"
echo "─────────────────────────────────────────────────────────"
test_content "frontend/app/(researcher)/discover/literature/page.tsx" "AcademicResourcesPanel" "Main page imports AcademicResourcesPanel"
test_content "frontend/app/(researcher)/discover/literature/page.tsx" "SearchBar\|SearchSection" "Main page imports SearchBar/SearchSection"
test_content "frontend/app/(researcher)/discover/literature/page.tsx" "PaperCard" "Main page imports PaperCard"
echo ""

echo "TEST 8: Export Functionality"
echo "─────────────────────────────────────────────────────────"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "Export BibTeX" "Export BibTeX button present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "onExportCitations" "Export citations handler present"
echo ""

echo "TEST 9: Theme Extraction Integration"
echo "─────────────────────────────────────────────────────────"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "Extract Themes" "Extract themes button present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "onExtractThemes" "Extract themes handler present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "Extract Incrementally" "Incremental extraction button present"
echo ""

echo "TEST 10: UI Polish Features"
echo "─────────────────────────────────────────────────────────"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "CostCalculator" "Cost calculator component present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "Content Depth Analysis" "Content depth analysis present"
test_content "frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx" "Full-Text Papers" "Full-text paper indicators present"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "  TEST SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo "Total Tests:    $TOTAL"
echo -e "${GREEN}✅ Passed:      $PASS ($(( PASS * 100 / TOTAL ))%)${NC}"

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ Failed:      $FAIL${NC}"
  echo "═══════════════════════════════════════════════════════"
  exit 1
else
  echo "❌ Failed:      0"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo -e "${GREEN}🎉 ALL UI INTEGRATION TESTS PASSED!${NC}"
  echo ""
  exit 0
fi
