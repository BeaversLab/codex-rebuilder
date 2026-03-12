# Codex Intel Rebuilder - Project Context

This project is a specialized build tool designed to repackage the official **Apple Silicon (Arm64) Codex Desktop App** to run on **Intel (x86_64) Macs**. It automates the process of extracting the application logic, replacing the Electron runtime, and rebuilding native dependencies for the Intel architecture.

## Project Overview

- **Purpose**: Bridge the gap for Intel Mac users who want to use the official Codex Desktop App, which is currently distributed primarily for Arm64.
- **Architecture**:
    - **Extraction**: Mounts the official `Codex.dmg` to extract `app.asar`, icons, and configuration.
    - **Runtime Replacement**: Downloads the corresponding version of the Electron x64 runtime for macOS.
    - **Native Module Rebuild**: Recompiles native dependencies like `better-sqlite3` and `node-pty` specifically for the target Electron version and x64 architecture.
    - **Binary Injection**: Pulls x64-compatible binaries (like `codex` and `rg`) from a global installation of the `@openai/codex` CLI.
    - **Sandboxing**: Implements a wrapper script to launch Electron with the `--no-sandbox` flag, enabling integrated tools like Playwright to function correctly.
- **Automation**: A GitHub Action (`.github/workflows/codex-release.yml`) periodically checks for new official releases, updates `version.json`, and triggers a fresh build and release.

## Key Technologies

- **Runtime**: Node.js
- **Framework**: Electron (Targeting x86_64)
- **Native Modules**: `better-sqlite3`, `node-pty`
- **Build Tools**: Shell scripts (`build.sh`), `Makefile`, `hdiutil` (for DMG handling)
- **CI/CD**: GitHub Actions

## Building and Running

### Prerequisites
- **Node.js** (v20+ recommended)
- **Codex CLI**: `npm install -g @openai/codex` (Required for x64 binaries)
- **Xcode Command Line Tools**: Necessary for compiling native modules.

### Commands
- **Full Build**:
  ```bash
  make build
  # Or: bash build.sh
  ```
- **Manual Rebuild Logic**:
  ```bash
  node rebuild_codex.js
  ```
- **Cleanup**:
  ```bash
  make clean
  ```
- **Install to Applications**:
  ```bash
  make install
  ```

## Project Structure

- `rebuild_codex.js`: The core logic for repackaging the app.
- `build.sh`: Orchestrates prerequisites, downloads, and the rebuild process.
- `Makefile`: Provides high-level targets for building, cleaning, and installing.
- `version.json`: Tracks the current official Codex version being targeted.
- `resources/`: Temporary directory used during build to store extracted assets (`app.asar`, `Info.plist`, etc.).
- `web/`: Reserved for web-related resources (currently empty).

## Development Conventions

- **Native Module Compatibility**: When rebuilding native modules, the script forces C++20 (`-std=c++20`) to ensure compatibility with modern Electron headers.
- **No-Sandbox Wrapper**: The final app bundle uses a wrapper script at `Contents/MacOS/Codex` instead of the raw Electron binary to ensure `--no-sandbox` is always applied.
- **Dynamic Binary Discovery**: The build script dynamically searches the global `npm root` for the `@openai/codex` package to locate necessary x64 binaries.
- **Quarantine Removal**: The build process automatically runs `xattr -cr` on the resulting `.app` to avoid "App is damaged" errors on macOS.

## Security & Usage Notes

- The `--no-sandbox` flag is required for internal terminal tools (like Playwright) but reduces the process-level isolation of the Electron renderer.
- Users may need to enable `network_access = true` in their Codex `config.toml` for full functionality within the integrated terminal.
