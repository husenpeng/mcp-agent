/**
 * Pure conversion from a robot template to the specification a hire publishes.
 * @module @tomato/experimental-robot
 */

import type { RobotSpec, RobotTemplate, RobotTemplateText } from './types.ts'

/**
 * Select a template's copy for one locale.
 * @param template - registered template.
 * @param locale - locale id such as `zh` or `zh-CN`; matching is case-insensitive.
 * @returns the exact locale's copy, else its language's copy, else the English copy.
 */
export function templateText(template: RobotTemplate, locale: string): RobotTemplateText {
  const exact = locale.toLowerCase()
  return template.text[exact] ?? template.text[exact.split('-')[0] ?? exact] ?? template.text.en
}

/**
 * Build the complete specification one hire publishes.
 * @param template - registered template.
 * @param locale - locale whose copy fills the name, description, mission, and criteria.
 * @param name - display name to publish; defaults to the localized template name.
 * @returns a new specification value independent of the template.
 */
export function templateSpec(template: RobotTemplate, locale: string, name?: string): RobotSpec {
  const text = templateText(template, locale)
  const spec = structuredClone(template.spec)
  return {
    name: name ?? text.name,
    description: text.description,
    position: spec.position,
    goal: { ...spec.goal, mission: text.mission, successCriteria: [...text.successCriteria] },
    capability: spec.capability,
    io: { ...spec.io, acceptance: [...text.acceptance] },
    memory: spec.memory,
    a2a: spec.a2a,
  }
}
