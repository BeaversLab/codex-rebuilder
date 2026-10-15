#!/bin/bash

# Exit on any error
set -e

CASK_FILE=${1:-"Casks/codex-intel.rb"}
CASK_TOKEN=$(basename "$CASK_FILE" .rb)
APP_NAME=${2:-"Codex.app"}

echo "Running tests for $CASK_FILE (token: $CASK_TOKEN)..."

# Get the repo root directory (one level above this script)
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Determine tap name:
# - Allow override via TAP_NAME environment variable.
# - Prefer GITHUB_REPOSITORY when available.
# - Fallback to a local, low-collision name based on the repo directory.
if [ -n "${TAP_NAME:-}" ]; then
    : # use existing TAP_NAME from environment
elif [ -n "${GITHUB_REPOSITORY:-}" ]; then
    TAP_NAME="$GITHUB_REPOSITORY"
else
    TAP_NAME="local/$(basename "$REPO_DIR")"
fi
# Register the local repo as a Homebrew tap so cask names can be used.
# Track whether the tap already existed so cleanup can avoid removing a
# pre-existing tap that belongs to the user or CI environment.
CASK_REF="$TAP_NAME/$CASK_TOKEN"
TAP_CREATED=false
if brew tap | grep -qx "$TAP_NAME"; then
    echo "Tap $TAP_NAME already exists; reusing it."
else
    echo "Setting up tap: $TAP_NAME -> $REPO_DIR"
    brew tap "$TAP_NAME" "$REPO_DIR"
    TAP_CREATED=true
fi

# Cleanup function to run on exit, ensuring no state is left behind
cleanup() {
    if brew list --cask "$CASK_REF" &>/dev/null; then
        echo "Cleanup: uninstalling $CASK_REF..."
        brew uninstall --cask "$CASK_REF" || true
    fi
    if [ -d "/Applications/$APP_NAME" ]; then
        echo "Cleanup: removing /Applications/$APP_NAME..."
        rm -rf "/Applications/$APP_NAME" || true
    fi
    if [ -d "$HOME/Applications/$APP_NAME" ]; then
        echo "Cleanup: removing ~/Applications/$APP_NAME..."
        rm -rf "$HOME/Applications/$APP_NAME" || true
    fi
    if [ "$TAP_CREATED" = true ]; then
        brew untap "$TAP_NAME" || true
    fi
}
trap cleanup EXIT

# 1. Syntax Validation (brew audit)
echo "[1/4] Auditing syntax with brew..."
# Strict audit checks for syntax and basic style issues
if ! brew audit --cask --strict "$CASK_REF"; then
    echo "Audit failed"
    exit 1
fi
echo "Audit passed."

# 2. Test Installation
echo "[2/4] Testing installation..."
if ! brew install --cask "$CASK_REF"; then
    echo "Install failed"
    exit 1
fi

# Verify if it was installed successfully
# By default, Homebrew Casks install to /Applications or ~/Applications
if [ -d "/Applications/$APP_NAME" ]; then
    echo "Installation verified: /Applications/$APP_NAME exists."
elif [ -d "$HOME/Applications/$APP_NAME" ]; then
    echo "Installation verified: ~/Applications/$APP_NAME exists."
else
    echo "Installation failed: $APP_NAME not found in /Applications or ~/Applications"
    exit 1
fi

# 3. Test Uninstallation
echo "[3/4] Testing uninstallation..."
if ! brew uninstall --cask "$CASK_REF"; then
    echo "Uninstall failed"
    exit 1
fi

# Verify uninstallation was successful
if [ -d "/Applications/$APP_NAME" ] || [ -d "$HOME/Applications/$APP_NAME" ]; then
    echo "Uninstall failed: $APP_NAME still exists."
    exit 1
else
    echo "Uninstallation verified."
fi

echo "[4/4] All tests passed successfully!"
