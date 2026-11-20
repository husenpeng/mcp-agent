/**
 * Local SQLite sidecar for memory retrieval. FTS5 indexes pre-tokenized record
 * and episode text so a search no longer scans the whole domain; the tables are
 * derived data and rebuild from the authoritative domains at any time. Vectors
 * live beside the text for the semantic stage that consumes them later.
 */
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { scopeProjectId } from './project.ts'
import { cosineSimilarity, episodeEmbeddingText, memoryEmbeddingText, memoryTokens } from './retrieval.ts'
import { bytesToVector, vectorToBytes } from './vector.ts'
import type { EpisodeRecord, MemoryRecord } from './storage.ts'
import type { EpisodeKind, MemoryKind, MemoryView } from './types.ts'

/** Format version of the sidecar schema; a mismatch rebuilds the file. */
export const INDEX_VERSION = 1

/** One queued embedding job. */
export interface EmbeddingJob {
  /** Queue sequence. */
  readonly seq: number
  /** Object family. */
  readonly target: 'record' | 'episode'
  /** Object identity. */
  readonly objectId: string
  /** Object update time the embedding must cover. */
  readonly contentUpdatedAt: number
}

/** Rank vector rows against one query vector, closest first. */
function rankNearest(
  rows: readonly { id: string; vector: Uint8Array; dimensions: number }[],
  query: Float32Array,
  limit: number,
): string[] {
  const scored = rows.flatMap((row) => {
    const vector = bytesToVector(row.vector, row.dimensions)
    if (vector === undefined || vector.length !== query.length) return []
    return [{ id: row.id, score: cosineSimilarity(query, vector) }]
  })
  scored.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
  return scored.slice(0, limit).map(entry => entry.id)
}

/** One record search against the sidecar. */
export interface RecordIndexSearch {
  /** Owner and optional project that bound the search. */
  readonly view: MemoryView
  /** Free text; an empty string lists the newest active records. */
  readonly text: string
  /** Additional wordings of the same query. */
  readonly alternatives?: readonly string[]
  /** Optional kind filter. */
  readonly kind?: MemoryKind
  /** Maximum ids returned. */
  readonly limit: number
}

/** One episode search against the sidecar. */
export interface EpisodeIndexSearch {
  /** Owner and project that bound the search. */
  readonly view: MemoryView
  /** Free text; an empty string lists the newest episodes. */
  readonly text: string
  /** Additional wordings of the same query. */
  readonly alternatives?: readonly string[]
  /** Episode kinds to include. */
  readonly kinds?: readonly EpisodeKind[]
  /** Epoch-millisecond lower bound on creation time. */
  readonly since?: number
  /** Epoch-millisecond upper bound on creation time. */
  readonly until?: number
  /** Maximum ids returned. */
  readonly limit: number
}

