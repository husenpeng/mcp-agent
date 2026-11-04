// Long descriptions of marketing catalog entries: the package README a pinned
// install ships, or the repository's. Reads go through the same CDNs as the
// plugin catalog because raw.githubusercontent.com is unreachable from some
// networks this market serves.
import { README_MAX_BYTES, readReadme, stripFrontMatter } from './registry.js'

/** @param {string} repository - GitHub repository URL. @returns {string | undefined} its `owner/repo`. */
function repositorySlug(repository) {
  return /^https?:\/\/github\.com\/([^/]+\/[^/#?]+?)(?:\.git)?\/?$/.exec(repository)?.[1]
}

/**
 * The repository files that describe one entry, most specific first.
 * @param {object} entry - a marketing catalog entry.
 * @returns {string[]} file URLs on jsDelivr's GitHub CDN.
 */
export function repositoryReadmes(entry) {
  const base = 'https://cdn.jsdelivr.net/gh'
  if (entry.install.type === 'skill') {
    const { repo, commit } = entry.install
    return [`${base}/${repo}@${commit}/README.md`, `${base}/${repo}@${commit}/readme.md`]
  }
  const slug = repositorySlug(entry.repository)
  return slug === undefined ? [] : [`${base}/${slug}/README.md`, `${base}/${slug}/readme.md`]
}

/**
 * Read one entry's README.
 * @param {object} entry - a marketing catalog entry.
 * @param {object} io - readers and bounds.
 * @param {(url: string, options?: object) => Promise<{ text: string }>} io.readText - text reader.
 * @param {(url: string, options?: object) => Promise<{ value: unknown }>} io.readJson - JSON reader.
 * @param {string[]} [io.registries] - npm registries in fallback order.
 * @param {AbortSignal} [io.signal] - disposal.
 * @returns {Promise<{ status: 'found', markdown: string, origin: string } | { status: 'none' }>} the document.
 */
export async function readEntryReadme(entry, { readText, readJson, registries, signal }) {
  const { install } = entry
  const published = install.type === 'plugin'
    ? { name: install.name, version: install.version }
    : install.type === 'mcp' && install.runner === 'npx' ? { name: install.package, version: install.version } : undefined
  if (published !== undefined) {
    const found = await readReadme(readText, readJson, { ...published, source: { type: 'npm' }, registries, signal })
    if (found.status === 'found') return found
  }
  if (install.type === 'mcp' && install.runner === 'uvx') {
    try {
      const { value } = await readJson(`https://pypi.org/pypi/${encodeURIComponent(install.package)}/${encodeURIComponent(install.version)}/json`, { signal })
      const description = value?.info?.description
      if (typeof description === 'string' && description.trim() !== '' && value?.info?.description_content_type?.includes('markdown')) {
        return { status: 'found', markdown: description.slice(0, README_MAX_BYTES), origin: 'pypi' }
      }
    } catch { /* PyPI has no such release page; the repository README follows */ }
  }
  for (const url of repositoryReadmes(entry)) {
    try {
      const { text } = await readText(url, { signal, maxBytes: README_MAX_BYTES })
      if (text.trim() !== '') return { status: 'found', markdown: stripFrontMatter(text), origin: 'repository' }
    } catch { /* this spelling is absent; the next one may exist */ }
  }
  return { status: 'none' }
}
