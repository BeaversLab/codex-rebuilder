# Codex Intel Rebuilder - Automation & Distribution

This project provides an **automated build pipeline** and a **distribution landing page** for the Intel Mac version of the official OpenAI Codex Desktop App. It ensures that Intel Mac users can always access the latest version of Codex with ease.

**Download Site:** [codex-intel.beaverslab.xyz](https://codex-intel.beaverslab.xyz/)

## Project Scope

- **Automation**: A GitHub Action pipeline that monitors official OpenAI releases, triggers a rebuild, and creates new GitHub Releases automatically.
- **Distribution**: A multi-language landing page for easy discovery and downloading of the x86_64 binaries.
- **Core Tool**: The underlying reconstruction logic (`rebuild_codex.js`, etc.) is based on the [soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder) tool.

---

# Underlying Rebuilder Tool (Details)

The core logic of this project allows you to port the official Arm64 (Apple Silicon) Codex Desktop App to run on Intel Macs by extracting application logic, replacing the Electron runtime, and rebuilding native dependencies.

## Features

- **Architecture Porting**: Transforms the official Arm64 `.dmg` into a native x86_64 `.app`.
- **Native Module Rebuild**: Automatically recompiles `better-sqlite3` and `node-pty` for Intel Macs.
- **Integrated Tooling**: Includes a wrapper to support Playwright and other browser automation tools.

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

The build process (`build.sh` / `rebuild_codex.js`) will:
1.  Download the latest official `Codex.dmg` from OpenAI.
2.  Extract the app logic (`app.asar`), icons, and configuration.
3.  Download the compatible x64 Electron runtime.
4.  Rebuild native modules for the Intel architecture.
5.  Inject the x64 `codex` binary from your global installation.
6.  Generate and fix permissions for `Codex.app`.

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

The rebuilding mechanism of this project is built upon the work of **[soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder)**. We have extended it with automated CI/CD workflows and a web-based distribution platform.

---

&copy; 2026 BeaversLab. Not affiliated with OpenAI.
