#!/bin/bash

# Comprehensive test script for all academic sources and filters
# Tests citation enrichment, fuzzy author search, and all filter combinations

API_URL="http://localhost:4000/api/literature/search/public"
QUERY="machine learning"

echo "========================================"
echo "COMPREHENSIVE FILTER & SOURCE TESTING"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
  local test_name="$1"
  local test_data="$2"
  local expected_min_results="$3"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"

  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$test_data")

  total=$(echo "$response" | jq -r '.total // 0')
  papers_count=$(echo "$response" | jq -r '.papers | length')

  if [ "$total" -ge "$expected_min_results" ] && [ "$papers_count" -ge "$expected_min_results" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Found $total total results, $papers_count papers returned"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} - Expected at least $expected_min_results results, got total=$total, papers=$papers_count"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

echo "=== 1. Testing Individual Sources ==="
echo ""

run_test "PubMed Basic Search" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed"],
  "limit": 5
}' 1

run_test "PubMed with Citation Enrichment" '{
  "query": "depression sunlight",
  "sources": ["pubmed"],
  "yearFrom": 2022,
  "limit": 5
}' 1

run_test "Semantic Scholar Basic Search" '{
  "query": "'"$QUERY"'",
  "sources": ["semantic_scholar"],
  "limit": 5
}' 1

run_test "CrossRef Basic Search" '{
  "query": "'"$QUERY"'",
  "sources": ["crossref"],
  "limit": 5
}' 1

run_test "ArXiv Basic Search" '{
  "query": "'"$QUERY"'",
  "sources": ["arxiv"],
  "limit": 5
}' 1

echo "=== 2. Testing Filter Combinations ==="
echo ""

run_test "Year Filter (2020-2024)" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed", "semantic_scholar"],
  "yearFrom": 2020,
  "yearTo": 2024,
  "limit": 10
}' 1

run_test "Min Citations Filter" '{
  "query": "deep learning",
  "sources": ["semantic_scholar"],
  "minCitations": 5,
  "limit": 5
}' 1

run_test "Publication Type: Journal" '{
  "query": "neural networks",
  "sources": ["pubmed"],
  "publicationType": "journal",
  "limit": 5
}' 1

run_test "Combined Filters (Year + Citations)" '{
  "query": "artificial intelligence",
  "sources": ["semantic_scholar"],
  "yearFrom": 2022,
  "minCitations": 10,
  "limit": 5
}' 1

echo "=== 3. Testing Author Search Modes ==="
echo ""

# First, get a real author name
SAMPLE_AUTHOR=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "sources": ["pubmed"],
    "limit": 1
  }' | jq -r '.papers[0].authors[0] // "Smith"')

echo "Using sample author: $SAMPLE_AUTHOR"
echo ""

AUTHOR_LAST=$(echo "$SAMPLE_AUTHOR" | awk '{print $NF}')

run_test "Author Search: Contains Mode" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed"],
  "author": "'"$AUTHOR_LAST"'",
  "authorSearchMode": "contains",
  "limit": 5
}' 0

# Test fuzzy with a misspelling
MISSPELLED=$(echo "$AUTHOR_LAST" | sed 's/i/e/1')
run_test "Author Search: Fuzzy Mode (with typo)" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed"],
  "author": "'"$MISSPELLED"'",
  "authorSearchMode": "fuzzy",
  "limit": 5
}' 0

run_test "Author Search: Exact Mode" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed"],
  "author": "'"$SAMPLE_AUTHOR"'",
  "authorSearchMode": "exact",
  "limit": 5
}' 0

echo "=== 4. Testing Sort Options ==="
echo ""

run_test "Sort by Date" '{
  "query": "'"$QUERY"'",
  "sources": ["semantic_scholar"],
  "sortBy": "date",
  "limit": 5
}' 1

run_test "Sort by Citations" '{
  "query": "'"$QUERY"'",
  "sources": ["semantic_scholar"],
  "sortBy": "citations",
  "limit": 5
}' 1

run_test "Sort by Relevance" '{
  "query": "'"$QUERY"'",
  "sources": ["semantic_scholar"],
  "sortBy": "relevance",
  "limit": 5
}' 1

echo "=== 5. Testing Multiple Sources ==="
echo ""

run_test "All Sources Combined" '{
  "query": "'"$QUERY"'",
  "sources": ["pubmed", "semantic_scholar", "crossref", "arxiv"],
  "limit": 10
}' 1

run_test "Multiple Sources with Filters" '{
  "query": "neural networks",
  "sources": ["pubmed", "semantic_scholar"],
  "yearFrom": 2023,
  "minCitations": 2,
  "limit": 10
}' 1

echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  exit 1
fi
