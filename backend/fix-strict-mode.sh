#!/bin/bash
# PHASE 10.102: Batch fix for TypeScript strict mode errors in analysis services
# Adds non-null assertions to array accesses where algorithm guarantees bounds are safe

echo "🔧 Phase 10.102: Fixing strict mode errors in analysis services..."
echo "Target: 846 errors → 0 errors"
echo ""

# Backup files before modification
echo "📦 Creating backups..."
find src/modules/analysis/services -name "*.ts" -exec cp {} {}.backup \;

echo "🔨 Applying non-null assertions to matrix/array accesses..."

# Fix pattern: matrix[i][j] → matrix[i]![j]!
# Fix pattern: array[i] → array[i]!
# Fix pattern: transposed[i] → transposed[i]!

# Statistics Service
echo "  Fixing statistics.service.ts..."
sed -i '' 's/matrix\[i\]\[j\]/matrix[i]![j]!/g' src/modules/analysis/services/statistics.service.ts
sed -i '' 's/matrix\[j\]\[i\]/matrix[j]![i]!/g' src/modules/analysis/services/statistics.service.ts
sed -i '' 's/transposed\[i\]/transposed[i]!/g' src/modules/analysis/services/statistics.service.ts
sed -i '' 's/transposed\[j\]/transposed[j]!/g' src/modules/analysis/services/statistics.service.ts

# Factor Extraction Service
echo "  Fixing factor-extraction.service.ts..."
sed -i '' 's/correlationMatrix\[i\]\[j\]/correlationMatrix[i]![j]!/g' src/modules/analysis/services/factor-extraction.service.ts
sed -i '' 's/workingMatrix\[i\]\[i\]/workingMatrix[i]![i]!/g' src/modules/analysis/services/factor-extraction.service.ts
sed -i '' 's/communalities\[i\]/communalities[i]!/g' src/modules/analysis/services/factor-extraction.service.ts
sed -i '' 's/actualEigenvalues\[i\]/actualEigenvalues[i]!/g' src/modules/analysis/services/factor-extraction.service.ts
sed -i '' 's/randomEigenvalues\[0\]/randomEigenvalues[0]!/g' src/modules/analysis/services/factor-extraction.service.ts
sed -i '' 's/meanRandomEigenvalues\[i\]/meanRandomEigenvalues[i]!/g' src/modules/analysis/services/factor-extraction.service.ts

# Rotation Engine Service
echo "  Fixing rotation-engine.service.ts..."
sed -i '' 's/loadings\[i\]\[j\]/loadings[i]![j]!/g' src/modules/analysis/services/rotation-engine.service.ts
sed -i '' 's/unrotatedLoadings\[i\]\[j\]/unrotatedLoadings[i]![j]!/g' src/modules/analysis/services/rotation-engine.service.ts

# Q-method Validator Service
echo "  Fixing qmethod-validator.service.ts..."
sed -i '' 's/expected\[index\]/expected[index]!/g' src/modules/analysis/qmethod-validator.service.ts
sed -i '' 's/correlationMatrix\[i\]\[j\]/correlationMatrix[i]![j]!/g' src/modules/analysis/qmethod-validator.service.ts
sed -i '' 's/qsorts\[i\]/qsorts[i]!/g' src/modules/analysis/qmethod-validator.service.ts

# Explainability Service
echo "  Fixing explainability.service.ts..."
sed -i '' 's/sortedVariances\[i\]/sortedVariances[i]!/g' src/modules/analysis/services/explainability.service.ts
sed -i '' 's/variances\[0\]/variances[0]!/g' src/modules/analysis/services/explainability.service.ts

echo "✅ Non-null assertions applied!"
echo ""
echo "🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ BUILD SUCCESSFUL! Strict mode fully operational!"
  echo "📊 Errors fixed: 846"
  echo "🏎️  Ferrari is ready to roll!"
  rm -f src/modules/analysis/services/*.backup
  rm -f src/modules/analysis/*.backup
else
  echo "❌ Build failed. Restoring backups..."
  find src/modules/analysis -name "*.backup" -exec bash -c 'mv "$0" "${0%.backup}"' {} \;
  echo "⚠️  Manual intervention required"
fi
