#!/bin/bash

echo "=================================="
echo "Claude VS Code Extension Fix"
echo "=================================="
echo ""

# Extension has been reinstalled
echo "✓ Claude extension reinstalled successfully (v2.0.27)"
echo ""

echo "=================================="
echo "MANUAL STEPS REQUIRED:"
echo "=================================="
echo ""
echo "Since 'Claude: Sign In' is not appearing, try these alternatives:"
echo ""
echo "OPTION 1 - Use the Claude Icon:"
echo "1. Look for the Claude icon in VS Code's left sidebar"
echo "2. Click on it"
echo "3. Look for a 'Sign In' or 'Authenticate' button in the panel that opens"
echo ""
echo "OPTION 2 - Check Extension Settings:"
echo "1. Press Cmd+Shift+P"
echo "2. Type: 'Preferences: Open Settings (UI)'"
echo "3. Search for 'Claude'"
echo "4. Look for authentication/API key settings"
echo ""
echo "OPTION 3 - Direct Authentication:"
echo "1. Go to: https://claude.ai"
echo "2. Sign in to your account"
echo "3. Go to: https://console.anthropic.com/account/keys"
echo "4. Generate an API key if you don't have one"
echo "5. In VS Code, press Cmd+Shift+P"
echo "6. Type: 'Preferences: Open User Settings (JSON)'"
echo "7. Add this line (replace YOUR_KEY with your actual key):"
echo '   "claude.apiKey": "YOUR_KEY"'
echo ""
echo "OPTION 4 - Restart VS Code Completely:"
echo "1. Close all VS Code windows"
echo "2. Quit VS Code completely (Cmd+Q)"
echo "3. Open VS Code again"
echo "4. Press Cmd+Shift+P and look for Claude commands"
echo ""
echo "=================================="
echo ""

# Check if we can find the Claude panel
echo "Checking available Claude commands..."
echo ""
echo "Run this in VS Code Command Palette (Cmd+Shift+P):"
echo "- Type 'Claude' and see all available commands"
echo "- Type 'View: Show Claude' if available"
echo "- Type 'Claude: Open Chat' if available"
echo ""

read -p "Would you like to open the Anthropic Console to get an API key? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Anthropic Console..."
    open "https://console.anthropic.com/account/keys"
fi
