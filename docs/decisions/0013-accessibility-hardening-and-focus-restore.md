# 0013: Accessibility hardening findings, and a Radix focus-restore fix

## Status

Accepted (Phase 7).

## Context

Phase 7's accessibility review (phase7.md §4/§9) added an automated
axe-core WCAG 2.1 AA scan (`e2e/accessibility.spec.ts`) across every
major workflow page, plus a manual keyboard/focus-trap check, against
the live Supabase project. This surfaced four real, fixable issues that
had shipped silently across Phases 1-6 - none were "list it for later,"
all were fixed and re-verified.

## Findings and fixes

1. **Color contrast (`--primary`, `--success`) below AA's 4.5:1.**
   `--primary` (`oklch(0.646 0.222 41.116)`, the warm orange brand
   accent on solid buttons/badges) only hit 3.44:1 against
   `--primary-foreground`; `--success` (`oklch(0.6 0.14 152)`) only hit
   3.17:1 against its own `bg-success/10` badge background. Both were
   darkened (`--primary` to `oklch(0.555 0.18 41.116)`, `--success` to
   `oklch(0.48 0.14 152)`) - same hue, same brand identity, verified via
   a small WCAG relative-luminance script to land at ~4.7-5.2:1 with
   real margin, not a bare pass. `--ring`/`--chart-1`/`--sidebar-primary`
   deliberately keep the brighter original value - a focus ring and a
   chart fill aren't held to text-contrast rules, and the sidebar's own
   accent already had sufficient contrast against the dark navy chrome.
   `KpiCard`'s label also dropped a `text-muted-foreground/90` opacity
   modifier that alone pushed an already-compliant color to 4.48:1 (just
   under the floor) at its 11px size.
2. **Filter `Select` triggers with no accessible name.** Bare filter
   bars (`inventory-filters.tsx`, `parts-filters.tsx`,
   `model-filters.tsx`, `date-range-picker.tsx`,
   `low-stock-report-table.tsx`) never had a visible `<label>` - by
   design, a compact filter row - but a `role="combobox"` trigger's
   accessible name has to come from `aria-label`/`aria-labelledby`, not
   inferred from its own visible value text. Every bare filter Select
   across the app now has a specific `aria-label` (e.g. "Filter by
   status"). Selects already wrapped in `FormField`/`FormLabel` (every
   in-form Select) were unaffected - `<label for>` already resolves
   correctly there.
3. **`aria-controls` pointing at a nonexistent element.** The low-stock
   status filter (`dashboard/low-stock-table.tsx`,
   `reports/low-stock/low-stock-report-table.tsx`) uses `Tabs`/
   `TabsList`/`TabsTrigger` purely as a segmented filter control over a
   table below, with no `TabsContent` at all - Radix still wires each
   trigger's `aria-controls` to a same-value content panel, which
   resolved to nothing. Fixed with `forceMount`-ed, `hidden` (never
   visible) `TabsContent` panels per value - keeps every trigger's
   `aria-controls` valid without duplicating the table four times or
   changing layout.
4. **Dialog/Sheet/AlertDialog didn't return focus to their trigger on
   close.** This is the one non-obvious finding: Radix's own
   FocusScope-based restore (it captures `document.activeElement` in a
   `useEffect`, which runs after render, and restores it on unmount)
   does not reliably land back on the trigger in this app's stack -
   reproduced live via Escape, the dialog's own Cancel button, and its X
   close button, in both `next dev` and a `next build && next start`
   production server, with both mouse- and keyboard-triggered opens.
   Manually focusing the same trigger element immediately afterward
   always worked (it's not `aria-hidden`/`inert`/disabled at that point)
   - the button itself is fine; Radix's captured "what to restore focus
   to" reference is the part that's unreliable here.

   The fix (`components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`)
   is a corrective layer, not a workaround that disables Radix's own
   attempt: each `Root` wrapper (`Dialog`/`AlertDialog`/`Sheet`) captures
   `document.activeElement` itself the moment `open` flips true, using
   React's "adjusting state during render" pattern
   (`react.dev/reference/react/useState#storing-information-from-previous-renders`)
   - not a ref mutation, which the React Compiler's `react-hooks/refs`
   lint rule correctly rejects, since this project has that rule
   enabled. This runs strictly before any child's mount effect
   (including Radix's own FocusScope) can fire and shift focus away.
   The corresponding `Content` component passes its own
   `onCloseAutoFocus` that only calls `event.preventDefault()` once it
   has a real, still-attached target to focus - if for any reason no
   trigger was captured, Radix's own default behavior still runs
   unobstructed.

## Consequences

- Any new shared component that introduces its own color pairing should
  check contrast against `--card`/`--background`, not just eyeball it -
  `/tmp` script pattern (OKLCH → linear sRGB → WCAG relative luminance)
  is straightforward to reproduce if a future token needs the same
  check.
- Any new bare (non-`FormField`) `Select`/`Combobox` filter needs its
  own `aria-label` - there is no shared wrapper that could enforce this
  automatically without forcing every Select through one, which isn't
  justified at this count.
- A `Tabs` component used as a stateless filter control (no distinct
  panel per tab) needs the same empty, `forceMount`-ed, hidden
  `TabsContent` treatment - documented here so a future report/list page
  copying this pattern doesn't reintroduce the same gap.
- The focus-restore fix is general-purpose and applies to every
  Dialog/AlertDialog/Sheet in the app automatically (fixed once, in the
  three shared primitives) - no per-call-site changes were needed
  beyond the primitives themselves.
- Verified live: `e2e/accessibility.spec.ts`'s six-page axe scan and its
  keyboard/focus-trap test are green; the full suite (`npm run test`,
  `npx playwright test`) still passes with the same total count as
  before, since these were fixes to existing shared components, not new
  surface area.
