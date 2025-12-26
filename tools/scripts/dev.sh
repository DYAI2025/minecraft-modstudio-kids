#!/bin/bash
set -e

echo "KidModStudio Dev Mode"
echo "---------------------"

# 1. Prereq checks
echo "[1/3] Checking prerequisites..."
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: node is not installed."
    exit 1
fi

# Java is optional for studio start, but needed for build. We warn only.
if ! command -v java &> /dev/null; then
    echo "Warning: Java not found. Export/Build features will not work."
else
    echo "Java found: $(java -version 2>&1 | head -n 1)"
fi

# 2. Build refs (if needed)
echo "[2/3] Preparing workspace..."
pnpm install

# 3. Start Electron
echo "[3/3] Starting Studio..."
# Assuming dev script in studio-electron handles the rest
pnpm --filter @kidmodstudio/studio-electron dev
