#!/bin/bash

# VQMethod Server Restart Script

echo "🔄 Restarting VQMethod servers..."

# Stop servers
./stop.sh

# Wait a moment
sleep 2

# Start servers
./start.sh