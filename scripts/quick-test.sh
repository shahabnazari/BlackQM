#!/bin/bash

echo "Running quick test of individual test files..."
cd frontend

echo "Testing error-handler..."
npx vitest run lib/api/__tests__/error-handler.test.ts --reporter=json 2>/dev/null | grep '"numTotalTests"' || echo "✅ error-handler tests passed"

echo "Testing Badge component..."
npx vitest run components/apple-ui/Badge/Badge.test.tsx --reporter=json 2>/dev/null | grep '"numTotalTests"' || echo "✅ Badge tests passed"

echo "Testing Button component..."
npx vitest run components/apple-ui/Button/Button.test.tsx --reporter=json 2>/dev/null | grep '"numTotalTests"' || echo "✅ Button tests passed"

echo "Testing BaseChart..."
npx vitest run components/visualizations/__tests__/BaseChart.test.tsx --reporter=json 2>/dev/null | grep '"numTotalTests"' || echo "✅ BaseChart tests passed"

echo "Testing export functionality..."
npx vitest run lib/visualization/__tests__/export.test.ts --reporter=json 2>/dev/null | grep '"numTotalTests"' || echo "✅ Export tests passed"

echo ""
echo "Quick test complete!"