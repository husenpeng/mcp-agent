/** Assemble a copy-ready macOS folder (application, installer, instructions) and zip it. */

import { execFile } from 'node:child_process'
import { chmod, copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { DESKTOP_PRODUCT_NAME } from './desktop-product.mjs'
import { copyMacOSApplication } from './package-macos.ts'

const execute = promisify(execFile)

/** One assembled folder and the zip container written beside it. */
export interface MacOSInstallBundleRequest {
  readonly arch: 'arm64' | 'x64'
  readonly version: string
  readonly appPath: string
  /** Parent of the assembled folder, which the zip contains as its only entry. */
  readonly assetsRoot: string
  readonly outputDirectory: string
  /** Directory holding `installer.sh`, the installer source copied into every bundle. */
  readonly installerDirectory: string
}

/** Assembled folder layout and the zip built from it. */
export interface MacOSInstallBundleResult {
  readonly directory: string
  readonly archive: string
}

/** Entry names every bundle carries, so a recipient can find the installer first. */
export const MACOS_INSTALL_BUNDLE_FILES = {
  application: `${DESKTOP_PRODUCT_NAME}.app`,
  installer: 'installer.sh',
  launcher: 'Install Tomato AI.command',
  instructions: 'INSTALL-zh.txt',
  readme: 'README.txt',
} as const

/** Double-click launcher; the installer itself never opens a window it cannot keep alive. */
export const MACOS_INSTALL_LAUNCHER = `#!/bin/bash
# Double-click entry point: installs the application in this folder and keeps the
# Terminal window open long enough to read the result.
cd "$(dirname "$0")" || exit 1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
/bin/bash "$SCRIPT_DIR/installer.sh"
status=$?
if [[ $status -ne 0 ]]; then
  printf '\\n安装未完成（退出码 %s）。请对照INSTALL-zh.txt 排查，或把上面的信息发回。\\n' "$status"
  printf '按回车键关闭窗口…'
  read -r _ || true
fi
exit $status
`

function instructionsZh(version: string, arch: 'arm64' | 'x64'): string {
  const chip = arch === 'arm64' ? 'Apple 芯片（arm64）' : 'Intel 芯片（x64）'
  return `${DESKTOP_PRODUCT_NAME} ${version} · macOS ${chip}

本安装包内容
  1. Install Tomato AI.command   双击即可自动安装（推荐）
  2. installer.sh            安装脚本本体，由上面的命令调用
  3. ${DESKTOP_PRODUCT_NAME}.app  应用本体，请勿单独移动或改名
  4. README.txt              英文说明

安装步骤
  0. 提示：zip 里的文件名和本说明是英文，双击的就是“Install Tomato AI.command”（英文意为“安装 Tomato AI”）。
  1. 双击下载的 zip，macOS 会在旁边生成一个文件夹。
  2. 进入该文件夹，双击“Install Tomato AI.command”。
  3. 终端窗口会把应用复制到 /Applications，并清除下载隔离标记。
     若提示需要管理员权限，请在系统弹窗中输入本机登录密码。
  4. 看到“安装完成”后关闭窗口，从“启动台”或“应用程序”打开 ${DESKTOP_PRODUCT_NAME}。

首次打开被系统拦截时
  本安装包未经过 Apple 公证。若首次打开提示“Apple 无法验证”，请任选一种：
  - 在“应用程序”里右键点选 ${DESKTOP_PRODUCT_NAME} →“打开”，再在弹窗中确认“打开”。
  - 或打开“系统设置 → 隐私与安全性”，在页面底部点击“仍要打开”。

双击安装命令没有反应时
  - 提示没有权限执行：在打开的文件夹里执行
        chmod +x "Install Tomato AI.command" "installer.sh"
    然后重新双击。
  - 提示脚本已损坏：在同一文件夹执行
        xattr -dr com.apple.quarantine "Install Tomato AI.command" "installer.sh"
    然后重新双击。
  - 也可以在“终端”里进入该文件夹后执行
        bash installer.sh
  - 安装到其他目录（默认 /Applications）：
        TOMATO_INSTALL_DIR="$HOME/Applications" bash installer.sh

说明
  - 已安装旧版本时请先退出正在运行的 ${DESKTOP_PRODUCT_NAME}，安装脚本会自动替换它。
  - 本安装包仅供内部测试与试用，不是面向公众分发的正式安装包，也不配置自动更新。
  - 安装脚本不联网、不修改系统设置，只复制应用到目标目录并清除该副本的下载隔离标记。
`
}

function readmeEn(version: string, arch: 'arm64' | 'x64'): string {
  const chip = arch === 'arm64' ? 'Apple silicon (arm64)' : 'Intel (x64)'
  return `${DESKTOP_PRODUCT_NAME} ${version} · macOS ${chip}

Contents
  1. Install Tomato AI.command   Double-click to install (recommended)
  2. installer.sh           The installer that file runs
  3. ${DESKTOP_PRODUCT_NAME}.app   The application; do not move or rename it separately
  4. INSTALL-zh.txt            Chinese instructions

Install
  1. Double-click the downloaded zip; macOS creates a folder next to it.
  2. Inside that folder, double-click "Install Tomato AI.command".
  3. The Terminal window copies the application into /Applications and removes
     the download quarantine attribute. Enter your login password if macOS asks.
  4. After "安装完成" appears, open ${DESKTOP_PRODUCT_NAME} from Applications.

If macOS blocks the first launch
  This build is not notarized by Apple. When macOS reports that it cannot verify
  the developer, either right-click ${DESKTOP_PRODUCT_NAME} in Applications and
  choose Open, or use System Settings > Privacy & Security > Open Anyway.

If the install command will not open
  - Permission errors:  chmod +x "Install Tomato AI.command" "installer.sh"
  - "Damaged" scripts:  xattr -dr com.apple.quarantine "Install Tomato AI.command" "installer.sh"
  - Or run "bash installer.sh" in Terminal from that folder.
  - Install elsewhere (default /Applications):
        TOMATO_INSTALL_DIR="$HOME/Applications" bash installer.sh

Notes
  - Quit a running ${DESKTOP_PRODUCT_NAME} first; the installer replaces the previous copy.
  - This bundle is for internal testing. It is not a public distribution package
    and does not configure automatic updates.
  - The installer never accesses the network or changes system settings.
`
}

/**
 * Build the archive base name shared by the folder and the zip.
 * @param version - Published build version.
 * @param arch - Application architecture.
 * @returns `<product>-<version>-mac-<arch>` without an extension.
 */
export function macOSInstallBundleBaseName(version: string, arch: 'arm64' | 'x64'): string {
  return `tomato-harness-${version}-mac-${arch}`
}

/**
 * Assemble the folder a recipient extracts and installs from, then zip it.
 * @param request - Assembled application, version, and destination directories.
 * @returns The assembled folder and the zip archive written to `outputDirectory`.
 */
export async function packageMacOSInstallBundle(request: MacOSInstallBundleRequest): Promise<MacOSInstallBundleResult> {
  const { arch, version, appPath, assetsRoot, outputDirectory, installerDirectory } = request
  const base = macOSInstallBundleBaseName(version, arch)
  const directory = join(assetsRoot, base)
  const archive = join(outputDirectory, `${base}.zip`)
  await rm(directory, { recursive: true, force: true })
  await rm(archive, { force: true })
  await mkdir(directory, { recursive: true })
  await copyMacOSApplication(appPath, join(directory, MACOS_INSTALL_BUNDLE_FILES.application))
  const installer = join(directory, MACOS_INSTALL_BUNDLE_FILES.installer)
  await copyFile(join(installerDirectory, 'installer.sh'), installer)
  await chmod(installer, 0o755)
  const launcher = join(directory, MACOS_INSTALL_BUNDLE_FILES.launcher)
  await writeFile(launcher, MACOS_INSTALL_LAUNCHER)
  await chmod(launcher, 0o755)
  await writeFile(join(directory, MACOS_INSTALL_BUNDLE_FILES.instructions), instructionsZh(version, arch))
  await writeFile(join(directory, MACOS_INSTALL_BUNDLE_FILES.readme), readmeEn(version, arch))
  await mkdir(outputDirectory, { recursive: true })
  // `--sequesterRsrc` keeps resource forks and extended attributes, and `--keepParent`
  // makes Finder extraction produce exactly this one folder.
  await execute('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', base, archive], { cwd: assetsRoot })
  const info = await stat(archive)
  if (info.size === 0) throw new Error(`desktop package: empty install bundle ${archive}`)
  return { directory, archive }
}

/**
 * Read the version the desktop manifest declares, which an install bundle is named after.
 * @param manifestPath - Desktop `package.json` path.
 * @returns The declared `version`.
 */
export async function readDesktopManifestVersion(manifestPath: string): Promise<string> {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { version?: unknown }
  if (typeof manifest.version !== 'string' || manifest.version === '') {
    throw new Error('desktop package: desktop package.json has no version')
  }
  return manifest.version
}
