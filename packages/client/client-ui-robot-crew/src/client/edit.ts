/**
 * Pure draft edits of the crew studio: each patch returns a new frozen-safe
 * specification and deletes optional fields explicitly cleared by the editor.
 * @module @tomato/client-ui-robot-crew
 */

import type { CrewEdge, CrewNode, CrewSpec } from '@tomato/experimental-robot-crew'
import type { CrewPatch, EdgePatch, NodePatch } from './types.ts'

/** Mutable view of one immutable value. */
type Mutable<T> = { -readonly [K in keyof T]: T[K] }

/**
 * Apply one crew-level patch.
 * @param spec - current specification.
 * @param patch - fields to replace; `undefined` clears an optional field.
 * @returns a new specification.
 */
export function applyCrewPatch(spec: CrewSpec, patch: CrewPatch): CrewSpec {
  const next = structuredClone(spec) as Mutable<CrewSpec>
  if (patch.name !== undefined) next.name = patch.name
  if ('description' in patch) {
    if (patch.description === undefined) delete next.description
    else next.description = patch.description
  }
  if (patch.mission !== undefined) next.mission = patch.mission
  if (patch.successCriteria !== undefined) next.successCriteria = patch.successCriteria
  if (patch.stopConditions !== undefined) next.stopConditions = patch.stopConditions
  if (patch.nodes !== undefined) next.nodes = patch.nodes
  if (patch.edges !== undefined) next.edges = patch.edges
  if (patch.memory !== undefined) next.memory = patch.memory
  if (patch.guard !== undefined) next.guard = patch.guard
  if (patch.a2a !== undefined) next.a2a = patch.a2a
  if (patch.input !== undefined) next.input = patch.input
  if ('workspaceRoot' in patch) {
    if (patch.workspaceRoot === undefined) delete next.workspaceRoot
    else next.workspaceRoot = patch.workspaceRoot
  }
  return next
}

/**
 * Apply one member patch.
 * @param node - current member.
 * @param patch - fields to replace; `undefined` clears the optional robot binding or position.
 * @returns a new member.
 */
export function applyNodePatch(node: CrewNode, patch: NodePatch): CrewNode {
  const next = structuredClone(node) as Mutable<CrewNode>
  if (patch.label !== undefined) next.label = patch.label
  if (patch.role !== undefined) next.role = patch.role
  if (patch.instruction !== undefined) next.instruction = patch.instruction
  if (patch.kind !== undefined) next.kind = patch.kind
  if (patch.maxTurns !== undefined) next.maxTurns = patch.maxTurns
  if (patch.budgetTokens !== undefined) next.budgetTokens = patch.budgetTokens
  if ('robot' in patch) {
    if (patch.robot === undefined) delete next.robot
    else next.robot = patch.robot
  }
  if ('at' in patch) {
    if (patch.at === undefined) delete next.at
    else next.at = patch.at
  }
  return next
}

/**
 * Apply one handoff patch.
 * @param edge - current handoff.
 * @param patch - fields to replace.
 * @returns a new handoff.
 */
export function applyEdgePatch(edge: CrewEdge, patch: EdgePatch): CrewEdge {
  const next = structuredClone(edge) as Mutable<CrewEdge>
  if (patch.from !== undefined) next.from = patch.from
  if (patch.to !== undefined) next.to = patch.to
  if (patch.kind !== undefined) next.kind = patch.kind
  if (patch.when !== undefined) next.when = patch.when
  return next
}

/**
 * Remove one member and every handoff that names it.
 * @param spec - current specification.
 * @param id - member id to remove.
 * @returns a new specification.
 */
export function withoutNode(spec: CrewSpec, id: string): CrewSpec {
  return { ...spec, nodes: spec.nodes.filter(node => node.id !== id), edges: spec.edges.filter(edge => edge.from !== id && edge.to !== id) }
}

/**
 * Remove one handoff.
 * @param spec - current specification.
 * @param edge - handoff to remove.
 * @returns a new specification.
 */
export function withoutEdge(spec: CrewSpec, edge: { readonly from: string; readonly to: string }): CrewSpec {
  return { ...spec, edges: spec.edges.filter(candidate => candidate.from !== edge.from || candidate.to !== edge.to) }
}
