/** Desktop-only omissions from already installed production npm packages. */

/**
 * Identify build, diagnostic, documentation and other-platform files omitted from the immutable Desktop runtime.
 * Unrecognized assets and target runtime binaries are retained. Paths name the copied
 * node_modules tree, including nested package containers.
 *
 * Harness packages ship their published docs and, for a few, their `src` tree; both reach the model as readable
 * implementation detail whenever the file tools can open the installation. They are omitted so a release carries
 * only what executes: `lib`, locale catalogs, bundle patches, native payloads and runtime assets such as skill
 * bodies and DevTools descriptions. Package-root README/CHANGELOG and translation metadata are documentation;
 * `src/` is authored source; `native/tests/` is test material. Nested third-party packages keep their own layout,
 * because their published exports may address `src` directly.
 * @param path - Path relative to the production node_modules directory.
 * @param target - Platform and architecture of the Electron Node runtime.
 * @param officeEngine - Engine selected from the installed kit manifest.
 * @returns Omission reason, or undefined when the entry must be copied.
 */
export function desktopRuntimeFileExclusion(
  path: string, target: { platform: NodeJS.Platform; arch: string }, officeEngine: string,
): string | undefined {
  const parts = path.split(/[\\/]/u)
  if (parts.some(part => ['.bin', '.pnpm', '.modules.yaml', '.pnpm-workspace-state-v1.json'].includes(part))) {
    return 'package-manager metadata'
  }
  const file = parts.at(-1)!
  if (/\.(?:[cm]?[jt]s|css)\.map$/u.test(file)) return 'source map'
  if (/\.d\.[cm]?ts$/u.test(file)) return 'TypeScript declaration'
  if (/\.tsbuildinfo$/u.test(file)) return 'TypeScript build cache'
  const { name, entry } = packageEntry(path)
  const harnessViolation = harnessEntryViolation(name, entry)
  if (harnessViolation !== undefined) return harnessViolation
  if (name.startsWith('@deepseek-ai/libreoffice-kit-')) {
    if (name !== `@deepseek-ai/libreoffice-kit-${officeEngine}`) return 'LibreOffice other platform'
  }
  if (name === 'fs-ext' && /^build\/(?:Release|Debug)\/(?:obj(?:\/|$)|fs_ext\.(?:exp|lib|pdb|iobj|ipdb)$)/u.test(entry)) {
    return 'fs-ext compiler output'
  }
  if (name === 'fs-ext' && /^build\/(?:binding\.sln|config\.gypi|fs_ext\.vcxproj(?:\.filters)?)$/u.test(entry)) {
    return 'fs-ext build configuration'
  }
  if (name === '@mixmark-io/domino' && (entry === 'test' || entry.startsWith('test/'))) return 'Domino test fixtures'
  if (name === '@mixmark-io/domino' && (entry === '.yarn' || entry.startsWith('.yarn/'))) return 'Domino development tooling'
  if (name === 'node-pty' && target.platform !== 'win32' && /^third_party\/conpty(?:\/|$)/u.test(entry)) {
    return 'node-pty Windows ConPTY sources'
  }
  if (name === 'node-pty' && entry.startsWith('prebuilds/')) {
    const platform = entry.split('/')[1]
    if (platform !== undefined && platform !== `${target.platform}-${target.arch}`) return 'node-pty other platform'
    if (file.endsWith('.pdb')) return 'node-pty debug symbols'
  }
  if (name === '@koromix/koffi-win32-x64' && entry === 'win32_x64/koffi.lib') return 'Koffi import library'
  return undefined
}

/**
 * Package name and entry path of the innermost installed package a runtime path names.
 * @param path - Path relative to the production node_modules directory.
 * @returns The scoped name (`@scope/name`) or bare name, and the path below it.
 */
function packageEntry(path: string): { name: string; entry: string } {
  const parts = path.split(/[\\/]/u)
  const packageParts = parts.slice(parts.lastIndexOf('node_modules') + 1)
  const nameParts = packageParts[0]?.startsWith('@') ? 2 : 1
  return { name: packageParts.slice(0, nameParts).join('/'), entry: packageParts.slice(nameParts).join('/') }
}

/**
 * Release-forbidden harness package content, independent of the target platform, as the packaging check and the
 * archive verifier both apply it. Scoped to `@tomato` packages: a third-party package's published layout is its
 * own, and its exports may address `src` directly.
 * @param name - Installed package name.
 * @param entry - Path below the package root.
 * @returns Omission reason, or undefined when the entry may reach a release.
 */
function harnessEntryViolation(name: string, entry: string): string | undefined {
  if (!name.startsWith('@tomato/')) return undefined
  // Package-root docs only: nested markdown is runtime data (skill bodies, DevTools descriptions).
  if (/^(?:readme|changelog)(?:\..+)?$/iu.test(entry)) return 'package documentation'
  if (entry === 'src' || entry.startsWith('src/')) return 'package source'
  if (entry === 'native/tests' || entry.startsWith('native/tests/')) return 'package tests'
  return undefined
}

/**
 * Report the release-forbidden content a runtime path names, for verification of an already prepared tree or
 * archive. The packaging filter applies the same rules through {@link desktopRuntimeFileExclusion}.
 * @param path - Path relative to the production node_modules directory.
 * @returns Omission reason, or undefined when the path may reach a release.
 */
export function harnessReleaseContentViolation(path: string): string | undefined {
  const { name, entry } = packageEntry(path)
  return harnessEntryViolation(name, entry)
}
