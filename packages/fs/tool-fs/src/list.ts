/**
 * Model-facing `list_dir`: a cheap directory view with bounded depth, a
 * default hidden/ignored-name filter, and a hard entry cap. It exists so a
 * model can answer "what is in this directory" without a broad glob.
 * @module @tomato/tool-fs/src/list
 */

import type { Context } from '@tomato/cordis'
import { FsError } from '@tomato/fs'
import type { FsDirEntry, FsTarget } from '@tomato/fs'
import { defineTool } from '@tomato/tools'
import type { GenericCallView } from '@tomato/tools'
import { sessionResolveOptions } from './session-cwd.ts'

/** Resolved `list_dir` caps — plugin config after defaulting. */
export interface ListToolCaps {
  /** Directory levels returned when the call names no depth. */
  depth: number
  /** Largest depth one call may request. */
  maxDepth: number
  /** Most entries retained inline by one call. */
  maxEntries: number
  /** Basenames skipped by default; a call may add more. */
  excludes: readonly string[]
}

/** Validated `list_dir` arguments. */
export interface ListInput {
  readonly path: string
  readonly depth: number
  readonly all: boolean
  readonly exclude: readonly string[]
  readonly limit: number
}

/** One child in the rendered listing. */
export interface ListEntry {
  /** Path relative to the listed root, with `/` separators. */
  readonly path: string
  /** Child type. */
  readonly type: 'file' | 'directory' | 'other'
  /** Byte size of a regular file. */
  readonly size?: number
}

/** Result of one `list_dir` call. */
export interface ListResult {
  /** Canonical root path. */
  readonly root: string
  /** Entries in depth-first, name order. */
  readonly entries: readonly ListEntry[]
  /** Whether the entry cap or depth cut the listing. */
  readonly truncated: boolean
}

/** Turn one glob-like name pattern into a RegExp; `*` matches any run, everything else is literal. */
function namePattern(pattern: string): RegExp {
  const escaped = pattern.replaceAll(/[.+^${}()|[\]\\]/gu, '\\$&').replaceAll('*', '.*')
  return new RegExp(`^${escaped}$`, 'u')
}

/**
 * Validate `list_dir` arguments against the deployment limits.
 * @param args - schema-validated arguments.
 * @param caps - resolved caps.
 * @returns the validated input with defaults applied.
 * @throws Error when a bound is invalid.
 */
export function parseListArgs(args: {
  path?: string
  depth?: number
  all?: boolean
  exclude?: readonly string[]
  limit?: number
}, caps: ListToolCaps): ListInput {
  const path = args.path?.trim() ?? '.'
  if (path === '') throw new Error('path must not be empty')
  const depth = args.depth ?? caps.depth
  if (!Number.isInteger(depth) || depth < 1 || depth > caps.maxDepth) {
    throw new Error(`depth must be an integer from 1 to ${caps.maxDepth}`)
  }
  const limit = args.limit ?? caps.maxEntries
  if (!Number.isInteger(limit) || limit < 1 || limit > caps.maxEntries) {
    throw new Error(`limit must be an integer from 1 to ${caps.maxEntries}`)
  }
  const exclude = [...args.exclude ?? []]
  if (exclude.some(value => value.trim() === '')) throw new Error('exclude entries must not be empty')
  return { path, depth, all: args.all === true, exclude, limit }
}

/**
 * Whether one child name is filtered out of the listing.
 * @param name - child basename.
 * @param input - validated arguments.
 * @param caps - resolved caps.
 * @returns true when the entry or its subtree must be skipped.
 */
export function excludedName(name: string, input: ListInput, caps: ListToolCaps): boolean {
  if (!input.all && name.startsWith('.')) return true
  return [...caps.excludes, ...input.exclude].some(pattern => namePattern(pattern).test(name))
}

/**
 * Render a listing as one model-facing block.
 * @param result - listed entries and their root.
 * @returns the root line followed by one indented entry per line.
 */
