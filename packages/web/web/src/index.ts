/**
 * Service Definition for the web access capability seam (`ctx.web`): registries and provider-selecting execution for search and
 * fetch. Duplicate ids are rejected. At execution time, a configured provider must exist and
 * be usable; without one, exactly one usable provider is required, so selection never depends
 * on registration order.
 * @module @tomato/web
 */

import { Context, type Volatile } from '@tomato/cordis'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import z from '@tomato/schemastery'
import type {
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebProviderInfo,
  WebProviderList,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
} from './types.ts'
import { WebError } from './types.ts'

export {
  WebError,
} from './types.ts'
export type {
  WebFetchBody,
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebProviderInfo,
  WebProviderList,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    web: WebRuntime
  }
}

/** Selection inputs for execution-time provider resolution. */
interface Selection<P> {
  /** Ordered candidate ids for this capability; empty means auto-select. */
  readonly candidates: readonly string[]
  /** Providers registered for this capability kind. */
  readonly providers: ReadonlyMap<string, P>
}

/**
 * Config for the web seam. `searchProviders` / `fetchProviders` are ordered
 * candidate lists: the first candidate that is registered and reports itself
 * available wins, so a deployment can name a preferred backend and a fallback.
 * An empty list auto-selects a single registered usable provider. Each
 * operation reads the current value, so a settings change applies to the next
 * search or fetch without remounting the service. Operational overrides such
 * as environment variables must feed these same fields rather than introduce
 * a second, hidden priority chain.
 */
export interface WebRuntimeConfig {
  /** Ordered search provider ids; empty = auto-select when exactly one usable. */
  readonly searchProviders: Volatile<string[]>
  /** Ordered fetch provider ids; empty = auto-select when exactly one usable. */
  readonly fetchProviders: Volatile<string[]>
}

/**
 * The web access service. Registered as `ctx.web` (one instance per context)
 * and exposed to Clients as the `web` Remote namespace (`listProviders`).
 *
 * Selection semantics (resolved at execution time; registration order only
 * breaks ties inside one configured list, never across auto-selection):
 * - With candidates, the first registered candidate whose `available()` is true wins.
 * - A candidate that is not registered is skipped; when none wins and a
 *   candidate was missing, `WEB_PROVIDER_CONFIGURED_MISSING` names the first one.
 * - Candidates all registered but unavailable → `WEB_PROVIDER_CONFIGURED_UNAVAILABLE`.
 * - No candidates, exactly one registered usable provider → that provider.
 * - No candidates, multiple usable providers → `WEB_PROVIDER_AMBIGUOUS`.
 * - No candidates, no usable provider → `WEB_PROVIDER_UNAVAILABLE`.
 */
export class WebRuntime extends TypertRemoteService {
  /**
   * Provider selection config. Operational env overrides feed the SAME fields:
   * `$TOMATO_WEB_SEARCH_PROVIDERS` / `$TOMATO_WEB_FETCH_PROVIDERS` carry a
   * comma-separated ordered list equivalent to `searchProviders` /
   * `fetchProviders` and are NOT a second priority chain.
   */
  static Config = z.object({
    searchProviders: z.array(z.string()).volatile(),
    fetchProviders: z.array(z.string()).volatile(),
  })

  private searchProviders = new Map<string, WebSearchProvider>()
  private fetchProviders = new Map<string, WebFetchProvider>()
  private readonly searchProviderEnv: readonly string[]
  private readonly fetchProviderEnv: readonly string[]

  constructor(ctx: Context, private readonly config: WebRuntimeConfig) {
    super(ctx, 'web')
    this.searchProviderEnv = candidateList(process.env.TOMATO_WEB_SEARCH_PROVIDERS)
    this.fetchProviderEnv = candidateList(process.env.TOMATO_WEB_FETCH_PROVIDERS)
  }

  /**
   * Register a search provider. `listProviders()` lists it until the
   * registration is disposed, which happens with the calling fiber or through
   * the returned disposer; registration and disposal each emit
   * `web/providers-changed`. Throws {@link WebError} `WEB_DUPLICATE_PROVIDER`
   * if its id is already registered for search.
   * @param provider - the provider; its `id` is the registry key.
   * @returns the disposer that unregisters the provider.
   */
  registerSearchProvider(provider: WebSearchProvider): () => void {
    return this.registerProvider(this.searchProviders, provider)
  }

