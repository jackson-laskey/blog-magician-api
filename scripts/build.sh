#!/bin/bash

# Exit on error
set -e

echo "🏗️ Starting local build test..."

# Navigate to the project root first
cd "$(dirname "$0")/../../../"

# Install root dependencies if needed
echo "📦 Installing root dependencies..."
npm install

# Build dependent packages first (if they exist)
echo "🔨 Building shared packages..."
npm run build --workspace=packages/types
npm run build --workspace=packages/database

# Build the API
echo "🚀 Building API..."
cd apps/api
npm install
npm run build

echo "✅ Build completed successfully!"