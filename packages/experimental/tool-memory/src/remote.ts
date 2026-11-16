/**
 * Remote surface of the memory store for a paired phone.
 *
 * A phone cannot run a turn, so it never reaches the memory tools: it reads the
 * owner's records, proposes habits it derived as unconfirmed candidates, and
 * confirms or deletes what the Host already holds. Every method resolves the
 * same owner and workspace view a session in that project would see, so the two
 * clients act on one store rather than two.
 * @module @tomato/experimental-tool-memory/remote
 */

import type { Context } from '@tomato/cordis'
import { TypertRemoteService, Remote } from '@tomato/typert-protocol'
import type { MemoryScope, MemoryView } from '@tomato/experimental-memory'
import { MemoryId } from '@tomato/experimental-memory'
import { SessionId } from '@tomato/session'
import type { MemoryService } from '@tomato/experimental-memory'
import type {
  MemoryConfirmationValue, MemoryDeletionValue, MemoryListValue, MemoryProposalValue, MemoryProposeRequest,
  MemoryScopeRequest, MemoryTargetRequest, MemoryWireEntry, MemoryWireRecord,
} from './types.ts'
import { MAX_PROPOSED_ENTRIES, wireRecord } from './types.ts'
export type * from './types.ts'

/** Owner and workspace a call acts on, or the reason it cannot act. */
type Resolved = { readonly view: MemoryView } | { readonly code: 'sign_in_required' | 'account_loading' | 'session_not_found' }

/**
 * Memory records for one phone, acting on the same store the Host's own tools
 * write.
 */
export class MemoryRemote extends TypertRemoteService {
  static inject = ['memory', 'sessions']

  /**
   * @param ctx - Host context carrying the memory service.
   */
  constructor(ctx: Context) {
    super(ctx, 'memories')
  }

  /**
   * Enumerate the owner's records for one Session's project.
   * @param request - Session that scopes workspace records.
   * @returns the owner's records, or `signedIn: false` with `accountLoading` while the Host has not
   *   verified the account or when nobody is signed in.
   */
  @Remote('list')
  async list(request: MemoryScopeRequest): Promise<MemoryListValue> {
    const resolved = await this.resolve(request.sessionId)
    if ('code' in resolved) {
      return {
        signedIn: false,
        ...resolved.code === 'account_loading' ? { accountLoading: true } : {},
        records: [],
      }
    }
    return { signedIn: true, records: this.memory.list(resolved.view).map(wireRecord) }
  }

  /**
   * Store habits a phone derived, as unconfirmed candidates.
   *
   * A candidate is invisible to later turns until a person promotes it, either
   * here or with `/memory confirm` on the Host. The write is attributed to the
   * Session the phone was in, because every record names the write that
   * justified it and a phone has no turn of its own.
   * @param request - Session, and the candidates to store.
   * @returns the stored candidates, or the reason nothing was stored.
   * @throws {@link MemoryError} when an entry is malformed or the store is full.
   */
  @Remote('propose')
  async propose(request: MemoryProposeRequest): Promise<MemoryProposalValue> {
    if (request.entries.length > MAX_PROPOSED_ENTRIES) {
      throw new Error(`a proposal carries at most ${MAX_PROPOSED_ENTRIES} entries, got ${request.entries.length}`)
    }
    const resolved = await this.resolve(request.sessionId)
    if ('code' in resolved) return { written: [] }
    const { view } = resolved
    const written: MemoryWireRecord[] = []
    for (const entry of request.entries) {
      const scope = this.scopeOf(entry, view)
      const record = await this.memory.remember({
        owner: view.owner,
        scope,
        kind: entry.kind,
        entity: entry.entity,
        key: entry.key,
        value: entry.value,
        status: 'candidate',
        pinned: false,
        source: { sessionId: SessionId(request.sessionId) },
      })
      written.push(wireRecord(record))
    }
    return { written }
  }

  /**
   * Promote one candidate so later turns receive it.
   * @param request - Session and the record to promote.
   * @returns the promoted record, or the reason it was not promoted.
   */
  @Remote('confirm')
  async confirm(request: MemoryTargetRequest): Promise<MemoryConfirmationValue> {
    const resolved = await this.resolve(request.sessionId)
    if ('code' in resolved) return { code: resolved.code }
    const record = await this.memory.confirm(resolved.view, MemoryId(request.id))
    return record === undefined ? { code: 'not_found' } : { record: wireRecord(record) }
  }

  /**
   * Silence one candidate until another write states it again.
   * @param request - Session and the record to dismiss.
   * @returns the dismissed record, or the reason nothing was dismissed.
   */
  @Remote('dismiss')
  async dismiss(request: MemoryTargetRequest): Promise<MemoryConfirmationValue> {
    const resolved = await this.resolve(request.sessionId)
    if ('code' in resolved) return { code: resolved.code }
    const record = await this.memory.dismiss(resolved.view, MemoryId(request.id))
    return record === undefined ? { code: 'not_found' } : { record: wireRecord(record) }
  }

  /**
   * Delete one record, whichever state it is in.
   * @param request - Session and the record to delete.
   * @returns whether a record was removed.
   */
  @Remote('forget')
  async forget(request: MemoryTargetRequest): Promise<MemoryDeletionValue> {
    const resolved = await this.resolve(request.sessionId)
    if ('code' in resolved) return { deleted: false, code: resolved.code }
    const deleted = await this.memory.forget(resolved.view, MemoryId(request.id))
    return { deleted }
  }

  /** The memory service, read at each call so a remount is seen. */
  private get memory(): MemoryService {
    return this.ctx.memory
  }

  /**
   * Resolve the owner and project one Session addresses, without waking it.
   *
   * A live Session carries its own header; a closed one is read from the
   * persisted corpus, which the phone's page already accepts the cost of.
   * @param sessionId - Session named by the request.
   * @returns the view to act on, or why none exists.
   */
  private async resolve(sessionId: string): Promise<Resolved> {
    const live = this.ctx.sessions.get(SessionId(sessionId))
    const cwd = live?.header.cwd ?? await this.persistedCwd(sessionId)
    const access = cwd === undefined
      ? this.memory.accessProfile()
      : await this.memory.accessFor(cwd)
    if (access.kind === 'account-loading') return { code: 'account_loading' }
    if (access.kind === 'sign-in-required') return { code: 'sign_in_required' }
    return { view: access.view }
  }

  /** Read the project directory of a closed Session from the corpus. */
  private async persistedCwd(sessionId: string): Promise<string | undefined> {
    const query = this.ctx.get('sessionQuery')
    if (query === undefined) return undefined
    const records = await query.listSessions()
    return records.find(record => record.header.id === sessionId)?.header.cwd
  }

  /**
   * Build the stored scope of one proposed entry.
   *
   * A workspace entry needs the Session's project identity and canonical
   * directory, which only the resolved view carries.
   * @param entry - the candidate.
   * @param view - the resolved view.
   * @returns the scope to store.
   * @throws when a workspace entry has no project to belong to.
   */
  private scopeOf(entry: MemoryWireEntry, view: MemoryView): MemoryScope {
    if (entry.scope === 'profile') return { kind: 'profile' }
    const workspace = view.workspace
    if (workspace === undefined) {
      throw new Error('this Session has no project directory, so it can store only profile memories')
    }
    return { kind: 'workspace', workspaceId: workspace.id, path: workspace.path }
  }
}

export default MemoryRemote
