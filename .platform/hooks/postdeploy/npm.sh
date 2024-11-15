#!/bin/bash
cd /var/app/current

# Kill any existing node processes
pkill -f "node"

# Wait a moment for the port to be released
sleep 2

# Start the server
npm start 