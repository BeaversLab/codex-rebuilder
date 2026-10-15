# Codex Intel Rebuilder - Project Context

This project is a specialized build tool designed to repackage the official **Apple Silicon (Arm64) Codex Desktop App** to run on **Intel (x86_64) Macs**. It automates the process of extracting the application logic, replacing the Electron runtime, and rebuilding native dependencies for the Intel architecture. It also provides an automated pipeline and Homebrew tap for installing an unofficial Intel (x86_64) port of the OpenAI Codex Desktop App.

## Project Overview

- **Purpose**: Bridge the gap for Intel Mac users who want to use the official Codex Desktop App, which is currently distributed primarily for Arm64.
- **Architecture**:
    - **Extraction**: Mounts the official `Codex.dmg` to extract `app.asar`, icons, and configuration.
    - **Runtime Replacement**: Downloads the corresponding version of the Electron x64 runtime for macOS.
    - **Native Module Rebuild**: Recompiles native dependencies like `better-sqlite3` and `node-pty` specifically for the target Electron version and x64 architecture.
    - **Binary Injection**: Pulls x64-compatible binaries (like `codex` and `rg`) from a global installation of the `@openai/codex` CLI.
    - **Sandboxing**: Implements a wrapper script to launch Electron with the `--no-sandbox` flag, enabling integrated tools like Playwright to function correctly.
- **Automation**: GitHub Actions check for new official releases every 6 hours, update `version.json` / the cask, and trigger a fresh build and release.

## Key Technologies

- **Runtime**: Node.js
- **Framework**: Electron (Targeting x86_64)
- **Native Modules**: `better-sqlite3`, `node-pty`
- **Build Tools**: Shell scripts (`scripts/build.sh`), `Makefile`, `hdiutil` (for DMG handling)
- **Distribution**: Homebrew (custom Cask), GitHub Releases
- **CI/CD**: GitHub Actions

## Key Files & Directories

- `Casks/codex-intel.rb`: The Homebrew Cask definition.
- `scripts/rebuild_codex.js`: The primary build logic.
- `scripts/source_app.js`: Locates the upstream app bundle in a mounted DMG (handles bundle renames such as `Codex.app` -> `ChatGPT.app`).
- `scripts/build.sh`: Orchestration script for the build process (Prerequisites, Download, Rebuild, Fix Permissions).
- `scripts/test_cask.sh`: Validates the Homebrew Cask locally or in CI.
- `Makefile`: Entry point for common development tasks.
- `.github/workflows/`:
  - `schedule.yml`: Automated build, release, and Cask update.
  - `test.yml`: Continuous integration for Cask validation.
- `version.json`: Tracks the current official Codex version being targeted.
- `resources/`: Temporary directory used during build to store extracted assets (`app.asar`, `Info.plist`, etc.).
- `web/`: Landing page for distribution.

## Building and Running

### Prerequisites

- **Node.js** (v20+ recommended)
- **Codex CLI**: `npm install -g @openai/codex` (Required for x64 binaries)
- **Homebrew**: Required for cask testing and usage.
- **Xcode Command Line Tools**: Necessary for compiling native modules (Xcode 15+ recommended for C++20 support).

### Commands

- **Full Build**:
  ```bash
  make build
  # Or: bash scripts/build.sh
  ```
- **Manual Rebuild Logic**:
  ```bash
  node scripts/rebuild_codex.js
  ```
- **Install to Applications**:
  ```bash
  make install
  ```
- **Test the Homebrew Cask**:
  ```bash
  ./scripts/test_cask.sh
  ```
- **Cleanup**:
  ```bash
  make clean
  ```

## Development Conventions

- **Native Module Compatibility**: When rebuilding native modules, the script forces C++20 (`-std=c++20`) to ensure compatibility with modern Electron headers. The rebuilder explicitly handles `better-sqlite3` and `node-pty` by rebuilding them from source for the target Electron version and architecture.
- **No-Sandbox Wrapper**: The final app bundle uses a wrapper script at `Contents/MacOS/Codex` instead of the raw Electron binary to ensure `--no-sandbox` is always applied.
- **Dynamic Binary Discovery**: The build script dynamically searches the global `npm root` for the `@openai/codex` package to locate necessary x64 binaries.
- **Quarantine Removal**: The build process automatically runs `xattr -cr` on the resulting `.app` to avoid "App is damaged" errors on macOS.
- **Automation**: Version updates in `Casks/codex-intel.rb` are handled automatically by the `schedule.yml` workflow. Manual edits to the version/sha256 should only be done if the automation fails.
- **Style**: Shell scripts use `set -e` for safety. The JavaScript rebuilder uses `execSync` for synchronous operations and clear logging.

## Security & Usage Notes

- The `--no-sandbox` flag is required for internal terminal tools (like Playwright) but reduces the process-level isolation of the Electron renderer.
- Users may need to enable `network_access = true` in their Codex `config.toml` for full functionality within the integrated terminal.
- This project is unofficial and is not affiliated with OpenAI.
