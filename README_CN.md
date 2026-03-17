# Codex Intel Rebuilder - 自动化打包与分发站点

本项目为 OpenAI Codex 桌面应用的 Intel Mac 版本提供 **自动化构建流水线** 和 **分发下载站点**。它旨在确保 Intel Mac 用户能够轻松、及时地获取到 Codex 的最新版本。

**下载站点:** [codex-intel.beaverslab.xyz](https://codex-intel.beaverslab.xyz/)

## 项目定位

- **自动化**: 通过 GitHub Actions 监控 OpenAI 的官方发布，自动触发重构流程并发布新的 GitHub Release。
- **分发**: 提供多语言的落地页，方便用户发现和下载适用于 x86_64 架构的安装包。
- **核心工具**: 本项目集成的核心重构逻辑（`rebuild_codex.js` 等）基于 [soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder) 开发。

---

# 核心重构工具说明 (原 Rebuilder)

本项目底层使用的核心逻辑可以将官方的 Arm64 (Apple Silicon) 版本 Codex 桌面应用移植到 Intel Mac 上运行。它通过自动提取应用逻辑、替换 Electron 运行时，并针对 x86_64 架构重新编译原生依赖来实现这一过程。

## 功能特性

- **架构移植**: 将官方的 Arm64 `.dmg` 转换为原生的 x86_64 `.app`。
- **原生模块重构**: 自动针对 Intel Mac 重新编译 `better-sqlite3` 和 `node-pty`。
- **集成工具支持**: 内置启动包装器，通过禁用 Chromium 沙箱来支持 Playwright 和其他浏览器自动化工具。

## 准备工作 (用于本地手动构建)

1.  **Node.js**: 建议使用 v20+。
2.  **Codex CLI**: 需要全局安装官方的 `@openai/codex` CLI，以获取所需的 x64 二进制文件。
    ```bash
    npm install -g @openai/codex
    ```
3.  **Xcode 命令行工具**: 用于编译原生模块（建议使用 Xcode 15+ 以支持 C++20）。

## 如何本地构建

虽然本项目主要在 CI 环境下运行，但你也可以手动使用 `Makefile` 进行构建：

```bash
# 构建应用
make

# 安装到 /Applications (应用程序文件夹)
make install

# 清理构建产物
make clean
```

构建过程 (`build.sh` / `rebuild_codex.js`) 会执行以下操作:
1.  从 OpenAI 下载最新的官方 `Codex.dmg`。
2.  提取应用逻辑 (`app.asar`)、图标和配置。
3.  下载兼容的 x64 Electron 运行时。
4.  针对 Intel 架构重新编译原生模块。
5.  从全局安装的 CLI 中注入 x64 `codex` 二进制文件。
6.  生成并修复 `Codex.app` 的权限。

## 安全与终端使用注意事项

构建出的应用在启动时会携带 `--no-sandbox` 参数。这对于允许集成终端派生浏览器子进程（例如使用 **Playwright**）是必需的。

要在 Codex 终端内（受 macOS Seatbelt 隔离）开启网络访问，请在你的 Codex `config.toml` 中添加以下内容:

```toml
[sandbox_workspace_write]
network_access = true
```

## 常见问题排查 (Troubleshooting)

- **"App is damaged" (应用已损坏)**: 由于 macOS 对未签名应用的隔离，请运行:
  ```bash
  xattr -cr Codex.app
  ```
- **"Operation not permitted"**: 请确保已运行上方的 `xattr` 命令。
- **原生模块错误**: 确保已安装 Xcode 命令行工具 (`xcode-select --install`)。如果看到关于 `source_location` 或 C++ 编译的错误，请确保使用 Xcode 15+ 版本。
- **缺少二进制文件**: 确保已通过 npm 全局安装了 `@openai/codex`。
- **空白窗口**: 通常表示可执行文件名称不匹配或缺少依赖项。请检查控制台日志。

## 致谢

本项目重构机制源自 **[soham2008xyz/codex-rebuilder](https://github.com/soham2008xyz/codex-rebuilder)** 的贡献。我们在此基础上扩展了自动化 CI/CD 工作流和 Web 分发平台。

---

&copy; 2026 BeaversLab. 本项目非 OpenAI 官方附属。
