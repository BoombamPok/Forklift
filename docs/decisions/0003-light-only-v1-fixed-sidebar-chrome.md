# 0003: V1 ships light-theme-only, with a fixed dark sidebar

## Status

Accepted (Phase 1).

## Context

CLAUDE.md §7 asks for a light neutral workspace with a dark charcoal/navy
sidebar. §13 separately says dark mode *may* be supported by the
architecture but shouldn't derail Phase 1. Those two statements are easy
to conflate into "build a light/dark toggle where the sidebar also
flips," which is more work than the brief actually asks for.

## Decision

The sidebar's dark navy chrome is a **fixed brand color**, not a
dark-mode toggle. Its CSS variables (`--sidebar`, `--sidebar-foreground`,
etc.) hold the identical value in both the `:root` and `.dark` blocks in
`src/app/globals.css`. There is no theme switcher in the UI, and
`next-themes` was removed from dependencies (nothing uses it).

Semantic tokens (`--background`, `--primary`, `--success`, etc.) are
still properly defined as CSS variables rather than hard-coded Tailwind
colors, so a real dark theme later is a token-value change, not a
rewrite of components.

## Consequences

- Matches the reference direction (Linear/Vercel-style permanently-dark
  chrome around a light workspace) without any toggle-state UI or
  persistence to build.
- If a future phase adds a real dark mode, `next-themes` (or equivalent)
  gets reintroduced then, and the `.dark` block's non-sidebar tokens
  (already populated with a coherent dark palette) become live instead of
  dormant.
