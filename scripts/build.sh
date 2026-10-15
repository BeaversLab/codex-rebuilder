#!/bin/bash

# Exit on error
set -e

echo "Checking prerequisites..."

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

# 2. Install/Update Codex CLI
echo "Installing/Updating @openai/codex CLI (x64 binary needed)..."
# We need to ensure we have the x64 binary. If running on arm64,
# npm might install arm64 version if not careful, but the CLI
# usually ships with universal or specific binaries.
# The rebuild script looks for 'x86_64' specifically.
npm install -g @openai/codex

# 3. Download Codex.dmg
if [ ! -f "Codex.dmg" ]; then
    echo "Downloading Codex.dmg..."
    curl -L -o Codex.dmg "https://persistent.oaistatic.com/codex-app-prod/Codex.dmg"
else
    echo "Codex.dmg already exists. Skipping download."
    echo "To force a redownload, delete Codex.dmg and run this script again."
fi

# 4. Run the rebuild script
echo "Running rebuild script..."
# Ensure dependencies for the script itself (if any local ones are added later)
# checks if package.json exists for the builder itself
if [ -f "package.json" ]; then
    npm install
fi

node "$(dirname "$0")/rebuild_codex.js"

# 5. Fix permissions
if [ -d "Codex_Intel.app" ]; then
    echo "Fixing permissions (clearing quarantine)..."
    xattr -cr Codex_Intel.app
else
    echo "Error: Codex_Intel.app was not created."
    exit 1
fi

# 6. Rename output
echo "Renaming Codex_Intel.app to Codex.app..."
rm -rf Codex.app
mv Codex_Intel.app Codex.app
echo "Build complete! You can now run: open Codex.app"
