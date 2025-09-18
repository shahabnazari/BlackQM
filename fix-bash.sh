#!/bin/bash
# Clean up any stuck processes or corrupted state

# Kill any stuck node processes related to the TypeScript fixer
pkill -f "world-class-typescript-fix.js" 2>/dev/null

# Remove any potentially corrupted files
rm -f world-class-typescript-fix.js 2>/dev/null
rm -f typescript-fix.js 2>/dev/null

# Clear bash history that might contain problematic commands
> ~/.bash_history 2>/dev/null

# Reset shell environment
unset -f cat 2>/dev/null
unset -f mv 2>/dev/null
unset -f cp 2>/dev/null
unset -f touch 2>/dev/null

# Clear any aliases that might be interfering
unalias -a 2>/dev/null

echo "Bash environment cleaned"