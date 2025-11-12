#!/bin/bash

echo "Testing backend pagination - checking if pages 1-6 return papers"
echo ""

for page in 1 2 3 4 5 6; do
  echo "=== PAGE $page ==="
  curl -s -X POST http://localhost:4000/api/literature/search/public \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"machine learning\", \"sources\": [], \"limit\": 20, \"page\": $page}" \
    | python3 -c "import sys,json; data=json.load(sys.stdin); papers=data.get('papers',[]); print(f'Papers returned: {len(papers)}'); [print(f'  {i+1}. {p.get(\"title\",\"N/A\")[:60]}...') for i,p in enumerate(papers[:3])]"
  echo ""
  sleep 1
done
