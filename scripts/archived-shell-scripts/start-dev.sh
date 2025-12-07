#!/bin/bash

echo "🚀 Starting VQMethod Development Server"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Not in the VQMethod project directory${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"

# Check if node_modules exists, if not install dependencies
if [ ! -d "frontend/node_modules" ] || [ -z "$(ls -A frontend/node_modules)" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Kill any existing processes on port 3000
echo -e "${YELLOW}🔍 Checking port 3000...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Port 3000 is in use. Killing existing process...${NC}"
    kill -9 $(lsof -Pi :3000 -sTCP:LISTEN -t)
    sleep 2
fi

# Start the frontend development server
echo -e "${GREEN}🎉 Starting frontend server on http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo "======================================="

cd frontend
npm run dev