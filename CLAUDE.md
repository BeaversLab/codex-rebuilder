# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository provides an automated build pipeline and Homebrew tap for distributing an unofficial Intel (x64) port of the OpenAI Codex Desktop App, which is officially only distributed for Apple Silicon.

## Build Commands

```bash
make build          # Full rebuild: downloads Codex.dmg, extracts resources, rebuilds native modules, assembles Codex.app
make install        # Move built Codex.app to /Applications
make clean          # Remove all build artifacts (Codex.app, resources/, electron*.zip, *.dmg, etc.)
```

Test the Homebrew cask locally:
```bash
bash scripts/test_cask.sh                    # Uses default Casks/codex-intel.rb
bash scripts/test_cask.sh <cask-file> <app>  # Custom cask and app path
```

There are no unit tests or linters beyond `brew audit --cask --strict` run by `test_cask.sh`.

## Architecture

### Build Pipeline (`scripts/build.sh` → `scripts/rebuild_codex.js`)

1. **build.sh** - Orchestration script:
   - Checks prerequisites (Node.js installed, npm available)
   - Installs/updates `@openai/codex` globally (needed for x64 `codex` and `rg` binaries)
   - Downloads `Codex.dmg` from `https://persistent.oaistatic.com/codex-app-prod/Codex.dmg` if not cached
   - Invokes `rebuild_codex.js`
   - Fixes permissions and renames `Codex_Intel.app` to `Codex.app`

2. **rebuild_codex.js** - Core rebuild logic:
   - Mounts the DMG and extracts `app.asar`, `electron.icns`, `Info.plist`, and `app.asar.unpacked` into `resources/` (cached between builds)
   - Reads the Electron version from the extracted `package.json`
   - Downloads `electron-v{version}-darwin-x64.zip` from GitHub (cached as `electron-*.zip` in repo root)
   - Assembles `Codex_Intel.app` by renaming the extracted `Electron.app` and replacing resources
   - Rebuilds native modules (`better-sqlite3`, `node-pty`) from source for x64 using `CXXFLAGS='-std=c++20 -stdlib=libc++'`
   - Creates a `--no-sandbox` wrapper script at `Contents/MacOS/Codex` that launches the real binary
   - Copies x86_64 `codex` and `rg` binaries from globally-installed `@openai/codex` to `Contents/Resources/`

3. **Casks/codex-intel.rb** - Homebrew cask definition:
   - The `version` and `sha256` fields are updated automatically by the CI workflow
   - Points to GitHub releases at `https://github.com/soham2008xyz/codex-intel/releases/download/{version}-intel/Codex-Intel.zip`
   - Declares conflict with official `codex` cask

### CI/CD Workflows (.github/workflows/)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `schedule.yml` | Every 6 hours / manual | Downloads upstream DMG, checks version, builds if new, creates GitHub release `{version}-intel`, uploads `Codex-Intel.zip`, updates cask version/sha256 |
| `build.yml` | Push/PR to main/master | Verifies build succeeds on `macos-15-intel` runner |
| `test.yml` | Push/PR to master | Validates cask install/uninstall via Homebrew |

**Key CI Conventions:**
- All workflows use `macos-15-intel` runner (required for x64 native module compilation)
- Release tag format: `{version}-intel` (e.g., `26.325.31654-intel`)
- The schedule workflow skips builds if the tag already exists
- Cask updates are committed back to the default branch automatically

### Resource Caching

- `resources/` - Persists extracted DMG contents (`app.asar`, icons, plist) between builds
- `electron-*.zip` - Cached Electron x64 binaries in repo root
- Delete these (or run `make clean`) to force fresh downloads on next build

### Native Module Rebuild

The rebuild explicitly handles two native modules that ship with Codex:
- `better-sqlite3` - SQLite bindings
- `node-pty` - PTY support for terminal emulation

These are compiled with C++20 flags for Electron 40+ compatibility.

## Quirks & Gotchas

- The built app requires `--no-sandbox` flag to run (handled by the wrapper script)
- If macOS quarantines the app after install: `xattr -cr /Applications/Codex.app`
- Build output from `rebuild_codex.js` is `Codex_Intel.app`; `build.sh` renames it to `Codex.app`
- The `@openai/codex` npm package must be installed globally before building (provides x64 binaries)
- `rebuild_codex.js` has a `--clean` flag to remove cached resources before building
