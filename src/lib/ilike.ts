/**
 * Escapes ILIKE's own wildcard characters so a literal "%" or "_" in a
 * search term is matched literally, not as a wildcard. Shared by every
 * `.ilike()`-based search (global header search, catalogue parts list) -
 * lives outside any `"use server"` module since those may only export
 * async functions.
 */
export function toIlikePattern(query: string): string {
  return `%${query.replace(/[%_\\]/g, (match) => `\\${match}`)}%`;
}
