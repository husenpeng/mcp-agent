/** Reader of the host half's `api/tomato-market` route. */

/** Document-relative so a mounted base path keeps working. */
const ROUTE = 'api/tomato-market'

/**
 * Call one market endpoint.
 * @param {string} endpoint - one of the route's endpoint names.
 * @param {object} [payload] - endpoint arguments.
 * @param {AbortSignal} [signal] - caller cancellation.
 * @returns {Promise<unknown>} the endpoint's data.
 * @throws {Error} with a message meant for the reader.
 */
export async function call(endpoint, payload = {}, signal) {
  let response
  try {
    response = await fetch(new URL(ROUTE, document.baseURI), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint, payload }),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error(`network: ${error?.message ?? error}`)
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result = await response.json()
  if (!result.ok) throw new Error(result.error?.message ?? 'request failed')
  return result.data
}

/**
 * Read the catalog, optionally bypassing the host's cache.
 * @param {boolean} refresh - fetch again.
 * @returns {Promise<object>} the compact catalog with star counts.
 */
export function readCatalog(refresh = false) {
  return call('catalog', { refresh })
}

/**
 * Read one version's compatibility facts.
 * @param {{ name: string }} plugin - the plugin.
 * @param {{ version: string, source: { registry?: string } }} version - the listed version.
 * @returns {Promise<object>} the classified manifest.
 */
export function readManifest(plugin, version) {
  return call('manifest', { name: plugin.name, version: version.version })
}

/**
 * Convert one listed DeepSeek Harness version into a Tomato-installable tarball.
 * @param {{ name: string }} plugin - the plugin.
 * @param {{ version: string }} version - the listed version.
 * @returns {Promise<{ adapted: boolean, spec: string, changed?: number, from?: string }>} the install spec.
 */
export function adaptVersion(plugin, version) {
  return call('adapt', { name: plugin.name, version: version.version })
}

/**
 * Ask which listed version the running TOMATO admits, starting from the one asked for.
 * @param {{ name: string, versions: object[] }} plugin - the plugin.
 * @param {{ version: string }} version - the version the reader chose.
 * @returns {Promise<object>} `{ status: 'resolved', runtimeVersion, requested, selected, rejected }`,
 *   `{ status: 'none', ... }` when no listed version is compatible, or `{ status: 'unknown', reason }`.
 */
export function resolveVersion(plugin, version) {
  return call('resolve', { name: plugin.name, version: version.version })
}

/**
 * Read one version's README.
 * @param {{ name: string }} plugin - the plugin.
 * @param {{ version: string }} version - the listed version.
 * @returns {Promise<object>} `{ status: 'found', markdown, origin }` or `{ status: 'none' }`.
 */
export function readDetail(plugin, version) {
  return call('detail', { name: plugin.name, version: version.version })
}
/** @returns {Promise<{ categories: object[], entries: object[], installed: string[] }>} the curated catalog and the entries this profile has. */
export function readMarketingCatalog() {
  return call('marketing-catalog')
}

/**
 * Read what installing one entry would do.
 * @param {string} id - entry id.
 * @returns {Promise<object>} the command and YAML of an MCP entry, or the directories and conflicts of a Skill entry.
 */
export function previewMarketingEntry(id) {
  return call('marketing-preview', { id })
}

/**
 * Install one MCP or Skill entry.
 * @param {string} id - entry id.
 * @returns {Promise<object>} the install result.
 */
export function installMarketingEntry(id) {
  return call('marketing-install', { id })
}

/**
 * Remove what one MCP or Skill entry installed.
 * @param {string} id - entry id.
 * @returns {Promise<object>} the removal result.
 */
export function uninstallMarketingEntry(id) {
  return call('marketing-uninstall', { id })
}

/**
 * Read one entry's README.
 * @param {string} id - entry id.
 * @returns {Promise<object>} `{ status: 'found', markdown, origin }` or `{ status: 'none' }`.
 */
export function readMarketingDetail(id) {
  return call('marketing-detail', { id })
}
