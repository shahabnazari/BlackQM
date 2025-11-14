#!/bin/bash

# Progressive Search Test Script
# Tests the tiered source allocation and progressive search strategy

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔬 PROGRESSIVE SEARCH TEST - TIER VERIFICATION             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test query
QUERY="artificial intelligence in healthcare"
echo "📝 Test Query: \"$QUERY\""
echo ""

# Get JWT token from localStorage (you'll need to provide this)
echo "🔐 Retrieving JWT token..."
# This would normally come from the browser's localStorage
# For this test, we'll use a placeholder
TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"

if [ "$TOKEN" == "YOUR_JWT_TOKEN_HERE" ]; then
  echo "❌ ERROR: JWT token required"
  echo ""
  echo "Usage: ./test-progressive-search.sh <JWT_TOKEN>"
  echo ""
  echo "To get your token:"
  echo "1. Open browser console on http://localhost:3000"
  echo "2. Run: localStorage.getItem('access_token')"
  echo "3. Copy the token value"
  exit 1
fi

echo "✅ Token received"
echo ""

# Monitor backend logs
echo "📡 Starting backend log monitoring..."
echo ""
tail -f /tmp/backend_restart.log | grep -E "(Progressive|TIER|Premium|Good|Preprint|Aggregator|sufficient|insufficient|papers)" &
TAIL_PID=$!

echo "⏳ Waiting 3 seconds for log monitor to start..."
sleep 3

# Execute search via API
echo ""
echo "🚀 Executing progressive search..."
echo ""

curl -s -X POST http://localhost:4000/api/literature/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"$QUERY\",
    \"sources\": [\"pubmed\", \"semantic_scholar\", \"arxiv\", \"google_scholar\"],
    \"limit\": 50
  }" | jq '.' > /tmp/search_result.json

echo ""
echo "✅ Search request sent"
echo ""
echo "⏳ Waiting 15 seconds for search to complete..."
sleep 15

# Stop log monitoring
kill $TAIL_PID 2>/dev/null

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   SEARCH RESULTS SUMMARY                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -f /tmp/search_result.json ]; then
  TOTAL_PAPERS=$(jq '.papers | length' /tmp/search_result.json 2>/dev/null || echo "0")
  echo "📊 Total Papers Retrieved: $TOTAL_PAPERS"
  echo ""

  # Show source distribution
  echo "📈 Source Distribution:"
  jq -r '.papers[] | .source' /tmp/search_result.json 2>/dev/null | sort | uniq -c | sort -rn
  echo ""

  # Show quality scores
  echo "⭐ Quality Score Distribution:"
  jq -r '.papers[] | .qualityScore' /tmp/search_result.json 2>/dev/null | sort -n | uniq -c | tail -10
fi

echo ""
echo "📄 Full results saved to: /tmp/search_result.json"
echo "📄 Backend logs saved to: /tmp/backend_restart.log"
echo ""
echo "✅ Test complete!"
