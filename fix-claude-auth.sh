#!/bin/bash

echo "=================================="
echo "Claude Authentication Fix Script"
echo "=================================="
echo ""

# Check if Claude extensions are installed
echo "✓ Checking Claude extensions..."
EXTENSIONS=$(code --list-extensions | grep -i "anthropic\|claude")
if [ -z "$EXTENSIONS" ]; then
    echo "❌ Claude extensions not found!"
    exit 1
else
    echo "✓ Claude extensions installed:"
    echo "$EXTENSIONS"
fi
echo ""

# Check authentication status
echo "Checking authentication status..."
AUTH_DIR="$HOME/Library/Application Support/Code/User/globalStorage"
if [ -d "$AUTH_DIR/anthropic.claude-code" ]; then
    echo "✓ Authentication data found"
else
    echo "❌ No authentication data found - You need to sign in"
fi
echo ""

echo "=================================="
echo "NEXT STEPS:"
echo "=================================="
echo ""
echo "1. Open VS Code"
echo "2. Press: Cmd+Shift+P"
echo "3. Type: 'Claude: Sign In'"
echo "4. Press Enter"
echo "5. Follow the browser authentication"
echo ""
echo "If 'Claude: Sign In' doesn't appear:"
echo "  - Press Cmd+Shift+P"
echo "  - Type: 'Developer: Reload Window'"
echo "  - Try step 3 again"
echo ""
echo "=================================="
echo ""

# Offer to open VS Code
read -p "Would you like me to open VS Code now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening VS Code..."
    code .
    echo ""
    echo "Now follow the steps above to sign in to Claude"
fi
