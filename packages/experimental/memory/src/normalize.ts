/**
 * Write-boundary normalization of stored memory text. Identity segments and
 * statements reach storage in one canonical form, so a caller's spelling does
 * not create a second identity and retrieval text stays comparable. Invalid
 * characters are preserved: the caller receives a typed rejection instead of a
 * silently rewritten identity.
 */

/** Normalize one identifier segment: trimmed, lowercase, separators collapsed. */
function normalizeSegment(segment: string): string {
  return segment.normalize('NFKC').trim().toLowerCase()
    .replaceAll(/[\s_]+/gu, '-')
    .replaceAll(/-+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
}

/**
 * Normalize an entity or key to its canonical identity form: NFKC, lowercase,
 * whitespace and underscores as single hyphens, empty `:` segments dropped.
 * Characters outside the identifier grammar stay in place, so
 * {@link isMemoryIdentifier} rejects them.
 * @param value - the caller's spelling of one identifier.
 * @returns the canonical form, possibly empty.
 */
export function normalizeIdentifier(value: string): string {
  return value.normalize('NFKC').split(':')
    .map(normalizeSegment)
    .filter(segment => segment !== '')
    .join(':')
}

/**
 * Normalize one statement or free-text field: NFC, control characters and
 * whitespace runs as a single space, trimmed. Case and language are preserved.
 * @param value - the caller's statement text.
 * @returns the canonical form, possibly empty.
 */
export function normalizeStatement(value: string): string {
  return value.normalize('NFC')
    .replaceAll(/[\u0000-\u001F\u007F]+/gu, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim()
}
