#!/bin/bash

echo "Identifying hanging tests..."
echo "=============================="

# Find all test files
find . -name "*.test.tsx" -o -name "*.test.ts" | grep -v node_modules | grep -v .next | while read -r testfile; do
    echo -n "Testing: $testfile ... "
    
    # Run the test with a 10-second timeout
    timeout 10s npx vitest run "$testfile" --reporter=silent > /dev/null 2>&1
    
    if [ $? -eq 124 ]; then
        echo "TIMEOUT ⏱️"
    elif [ $? -eq 0 ]; then
        echo "PASS ✅"
    else
        echo "FAIL ❌"
    fi
done

echo "=============================="
echo "Test identification complete!"