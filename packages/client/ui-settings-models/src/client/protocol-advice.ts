/**
 * Endpoint-protocol advice for a hand-declared route, derived from the
 * configurable-provider directory the page already holds.
 *
 * A protocol is a property of the endpoint, not of the model: the same model
 * id is served over different protocols by different gateways, so the advice
 * keys on the endpoint hostname rather than the model. Each installed catalog
 * provider reports its own endpoint (`defaultBaseURL`) and the one protocol its
 * shipped models agree on (`sharedProtocol`); together they form a
 * hostname→protocol table the creation form consults while the protocol field
 * is still automatic. An unknown hostname — every relay and self-hosted server
 * the catalog does not ship — falls back to the first protocol the adapter
 * offers, the OpenAI-compatible gateway dialect most relays speak.
 *
 * Matching is exact on the hostname: a relay whose URL merely contains a
 * vendor's name (`api.anthropic.com.evil-relay.example`) is not that vendor.
 * Port and path carry no reliable protocol signal — `/v1` appears on Anthropic
 * native relays too — so neither participates.
 */

/** The directory facts one provider contributes to the advice table. */
export interface ProtocolAdviceSource {
  /** The provider's catalog endpoint; absent when it has no fixed endpoint. */
  defaultBaseURL?: string
  /** The one protocol the provider's catalog models agree on; absent when none is nameable. */
  sharedProtocol?: string
}

/**
 * The exact hostname of a URL, lowercased, or undefined when it does not parse.
 * Port, path, query, and credentials are ignored: only the host decides.
 * @param value - the endpoint text as typed or reported.
 * @returns the hostname to match on, or undefined for an unparseable value.
 */
export function hostnameOf(value: string): string | undefined {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

/**
 * Derive the hostname→protocol advice table from the directory. A hostname two
 * providers disagree on is dropped rather than guessed: the form falls back for
 * it, and the user picks the protocol explicitly.
 * @param entries - directory entries carrying an endpoint and a shared protocol.
 * @returns hostnames mapped to the one protocol their providers agree on.
 */
export function protocolAdviceByHost(entries: readonly ProtocolAdviceSource[]): ReadonlyMap<string, string> {
  const advice = new Map<string, string>()
  const conflicted = new Set<string>()
  for (const entry of entries) {
    if (entry.defaultBaseURL === undefined || entry.sharedProtocol === undefined) continue
    const host = hostnameOf(entry.defaultBaseURL)
    if (host === undefined) continue
    const seen = advice.get(host)
    if (seen !== undefined && seen !== entry.sharedProtocol) {
      conflicted.add(host)
      continue
    }
    advice.set(host, entry.sharedProtocol)
  }
  for (const host of conflicted) advice.delete(host)
  return advice
}

/**
 * The protocol to prefill for an endpoint: the advice table's exact-hostname
 * answer, or the fallback when the hostname is unknown or unparseable.
 * @param baseURL - the endpoint as the form currently shows it.
 * @param advice - the derived hostname→protocol table.
 * @param fallback - the protocol an unknown endpoint takes (the first offered).
 * @returns the protocol identifier to prefill.
 */
export function adviseProtocol(baseURL: string, advice: ReadonlyMap<string, string>, fallback: string): string {
  const host = hostnameOf(baseURL)
  return host === undefined ? fallback : advice.get(host) ?? fallback
}
