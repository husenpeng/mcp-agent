/**
 * Pure flowchart geometry and graph legality for the crew canvas. No React, no
 * transport: the component owns state, this module owns the math.
 * @module @tomato/client-ui-robot-crew
 */

import type { CrewEdge, CrewNode, CrewNodeProgress, CrewRun } from '@tomato/experimental-robot-crew'

/** Rendered node width in canvas pixels. */
export const NODE_WIDTH = 176

/** Rendered node height in canvas pixels. */
export const NODE_HEIGHT = 104

/** Horizontal distance between auto-laid-out columns. */
const COLUMN_GAP = 64

/** Vertical distance between auto-laid-out rows. */
const ROW_GAP = 56

/** Left inset of the first auto-laid-out column. */
const ORIGIN_X = 16

/** Top inset of the first auto-laid-out row. */
const ORIGIN_Y = 64

/**
 * Build one new member with the recommended defaults and a free id.
 * @param nodes - current members.
 * @param label - localized display name.
 * @returns the member to append.
 */
export function createDraftNode(nodes: readonly CrewNode[], label: string): CrewNode {
  const index = nodes.length
  return {
    id: nextNodeId(nodes),
    label,
    role: '',
    instruction: '',
    kind: 'worker',
    maxTurns: 1,
    budgetTokens: 60_000,
    at: { x: ORIGIN_X + (index % 3) * (NODE_WIDTH + COLUMN_GAP), y: ORIGIN_Y + Math.floor(index / 3) * (NODE_HEIGHT + ROW_GAP) },
  }
}

/** One node's canvas coordinates. */
export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * Resolve the coordinates a node renders at: its stored position, otherwise an
 * auto-laid-out grid slot by index.
 * @param node - node whose coordinates to resolve.
 * @param index - position of the node in the specification.
 * @returns the canvas coordinates.
 */
export function positionOf(node: CrewNode, index: number): Point {
  if (node.at !== undefined) return node.at
  const column = index % 3
  const row = Math.floor(index / 3)
  return { x: ORIGIN_X + column * (NODE_WIDTH + COLUMN_GAP), y: ORIGIN_Y + row * (NODE_HEIGHT + ROW_GAP) }
}

/**
 * Lay every node out on a three-column grid, ignoring stored positions.
 * @param nodes - nodes to place.
 * @returns one position per node in specification order.
 */
export function autoLayout(nodes: readonly CrewNode[]): readonly Point[] {
  return nodes.map((_, index) => ({
    x: ORIGIN_X + (index % 3) * (NODE_WIDTH + COLUMN_GAP),
    y: ORIGIN_Y + Math.floor(index / 3) * (NODE_HEIGHT + ROW_GAP),
  }))
}

/**
 * Cubic path from one node's right edge to another node's left edge.
 * @param from - source position.
 * @param to - target position.
 * @returns the SVG `d` attribute.
 */
export function edgePath(from: Point, to: Point): string {
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2
  const bend = Math.max(48, Math.min(180, Math.abs(x2 - x1) / 2))
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
}

/**
 * Midpoint of an edge's cubic curve, used to anchor its delete affordance.
 * @param from - source position.
 * @param to - target position.
 * @returns the curve midpoint.
 */
export function edgeMidpoint(from: Point, to: Point): Point {
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
}

/**
 * Whether adding one edge would close a cycle, found by walking backward from
 * the prospective source to the target.
 * @param edges - existing edges.
 * @param from - prospective source.
 * @param to - prospective target.
 * @returns whether the edge is illegal.
 */
export function createsCycle(edges: readonly CrewEdge[], from: string, to: string): boolean {
  if (from === to) return true
  const incoming = new Map<string, string[]>()
  for (const edge of edges) {
    const list = incoming.get(edge.to) ?? []
    list.push(edge.from)
    incoming.set(edge.to, list)
  }
  const seen = new Set<string>()
  const stack = [from]
  while (stack.length > 0) {
    const current = stack.pop() as string
    if (current === to) return true
    if (seen.has(current)) continue
    seen.add(current)
    stack.push(...incoming.get(current) ?? [])
  }
  return false
}

/**
 * Whether an identical directed edge already exists.
 * @param edges - existing edges.
 * @param from - prospective source.
 * @param to - prospective target.
 * @returns whether the edge is a duplicate.
 */
export function duplicateEdge(edges: readonly CrewEdge[], from: string, to: string): boolean {
  return edges.some(edge => edge.from === from && edge.to === to)
}

/**
 * Progress of one node in the displayed run.
 * @param run - selected run, when one is displayed.
 * @param id - node id.
 * @returns the node progress, or undefined while no run covers it.
 */
export function progressOf(run: CrewRun | undefined, id: string): CrewNodeProgress | undefined {
  return run?.nodes.find(node => node.id === id)
}

/**
 * The next free node id for an added member.
 * @param nodes - current nodes.
 * @returns a slug that is not taken.
 */
export function nextNodeId(nodes: readonly CrewNode[]): string {
  const taken = new Set(nodes.map(node => node.id))
  for (let index = nodes.length + 1; ; index += 1) {
    const id = `step-${index}`
    if (!taken.has(id)) return id
  }
}
