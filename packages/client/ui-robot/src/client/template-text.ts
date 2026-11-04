/**
 * Template copy selection for the robot page. Keep the fallback order
 * identical to `templateText()` in `@tomato/experimental-robot`, which the
 * Host uses when it publishes a hire; this non-experimental client bundle
 * cannot inline that package.
 */
import type { RobotTemplate, RobotTemplateText } from '@tomato/api-robot-controller/client'

/**
 * Select a template's copy for one locale.
 * @param template - registered template.
 * @param locale - locale id such as `zh` or `zh-CN`; matching is case-insensitive.
 * @returns the exact locale's copy, else its language's copy, else the English copy.
 */
export function templateTextFor(template: RobotTemplate, locale: string): RobotTemplateText {
  const exact = locale.toLowerCase()
  return template.text[exact] ?? template.text[exact.split('-')[0] ?? exact] ?? template.text.en
}
