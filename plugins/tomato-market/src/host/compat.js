/**
 * DeepSeek Harness → Tomato package adaptation.
 *
 * Tomato is a renamed fork of DeepSeek Harness: every `@deepseek-ai/dsh-<leaf>`
 * package is `@tomato/<leaf>`, the vendored Cordis packages live under
 * `@tomato/cordis-*`, and `dsh` manifest metadata is `tomato` metadata. The
 * market converts a published DSH plugin into that naming so Tomato's own
 * installer and resolver can load it. The rules mirror
 * `scripts/rescope-to-tomato.ts`; real third-party packages under the old
 * scope, such as `@deepseek-ai/libreoffice-kit`, are left alone.
 */

/** Leaves whose Tomato name is not the plain `dsh-` prefix removed. */
const SPECIAL_LEAVES = {
  'dsh': 'cli',
  'dshx': 'x',
  'dsh-brand': 'branded',
  'dsh-root': 'harness',
  'dsh-subagent-dsh-sdk': 'subagent-sdk',
  'cordis': 'cordis',
  'schemastery': 'schemastery',
  'cosmokit': 'cosmokit',
  'loader': 'cordis-plugin-loader',
  'include': 'cordis-plugin-include',
  'group': 'cordis-plugin-group',
  'timer': 'cordis-plugin-timer',
  'hmr': 'cordis-plugin-hmr',
  'logger-console': 'cordis-plugin-logger-console',
}

/** Real third-party packages under the old scope that Tomato does not rename. */
const EXTERNAL = /^@deepseek-ai\/libreoffice-kit(?:[-.][A-Za-z0-9._-]+)?$/

/**
 * Map one package name from DeepSeek Harness to Tomato.
 * @param {string} name - package name without a subpath.
 * @returns {string} the Tomato name, or the input when it is not a renamed package.
 */
export function mapPackageName(name) {
  if (EXTERNAL.test(name)) return name
  if (name.startsWith('@deepseek-ai/')) {
    const leaf = name.slice('@deepseek-ai/'.length)
    const special = SPECIAL_LEAVES[leaf]
    if (special !== undefined) return `@tomato/${special}`
    if (leaf.startsWith('dsh-')) return `@tomato/${leaf.slice('dsh-'.length)}`
    return `@tomato/${leaf}`
  }
  if (name.startsWith('@cordisjs/plugin-')) {
    const leaf = name.slice('@cordisjs/plugin-'.length)
    const special = SPECIAL_LEAVES[leaf]
    return special === undefined ? `@tomato/cordis-plugin-${leaf}` : `@tomato/${special}`
  }
  return name
}

/**
 * Map a full specifier, keeping its subpath.
 * @param {string} specifier - package specifier such as `@deepseek-ai/dsh-session/types`.
 * @returns {string} the Tomato specifier; unchanged when it names no renamed package.
 */
export function mapSpecifier(specifier) {
  const match = /^(@[^/]+\/[^/]+)(\/.*)?$/.exec(specifier)
  if (match === null) return specifier
  return `${mapPackageName(match[1])}${match[2] ?? ''}`
}

/** Package-name tokens that appear in source, patches, and JSON. */
const TOKEN = /@(?:deepseek-ai|cordisjs)\/[A-Za-z0-9._*-]+(?:\/[A-Za-z0-9._*-]+)*/g

/**
 * Rewrite every DeepSeek Harness package reference in one text.
 * @param {string} text - source, patch, or JSON text.
 * @returns {string} the text with Tomato package names.
 */
export function rewriteText(text) {
  return text.replace(TOKEN, token => mapSpecifier(token))
}

/** @param {unknown} value - candidate. @returns {boolean} whether it is a plain object. */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {unknown} value - candidate. @returns {string[]} its string members, or none. */
function strings(value) {
  return Array.isArray(value) ? value.filter(entry => typeof entry === 'string') : []
}

/**
 * Rename the package references of one harness metadata block.
 * @param {Record<string, unknown>} source - `dsh` metadata.
 * @returns {Record<string, unknown>} the same declaration under Tomato names.
 */
export function normalizeHarnessMetadata(source) {
  const manifest = structuredClone(source)
  const client = isRecord(manifest.client) ? manifest.client : undefined
  if (client !== undefined) {
    client.inject = strings(client.inject).map(mapSpecifier)
    if (client.external !== undefined) client.external = strings(client.external).map(mapSpecifier)
  }
  const profile = isRecord(manifest.profile) ? manifest.profile : undefined
  if (profile !== undefined) profile.bundles = strings(profile.bundles).map(mapPackageName)
  return manifest
}

/**
 * Build a Tomato package manifest from a DeepSeek Harness one.
 * @param {unknown} input - the published `package.json`.
 * @returns {{ manifest: Record<string, unknown>, adapted: boolean }} the installable manifest.
 * @throws {Error} when the package declares no harness metadata or no bundle patch.
 */
export function adaptManifest(input) {
  if (!isRecord(input)) throw new Error('package.json is not a JSON object')
  const source = isRecord(input.dsh) ? input.dsh : isRecord(input.tomato) ? input.tomato : undefined
  if (source === undefined) throw new Error('package declares neither dsh nor tomato metadata')
  const tomato = normalizeHarnessMetadata(source)
  const manifest = { ...input, tomato }
  delete manifest.dsh
  if (isRecord(manifest.peerDependencies)) {
    const peers = {}
    for (const [name, range] of Object.entries(manifest.peerDependencies)) peers[mapPackageName(name)] = range
    manifest.peerDependencies = peers
  }
  if (isRecord(manifest.dependencies)) {
    const dependencies = {}
    for (const [name, range] of Object.entries(manifest.dependencies)) {
      const mapped = mapPackageName(name)
      if (mapped === name) {
        dependencies[name] = range
        continue
      }
      // Runtime packages come from the running installation; installing copies
      // of them would duplicate Cordis and break the shared service graph.
      manifest.peerDependencies = isRecord(manifest.peerDependencies) ? manifest.peerDependencies : {}
      manifest.peerDependencies[mapped] = manifest.peerDependencies[mapped] ?? range
    }
    manifest.dependencies = dependencies
  }
  if (isRecord(manifest.engines) && typeof manifest.engines.dsh === 'string') {
    manifest.engines = { ...manifest.engines, tomato: typeof manifest.engines.tomato === 'string' ? manifest.engines.tomato : manifest.engines.dsh }
    delete manifest.engines.dsh
  }
  if (!isRecord(manifest.tomato.bundle) || typeof manifest.tomato.bundle.patch !== 'string') {
    throw new Error('the package declares no bundle patch, so Tomato cannot load it as a plugin')
  }
  return { manifest, adapted: isRecord(input.dsh) }
}

/** Text files whose package references are rewritten during adaptation. */
export const REWRITTEN_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.json', '.yml', '.yaml']

/**
 * Whether one extracted file is rewritten.
 * @param {string} path - file path inside the package.
 * @returns {boolean} whether the file is a text file this adapter rewrites.
 */
export function isRewrittenFile(path) {
  return REWRITTEN_EXTENSIONS.some(extension => path.endsWith(extension))
}