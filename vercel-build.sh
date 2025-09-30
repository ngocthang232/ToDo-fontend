#!/bin/bash
set -e

# Install dependencies
npm install

# Build the app
npx react-scripts build

echo "Build completed successfully!"
