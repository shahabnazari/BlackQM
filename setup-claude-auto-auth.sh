#!/bin/bash

echo "=================================="
echo "Claude Auto-Authentication Setup"
echo "=================================="
echo ""

# Check if VS Code settings file exists
SETTINGS_FILE="$HOME/Library/Application Support/Code/User/settings.json"

if [ ! -f "$SETTINGS_FILE" ]; then
    echo "Creating VS Code settings file..."
    echo "{}" > "$SETTINGS_FILE"
fi

echo "This script will set up automatic Claude authentication in VS Code."
echo ""
echo "You need your Anthropic API key. If you don't have one:"
echo "1. Go to: https://console.anthropic.com/account/keys"
echo "2. Sign in with your Claude Ultimate account"
echo "3. Click 'Create Key'"
echo "4. Copy the key that starts with 'sk-ant-...'"
echo ""

# Prompt for API key
read -p "Please paste your Anthropic API key here: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ No API key provided. Exiting..."
    exit 1
fi

# Validate API key format
if [[ ! "$API_KEY" =~ ^sk-ant- ]]; then
    echo "⚠️  Warning: API key doesn't start with 'sk-ant-'. Make sure it's correct."
fi

echo ""
echo "Adding API key to VS Code settings..."

# Create a temporary Python script to update JSON properly
cat > /tmp/update_claude_settings.py << 'EOF'
import json
import sys
import os

settings_path = os.path.expanduser("~/Library/Application Support/Code/User/settings.json")
api_key = sys.argv[1]

try:
    with open(settings_path, 'r') as f:
        settings = json.load(f)
except:
    settings = {}

# Add Claude settings
settings["claude.apiKey"] = api_key
settings["claudeCodeChat.apiKey"] = api_key
settings["anthropic.apiKey"] = api_key
settings["claude-code.apiKey"] = api_key

# Write back
with open(settings_path, 'w') as f:
    json.dump(settings, f, indent=2)

print("✓ API key added to VS Code settings")
EOF

# Run the Python script
python3 /tmp/update_claude_settings.py "$API_KEY"

# Clean up
rm /tmp/update_claude_settings.py

echo ""
echo "=================================="
echo "✅ SETUP COMPLETE!"
echo "=================================="
echo ""
echo "Your Claude extension is now configured with automatic authentication."
echo ""
echo "Next steps:"
echo "1. Restart VS Code (Cmd+Q, then reopen)"
echo "2. The Claude extension should now work automatically"
echo "3. Try pressing Cmd+Shift+P and type 'Claude'"
echo "4. Or click the Claude icon in the sidebar"
echo ""
echo "Your API key has been securely saved to VS Code settings."
echo "You won't need to authenticate again unless you clear VS Code data."
echo ""

# Offer to restart VS Code
read -p "Would you like me to restart VS Code now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Closing VS Code..."
    osascript -e 'quit app "Visual Studio Code"'
    sleep 2
    echo "Reopening VS Code..."
    code .
    echo ""
    echo "✅ VS Code restarted. Claude should now be authenticated!"
fi
