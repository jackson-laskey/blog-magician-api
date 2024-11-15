#!/bin/bash

# Exit on error
set -e

echo "🏗️ Starting local build test..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the API
echo "🚀 Building API..."
npm run build

echo "✅ Build completed successfully!"