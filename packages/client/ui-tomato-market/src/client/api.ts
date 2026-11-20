/**
 * Reader of the host half's `/api/tomato-market` route. The route answers one JSON body per request and names nothing
 * but catalog facts and entry ids; the commands a one-click install runs come from the catalog bundled with the package.
 */
import { ROUTE } from './contract.ts'
import type {
  ManifestFacts, MarketCatalog, MarketEntryDetail, MarketingCatalog, MarketingEntry, MarketingPreview, MarketReply,
  MarketRequest, MarketVersion, MarketingResult, Resolution,
} from './contract.ts'

/** The market's reads, as the tab controllers call them. */
export interface MarketClient {
  /** @returns the open catalog with star counts, or the cached one again when `refresh`. */
  catalog(refresh: boolean): Promise<MarketCatalog>
  manifest(plugin: { readonly name: string }, version: MarketVersion): Promise<ManifestFacts>
  resolve(plugin: { readonly name: string }, version: MarketVersion): Promise<Resolution>
  detail(plugin: { readonly name: string }, version: MarketVersion): Promise<MarketEntryDetail>
  adapt(plugin: { readonly name: string }, version: MarketVersion): Promise<{ readonly adapted: boolean; readonly spec: string }>
  marketingCatalog(): Promise<{ readonly installed: readonly string[] } & MarketingCatalog>
  marketingPreview(id: string): Promise<MarketingPreview>
  marketingInstall(id: string): Promise<MarketingResult>
  marketingUninstall(id: string): Promise<MarketingResult>
  marketingDetail(id: string): Promise<MarketEntryDetail>
}

/**
 * Call one market endpoint.
 * @param endpoint - one of the route's endpoint names.
 * @param payload - endpoint arguments.
 * @returns the endpoint's data.
 * @throws {Error} with a message meant for the reader.
 */
async function call(base: string, endpoint: MarketRequest['endpoint'], payload: Readonly<Record<string, unknown>> = {}): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(new URL(ROUTE, base), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint, payload } satisfies MarketRequest),
    })
  } catch (error) {
    throw new Error(`network: ${(error as Error).message}`)
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result = await response.json() as MarketReply
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

/**
 * The market client one Plugins page tab reads through.
 * @param base - the document's base URL, resolved once per call.
 * @returns the client.
 */
export function marketClient(base: () => string): MarketClient {
  return {
    catalog: refresh => call(base(), 'catalog', { refresh }) as Promise<MarketCatalog>,
    manifest: (plugin, version) => call(base(), 'manifest', { name: plugin.name, version: version.version }) as Promise<ManifestFacts>,
    resolve: (plugin, version) => call(base(), 'resolve', { name: plugin.name, version: version.version }) as Promise<Resolution>,
    detail: (plugin, version) => call(base(), 'detail', { name: plugin.name, version: version.version }) as Promise<MarketEntryDetail>,
    adapt: (plugin, version) => call(base(), 'adapt', { name: plugin.name, version: version.version }) as Promise<{ readonly adapted: boolean; readonly spec: string }>,
    marketingCatalog: () => call(base(), 'marketing-catalog') as Promise<{ readonly installed: readonly string[] } & MarketingCatalog>,
    marketingPreview: id => call(base(), 'marketing-preview', { id }) as Promise<MarketingPreview>,
    marketingInstall: id => call(base(), 'marketing-install', { id }) as Promise<MarketingResult>,
    marketingUninstall: id => call(base(), 'marketing-uninstall', { id }) as Promise<MarketingResult>,
    marketingDetail: id => call(base(), 'marketing-detail', { id }) as Promise<MarketEntryDetail>,
  }
}

export type { ManifestFacts, MarketingEntry, MarketingResult, Resolution }
