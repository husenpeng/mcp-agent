// Registry facts for one exact version: which harness manifest it declares,
// and its README. These decide whether the market may hand a plugin to
// Tomato's installer and what its page shows.

/** Registries asked in order: the official npm registry, then the mainland mirror. */
export const DEFAULT_REGISTRIES = ['https://registry.npmjs.org', 'https://registry.npmmirror.com']

/** npm file CDNs read for a README, in order. */
export const README_CDNS = ['https://cdn.jsdelivr.net/npm', 'https://unpkg.com']

/** Largest README kept. */
export const README_MAX_BYTES = 512 * 1024

/** @param {string} text - candidate Markdown. @returns {string} the document without a leading YAML front matter block. */
export function stripFrontMatter(text) {
  if (!text.startsWith('---')) return text
  const end = text.indexOf('\n---', 3)
  if (end === -1) return text
  const after = text.indexOf('\n', end + 4)
  return after === -1 ? '' : text.slice(after + 1)
}

/**
 * The registry paths that answer one exact version's manifest.
 * @param {string} name - npm package name.
 * @param {string} version - exact version.
 * @param {string[]} registries - registries in fallback order.
 * @returns {Array<{ registry: string, url: string }>} candidate reads.
 */
export function manifestCandidates(name, version, registries = DEFAULT_REGISTRIES) {
  const encoded = encodeURIComponent(name)
  const escapedVersion = encodeURIComponent(version)
  return registries.map(registry => ({
    registry,
    url: `${registry.replace(/\/$/, '')}/${encoded}/${escapedVersion}`,
  }))
}

/**
 * Whether a manifest declares a harness bundle, and the facts the market shows.
 * @param {object | undefined} manifest - one version's registry manifest.
 * @returns {object} the compatibility record; `class` is `tomato` when the
 * package declares `tomato.bundle`, `dsh` when it targets DeepSeek Harness
 * instead, and `other` when it declares no bundle at all.
 */
export function classifyManifest(manifest) {
  if (typeof manifest !== 'object' || manifest === null) return { class: 'unknown' }
  const tomato = typeof manifest.tomato === 'object' && manifest.tomato !== null ? manifest.tomato : undefined
  const dsh = typeof manifest.dsh === 'object' && manifest.dsh !== null ? manifest.dsh : undefined
  const peers = typeof manifest.peerDependencies === 'object' && manifest.peerDependencies !== null ? manifest.peerDependencies : {}
  const peerNames = Object.keys(peers)
  const deepseekPeers = peerNames.filter(peer => peer.startsWith('@deepseek-ai/'))
  const tomatoPeers = peerNames.filter(peer => peer.startsWith('@tomato/'))
  const engines = typeof manifest.engines === 'object' && manifest.engines !== null ? manifest.engines : {}
  const declaredBundle = tomato?.bundle !== undefined || dsh?.bundle !== undefined
  return {
    class: tomato?.bundle !== undefined ? 'tomato' : dsh?.bundle !== undefined || deepseekPeers.length > 0 ? 'dsh' : 'other',
    bundlePatch: tomato?.bundle?.patch ?? dsh?.bundle?.patch,
    declaredBundle,
    tomatoRange: typeof engines.tomato === 'string' ? engines.tomato : undefined,
    dshRange: typeof engines.dsh === 'string' ? engines.dsh : undefined,
    deepseekPeers,
    tomatoPeers,
    deprecated: typeof manifest.deprecated === 'string' ? manifest.deprecated : undefined,
    version: typeof manifest.version === 'string' ? manifest.version : undefined,
  }
}

/**
 * The README reads for one listed version, most specific first.
 * @param {{ name: string, version: string, source: object }} request - the version.
 * @returns {Array<{ url: string, hint: string }>} candidate reads.
 */
export function readmeCandidates({ name, version, source }) {
  const candidates = []
  if (source.type === 'git' && typeof source.url === 'string' && typeof source.commit === 'string') {
    const slug = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/.exec(source.url)
    if (slug !== null) {
      const directory = typeof source.path === 'string' && source.path !== '.' ? `${source.path.replace(/^\/+|\/+$/g, '')}/` : ''
      candidates.push({
        url: `https://raw.githubusercontent.com/${slug[1]}/${slug[2]}/${source.commit}/${directory}README.md`,
        hint: 'repository',
      })
    }
  }
  const packageSpec = `${name}@${version}`
  for (const cdn of README_CDNS) candidates.push({ url: `${cdn}/${packageSpec}/README.md`, hint: cdn })
  candidates.push({ url: `https://registry.npmmirror.com/${packageSpec}/files/README.md`, hint: 'npmmirror' })
  return candidates
}

/**
 * The raw `package.json` paths of a Git-sourced version on GitHub, in fallback order.
 * @param {{ url: string, commit: string, path?: string }} source - the version's Git source.
 * @returns {string[]} raw file URLs; empty when the repository is not on GitHub.
 */
export function gitManifestCandidates(source) {
  const slug = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/.exec(source.url)
  if (slug === null || typeof source.commit !== 'string') return []
  const directory = typeof source.path === 'string' && source.path !== '.' ? `${source.path.replace(/^\/+|\/+$/g, '')}/` : ''
  return [`https://raw.githubusercontent.com/${slug[1]}/${slug[2]}/${source.commit}/${directory}package.json`]
}

/**
 * Read the first manifest registry that answers.
 * @param {(url: string, options?: object) => Promise<{ value: unknown }>} read - the JSON reader.
 * @param {string} name - package name.
 * @param {string} version - exact version.
 * @param {{ registries?: string[], signal?: AbortSignal }} [options] - registry order and disposal.
 * @returns {Promise<{ manifest: object, registry: string }>} the manifest and the registry that answered.
 * @throws {Error} naming every registry when none answered.
 */
export async function readManifest(read, name, version, options = {}) {
  const registries = options.registries ?? DEFAULT_REGISTRIES
  const failures = []
  for (const { registry, url } of manifestCandidates(name, version, registries)) {
    try {
      const { value } = await read(url, { signal: options.signal, maxBytes: 4 * 1024 * 1024 })
      if (typeof value !== 'object' || value === null) throw new Error('manifest is not a JSON object')
      return { manifest: value, registry }
    } catch (error) {
      failures.push(`${new URL(registry).host}: ${error?.message ?? error}`)
    }
  }
  throw new Error(`registry unavailable (${failures.join('; ')})`)
}

/**
 * Read one version's long description.
 * @param {(url: string, options?: object) => Promise<{ text: string }>} readText - the text reader.
 * @param {(url: string, options?: object) => Promise<{ value: unknown }>} readJson - the JSON reader.
 * @param {{ name: string, version: string, source: object, registries?: string[], signal?: AbortSignal }} request - the version.
 * @returns {Promise<{ status: 'found', markdown: string, origin: string } | { status: 'none' }>} the document.
 */
export async function readReadme(readText, readJson, request) {
  for (const candidate of readmeCandidates(request)) {
    try {
      const { text } = await readText(candidate.url, { signal: request.signal, maxBytes: README_MAX_BYTES })
      if (text.trim() !== '') return { status: 'found', markdown: stripFrontMatter(text), origin: candidate.hint }
    } catch { /* this mirror has no README; the next one may */ }
  }
  try {
    const { manifest } = await readManifest(readJson, request.name, request.version, request)
    if (typeof manifest.readme === 'string' && manifest.readme.trim() !== '') {
      return { status: 'found', markdown: stripFrontMatter(manifest.readme), origin: 'registry' }
    }
  } catch { /* no registry readme either */ }
  return { status: 'none' }
}