  /**
   * Register a fetch provider, with the listing, disposal, and event behavior
   * of {@link WebRuntime.registerSearchProvider}. Throws {@link WebError}
   * `WEB_DUPLICATE_PROVIDER` if its id is already registered for fetch.
   * @param provider - the provider; its `id` is the registry key.
   * @returns the disposer that unregisters the provider.
   */
  registerFetchProvider(provider: WebFetchProvider): () => void {
    return this.registerProvider(this.fetchProviders, provider)
  }

  private registerProvider<P extends { readonly id: string }>(store: Map<string, P>, provider: P): () => void {
    if (store.has(provider.id)) {
      throw new WebError(`a web provider with id "${provider.id}" is already registered`, 'WEB_DUPLICATE_PROVIDER')
    }
    const emitChanged = (): void => { this.emitProvidersChanged() }
    const dispose = this.ctx.effect(function* () {
      store.set(provider.id, provider)
      emitChanged()
      yield () => {
        store.delete(provider.id)
        emitChanged()
      }
    }, 'web.registerProvider()')
    // ctx.effect's disposer returns Promise<void>; our disposer API is
    // synchronous fire-and-forget — discard the (always-resolved) promise.
    return () => void dispose()
  }

  /**
   * List every registered search and fetch provider for provider pickers.
   * Availability does not filter the lists.
   * @returns detached `{ id, title, description }` entries per capability, in registration order.
   */
  @Remote
  listProviders(): WebProviderList {
    return {
      search: [...this.searchProviders.values()].map(providerInfo),
      fetch: [...this.fetchProviders.values()].map(providerInfo),
    }
  }

  /** Emit `web/providers-changed`, containing each listener's failure so none vetoes the mutation. */
  private emitProvidersChanged(): void {
    for (const listener of this.ctx.events.dispatch('emit', ['web/providers-changed'])) {
      try {
        const returned: unknown = listener()
        void Promise.resolve(returned).catch((error: unknown) => { this.warnListenerFailure(error) })
      } catch (error: unknown) {
        this.warnListenerFailure(error)
      }
    }
  }

  private warnListenerFailure(error: unknown): void {
    this.ctx.logger.warn('web: a web/providers-changed listener failed')
    this.ctx.logger.warn(error)
  }

  /**
   * Run one search through the selected provider. Resolves the provider at call
   * time with the selection rules above; throws {@link WebError} when the
   * capability cannot run. The seam enforces `request.maxResults` on the result:
   * if the provider over-returns, `sources[]` is truncated and `truncated` set.
   * @param request - the query and optional result limit.
   * @param signal - optional cancellation signal forwarded to the provider.
   * @returns the provider's results, capped to `request.maxResults`.
   */
  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const result = await this.selectSearchProvider().search(request, signal)
    return capSources(result, request.maxResults)
  }

  /**
   * Whether the provider `search()` would select can authenticate a search made for a
   * model request on the `llmProvider` chat route. Asks only that provider's `ready()`;
   * one without `ready()` counts as ready. Makes no network calls. A selection failure
   * answers true, because `search()` reports that failure as a structured `WebError`.
   * @param llmProvider - the provider route id of the model request, when known.
   * @returns false only when the selected provider reports that it cannot authenticate.
   */
  async searchReady(llmProvider?: string): Promise<boolean> {
    return await selectedProviderReady(() => this.selectSearchProvider(), llmProvider)
  }

  /** Select the search provider with the rules above, throwing the matching {@link WebError}. */
  private selectSearchProvider(): WebSearchProvider {
    const configured = this.config.searchProviders.get()
    return resolveProvider({
      providers: this.searchProviders,
      candidates: configured.length > 0 ? configured : this.searchProviderEnv,
    })
  }

  /**
   * Retrieve one URL through the selected provider. Resolves the provider at
   * call time with the selection rules above; throws {@link WebError} when the
   * capability cannot run. A non-2xx response is a result, not a throw.
   * @param request - the URL plus retrieval options.
   * @param signal - optional cancellation signal forwarded to the provider.
   * @returns the retrieval outcome; non-2xx responses resolve descriptively.
   */
  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    return await this.selectFetchProvider().fetch(request, signal)
  }

  /**
   * Whether the provider `fetch()` would select can authenticate a fetch made for a
   * model request on the `llmProvider` chat route. Asks only that provider's `ready()`;
   * one without `ready()` counts as ready. Makes no network calls. A selection failure
   * answers true, because `fetch()` reports that failure as a structured `WebError`.
   * @param llmProvider - the provider route id of the model request, when known.
   * @returns false only when the selected provider reports that it cannot authenticate.
   */
  async fetchReady(llmProvider?: string): Promise<boolean> {
    return await selectedProviderReady(() => this.selectFetchProvider(), llmProvider)
  }

  /** Select the fetch provider with the rules above, throwing the matching {@link WebError}. */
  private selectFetchProvider(): WebFetchProvider {
    const configured = this.config.fetchProviders.get()
    return resolveProvider({
      providers: this.fetchProviders,
      candidates: configured.length > 0 ? configured : this.fetchProviderEnv,
    })
  }
}

