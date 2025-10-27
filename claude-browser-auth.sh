#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Claude Browser Sign-in Authentication             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Opening VS Code for browser authentication...${NC}"
echo ""

# Open VS Code
code .

echo -e "${GREEN}VS Code is now open. Follow these steps:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  STEP 1: Open Command Palette"
echo "  └─ Press: Cmd+Shift+P"
echo ""
echo "  STEP 2: Search for Claude Sign In"
echo "  └─ Type: 'Claude: Sign In'"
echo "  └─ Press Enter"
echo ""
echo "  STEP 3: Follow Browser Authentication"
echo "  └─ A browser window will open"
echo "  └─ Sign in with your Claude account"
echo "  └─ Authorize the VS Code extension"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  If 'Claude: Sign In' doesn't appear:${NC}"
echo ""
echo "  Alternative Method 1:"
echo "  ├─ Press: Cmd+Shift+P"
echo "  ├─ Type: 'Developer: Reload Window'"
echo "  ├─ Press Enter"
echo "  └─ Try 'Claude: Sign In' again"
echo ""
echo "  Alternative Method 2:"
echo "  ├─ Look for Claude icon in the left sidebar"
echo "  ├─ Click on it"
echo "  └─ Look for 'Sign In' button in the panel"
echo ""
echo "  Alternative Method 3:"
echo "  ├─ Press: Cmd+Shift+P"
echo "  ├─ Type: 'Claude Code Chat: Start Chat'"
echo "  └─ It may prompt you to authenticate"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}After successful authentication:${NC}"
echo "  • You'll see a success message in VS Code"
echo "  • Claude chat will be available in the sidebar"
echo "  • You can start using Claude immediately"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter after you've completed the authentication..."
echo ""

# Test if authentication worked
echo -e "${YELLOW}Testing Claude authentication...${NC}"
echo ""

# Check for authentication data
AUTH_DIR="$HOME/Library/Application Support/Code/User/globalStorage"
if [ -d "$AUTH_DIR/anthropic.claude-code" ] || [ -d "$AUTH_DIR/codeontherocks.claude-config" ]; then
    echo -e "${GREEN}✓ Authentication data found!${NC}"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     🎉 Claude authentication appears successful!         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "You can now use Claude in VS Code!"
    echo ""
    echo "Try these commands:"
    echo "  • Cmd+Shift+P → 'Claude: New Chat'"
    echo "  • Cmd+Shift+P → 'Claude: Open Chat'"
    echo "  • Click the Claude icon in the sidebar"
else
    echo -e "${YELLOW}⚠️  No authentication data found yet${NC}"
    echo ""
    echo "This could mean:"
    echo "  1. Authentication is still in progress"
    echo "  2. You need to complete the browser sign-in"
    echo "  3. The extension needs to be reloaded"
    echo ""
    echo "Try:"
    echo "  • Completing the browser authentication if still open"
    echo "  • Reloading VS Code: Cmd+Shift+P → 'Developer: Reload Window'"
    echo "  • Running ./test-claude-chat.sh to verify"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "For additional testing, run: ./test-claude-chat.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
