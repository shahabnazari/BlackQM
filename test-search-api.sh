#!/bin/bash

# Test Search API Endpoint
# Tests if backend search is working after restart

echo "=== Testing Literature Search API ==="
echo ""

# Test search with simple query
echo "1. Testing search with query: 'machine learning'"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST http://localhost:4000/api/literature/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "filters": {
      "academicDatabases": ["pubmed", "arxiv"],
      "yearRange": [2020, 2025]
    },
    "limit": 10,
    "offset": 0
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS - Search API is working!"
  echo ""
  echo "Response preview:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null | head -30 || echo "$BODY" | head -10
  echo ""

  # Count papers in response
  PAPER_COUNT=$(echo "$BODY" | grep -o '"papers":\[' | wc -l | tr -d ' ')
  if [ "$PAPER_COUNT" -gt 0 ]; then
    echo "✅ Papers returned in response"
  else
    echo "⚠️  No papers in response (may be normal if no results)"
  fi
else
  echo "❌ FAILED - HTTP $HTTP_CODE"
  echo "Error response:"
  echo "$BODY"
fi

echo ""
echo "=== Test Complete ==="
