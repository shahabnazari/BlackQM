# Claude VS Code Authentication Guide

## Quick Steps to Authenticate Claude in VS Code

### Method 1: API Key Authentication (Most Reliable)

1. **Get an API Key:**
   - Go to: https://console.anthropic.com/account/keys
   - Sign in with your Claude account
   - Click "Create Key" button
   - Copy the key (starts with `sk-ant-`)

2. **Add API Key to VS Code:**
   - Run: `./claude-auth-complete.sh`
   - Choose option 1
   - Paste your API key when prompted
   - The script will test and save it automatically

### Method 2: Browser Authentication

1. **In VS Code:**
   - Press `Cmd+Shift+P`
   - Type: "Claude: Sign In"
   - Follow the browser authentication flow

### Method 3: Manual Configuration

1. **Open VS Code Settings:**
   - Press `Cmd+,` to open settings
   - Click the JSON icon (top right)
2. **Add these lines:**

   ```json
   "claude.apiKey": "your-api-key-here",
   "anthropic.apiKey": "your-api-key-here",
   "claude-code.apiKey": "your-api-key-here"
   ```

3. **Restart VS Code:**
   - Quit completely (`Cmd+Q`)
   - Reopen VS Code

## Testing Your Authentication

After setting up, test Claude:

1. **Open Command Palette:**
   - Press `Cmd+Shift+P`

2. **Try these commands:**
   - "Claude: New Chat"
   - "Claude: Open Chat"
   - "Claude Code Chat: Start Chat"

3. **Or use the sidebar:**
   - Look for the Claude icon in the left sidebar
   - Click to open the chat panel

## Troubleshooting

### If "Claude: Sign In" doesn't appear:

1. Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Check extensions are enabled: `Cmd+Shift+X` → Search "Claude"

### If API key doesn't work:

1. Ensure it starts with `sk-ant-`
2. Check for extra spaces when pasting
3. Verify the key at: https://console.anthropic.com/account/keys

### If Claude chat doesn't open:

1. Check the Output panel: `View` → `Output` → Select "Claude" from dropdown
2. Look for error messages
3. Try reinstalling the extension

## Available Scripts

- `./claude-auth-complete.sh` - Complete authentication setup
- `./test-claude-chat.sh` - Test if authentication is working
- `./fix-claude-auth.sh` - Basic authentication check
- `./setup-claude-auto-auth.sh` - Set up API key authentication

## Need Help?

If you're still having issues:

1. Check if your Claude/Anthropic account is active
2. Ensure you have API access (some accounts may not have API access)
3. Try creating a new API key if the current one isn't working
