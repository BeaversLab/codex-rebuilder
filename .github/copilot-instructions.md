# Copilot Instructions

## Commands

```bash
make build        # Full build: download DMG → extract → rebuild native modules → assemble Codex.app
make install      # Move Codex.app to /Applications
make clean        # Remove all build artifacts (Codex.app, Codex.dmg, resources/, electron*.zip, etc.)

# Test the Homebrew cask (audit + install + uninstall)
bash scripts/test_cask.sh
bash scripts/test_cask.sh Casks/codex-intel.rb Codex.app  # explicit cask/app args
```

There are no unit tests or linters beyond `brew audit --cask --strict` run by `test_cask.sh`.

## Architecture

This repo repackages the Apple Silicon-only Codex.app into an Intel (x86_64) build. The pipeline:

1. **`scripts/build.sh`** — checks prerequisites, installs `@openai/codex` globally, downloads `Codex.dmg` (skips if cached), then calls `rebuild_codex.js`. After the script exits, `Codex_Intel.app` is renamed to `Codex.app`.

2. **`scripts/rebuild_codex.js`** — the core logic:
   - Mounts the DMG and extracts `app.asar`, `electron.icns`, `Info.plist`, and `app.asar.unpacked` into `resources/` (cached; only remounts the DMG if files are missing).
   - Reads the Electron version from `app.asar`'s `package.json` via `npx @electron/asar`.
   - Downloads `electron-v{version}-darwin-x64.zip` from GitHub (cached in repo root as `electron-*.zip`).
   - Assembles `Codex_Intel.app` by renaming the extracted `Electron.app`, replacing its resources with the Codex assets.
   - Rebuilds `better-sqlite3` and `node-pty` from source for the target Electron x64 runtime in a temp directory, then copies the built modules into `app.asar.unpacked`.
   - Creates a `--no-sandbox` wrapper: the real Electron binary is renamed to `Codex.orig`; a shell script named `Codex` launches it with `--no-sandbox "$@"`.
   - Copies the x86_64 `codex` and `rg` binaries from the globally-installed `@openai/codex` npm package into `Contents/Resources/` and `Contents/Resources/bin/`.

3. **`Casks/codex-intel.rb`** — Historical Homebrew cask pointing to GitHub releases. The scheduled cask update workflow has been retired.

## Key Conventions

- **Build output name**: `rebuild_codex.js` produces `Codex_Intel.app`; `build.sh` renames it to `Codex.app`. Makefile targets and the retained cask test expect `Codex.app` as the final artifact.

- **Resource caching**: The `resources/` directory persists between builds. Deleting it (or running `make clean`) forces a fresh DMG mount on next build. Likewise, `electron-*.zip` files are cached in the repo root and reused if the version matches.

- **Native module build flags**: `better-sqlite3` and `node-pty` must be compiled with `CXXFLAGS='-std=c++20 -stdlib=libc++'` for Electron 40+ compatibility. This is hardcoded in `rebuild_codex.js`.

- **CI runner**: The retained cask test targets `macos-15-intel`; an Intel macOS runner is required for validating the x64 app.

- **Release tag format**: Historical releases used `{version}-intel` (e.g., `26.325.31654-intel`). No new releases are scheduled.

- **Cask update automation**: Retired because OpenAI now provides an official Intel-compatible installer.

- **Quarantine fix**: After local install, `xattr -cr /Applications/Codex.app` clears macOS quarantine if the app is blocked from launching.

- **Gitignored artifacts**: `Codex.app`, `Codex_Intel.app`, `resources/`, `*.zip`, `*.dmg`, `package.json`, `package-lock.json`, `node_modules/`, and temp build directories are all gitignored. CI re-downloads everything fresh each run.
