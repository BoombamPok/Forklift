# 0011: Part-image storage path convention, and a hard delete for `part_images`

## Status

Accepted (Phase 3).

## Context

Phase 1's storage migration only established the `part-images` bucket
and SELECT/INSERT policies - "no upload UI exists yet". Phase 3 needs
upload **and removal**, and no path convention was ever decided for
where a file lives under the bucket.

Every other write policy in this schema follows ADR 0007: no `DELETE`
policy, ever - "deletion" is always a soft delete via
`UPDATE ... SET deleted_at`. `part_images` can't follow that rule as-is,
because the table has no `deleted_at` column at all.

## Decision

- **Path convention**: `{inventory_part_id}/{uuid}.{ext}`. Keying the
  first path segment by the owning part makes "list this part's
  images" and "delete everything under this part" simple prefix
  operations, and avoids any filename collision risk across parts.
- **`part_images` gets a real DELETE policy** (`supabase/migrations/
  20260905110000_part_images_delete_and_storage_path.sql`), matching
  the same role set as its INSERT policy (admin/manager/staff, role-
  based like every other write policy here - not owner-restricted).
  `storage.objects` gets a matching DELETE policy scoped to the
  `part-images` bucket.
- This is a deliberate, narrow exception to ADR 0007's rule, not a
  reversal of it: images aren't audit/history data the way
  `stock_movements` rows are (CLAUDE.md never asks for permanent image
  history), and the table was never given a `deleted_at` column to
  soft-delete through in the first place. Removing a wrong or duplicate
  photo should actually remove it.

## Consequences

- `deletePartImage` (Server Action) must remove both the `part_images`
  row and the underlying storage object - a partial failure (row
  deleted, object left behind, or vice versa) is a real failure mode to
  handle explicitly, not assume away.
- Any future table that's genuinely non-history, ownerless media (not a
  business record) can follow this same narrow pattern; every other
  table keeps ADR 0007's soft-delete-only rule unchanged.
