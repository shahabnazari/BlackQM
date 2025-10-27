#!/bin/bash

echo "=========================================="
echo "Claude Chat VSCode Testing Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if Claude extensions are installed
echo "Test 1: Checking Claude Extensions..."
EXTENSIONS=$(code --list-extensions | grep -i "anthropic\|claude")
if [ -z "$EXTENSIONS" ]; then
    echo -e "${RED}❌ FAIL: No Claude extensions found${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASS: Claude extensions installed:${NC}"
    echo "$EXTENSIONS" | while read ext; do
        echo "  - $ext"
    done
fi
echo ""

# Test 2: Check VSCode settings for API keys
echo "Test 2: Checking API Key Configuration..."
SETTINGS_FILE="$HOME/Library/Application Support/Code/User/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    echo -e "${RED}❌ FAIL: VSCode settings file not found${NC}"
    exit 1
fi

API_KEY=$(grep -o '"claude.apiKey": "[^"]*"' "$SETTINGS_FILE" | cut -d'"' -f4)
if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ FAIL: No API key found in settings${NC}"
    exit 1
else
    echo -e "${GREEN}✓ PASS: API key configured${NC}"
    echo "  Key format: ${API_KEY:0:15}...${API_KEY: -10}"
fi
echo ""

# Test 3: Validate API key format
echo "Test 3: Validating API Key Format..."
if [[ "$API_KEY" =~ ^sk-ant- ]]; then
    echo -e "${GREEN}✓ PASS: API key has correct format (starts with sk-ant-)${NC}"
else
    echo -e "${RED}❌ FAIL: API key format is incorrect${NC}"
    exit 1
fi
echo ""

# Test 4: Test API key with Anthropic API
echo "Test 4: Testing API Key with Anthropic API..."
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
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS: API key is valid and working${NC}"
    echo "  Response received from Claude API"
    # Extract the actual response text
    CLAUDE_RESPONSE=$(echo "$BODY" | grep -o '"text":"[^"]*"' | cut -d'"' -f4 | head -1)
    if [ ! -z "$CLAUDE_RESPONSE" ]; then
        echo -e "  ${GREEN}Claude says: \"$CLAUDE_RESPONSE\"${NC}"
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ FAIL: API key is invalid (401 Unauthorized)${NC}"
    echo "  You need to update your API key"
    exit 1
elif [ "$HTTP_CODE" = "429" ]; then
    echo -e "${YELLOW}⚠ WARNING: Rate limit exceeded (429)${NC}"
    echo "  API key is valid but you've hit rate limits"
else
    echo -e "${RED}❌ FAIL: API request failed (HTTP $HTTP_CODE)${NC}"
    echo "  Response: $BODY"
    exit 1
fi
echo ""

# Test 5: Check global storage
echo "Test 5: Checking Global Storage..."
GLOBAL_STORAGE="$HOME/Library/Application Support/Code/User/globalStorage"
if [ -d "$GLOBAL_STORAGE/anthropic.claude-code" ] || [ -d "$GLOBAL_STORAGE/codeontherocks.claude-config" ]; then
    echo -e "${GREEN}✓ PASS: Claude global storage exists${NC}"
    ls -la "$GLOBAL_STORAGE" | grep -i "claude\|anthropic" | while read line; do
        echo "  $line"
    done
else
    echo -e "${YELLOW}⚠ WARNING: No Claude global storage found${NC}"
    echo "  This is okay if using API key authentication"
fi
echo ""

# Test 6: Check extension settings
echo "Test 6: Checking Extension-Specific Settings..."
CLAUDE_SETTINGS=$(grep -i "claude\|anthropic" "$SETTINGS_FILE" | grep -v "apiKey")
if [ ! -z "$CLAUDE_SETTINGS" ]; then
    echo -e "${GREEN}✓ PASS: Additional Claude settings found:${NC}"
    echo "$CLAUDE_SETTINGS" | head -5 | while read line; do
        echo "  $line"
    done
else
    echo -e "${YELLOW}⚠ INFO: No additional Claude settings${NC}"
fi
echo ""

# Final Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Claude extensions: INSTALLED${NC}"
echo -e "${GREEN}✓ API key: CONFIGURED${NC}"
echo -e "${GREEN}✓ API key format: VALID${NC}"
echo -e "${GREEN}✓ API authentication: WORKING${NC}"
echo ""
echo "=========================================="
echo "Next Steps to Use Claude Chat in VSCode:"
echo "=========================================="
echo ""
echo "1. Open VSCode Command Palette:"
echo "   Press: Cmd+Shift+P"
echo ""
echo "2. Try these commands:"
echo "   - Type: 'Claude: New Chat'"
echo "   - Type: 'Claude: Open Chat'"
echo "   - Type: 'Claude Code Chat: Start Chat'"
echo ""
echo "3. Or use the Claude icon:"
echo "   - Look for Claude icon in the left sidebar"
echo "   - Click it to open the chat panel"
echo ""
echo "4. Test with a simple prompt:"
echo "   - Ask: 'Write a hello world function in Python'"
echo "   - Claude should respond with code"
echo ""
echo "=========================================="
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo "Claude Chat is properly authenticated and ready to use!"
echo "=========================================="
