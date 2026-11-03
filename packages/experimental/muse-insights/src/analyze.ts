/**
 * Pure unfinished-task derivation: merge Session todo lists with the open
 * tasks a daily recap stated, deduplicate equivalent wording, and order by
 * urgency.
 * @module @tomato/experimental-muse-insights/analyze
 */

import { createHash } from 'node:crypto'
import type { CollectedTodo } from './collect.ts'
import type { UnfinishedTask, UnfinishedTaskSource, UnfinishedTaskStatus } from './types.ts'

/** One task candidate before deduplication. */
interface TaskCandidate {
  readonly title: string
  readonly detail: string
  readonly status: UnfinishedTaskStatus
  readonly source: UnfinishedTaskSource
  readonly sessionId: string | null
  readonly sessionTitle: string | null
}

/** Inputs to one analysis run. */
export interface UnfinishedInput {
  /** Pending and in-progress items read from Session todo lists. */
  readonly todos: readonly CollectedTodo[]
  /** Concrete open tasks the latest daily recap stated. */
  readonly recapTasks: readonly string[]
  /** Maximum tasks the analysis retains. */
  readonly maxTasks: number
}

/**
 * Merge, deduplicate, and order unfinished tasks.
 * @param input - todo items, recap tasks, and the retention bound.
 * @returns at most `maxTasks` tasks, `in_progress` and todo-sourced entries first.
 */
export function buildUnfinishedTasks(input: UnfinishedInput): UnfinishedTask[] {
  const completed = new Set<string>()
  for (const todo of input.todos) {
    if (todo.status === 'completed') completed.add(taskTextKey(todo.content))
  }
  const byText = new Map<string, TaskCandidate>()
  for (const todo of input.todos) {
    if (todo.status === 'completed') continue
    const title = clean(todo.content)
    if (title === '') continue
    offer(byText, {
      title,
      detail: '',
      status: todo.status,
      source: 'todo',
      sessionId: todo.sessionId,
      sessionTitle: todo.sessionTitle,
    })
  }
  for (const text of input.recapTasks) {
    const title = clean(text)
    if (title === '' || completed.has(taskTextKey(title))) continue
    offer(byText, {
      title,
      detail: '',
      status: 'pending',
      source: 'recap',
      sessionId: null,
      sessionTitle: null,
    })
  }
  return [...byText.entries()]
    .map(([key, candidate]) => toTask(key, candidate))
    .sort(compareTasks)
    .slice(0, input.maxTasks)
}

/**
 * Canonical text used for deduplication and identity: trimmed, whitespace-collapsed, and case-folded.
 * @param text - task wording from a todo list or recap.
 * @returns the comparison key.
 */
export function taskTextKey(text: string): string {
  return text.trim().replaceAll(/\s+/gu, ' ').toLocaleLowerCase()
}

/** Whitespace-normalized task text as shown. */
function clean(text: string): string {
  return text.trim().replaceAll(/\s+/gu, ' ')
}

/**
 * Keep the stronger candidate when two entries name the same task.
 * A todo item beats recap wording, and an active item beats a pending one.
 * @param candidates - candidates keyed by {@link taskTextKey}.
 * @param next - candidate to consider.
 */
function offer(candidates: Map<string, TaskCandidate>, next: TaskCandidate): void {
  const key = taskTextKey(next.title)
  if (key === '') return
  const previous = candidates.get(key)
  if (previous === undefined || score(next) > score(previous)) candidates.set(key, next)
}

/** Higher wins: an in-progress todo outranks a pending one, and a todo outranks recap wording. */
function score(candidate: TaskCandidate): number {
  return (candidate.status === 'in_progress' ? 2 : 0) + (candidate.source === 'todo' ? 1 : 0)
}

/** Cap one stored text field at its schema limit. */
function clamp(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

/** Stable task identity: digest of source, owning Session, and canonical wording. */
function toTask(key: string, candidate: TaskCandidate): UnfinishedTask {
  return {
    id: createHash('sha256').update(`${candidate.source}\u0000${candidate.sessionId ?? ''}\u0000${key}`).digest('hex').slice(0, 16),
    title: clamp(candidate.title, 500),
    detail: clamp(candidate.detail, 1_000),
    status: candidate.status,
    source: candidate.source,
    sessionId: candidate.sessionId,
    sessionTitle: candidate.sessionTitle === null ? null : clamp(candidate.sessionTitle, 500),
  }
}

/** In-progress first, then todo-sourced, then stable wording. */
function compareTasks(left: UnfinishedTask, right: UnfinishedTask): number {
  return (left.status === 'in_progress' ? 0 : 1) - (right.status === 'in_progress' ? 0 : 1)
    || (left.source === 'todo' ? 0 : 1) - (right.source === 'todo' ? 0 : 1)
    || left.title.localeCompare(right.title)
}
