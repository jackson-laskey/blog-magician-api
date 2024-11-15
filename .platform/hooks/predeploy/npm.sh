#!/bin/bash
cd /var/app/staging
npm ci --only=production
exit 0 