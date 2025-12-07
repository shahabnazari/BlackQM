#!/bin/bash

# Phase 10.98 Real-Time Theme Extraction Monitor
# Watches backend logs for LocalCodeExtractionService and LocalThemeLabelingService activity

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Phase 10.98 Theme Extraction Monitor"
echo "  Watching for Local TF-Based Extraction (NO AI, \$0.00 cost)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ GOOD SIGNS (Expected):"
echo "  - 'Extracting codes from X sources using TF...'"
echo "  - 'Labeling X theme clusters using TF analysis...'"
echo "  - 'Routing to LocalCodeExtractionService'"
echo "  - 'Routing to LocalThemeLabelingService'"
echo "  - '\$0.00 cost' messages"
echo ""
echo "❌ BAD SIGNS (Should NOT appear):"
echo "  - 'AI service rate limit exceeded'"
echo "  - 'OpenAI API' or 'Groq API'"
echo "  - '429 Too Many Requests'"
echo "  - Token usage messages"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Monitoring backend logs... (Press Ctrl+C to stop)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find the most recent backend log file
LOG_DIR="$HOME/Documents/blackQmethhod/logs/backend"
if [ ! -d "$LOG_DIR" ]; then
  LOG_DIR="logs/backend"
fi

if [ ! -d "$LOG_DIR" ]; then
  echo "❌ Error: Backend log directory not found"
  echo "Expected: $HOME/Documents/blackQmethhod/logs/backend"
  exit 1
fi

# Monitor logs with color coding
tail -f "$LOG_DIR"/*.log 2>/dev/null | grep --line-buffered -E "(LocalCode|LocalTheme|TF|Routing|Extracted|Labeled|cost|AI service|rate limit|OpenAI|Groq|429)" | while read line; do
  # Color code based on content
  if echo "$line" | grep -q "LocalCodeExtraction\|LocalThemeLabeling"; then
    # Green for local services
    echo -e "\033[0;32m✅ $line\033[0m"
  elif echo "$line" | grep -q "\$0.00 cost"; then
    # Cyan for cost verification
    echo -e "\033[0;36m💰 $line\033[0m"
  elif echo "$line" | grep -q "Routing to Local"; then
    # Blue for routing
    echo -e "\033[0;34m🔧 $line\033[0m"
  elif echo "$line" | grep -q "AI service\|OpenAI\|Groq\|429\|rate limit"; then
    # Red for AI calls (should not appear!)
    echo -e "\033[0;31m❌ WARNING: $line\033[0m"
  else
    # Default for other messages
    echo "$line"
  fi
done
