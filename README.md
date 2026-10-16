# Codex Intel Rebuilder - Historical Intel Port

This project documents the former Intel Mac rebuild pipeline for the OpenAI Codex Desktop App.

OpenAI now provides an official Intel-compatible macOS installer. Intel Mac users should download Codex from the [official OpenAI download page](https://chatgpt.com/download/), which detects the Mac architecture and provides the appropriate installer.

**Download Site:** [codex-intel.beaverslab.xyz](https://codex-intel.beaverslab.xyz/)

## Project Scope

- **Official download**: OpenAI's download page now provides an Intel-compatible installer directly.
- **Archive**: The rebuild scripts and Homebrew cask are retained for reference.
- **Core Tool**: The underlying reconstruction logic (`scripts/rebuild_codex.js`, etc.) is based on the [soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder) tool.

---

# Underlying Rebuilder Tool (Details)

The core logic of this project allowed the official Arm64 (Apple Silicon) Codex Desktop App to run on Intel Macs by extracting application logic, replacing the Electron runtime, and rebuilding native dependencies. This workaround is no longer needed for normal installation because OpenAI provides an official Intel-compatible download.

## Features

- **Architecture Porting**: Transforms the official Arm64 `.dmg` into a native x86_64 `.app`.
- **Native Module Rebuild**: Automatically recompiles `better-sqlite3` and `node-pty` for Intel Macs.
- **Integrated Tooling**: Includes a wrapper to support Playwright and other browser automation tools.

## Homebrew Tap Usage

```bash
brew tap soham2008xyz/codex-intel https://github.com/soham2008xyz/codex-intel
brew install --cask codex-intel
```

Notes:

- The cask installs `Codex.app`.
- The cask conflicts with the official `codex` cask, so uninstall that first if needed.

Upgrade to the latest converted release:

```bash
brew upgrade --cask codex-intel
```

Remove the app:

```bash
brew uninstall --cask codex-intel
```

Remove the tap when you no longer need it:

```bash
brew untap soham2008xyz/codex-intel
```

## Prerequisites (for local builds)

1.  **Node.js**: v20+ recommended.
2.  **Codex CLI**: You must have the official `@openai/codex` CLI installed globally for x64 binaries.
    ```bash
    npm install -g @openai/codex
    ```
3.  **Xcode Command Line Tools**: Required for compiling native modules (Xcode 15+ recommended for C++20 support).

## How to Build Locally

The easiest way to build is using the provided `Makefile`:

```bash
# Build the application
make

# Install to /Applications
make install

# Clean up build artifacts
make clean
```

The build process (`scripts/build.sh` / `scripts/rebuild_codex.js`) will:
1.  Download the latest official `Codex.dmg` from OpenAI.
2.  Extract the app logic (`app.asar`), icons, and configuration.
3.  Download the compatible x64 Electron runtime.
4.  Rebuild native modules for the Intel architecture.
5.  Inject the x64 `codex` binary from your global installation.
6.  Generate and fix permissions for `Codex.app`.

## Repository Checks

The former scheduled build and release workflows have been retired now that an official Intel installer is available. [`test.yml`](.github/workflows/test.yml) remains as a validation workflow for the retained Homebrew cask:

- checking out the repository
- setting up Homebrew
- auditing the cask
- installing and uninstalling it via [`scripts/test_cask.sh`](scripts/test_cask.sh)

## Repository Layout

- [`Casks/codex-intel.rb`](Casks/codex-intel.rb): Homebrew cask definition
- [`scripts/build.sh`](scripts/build.sh): Intel rebuild pipeline retained for reference
- [`scripts/rebuild_codex.js`](scripts/rebuild_codex.js): core repackaging logic
- [`scripts/test_cask.sh`](scripts/test_cask.sh): local and CI cask verification
- [`Makefile`](Makefile): build entrypoint for the retained historical rebuild

## Security & Terminal Usage

The built app launches with the `--no-sandbox` Electron flag. This is necessary to allow the integrated terminal to spawn browser subprocesses (e.g., for **Playwright**).

To enable network access inside the Codex terminal (isolated by macOS Seatbelt), add this to your Codex `config.toml`:

```toml
[sandbox_workspace_write]
network_access = true
```

## Troubleshooting

- **"App is damaged"**: Due to macOS quarantine on unsigned apps, run:
  ```bash
  xattr -cr Codex.app
  ```
- **"Operation not permitted"**: Ensure you've run the `xattr` command above.
- **Native Module Errors**: Ensure Xcode Command Line Tools are installed (`xcode-select --install`). If you see errors about `source_location` or C++ compilation, ensure you have Xcode 15+.
- **Missing Binary**: Ensure `@openai/codex` is installed globally via npm.
- **Blank Window**: Usually indicates a mismatch in executable names or missing dependencies. Check the console logs.

## Credits

The rebuilding mechanism of this project is built upon the work of **[soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder)**. The historical rebuild scripts and web page are retained for reference now that the official download supports Intel Macs.

---

&copy; 2026 BeaversLab. Not affiliated with OpenAI.
