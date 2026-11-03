/** Quote normalization and matching shared by the memory tools and post-turn capture. */

import type { SessionEvent } from '@tomato/session'

/** One person message admitted in the open turn, in comparison form. */
export interface TurnQuote {
  /** Seq of the `user/message` event. */
  readonly seq: number
  /** Normalized text of the message. */
  readonly text: string
}

/** Trailing sentence punctuation that a quote may omit. */
const TRAILING_PUNCTUATION = /[\s.!?。！？…]+$/u

/**
 * Normalize quoted or recorded text for comparison: lowercased, whitespace
 * runs collapsed to one space, and trailing sentence punctuation dropped.
 * @param text - quoted or recorded text.
 * @returns the comparison form.
 */
export function normalizeQuote(text: string): string {
  return text.toLowerCase().replaceAll(/\s+/gu, ' ').trim().replace(TRAILING_PUNCTUATION, '')
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/**
 * Count user-perceived characters, so an emoji or combined character counts once.
 * @param text - text to measure.
 * @returns the grapheme count.
 */
export function characterCount(text: string): number {
  let count = 0
  for (const _segment of graphemes.segment(text)) count += 1
  return count
}

/**
 * Joined text blocks of one person message event.
 * @param event - a `user/message` event.
 * @returns its text blocks joined by a newline.
 */
export function messageText(event: SessionEvent<'user/message'>): string {
  return event.data.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n')
}

/**
 * Find the person message of the open turn that contains a quote.
 * @param quotes - person messages admitted in the open turn.
 * @param quote - text the model cited.
 * @param minChars - minimum user-perceived characters of the normalized quote.
 * @returns the seq of the latest containing message, or `undefined` when the quote is too short or matches none.
 */
export function quotedMessage(quotes: readonly TurnQuote[], quote: string, minChars: number): number | undefined {
  const text = normalizeQuote(quote)
  if (characterCount(text) < minChars) return undefined
  return quotes.findLast(candidate => candidate.text.includes(text))?.seq
}
