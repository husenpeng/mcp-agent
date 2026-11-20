/**
 * The authenticated `/api/tomato-market` request and reply contract shared by the host and the browser tab package
 * `@tomato/client-ui-tomato-market`, which imports it and the Plugins page tab props it composes.
 */

/** The route the browser half calls; document-relative, so a mounted base path keeps working. */
export const ROUTE = 'api/tomato-market'

/** Plugin kinds the curated marketing catalog declares. */
export type MarketingKind = 'plugin' | 'mcp' | 'skill'

/** Localized catalog text keyed by language. */
export type Localized = Readonly<Record<string, string>>

/** One category of the curated marketing catalog. */
export interface MarketingCategory {
  readonly id: string
  readonly title: Localized
}

/** What one plugin, MCP server, or Skill entry installs. */
/** What installing one plugin entry runs: an exact npm package and version the Plugins page installs. */
export interface MarketingPluginInstall {
  readonly type: 'plugin'
  readonly name: string
  readonly version: string
}

/** What installing one MCP server entry runs: a pinned stdio command and the variables it reads. */
export interface MarketingMcpInstall {
  readonly type: 'mcp'
  readonly runner: 'npx' | 'uvx'
  readonly package: string
  readonly version: string
  readonly bin?: string
  readonly args?: readonly string[]
  readonly env?: readonly string[]
}

/** What installing one Skill entry runs: pinned repository directories copied into the user skill root. */
export interface MarketingSkillInstall {
  readonly type: 'skill'
  readonly repo: string
  readonly commit: string
  readonly skills: ReadonlyArray<{ readonly name: string; readonly path: string }>
}

/** One entry that only documents its steps. */
export interface MarketingManualInstall {
  readonly type: 'manual'
  readonly steps: Localized
}

/** What one catalog entry installs, discriminated by `type`. */
export type MarketingInstall = MarketingPluginInstall | MarketingMcpInstall | MarketingSkillInstall | MarketingManualInstall

/** One curated entry. */
export interface MarketingEntry {
  readonly id: string
  readonly kind: MarketingKind
  readonly title: Localized
  readonly description: Localized
  readonly categories: readonly string[]
  readonly access?: 'none' | 'free-key' | 'self-hosted' | 'login'
  readonly manual?: boolean
  readonly platforms?: readonly string[]
  readonly homepage?: string
  /** The license the repository declares. */
  readonly license?: string
  readonly install: MarketingInstall
  readonly stars?: number
  /** When the repository last pushed, as the catalog snapshot recorded it. */
  readonly updatedAt?: string
}

/** The curated catalog that ships with this package. */
export interface MarketingCatalog {
  readonly format: number
  readonly generatedAt: string
  readonly categories: readonly MarketingCategory[]
  readonly entries: readonly MarketingEntry[]
}

/** One entry's long description, as the browser renders it. */
export type MarketEntryDetail = { readonly status: 'found'; readonly markdown: string } | { readonly status: 'none' }

/** What installing one entry would do, for the confirmation dialog the browser shows. */
export type MarketingPreview =
  | { readonly kind: 'mcp'; readonly command: string; readonly yaml: string; readonly runnerMissing?: string }
  | { readonly kind: 'skill'; readonly skills: readonly string[]; readonly conflicts: readonly string[] }

/** One installable version of a catalog plugin. */
export interface MarketVersion {
  readonly version: string
  readonly source: { readonly type: 'npm' | 'git'; readonly registry?: string; readonly url?: string; readonly commit?: string; readonly path?: string }
  readonly publishTimestamp?: number
  readonly tomato?: string
  readonly deprecated?: boolean
}

/** One plugin listed by the open catalog. */
export interface MarketPlugin {
  /** List artwork, already resolved against the answering index. */
  readonly icon?: string
  /** The plugin's homepage. */
  readonly homepage?: string
  readonly name: string
  readonly title?: Localized | string
  readonly description?: Localized | string
  readonly author?: string
  readonly category?: string
  readonly keywords?: readonly string[]
  readonly repository?: { readonly url?: string; readonly directory?: string }
  readonly versions: readonly MarketVersion[]
}

/** One catalog category. */
export interface MarketCatalogCategory {
  readonly id: string
  readonly title?: Localized | string
}

/** One read of the open catalog, with GitHub stars merged in. */
export interface MarketCatalog {
  readonly title?: Localized | string
  readonly categories: readonly MarketCatalogCategory[]
  readonly plugins: readonly MarketPlugin[]
  readonly stars: Readonly<Record<string, number>>
  readonly indexUrl?: string
}

/** One request the browser half sends. */
export interface MarketRequest {
  /** The endpoint to read; the payload's fields belong to that endpoint. */
  readonly endpoint:
    | 'catalog'
    | 'manifest'
    | 'resolve'
    | 'detail'
    | 'adapt'
    | 'marketing-catalog'
    | 'marketing-preview'
    | 'marketing-install'
    | 'marketing-uninstall'
    | 'marketing-detail'
  readonly payload?: Readonly<Record<string, unknown>>
}

/**
 * Owner props of one market tab: the Plugins page's own bridges, which hand a plugin package to its install dialog and
 * open an installed bundle's page.
 */
export interface MarketTabProps {
  /** Install an exact version the person already confirmed through the page's install dialog. */
  readonly install: (target: { readonly spec: string; readonly registry?: string; readonly title: string; readonly version: string }) => void
  /** Switch to the Installed tab and open a bundle's page. */
  readonly openPackage: (packageName: string) => void
}

/** One rendered market tab: the page's own slot owner props, plus the language it renders at. */
export interface MarketViewProps extends MarketTabProps {
  readonly language: string
}

/** One verdict against the running TOMATO. */
export type ResolutionVerdict =
  | { readonly status: 'compatible' }
  | { readonly status: 'incompatible'; readonly requirements: Readonly<Record<string, string>> }
  | { readonly status: 'unknown'; readonly reason: string }

/** Which listed version the running TOMATO admits. */
export type Resolution =
  | { readonly status: 'resolved'; readonly runtimeVersion?: string; readonly requested: string; readonly selected: string }
  | { readonly status: 'none'; readonly runtimeVersion?: string; readonly requested: string }
  | { readonly status: 'unknown'; readonly requested: string; readonly reason: string }

/** What one install or uninstall changed on this profile. */
export interface MarketingResult {
  readonly application?: 'applied' | 'restart-required'
  readonly warnings?: readonly unknown[]
}

/** What one listed version's manifest read reports to the browser. */
export interface ManifestFacts {
  /** `tomato` when the package declares a bundle or targets TOMATO peers; `other` when it declares neither. */
  readonly class: 'tomato' | 'other'
  readonly declaredBundle: boolean
  readonly tomatoPeers: readonly string[]
  readonly registry: string
  readonly bundlePatch?: string
  readonly tomatoRange?: string
  readonly deprecated?: string
  readonly version?: string
  readonly runtimeVersion?: string
  readonly compatibility?: ResolutionVerdict
}

/** One reply the host half sends. */
export type MarketReply =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } }

/** The browser-facing route shape this package's host half registers. */
export interface MarketRoute {
  readonly fetch: {
    register(route: {
      path: string
      methods: readonly ('POST' | 'GET')[]
      requestBody: 'buffered'
      fetch(request: Request): Promise<Response>
    }): () => void
  }
}