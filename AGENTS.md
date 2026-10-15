# Codex Intel Rebuilder

Homebrew tap that rebuilds the Apple Silicon Codex DMG for Intel/AMD64 Macs.

## Commands

```bash
make build     # Full rebuild: download DMG → extract → rebuild native modules → assemble .app
make install   # Copy built Codex.app to /Applications
make clean     # Remove all build artifacts (Codex.app, Codex.dmg, resources/, etc.)
```

Test locally:
```bash
bash scripts/test_cask.sh                    # Test with default cask
bash scripts/test_cask.sh Casks/codex-intel.rb Codex.app  # Custom cask/app
```

## Architecture

- `scripts/build.sh` - orchestration script (downloads DMG, runs rebuild)
- `scripts/rebuild_codex.js` - core logic: extracts app.asar, downloads Electron x64, swaps native modules (better-sqlite3, node-pty), creates `--no-sandbox` wrapper
- `Casks/codex-intel.rb` - Homebrew cask definition (version + sha256 updated by CI)
- DMG source: `https://persistent.oaistatic.com/codex-app-prod/Codex.dmg`
- Electron download: `https://github.com/electron/electron/releases/download/v{version}/electron-v{version}-darwin-x64.zip`

## Build Requirements

- **Intel macOS** (native module rebuild targets x64)
- Node.js 20+
- `@openai/codex` npm package (provides x64 `codex` and `rg` binaries)
- `npx @electron/asar` for extracting app.asar
- Xcode CLT for `SetFile` (optional, creation date only)

## CI Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `schedule.yml` | Every 6h / manual | Checks for new upstream release, builds if needed, creates GitHub release + updates cask |
| `build.yml` | Push to main/master, PR | Verifies build succeeds on Intel runner |
| `test.yml` | Push to master, PR | Validates cask install/uninstall via Homebrew |

## Quirks

- The rebuild script uses `--no-sandbox` wrapper (required for Electron on macOS in some contexts)
- Native modules (better-sqlite3, node-pty) are rebuilt for Electron's x64 runtime using `CXXFLAGS='-std=c++20 -stdlib=libc++'`
- If macOS flags the app after install: `xattr -cr /Applications/Codex.app`
- Build artifacts are gitignored; CI re-downloads Electron zip per release version
