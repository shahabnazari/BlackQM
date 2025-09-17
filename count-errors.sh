#!/bin/bash
cd frontend
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"