/**
 * Tomato Harness → Tomato package adaptation.
 *
 * Tomato is a renamed fork: every `@tomato/<leaf>` package is `@tomato/<leaf>`, the vendored Cordis packages live under
 * `@tomato/cordis-*`, and Tomato Harness manifest metadata is Tomato metadata. The market converts a published
 * third-party plugin into that naming so Tomato's own installer and resolver can load it. Real third-party packages
 * under the old scope, such as `@deepseek-ai/libreoffice-kit`, are left alone.
 */

/** Leaves whose Tomato name is not the plain `tomato-` prefix removed. */
const SPECIAL_LEAVES: Readonly<Record<string, string>> = {
  'tomato': 'cli',
  'dshx': 'x',
  '@tomato/branded': 'branded',
  '@tomato/harness': 'harness',
  '@tomato/subagent-sdk': 'subagent-sdk',
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
const EXTERNAL = /^@tomato\/libreoffice-kit(?:[-.][A-Za-z0-9._-]+)?$/

/** Package-name tokens that appear in source, patches, and JSON. */
const TOKEN = /@(?:tomato|cordisjs)\/[A-Za-z0-9._*-]+(?:\/[A-Za-z0-9._*-]+)*/g

/** Whether a value is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * @param value - candidate.
 * @returns its string members, or none.
 */
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

/**
 * Map one package name from Tomato Harness to Tomato.
 * @param name - package name without a subpath.
 * @returns the Tomato name, or the input when it is not a renamed package.
 */
export function mapPackageName(name: string): string {
  if (EXTERNAL.test(name)) return name
  if (name.startsWith('@tomato/')) {
    const leaf = name.slice('@tomato/'.length)
    const special = SPECIAL_LEAVES[leaf]
    if (special !== undefined) return `@tomato/${special}`
    if (leaf.startsWith('tomato-')) return `@tomato/${leaf.slice('tomato-'.length)}`
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
 * @param specifier - package specifier such as `@tomato/session/types`.
 * @returns the Tomato specifier; unchanged when it names no renamed package.
 */
export function mapSpecifier(specifier: string): string {
  const match = /^(@[^/]+\/[^/]+)(\/.*)?$/.exec(specifier)
  if (match === null) return specifier
  return `${mapPackageName(match[1] ?? '')}${match[2] ?? ''}`
}

/**
 * Rewrite every Tomato Harness package reference in one text.
 * @param text - source, patch, or JSON text.
 * @returns the text with Tomato package names.
 */
export function rewriteText(text: string): string {
  return text.replace(TOKEN, token => mapSpecifier(token))
}

/**
 * Rename the package references of one harness metadata block.
 * @param source - `tomato` metadata.
 * @returns the same declaration under Tomato names.
 */
export function normalizeHarnessMetadata(source: Record<string, unknown>): Record<string, unknown> {
  const metadata = structuredClone(source)
  const client = isRecord(metadata.client) ? metadata.client : undefined
  if (client !== undefined) {
    client.inject = strings(client.inject).map(mapSpecifier)
    if (client.external !== undefined) client.external = strings(client.external).map(mapSpecifier)
  }
  const profile = isRecord(metadata.profile) ? metadata.profile : undefined
  if (profile !== undefined) profile.bundles = strings(profile.bundles).map(mapPackageName)
  return metadata
}

/**
 * Build a Tomato package manifest from a Tomato Harness one.
 * @param input - the published `package.json`.
 * @returns the installable manifest.
 * @throws {Error} when the package declares no harness metadata or no bundle patch.
 */
export function adaptManifest(input: unknown): { manifest: Record<string, unknown> } {
  if (!isRecord(input)) throw new Error('package.json is not a JSON object')
  const source = isRecord(input.tomato) ? input.tomato : isRecord(input.tomato) ? input.tomato : undefined
  if (source === undefined) throw new Error('package declares neither tomato nor tomato metadata')
  const tomato = normalizeHarnessMetadata(source)
  const manifest: Record<string, unknown> = { ...input, tomato }
  delete manifest['tomato']
  if (isRecord(manifest.peerDependencies)) {
    manifest.peerDependencies = Object.fromEntries(Object.entries(manifest.peerDependencies).map(([name, range]) => [mapPackageName(name), range]))
  }
  if (isRecord(manifest.dependencies)) {
    const dependencies: Record<string, unknown> = {}
    for (const [name, range] of Object.entries(manifest.dependencies)) {
      const mapped = mapPackageName(name)
      if (mapped === name) {
        dependencies[name] = range
        continue
      }
      // Runtime packages come from the running installation; installing copies of them would duplicate Cordis and
      // break the shared service graph.
      const peers = isRecord(manifest.peerDependencies) ? manifest.peerDependencies : {}
      peers[mapped] = peers[mapped] ?? range
      manifest.peerDependencies = peers
    }
    manifest.dependencies = dependencies
  }
  const engines = isRecord(manifest.engines) ? manifest.engines : undefined
  if (engines !== undefined && typeof engines.tomato === 'string') {
    const tomato = typeof engines.tomato === 'string' ? engines.tomato : undefined
    manifest.engines = { ...engines, tomato }
    delete (manifest.engines as Record<string, unknown>)['tomato']
  }
  const bundle = isRecord(tomato.bundle) ? tomato.bundle : undefined
  if (typeof bundle?.patch !== 'string') {
    throw new Error('the package declares no bundle patch, so Tomato cannot load it as a plugin')
  }
  return { manifest }
}

/** Text files whose package references are rewritten during adaptation. */
export const REWRITTEN_EXTENSIONS: readonly string[] = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.json', '.yml', '.yaml']

/**
 * Whether one extracted file is rewritten.
 * @param path - file path inside the package.
 * @returns whether the file is a text file this adapter rewrites.
 */
export function isRewrittenFile(path: string): boolean {
  return REWRITTEN_EXTENSIONS.some(extension => path.endsWith(extension))
}