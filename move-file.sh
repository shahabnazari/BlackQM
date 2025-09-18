#!/bin/bash
# Move file without triggering the regex error
if [ -f "test-move-file.txt" ]; then
    cat test-move-file.txt > scripts/moved-file.txt
    rm test-move-file.txt
    echo "File moved successfully"
else
    echo "Source file not found"
fi