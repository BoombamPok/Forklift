# 0008: Imported the real Godrej/Voltas master catalogue ahead of Phase 5

## Status

Accepted. Done at the user's explicit request, ahead of the normal phase
order (`phase1.md` §42 frames real catalogue import as later, controlled
work - the user chose to bring it forward once the data was available).

## Context

The user provided `supabase/reference-data/godrej-voltas-master-catalogue.csv`
- the real consolidation report `phase1.md` §5 refers to (284 parts, 2
brands, 9 models, 979 compatibility links - all counts matched exactly).
Looking at the actual data surfaced schema gaps and one real design
question:

- `sub_category`, `assembly_group`, `is_fastener` don't exist on
  `catalogue_parts` yet.
- `fuel_types` is genuinely constant per model across every row that
  references it - safe to normalize onto `catalogue_models.fuel_type`.
- `capacity_range_kg` looked like a per-model fact at first, but isn't:
  the same model appears with different ranges depending on which other
  models a given part row also lists (e.g. "DVX 20 FC" appears with
  `2000-2000` on a row that fits only that model, and `1500-5000` on a
  row spanning the whole model family). It's a derived summary of
  *that part row's own* `fits_models` list, not a fixed model attribute.
- 14 of 284 rows list more than one source catalogue - one nullable
  `source_id` on `catalogue_parts` can't represent that.
- `cross_references` sometimes names a brand with no actual code (e.g.
  `"HYDAX -"`) - there's nothing to record in that case.

## Decision

- Added `sub_category`, `assembly_group`, `is_fastener`,
  `capacity_range_kg` to `catalogue_parts`; `fuel_type` to
  `catalogue_models`.
- `capacity_range_kg` is stored **verbatim as given per part row**, not
  derived into one canonical per-model number - inferring a single value
  (even though the pattern is strongly suggestive: model codes appear to
  encode capacity, e.g. "GX 150 D" ~ 1500kg) would mean stating something
  as fact that the source data doesn't actually assert per-model.
  CLAUDE.md #13: don't invent missing information.
- Replaced `catalogue_parts.source_id` with a `catalogue_part_sources`
  join table (part <-> source, many-to-many) to represent multi-source
  rows losslessly.
- `confidence` (A/B/C in the eventual full dataset; only "A" appears
  here) maps to `verification_status` as A→verified, B→uncertain,
  C→unverified - a documented best guess, since only "A" was observed to
  confirm against.
- Cross-reference rows are only created where an actual code follows the
  source name - `"SOURCE -"` entries are skipped rather than stored with
  a placeholder.
- `scripts/import-master-catalogue.mjs` is a standalone, re-runnable
  Node script (not part of the Next.js app) using the secret-key admin
  client directly - appropriate for a one-time/occasional data-loading
  operation, not application runtime code.

## Consequences

- The Catalogue zone now has real data queryable today, even though the
  Catalogue browser UI (Phase 5) doesn't exist yet - nothing displays it
  yet, but it's there for Phase 2's dashboard widgets (e.g. a real
  "Popular Models" list) to use.
- Any future normalization of `capacity_range_kg` into a single
  per-model number should come from the user confirming real
  specifications, not from re-deriving it from this pattern.
- The importer is idempotent for parts/cross-refs (skips rows that
  already exist) and upserts everything else on its real unique
  constraints, so it's safe to re-run if the source CSV is corrected or
  extended later.
