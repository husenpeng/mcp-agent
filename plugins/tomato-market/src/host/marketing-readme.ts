// Long descriptions of marketing catalog entries: the package README a pinned
// install ships, or the repository's. Reads go through the same CDNs as the
// plugin catalog because raw.githubusercontent.com is unreachable from some
// networks this market serves.
import type { MarketingEntry } from '../api.ts'
import type { HttpReader, ReadOptions, TextRead } from './http.ts'
import { README_MAX_BYTES, readReadme, stripFrontMatter } from './registry.ts'

/** One entry's long description. */
export type EntryReadme = { readonly status: 'found'; readonly markdown: string; readonly origin: string } | { readonly status: 'none' }

/**
 * @param repository - GitHub repository URL.
 * @returns its `owner/repo`.
 */
function repositorySlug(repository: unknown): string | undefined {
  return typeof repository === 'string'
    ? /^https?:\/\/github\.com\/([^/]+\/[^/#?]+?)(?:\.git)?\/?$/.exec(repository)?.[1]
    : undefined
}

/**
 * The repository files that describe one entry, most specific first.
 * @param entry - a marketing catalog entry.
 * @returns file URLs on jsDelivr's GitHub CDN.
 */
export function repositoryReadmes(entry: Pick<MarketingEntry, 'install'> & { readonly repository?: unknown }): string[] {
  const base = 'https://cdn.jsdelivr.net/gh'
  if (entry.install.type === 'skill') {
    const { repo, commit } = entry.install
    return [`${base}/${String(repo)}@${String(commit)}/README.md`, `${base}/${String(repo)}@${String(commit)}/readme.md`]
  }
  const slug = repositorySlug(entry.repository)
  return slug === undefined ? [] : [`${base}/${slug}/README.md`, `${base}/${slug}/readme.md`]
}

/**
 * Read one entry's README.
 * @param entry - a marketing catalog entry.
 * @param io - readers and bounds.
 * @returns the document.
 */
export async function readEntryReadme(entry: MarketingEntry, io: {
  readonly readText: (url: string, options?: ReadOptions) => Promise<TextRead>
  readonly readJson: HttpReader
  readonly registries: readonly string[]
  readonly signal?: AbortSignal | undefined
}): Promise<EntryReadme> {
  const { install } = entry
  const published = install.type === 'plugin' && install.name !== undefined && install.version !== undefined
    ? { name: install.name, version: install.version }
    : install.type === 'mcp' && install.runner === 'npx' && install.package !== undefined && install.version !== undefined
      ? { name: install.package, version: install.version }
      : undefined
  if (published !== undefined) {
    const found = await readReadme(io.readText, io.readJson, { ...published, source: { type: 'npm' }, registries: io.registries, signal: io.signal })
    if (found.status === 'found') return found
  }
  if (install.type === 'mcp' && install.runner === 'uvx' && install.package !== undefined && install.version !== undefined) {
    try {
      const { value } = await io.readJson(
        `https://pypi.org/pypi/${encodeURIComponent(install.package)}/${encodeURIComponent(install.version)}/json`,
        { signal: io.signal },
      )
      const info = (value as { info?: { description?: unknown; description_content_type?: unknown } })?.info
      const description = info?.description
      if (typeof description === 'string' && description.trim() !== ''
        && typeof info?.description_content_type === 'string' && info.description_content_type.includes('markdown')) {
        return { status: 'found', markdown: description.slice(0, README_MAX_BYTES), origin: 'pypi' }
      }
    } catch { /* PyPI has no such release page; the repository README follows */ }
  }
  for (const url of repositoryReadmes(entry)) {
    try {
      const { text } = await io.readText(url, { signal: io.signal, maxBytes: README_MAX_BYTES })
      if (text.trim() !== '') return { status: 'found', markdown: stripFrontMatter(text), origin: 'repository' }
    } catch { /* this spelling is absent; the next one may exist */ }
  }
  return { status: 'none' }
}