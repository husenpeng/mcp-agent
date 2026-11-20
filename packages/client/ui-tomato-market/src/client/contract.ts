/**
 * The browser half's own contract. It carries the shared request and reply types by type-only imports, which the
 * bundler erases, and declares the one constant the tabs inline, so no cross-plugin value import reaches the bundle.
 */
export type {
  Localized, ManifestFacts, MarketCatalog, MarketCatalogCategory, MarketEntryDetail, MarketPlugin, MarketReply,
  MarketRequest, MarketRoute, MarketVersion, MarketingCatalog, MarketingCategory, MarketingEntry, MarketingInstall,
  MarketingKind, MarketingManualInstall, MarketingMcpInstall, MarketingPluginInstall, MarketingPreview,
  MarketingResult, MarketingSkillInstall, MarketTabProps, MarketViewProps, Resolution, ResolutionVerdict,
} from '@tomato/plugin-tomato-market/api'

/** The route the tabs call; document-relative, so a mounted base path keeps working. */
export const ROUTE = 'api/tomato-market'

// A wire constant crosses the package edge once: the import above is type-only, so the value neither shares an
// identity nor belongs to a module that a browser bundle may reach at runtime.
