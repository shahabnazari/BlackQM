#!/bin/bash

# Remove outdated IMPLEMENTATION_PHASES files from Lead folder
echo "Removing outdated IMPLEMENTATION_PHASES files from Lead folder..."

cd /Users/shahabnazariadli/Documents/blackQmethhod/Lead

# Remove each file
echo "Removing IMPLEMENTATION_PHASES.md..."
rm -f IMPLEMENTATION_PHASES.md

echo "Removing IMPLEMENTATION_PHASES_PART1.md..."
rm -f IMPLEMENTATION_PHASES_PART1.md

echo "Removing IMPLEMENTATION_PHASES_PART1A.md..."
rm -f IMPLEMENTATION_PHASES_PART1A.md

echo "Removing IMPLEMENTATION_PHASES_PART1B.md..."
rm -f IMPLEMENTATION_PHASES_PART1B.md

echo "Removing IMPLEMENTATION_PHASES_PART2.md..."
rm -f IMPLEMENTATION_PHASES_PART2.md

echo "Done! Outdated files removed."
echo ""
echo "Remaining files in Lead folder:"
ls -la | grep -E "\.md$" | grep -v IMPLEMENTATION_PHASES

echo ""
echo "PHASE_TRACKER.md in Main Docs is now the sole source of truth."