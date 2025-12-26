#!/bin/bash
set -e

echo "KidModStudio Release Packaging"
echo "------------------------------"

echo "Building core packages..."
pnpm -r --filter "./packages/*" build

echo "Packaging Electron App..."
pnpm --filter @kidmodstudio/studio-electron build

echo "Done (Dry run for MVP)"
