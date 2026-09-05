# 0001: Catalogue and inventory are separate schema zones

## Status

Accepted (Phase 1).

## Context

CLAUDE.md §3 and phase1.md §4 require catalogue ("what exists and what
does it fit?") and inventory ("what do we own, where is it, what
happened to it?") to stay conceptually distinct. A part can exist in
catalogue only, inventory only, or both.

## Decision

`catalogue_parts` and `inventory_parts` are separate tables.
`inventory_parts.catalogue_part_id` is a **nullable** foreign key to
`catalogue_parts`. No table merges the two concepts.

This is enforced structurally, not just by convention: nothing in the
schema requires an inventory row to have a catalogue link, and nothing
requires a catalogue row to have an inventory row.

## Consequences

- Queries that need "everything we stock" vs. "everything we know about"
  are naturally different queries against different tables, not filters
  on one giant table.
- Reports/search that blend the two (Phase 3+) need an explicit join or
  `UNION`, not a single `SELECT * FROM parts`.
- Verified live: `supabase/seed.sql` seeds one catalogue-only part
  (`SAMPLE-0002`), one catalogue+inventory part (`SAMPLE-0001`), and one
  inventory-only part (`INV-ONLY-0001`) — all three states hold.
