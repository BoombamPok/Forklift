/**
 * Next.js's `searchParams` gives a `string | string[] | undefined` per
 * key (repeated query params become an array) - every list page that
 * reads filters/sort/page off the URL just wants the first value.
 * Shared here since `getInventoryList`'s page and the two new catalogue
 * list pages all need the exact same one-liner.
 */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