/** Project one provider to its picker entry, omitting an absent title or description. */
function providerInfo(provider: WebSearchProvider | WebFetchProvider): WebProviderInfo {
  return {
    id: provider.id,
    ...provider.title === undefined ? {} : { title: provider.title },
    ...provider.description === undefined ? {} : { description: provider.description },
  }
}

interface ResolvableProvider {
  readonly id: string
  available(): boolean
  ready?(llmProvider: string | undefined): Promise<boolean>
}

/**
 * Ask the provider an operation selects whether it can authenticate for one chat route.
 * @param select - the operation's selection; throws its {@link WebError} when no provider qualifies.
 * @param llmProvider - the provider route id of the model request, when known.
 * @returns the provider's answer; true when it has no `ready()` or selection fails, because the
 *   operation reports that failure itself.
 */
async function selectedProviderReady(select: () => ResolvableProvider, llmProvider: string | undefined): Promise<boolean> {
  let provider: ResolvableProvider
  try { provider = select() }
  catch (_selectionFailure) { return true /* The operation surfaces the same failure when called. */ }
  return await provider.ready?.(llmProvider) ?? true
}

/** Parse a comma-separated env override into its ordered, non-empty candidates. */
function candidateList(raw: string | undefined): readonly string[] {
  if (raw === undefined) return []
  return raw.split(',').map(candidate => candidate.trim()).filter(candidate => candidate.length > 0)
}

/** Resolve the selected provider or throw the matching {@link WebError}. */
function resolveProvider<P extends ResolvableProvider>(selection: Selection<P>): P {
  const { candidates, providers } = selection
  if (candidates.length > 0) {
    let firstMissing: string | undefined
    for (const id of candidates) {
      const provider = providers.get(id)
      if (!provider) {
        firstMissing ??= id
        continue
      }
      if (provider.available()) return provider
    }
    if (firstMissing !== undefined) {
      throw new WebError(`configured web providers "${candidates.join(', ')}": "${firstMissing}" is not registered`, 'WEB_PROVIDER_CONFIGURED_MISSING')
    }
    throw new WebError(
      `configured web providers "${candidates.join(', ')}" are registered but unavailable`,
      'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
    )
  }
  const usable = [...providers.values()].filter(provider => provider.available())
  const [single] = usable
  if (single === undefined) {
    throw new WebError('no usable web provider is registered', 'WEB_PROVIDER_UNAVAILABLE')
  }
  if (usable.length > 1) {
    const ids = usable.map(provider => provider.id).join(', ')
    throw new WebError(`multiple usable web providers are registered (${ids}); configure one explicitly`, 'WEB_PROVIDER_AMBIGUOUS')
  }
  return single
}

/** Enforce `maxResults` on a search result: truncate `sources[]` and flag it. */
function capSources(result: WebSearchResult, maxResults: number | undefined): WebSearchResult {
  if (maxResults === undefined || result.sources.length <= maxResults) return result
  return { ...result, sources: result.sources.slice(0, maxResults), truncated: true }
}

export default WebRuntime
