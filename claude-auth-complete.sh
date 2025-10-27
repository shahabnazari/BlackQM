#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Claude VS Code Authentication Assistant           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check if Claude extensions are installed
echo -e "${YELLOW}Step 1: Checking Claude Extensions...${NC}"
EXTENSIONS=$(code --list-extensions | grep -i "anthropic\|claude")
if [ -z "$EXTENSIONS" ]; then
    echo -e "${RED}❌ No Claude extensions found!${NC}"
    echo ""
    echo "Installing Claude extensions..."
    code --install-extension Anthropic.claude-code
    code --install-extension codeontherocks.claude-config
    echo -e "${GREEN}✓ Extensions installed${NC}"
else
    echo -e "${GREEN}✓ Claude extensions already installed:${NC}"
    echo "$EXTENSIONS" | while read ext; do
        echo "  • $ext"
    done
fi
echo ""

# Step 2: Check current authentication status
echo -e "${YELLOW}Step 2: Checking Current Authentication Status...${NC}"
SETTINGS_FILE="$HOME/Library/Application Support/Code/User/settings.json"
API_KEY=""

if [ -f "$SETTINGS_FILE" ]; then
    API_KEY=$(grep -o '"claude.apiKey": "[^"]*"' "$SETTINGS_FILE" 2>/dev/null | cut -d'"' -f4)
    if [ ! -z "$API_KEY" ]; then
        echo -e "${GREEN}✓ API key found in settings${NC}"
        echo "  Key preview: ${API_KEY:0:15}...${API_KEY: -10}"
        
        # Test the API key
        echo ""
        echo -e "${YELLOW}Testing API key...${NC}"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.anthropic.com/v1/messages \
          -H "x-api-key: $API_KEY" \
          -H "anthropic-version: 2023-06-01" \
          -H "content-type: application/json" \
          -d '{
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 50,
            "messages": [
              {"role": "user", "content": "Say hello in exactly 3 words"}
            ]
          }' 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ API key is valid and working!${NC}"
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║     🎉 Claude is already authenticated and working!      ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo "You can now use Claude in VS Code by:"
            echo "  1. Press Cmd+Shift+P"
            echo "  2. Type 'Claude' to see available commands"
            echo "  3. Or click the Claude icon in the sidebar"
            echo ""
            read -p "Would you like to test Claude chat now? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "Opening VS Code..."
                code .
                echo ""
                echo "Now try: Cmd+Shift+P → 'Claude: New Chat'"
            fi
            exit 0
        else
            echo -e "${RED}❌ API key is invalid or expired${NC}"
            echo "You need a new API key"
            API_KEY=""
        fi
    else
        echo -e "${YELLOW}⚠ No API key found in settings${NC}"
    fi
else
    echo -e "${YELLOW}⚠ VS Code settings file doesn't exist${NC}"
    echo "Creating settings file..."
    mkdir -p "$(dirname "$SETTINGS_FILE")"
    echo "{}" > "$SETTINGS_FILE"
fi
echo ""

# Step 3: Authentication Options
echo -e "${YELLOW}Step 3: Choose Authentication Method${NC}"
echo ""
echo "Select how you want to authenticate:"
echo "  1) Use API Key (Recommended - Always works)"
echo "  2) Browser Sign-in (May not always be available)"
echo "  3) Get help obtaining an API key"
echo "  4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}API Key Authentication${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        if [ -z "$API_KEY" ]; then
            echo "You'll need an Anthropic API key."
            echo "If you don't have one, I can help you get it."
            echo ""
            read -p "Do you have an API key? (y/n) " -n 1 -r
            echo ""
            
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo ""
                echo "Let's get you an API key:"
                echo "1. Opening Anthropic Console..."
                open "https://console.anthropic.com/account/keys"
                echo ""
                echo "2. Sign in with your Claude account"
                echo "3. Click 'Create Key'"
                echo "4. Copy the key (starts with 'sk-ant-...')"
                echo ""
                echo "Press Enter when you have copied your key..."
                read
            fi
            
            echo ""
            echo "Please paste your API key below:"
            echo "(It should start with 'sk-ant-')"
            echo ""
            read -s -p "API Key: " NEW_API_KEY
            echo ""
            
            if [ -z "$NEW_API_KEY" ]; then
                echo -e "${RED}❌ No API key provided${NC}"
                exit 1
            fi
            
            if [[ ! "$NEW_API_KEY" =~ ^sk-ant- ]]; then
                echo -e "${YELLOW}⚠ Warning: Key doesn't start with 'sk-ant-'${NC}"
                read -p "Continue anyway? (y/n) " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
            
            API_KEY="$NEW_API_KEY"
        fi
        
        # Update settings with API key
        echo ""
        echo "Updating VS Code settings..."
        
        # Create Python script to properly update JSON
        cat > /tmp/update_claude_auth.py << EOF
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

# Add all possible Claude API key settings
settings["claude.apiKey"] = api_key
settings["claudeCodeChat.apiKey"] = api_key
settings["anthropic.apiKey"] = api_key
settings["claude-code.apiKey"] = api_key
settings["claude.anthropicApiKey"] = api_key

# Enable Claude features
settings["claude.enabled"] = True
settings["claude.showInStatusBar"] = True

with open(settings_path, 'w') as f:
    json.dump(settings, f, indent=2)

print("✓ Settings updated successfully")
EOF
        
        python3 /tmp/update_claude_auth.py "$API_KEY"
        rm /tmp/update_claude_auth.py
        
        echo -e "${GREEN}✓ API key saved to VS Code settings${NC}"
        echo ""
        
        # Test the new API key
        echo "Testing authentication..."
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.anthropic.com/v1/messages \
          -H "x-api-key: $API_KEY" \
          -H "anthropic-version: 2023-06-01" \
          -H "content-type: application/json" \
          -d '{
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 50,
            "messages": [
              {"role": "user", "content": "Say hello"}
            ]
          }' 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Authentication successful!${NC}"
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║        🎉 Claude is now authenticated!                   ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Restart VS Code for changes to take effect"
            echo "2. Press Cmd+Shift+P and type 'Claude'"
            echo "3. Use 'Claude: New Chat' to start chatting"
            echo ""
            read -p "Restart VS Code now? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                osascript -e 'quit app "Visual Studio Code"'
                sleep 2
                code .
                echo ""
                echo -e "${GREEN}✓ VS Code restarted${NC}"
                echo "Try: Cmd+Shift+P → 'Claude: New Chat'"
            fi
        else
            echo -e "${RED}❌ Authentication failed${NC}"
            echo "Please check your API key and try again"
        fi
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}Browser Sign-in Method${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Opening VS Code..."
        code .
        echo ""
        echo "2. In VS Code, press: Cmd+Shift+P"
        echo "3. Type: 'Claude: Sign In'"
        echo "4. Follow the browser authentication"
        echo ""
        echo "If 'Claude: Sign In' doesn't appear:"
        echo "  • Type: 'Developer: Reload Window'"
        echo "  • Then try step 3 again"
        echo ""
        echo "Or look for the Claude icon in the sidebar"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}Getting an API Key${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "To get an Anthropic API key:"
        echo ""
        echo "1. You need a Claude account (free or paid)"
        echo "2. Go to: https://console.anthropic.com"
        echo "3. Sign in with your account"
        echo "4. Navigate to 'API Keys' section"
        echo "5. Click 'Create Key'"
        echo "6. Copy the key (starts with 'sk-ant-...')"
        echo "7. Run this script again and choose option 1"
        echo ""
        read -p "Open Anthropic Console now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://console.anthropic.com/account/keys"
        fi
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "For additional help, run: ./test-claude-chat.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