/** Sidecar schema: two content tables with FTS5 mirrors, a vector table, and metadata. */
const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
-- Host processes share one sidecar file; wait for a concurrent writer instead
-- of failing the whole memory service with SQLITE_BUSY on open.
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS outbox (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  object_id TEXT NOT NULL,
  content_updated_at INTEGER NOT NULL,
  next_at INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  UNIQUE(target, object_id)
) STRICT;
CREATE INDEX IF NOT EXISTS outbox_due ON outbox(next_at, seq);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  workspace_id TEXT,
  scope_kind TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  search_text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS records_scope ON records(owner, workspace_id, status, updated_at);
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(search_text, content='records', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
  INSERT INTO records_fts(rowid, search_text) VALUES (new.rowid, new.search_text);
END;
CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON records BEGIN
  INSERT INTO records_fts(records_fts, rowid, search_text) VALUES ('delete', old.rowid, old.search_text);
END;
CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON records BEGIN
  INSERT INTO records_fts(records_fts, rowid, search_text) VALUES ('delete', old.rowid, old.search_text);
  INSERT INTO records_fts(rowid, search_text) VALUES (new.rowid, new.search_text);
END;

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  search_text TEXT NOT NULL,
  created_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS episodes_scope ON episodes(owner, workspace_id, created_at);
CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(search_text, content='episodes', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS episodes_ai AFTER INSERT ON episodes BEGIN
  INSERT INTO episodes_fts(rowid, search_text) VALUES (new.rowid, new.search_text);
END;
CREATE TRIGGER IF NOT EXISTS episodes_ad AFTER DELETE ON episodes BEGIN
  INSERT INTO episodes_fts(episodes_fts, rowid, search_text) VALUES ('delete', old.rowid, old.search_text);
END;
CREATE TRIGGER IF NOT EXISTS episodes_au AFTER UPDATE ON episodes BEGIN
  INSERT INTO episodes_fts(episodes_fts, rowid, search_text) VALUES ('delete', old.rowid, old.search_text);
  INSERT INTO episodes_fts(rowid, search_text) VALUES (new.rowid, new.search_text);
END;

CREATE TABLE IF NOT EXISTS vectors (
  target TEXT NOT NULL,
  object_id TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  vector BLOB NOT NULL,
  content_updated_at INTEGER NOT NULL,
  PRIMARY KEY(target, object_id)
) STRICT;
`

/** Quote one token for an FTS5 MATCH expression. */
function ftsToken(token: string): string {
  return `"${token.replaceAll('"', '""')}"`
}

/** Distinct query tokens, literal wording first. */
function queryTokens(text: string, alternatives: readonly string[] = []): string[] {
  const tokens = new Set(memoryTokens(text))
  for (const alternative of alternatives) for (const token of memoryTokens(alternative)) tokens.add(token)
  return [...tokens]
}

/** Searchable text of one record: the same tokens the ranking stage compares. */
function recordSearchText(record: MemoryRecord): string {
  return memoryTokens(memoryEmbeddingText(record)).join(' ')
}

/** Searchable text of one episode: the same tokens the ranking stage compares. */
function episodeSearchText(episode: EpisodeRecord): string {
  return memoryTokens(episodeEmbeddingText(episode)).join(' ')
}

/**
 * Local FTS5 index over memory text. Every write mirrors one authoritative
 * record or episode; {@link rebuild} restores the file from both domains.
 */
export class MemoryIndex {
  private readonly db: DatabaseSync
  private readonly vecEnabled: boolean

  /**
   * Open or create one sidecar file.
   * @param path - SQLite file path; its parent directory is created on demand.
   * @param options - optional sqlite-vec extension path, without the platform suffix.
   */
  constructor(path: string, options: { readonly vecExtensionPath?: string } = {}) {
    mkdirSync(dirname(path), { recursive: true })
    const extension = options.vecExtensionPath
    this.db = new DatabaseSync(path, extension === undefined ? {} : { allowExtension: true })
    try {
      this.db.exec(SCHEMA)
      if (extension !== undefined) {
        this.db.enableLoadExtension(true)
        this.db.loadExtension(extension)
      }
    } catch (error) {
      this.db.close()
      throw error
    }
    this.vecEnabled = extension !== undefined
  }

  /** Close the file. */
  close(): void {
    this.db.close()
  }

  /** Read one metadata value. */
  private meta(key: string): string | undefined {
    const row = this.db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value?: string } | undefined
    return row?.value
  }

  /** Write one metadata value. */
  private setMeta(key: string, value: string): void {
    this.db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
  }

  /**
   * Whether the file is missing a schema version, a completed build, or is
   * marked stale. Row counts are deliberately not compared: Host processes
   * share the file while holding different domain snapshots, so a count
   * difference is the normal case and {@link rebuild} merges rather than drops.
   * @returns true when {@link rebuild} has to run.
   */
  needsRebuild(): boolean {
    return this.meta('version') !== String(INDEX_VERSION)
      || this.meta('built') !== '1'
      || this.meta('dirty') === '1'
  }

  /** Mark the file stale so the next open rebuilds it. */
  markDirty(): void {
    this.setMeta('dirty', '1')
  }

  /**
   * Merge the authoritative domains into the file. Every row is upserted and
   * none is dropped: another Host process may have published rows this process
   * never loaded, and a row without its record left is ignored by readers.
   * @param records - every record this process holds.
   * @param episodes - every episode this process holds.
   */
  rebuild(records: readonly MemoryRecord[], episodes: readonly EpisodeRecord[]): void {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      for (const record of records) this.putRecord(record)
      for (const episode of episodes) this.putEpisode(episode)
      this.setMeta('version', String(INDEX_VERSION))
      this.setMeta('built', '1')
      this.setMeta('dirty', '0')
      this.db.exec('COMMIT')
    } catch (error) {
      /* v8 ignore start -- a failed rebuild needs medium fault injection; the service falls back to the in-memory scan. */
      this.db.exec('ROLLBACK')
      throw error
      /* v8 ignore stop */
    }
  }

  /**
   * Mirror one authoritative record into the index.
   * @param record - the stored record.
   */
  putRecord(record: MemoryRecord): void {
    this.db.prepare(`
      INSERT INTO records (id, owner, workspace_id, scope_kind, kind, status, search_text, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        owner = excluded.owner, workspace_id = excluded.workspace_id, scope_kind = excluded.scope_kind,
        kind = excluded.kind, status = excluded.status, search_text = excluded.search_text,
        updated_at = excluded.updated_at
    `).run(
      record.id,
      record.owner,
      record.scope.kind === 'workspace' ? scopeProjectId(record.scope) : null,
      record.scope.kind,
      record.kind,
      record.status,
      recordSearchText(record),
      record.updatedAt,
    )
    this.enqueue('record', record.id, record.updatedAt)
  }

  /**
   * Remove one record from the index.
   * @param id - stored record identity.
   */
  deleteRecord(id: string): void {
    this.db.prepare('DELETE FROM records WHERE id = ?').run(id)
    this.db.prepare('DELETE FROM outbox WHERE target = ? AND object_id = ?').run('record', id)
    this.db.prepare('DELETE FROM vectors WHERE target = ? AND object_id = ?').run('record', id)
  }

  /**
   * Mirror one authoritative episode into the index.
   * @param episode - the stored episode.
   */
  putEpisode(episode: EpisodeRecord): void {
    this.db.prepare(`
      INSERT INTO episodes (id, owner, workspace_id, kind, search_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        owner = excluded.owner, workspace_id = excluded.workspace_id, kind = excluded.kind,
        search_text = excluded.search_text, created_at = excluded.created_at
    `).run(
      episode.id,
      episode.owner,
      scopeProjectId(episode.scope),
      episode.kind,
      episodeSearchText(episode),
      episode.createdAt,
    )
    this.enqueue('episode', episode.id, episode.updatedAt)
  }

  /**
   * Remove one episode from the index.
   * @param id - stored episode identity.
   */
  deleteEpisode(id: string): void {
    this.db.prepare('DELETE FROM episodes WHERE id = ?').run(id)
    this.db.prepare('DELETE FROM outbox WHERE target = ? AND object_id = ?').run('episode', id)
    this.db.prepare('DELETE FROM vectors WHERE target = ? AND object_id = ?').run('episode', id)
  }

  /** Queue one object for embedding, resetting its retry state. */
  private enqueue(target: 'record' | 'episode', id: string, contentUpdatedAt: number): void {
    this.db.prepare(`
      INSERT INTO outbox (target, object_id, content_updated_at, next_at, attempts)
      VALUES (?, ?, ?, 0, 0)
      ON CONFLICT(target, object_id) DO UPDATE SET
        content_updated_at = excluded.content_updated_at, next_at = 0, attempts = 0
    `).run(target, id, contentUpdatedAt)
  }

  /**
   * Read a cached vector for a current object.
   * @param target - record or episode.
   * @param id - object identity.
   * @param model - provider model identity.
   * @param contentUpdatedAt - object update time the vector was computed from.
   * @returns the vector, or `undefined` when absent or stale.
   */
  getVector(target: 'record' | 'episode', id: string, model: string, contentUpdatedAt: number): Float32Array | undefined {
    const row = this.db.prepare(
      'SELECT model, dimensions, vector, content_updated_at FROM vectors WHERE target = ? AND object_id = ?',
    ).get(target, id) as { model: string; dimensions: number; vector: Uint8Array; content_updated_at: number } | undefined
    if (row === undefined || row.model !== model || row.content_updated_at !== contentUpdatedAt) return undefined
    return bytesToVector(row.vector, row.dimensions)
  }

  /**
   * Store one vector for a current object.
   * @param target - record or episode.
   * @param id - object identity.
   * @param model - provider model identity.
   * @param dimensions - vector length.
   * @param vector - the vector.
   * @param contentUpdatedAt - object update time the vector was computed from.
   */
  putVector(
    target: 'record' | 'episode',
    id: string,
    model: string,
    dimensions: number,
    vector: Float32Array,
    contentUpdatedAt: number,
  ): void {
    this.db.prepare(`
      INSERT INTO vectors (target, object_id, model, dimensions, vector, content_updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(target, object_id) DO UPDATE SET
        model = excluded.model, dimensions = excluded.dimensions, vector = excluded.vector,
        content_updated_at = excluded.content_updated_at
    `).run(target, id, model, dimensions, vectorToBytes(vector), contentUpdatedAt)
  }

  /**
   * Remove one vector and its identity's outbox row.
   * @param target - record or episode.
   * @param id - object identity.
   */
  deleteVector(target: 'record' | 'episode', id: string): void {
    this.db.prepare('DELETE FROM vectors WHERE target = ? AND object_id = ?').run(target, id)
  }

  /**
   * Number of stored vectors.
   * @returns how many vectors the store holds.
   */
  vectorCount(): number {
    return (this.db.prepare('SELECT COUNT(*) AS count FROM vectors').get() as { count: number }).count
  }

  /**
   * Number of queued embedding jobs.
   * @returns how many rows the outbox holds.
   */
  outboxCount(): number {
    return (this.db.prepare('SELECT COUNT(*) AS count FROM outbox').get() as { count: number }).count
  }

  /**
   * Read due embedding jobs.
   * @param now - current epoch milliseconds.
   * @param limit - maximum jobs returned.
   * @returns jobs in queue order.
   */
  pendingEmbeddings(now: number, limit: number): EmbeddingJob[] {
    const rows = this.db.prepare(
      'SELECT seq, target, object_id, content_updated_at FROM outbox WHERE next_at <= ? ORDER BY seq LIMIT ?',
    ).all(now, limit) as { seq: number; target: 'record' | 'episode'; object_id: string; content_updated_at: number }[]
    return rows.map(row => ({
      seq: row.seq, target: row.target, objectId: row.object_id, contentUpdatedAt: row.content_updated_at,
    }))
  }

  /**
   * Remove one completed job.
   * @param seq - job sequence.
   */
  completeEmbedding(seq: number): void {
    this.db.prepare('DELETE FROM outbox WHERE seq = ?').run(seq)
  }

  /**
   * Delay failed jobs with a bounded attempt count.
   * @param seqs - job sequences to delay.
   * @param nextAt - epoch milliseconds they become due again.
   */
  retryEmbeddings(seqs: readonly number[], nextAt: number): void {
    const statement = this.db.prepare('UPDATE outbox SET next_at = ?, attempts = attempts + 1 WHERE seq = ?')
    for (const seq of seqs) statement.run(nextAt, seq)
  }

  /**
   * Align the stored vectors with a provider model. A changed model drops every
   * vector and queues every current object again.
   * @param model - the mounted provider's model identity.
   * @returns whether a rebuild of the vectors was queued.
   */
  syncEmbeddingModel(model: string): boolean {
    if (this.meta('embedModel') === model) return false
    this.db.exec('DELETE FROM vectors; DELETE FROM outbox;')
    this.enqueueAll()
    this.setMeta('embedModel', model)
    return true
  }

  /** Queue every current object for embedding. */
  private enqueueAll(): void {
    this.db.exec(`
      INSERT OR IGNORE INTO outbox (target, object_id, content_updated_at, next_at, attempts)
        SELECT 'record', id, updated_at, 0, 0 FROM records;
      INSERT OR IGNORE INTO outbox (target, object_id, content_updated_at, next_at, attempts)
        SELECT 'episode', id, created_at, 0, 0 FROM episodes;
    `)
  }

  /** Queue every current object that has no vector yet. */
  ensureEmbeddings(): void {
    this.db.exec(`
      INSERT OR IGNORE INTO outbox (target, object_id, content_updated_at, next_at, attempts)
        SELECT 'record', r.id, r.updated_at, 0, 0 FROM records r
        LEFT JOIN vectors v ON v.target = 'record' AND v.object_id = r.id
        WHERE v.object_id IS NULL;
      INSERT OR IGNORE INTO outbox (target, object_id, content_updated_at, next_at, attempts)
        SELECT 'episode', e.id, e.created_at, 0, 0 FROM episodes e
        LEFT JOIN vectors v ON v.target = 'episode' AND v.object_id = e.id
        WHERE v.object_id IS NULL;
    `)
  }

  /**
   * Rank current records by cosine similarity to one query vector.
   * @param view - owner and optional project.
   * @param query - query vector.
   * @param limit - maximum ids returned.
   * @param model - provider model identity.
   * @returns record ids, closest first.
   */
  nearestRecordIds(view: MemoryView, query: Float32Array, limit: number, model: string): string[] {
    const workspaceId = view.workspace?.id ?? null
    const scope = workspaceId === null
      ? "r.scope_kind = 'profile'"
      : "(r.scope_kind = 'profile' OR r.workspace_id = ?)"
    const params: string[] = [model, view.owner]
    if (workspaceId !== null) params.push(workspaceId)
    /* v8 ignore start -- the native accelerator needs the packaged sqlite-vec binary; tests cover the fallback. */
    if (this.vecEnabled) {
      const queryBytes = Buffer.from(query.buffer, query.byteOffset, query.byteLength)
      const rows = this.db.prepare(`
        SELECT v.object_id AS id FROM vectors v
        JOIN records r ON r.id = v.object_id
        WHERE v.target = 'record' AND v.model = ? AND r.owner = ? AND r.status = 'active'
          AND v.dimensions = ? AND ${scope}
        ORDER BY vec_distance_cosine(v.vector, ?) LIMIT ?
      `).all(...params.slice(0, 2), query.length, ...params.slice(2), queryBytes, limit) as { id: string }[]
      return rows.map(row => row.id)
    }
    /* v8 ignore stop */
    const rows = this.db.prepare(`
      SELECT v.object_id AS id, v.vector, v.dimensions FROM vectors v
      JOIN records r ON r.id = v.object_id
      WHERE v.target = 'record' AND v.model = ? AND r.owner = ? AND r.status = 'active' AND ${scope}
    `).all(...params) as { id: string; vector: Uint8Array; dimensions: number }[]
    return rankNearest(rows, query, limit)
  }

  /**
   * Rank episodes by cosine similarity to one query vector.
   * @param view - owner and project.
   * @param query - query vector.
   * @param limit - maximum ids returned.
   * @param model - provider model identity.
   * @returns episode ids, closest first; empty without a project view.
   */
  nearestEpisodeIds(view: MemoryView, query: Float32Array, limit: number, model: string): string[] {
    const workspaceId = view.workspace?.id
    if (workspaceId === undefined) return []
    /* v8 ignore start -- the native accelerator needs the packaged sqlite-vec binary; tests cover the fallback. */
    if (this.vecEnabled) {
      const queryBytes = Buffer.from(query.buffer, query.byteOffset, query.byteLength)
      const rows = this.db.prepare(`
        SELECT v.object_id AS id FROM vectors v
        JOIN episodes e ON e.id = v.object_id
        WHERE v.target = 'episode' AND v.model = ? AND e.owner = ? AND e.workspace_id = ?
          AND v.dimensions = ?
        ORDER BY vec_distance_cosine(v.vector, ?) LIMIT ?
      `).all(model, view.owner, workspaceId, query.length, queryBytes, limit) as { id: string }[]
      return rows.map(row => row.id)
    }
    /* v8 ignore stop */
    const rows = this.db.prepare(`
      SELECT v.object_id AS id, v.vector, v.dimensions FROM vectors v
      JOIN episodes e ON e.id = v.object_id
      WHERE v.target = 'episode' AND v.model = ? AND e.owner = ? AND e.workspace_id = ?
    `).all(model, view.owner, workspaceId) as { id: string; vector: Uint8Array; dimensions: number }[]
    return rankNearest(rows, query, limit)
  }

  /**
   * Find active records matching any query token, ordered by FTS5 relevance.
   * @param search - view, text, alternative wordings, kind filter, and limit.
   * @returns record ids, best match first.
   */
  searchRecordIds(search: RecordIndexSearch): string[] {
    const workspaceId = search.view.workspace?.id ?? null
    const scope = workspaceId === null
      ? "r.scope_kind = 'profile'"
      : "(r.scope_kind = 'profile' OR r.workspace_id = ?)"
    const scopeParams: string[] = workspaceId === null ? [] : [workspaceId]
    const kind = search.kind ?? null
    const tokens = queryTokens(search.text, search.alternatives)
    if (tokens.length === 0) {
      const rows = this.db.prepare(`
        SELECT r.id FROM records r
        WHERE r.owner = ? AND r.status = 'active' AND ${scope} AND (? IS NULL OR r.kind = ?)
        ORDER BY r.updated_at DESC, r.id LIMIT ?
      `).all(search.view.owner, ...scopeParams, kind, kind, search.limit) as { id: string }[]
      return rows.map(row => row.id)
    }
    const rows = this.db.prepare(`
      SELECT r.id FROM records_fts JOIN records r ON r.rowid = records_fts.rowid
      WHERE records_fts MATCH ? AND r.owner = ? AND r.status = 'active'
        AND ${scope} AND (? IS NULL OR r.kind = ?)
      ORDER BY bm25(records_fts), r.updated_at DESC, r.id LIMIT ?
    `).all(tokens.map(ftsToken).join(' OR '), search.view.owner, ...scopeParams, kind, kind, search.limit) as { id: string }[]
    return rows.map(row => row.id)
  }

  /**
   * Find episodes matching any query token, ordered by FTS5 relevance.
   * @param search - view, text, alternative wordings, kind/time filters, and limit.
   * @returns episode ids, best match first; empty without a project view.
   */
  searchEpisodeIds(search: EpisodeIndexSearch): string[] {
    const workspaceId = search.view.workspace?.id
    if (workspaceId === undefined) return []
    const kinds = search.kinds === undefined || search.kinds.length === 0 ? [] : [...search.kinds]
    const kindClause = kinds.length === 0 ? '' : ` AND e.kind IN (${kinds.map(() => '?').join(', ')})`
    const kindParams = kinds
    const timeClause = `${search.since === undefined ? '' : ' AND e.created_at >= ?'}${search.until === undefined ? '' : ' AND e.created_at <= ?'}`
    const timeParams: number[] = []
    if (search.since !== undefined) timeParams.push(search.since)
    if (search.until !== undefined) timeParams.push(search.until)
    const tokens = queryTokens(search.text, search.alternatives)
    const limit = search.limit
    if (tokens.length === 0) {
      const rows = this.db.prepare(`
        SELECT e.id FROM episodes e
        WHERE e.owner = ? AND e.workspace_id = ?${kindClause}${timeClause}
        ORDER BY e.created_at DESC, e.id LIMIT ?
      `).all(search.view.owner, workspaceId, ...kindParams, ...timeParams, limit) as { id: string }[]
      return rows.map(row => row.id)
    }
    const rows = this.db.prepare(`
      SELECT e.id FROM episodes_fts JOIN episodes e ON e.rowid = episodes_fts.rowid
      WHERE episodes_fts MATCH ? AND e.owner = ? AND e.workspace_id = ?${kindClause}${timeClause}
      ORDER BY bm25(episodes_fts), e.created_at DESC, e.id LIMIT ?
    `).all(tokens.map(ftsToken).join(' OR '), search.view.owner, workspaceId, ...kindParams, ...timeParams, limit) as { id: string }[]
    return rows.map(row => row.id)
  }
}
