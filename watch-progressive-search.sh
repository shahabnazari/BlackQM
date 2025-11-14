#!/bin/bash
# Watch backend logs for progressive search behavior
# Run this while you test searches in the browser

echo "========================================="
echo "📊 WATCHING PROGRESSIVE SEARCH LOGS"
echo "========================================="
echo ""
echo "Waiting for search requests..."
echo "Look for these indicators:"
echo "  • 🎯 Progressive Search Strategy"
echo "  • 🔍 [TIER 1 - Premium]"
echo "  • ✅ Premium sources sufficient"
echo "  • ⏩ Skipping lower-tier sources"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================="
echo ""

tail -f /tmp/backend-progressive.log | grep --line-buffered -E "Progressive|TIER|sufficient|insufficient|Skipping"

