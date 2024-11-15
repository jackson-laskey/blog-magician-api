#!/bin/bash
cd /var/app/staging

# Install production dependencies only
npm ci --only=production

exit 0 