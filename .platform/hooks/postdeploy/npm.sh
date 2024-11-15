#!/bin/bash
cd /var/app/current
if pgrep -f "node dist/server.js" > /dev/null; then
    pkill -f "node dist/server.js"
    sleep 2
fi
npm start &
sleep 5
if ! pgrep -f "node dist/server.js" > /dev/null; then
    echo "Failed to start the server"
    exit 1
fi
exit 0 