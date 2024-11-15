#!/bin/bash
cd /var/app/current

# Find and kill only the API server process
if pgrep -f "node dist/server.js" > /dev/null; then
    pkill -f "node dist/server.js"
    # Wait for the process to be fully terminated
    sleep 2
fi

# Start the server in the background
npm start &

# Wait a moment to ensure the server starts
sleep 5

# Check if the server is running
if ! pgrep -f "node dist/server.js" > /dev/null; then
    echo "Failed to start the server"
    exit 1
fi

exit 0 