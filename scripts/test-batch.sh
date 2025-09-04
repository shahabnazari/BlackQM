#!/bin/bash

# Test batching script for CI/CD environments
# Prevents resource exhaustion by running tests in controlled batches

set -e

echo "🧪 Running tests in batched mode to prevent resource exhaustion..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BATCH_SIZE=5
TEST_DIR="frontend"
RESULTS_DIR="test-results"

# Create results directory
mkdir -p $RESULTS_DIR

# Function to run tests in batches
run_test_batch() {
    local workspace=$1
    local batch_config=$2
    
    echo -e "${YELLOW}Testing $workspace...${NC}"
    
    if [ "$workspace" == "frontend" ]; then
        cd frontend
        
        # Find all test files
        TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules)
        
        # Convert to array
        TEST_ARRAY=($TEST_FILES)
        TOTAL_FILES=${#TEST_ARRAY[@]}
        
        echo "Found $TOTAL_FILES test files"
        
        # Run tests in batches
        for ((i=0; i<$TOTAL_FILES; i+=$BATCH_SIZE)); do
            BATCH_NUM=$((i/$BATCH_SIZE + 1))
            echo -e "${YELLOW}Running batch $BATCH_NUM...${NC}"
            
            # Get batch of files
            BATCH_FILES=("${TEST_ARRAY[@]:$i:$BATCH_SIZE}")
            
            # Run batch with the batch config
            if npx vitest run --config vitest.config.batch.ts "${BATCH_FILES[@]}"; then
                echo -e "${GREEN}✓ Batch $BATCH_NUM passed${NC}"
            else
                echo -e "${RED}✗ Batch $BATCH_NUM failed${NC}"
                FAILED_BATCHES+=($BATCH_NUM)
            fi
            
            # Small delay between batches to allow resource cleanup
            sleep 2
        done
        
        cd ..
    fi
    
    if [ "$workspace" == "backend" ]; then
        cd backend
        
        # Backend uses Jest which has better resource management
        echo "Running backend tests..."
        if npm test -- --maxWorkers=2 --forceExit; then
            echo -e "${GREEN}✓ Backend tests passed${NC}"
        else
            echo -e "${RED}✗ Backend tests failed${NC}"
            return 1
        fi
        
        cd ..
    fi
}

# Main execution
echo "Starting batched test execution..."
echo "Configuration:"
echo "  - Batch size: $BATCH_SIZE test files"
echo "  - Max concurrent threads: 2"
echo "  - Test timeout: 30s"
echo ""

FAILED_BATCHES=()

# Run frontend tests in batches
run_test_batch "frontend" "vitest.config.batch.ts"

# Run backend tests
run_test_batch "backend" ""

# Summary
echo ""
echo "========================================="
if [ ${#FAILED_BATCHES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some test batches failed: ${FAILED_BATCHES[@]}${NC}"
    echo "Consider further reducing batch size or increasing timeouts"
    exit 1
fi