export function formatListOutput(result: ListResult): string {
  const lines = [`<path>${result.root}</path>`, '<type>directory</type>', '<entries>']
  for (const entry of result.entries) {
    const suffix = entry.type === 'directory' ? '/' : entry.size === undefined ? '' : ` (${entry.size} bytes)`
    lines.push(`${entry.path}${suffix}`)
  }
  if (result.truncated) lines.push('… listing truncated; narrow depth, path, or exclude to see more.')
  lines.push('</entries>')
  return lines.join('\n')
}

/**
 * Register `list_dir` and its prompt guidance.
 * @param ctx - plugin context supplying filesystem, tools, prompt, and working directory.
 * @param caps - resolved caps.
 */
export function applyListTool(ctx: Context, caps: ListToolCaps): void {
  ctx.systemPrompt.section({
    name: 'tool:list-dir',
    order: ctx.systemPrompt.getSectionOrder('TOOL_GLOB'),
    text: ({ scope }) => ctx.tools.get('list_dir', scope) === undefined
      ? ''
      : 'Use list_dir to see what a directory contains before searching. Prefer a shallow depth with excludes over a broad glob; glob returns file paths, not directories.',
  })

  ctx.tools.register(defineTool({
    name: 'list_dir',
    description: 'List a directory tree to answer "what is here" before searching. '
      + `Returns at most ${caps.maxEntries} entries by default, skips hidden names and common build directories unless all is set, and stops at the requested depth.`,
    parameters: {
      path: { type: 'string', description: 'Directory to list. Defaults to the session workspace.' },
      depth: { type: 'number', description: `Levels to show, from 1 to ${caps.maxDepth}. Defaults to ${caps.depth}.` },
      all: { type: 'boolean', description: 'Include hidden names and dot directories. Defaults to false.' },
      exclude: {
        type: 'array',
        items: { type: 'string' },
        description: 'Extra basenames or simple globs to skip, for example "dist" or "*.snap".',
      },
      limit: { type: 'number', description: `Maximum entries returned, from 1 to ${caps.maxEntries}.` },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          root: { type: 'string', required: true },
          entries: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                path: { type: 'string', required: true },
                type: { type: 'string', required: true, enum: ['file', 'directory', 'other'] },
                size: { type: 'number' },
              },
            },
          },
          truncated: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: formatListOutput(value) }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const input = parseListArgs(args, caps)
      const target = await ctx.fs.resolve(input.path, await sessionResolveOptions(ctx, exec))
      const info = await ctx.fs.stat(target, exec.signal)
      if (info === undefined) throw new FsError(`cannot list "${target.displayPath}": not found`, 'FS_NOT_FOUND')
      if (info.type !== 'directory') throw new FsError(`cannot list "${target.displayPath}": not a directory`, 'FS_NOT_DIRECTORY')
      const entries: ListEntry[] = []
      let truncated = false
      const walk = async (directory: FsTarget, prefix: string, remaining: number): Promise<void> => {
        const children: readonly FsDirEntry[] = await ctx.fs.listDir(directory, exec.signal)
        for (const child of children) {
          if (excludedName(child.name, input, caps)) continue
          if (entries.length >= input.limit) {
            truncated = true
            return
          }
          const path = prefix === '' ? child.name : `${prefix}/${child.name}`
          entries.push({
            path,
            type: child.type === 'directory' ? 'directory' : child.type === 'file' ? 'file' : 'other',
            ...child.size === undefined ? {} : { size: child.size },
          })
          if (child.type === 'directory' && remaining > 1) await walk(child.target, path, remaining - 1)
        }
      }
      await walk(target, '', input.depth)
      return { root: ctx.fs.processPath(target), entries, truncated }
    },
    presentCall(args): GenericCallView {
      return {
        card: 'generic',
        title: `List ${args.path ?? '.'}`,
        kind: 'read',
        locations: [{ path: args.path ?? '.' }],
      }
    },
  }))
}
