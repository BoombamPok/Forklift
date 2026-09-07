# ForkStock UI — "Instrument"

Design notes for the visual reset. Written for whoever picks this up next,
including future-you.

---

## The diagnosis

The engineering was never the problem. Suspense per widget, `allSettled` so
one dead query can't take down a row, honest empty states, RLS — that's a
serious app. Three specific things were making it look like a template.

**1. Roboto plus Material defaults.** Roboto is MUI's default font, and
default elevation is MUI's default depth model. Ship both and the app reads
as "an MUI app" before it reads as anything else.

**2. The brand colour was amber.** `#A05826` sat on every button, the logo,
the active nav item — and also on the "low stock" warning chip. The single
most important signal this product emits was the same hue as its furniture.
A storekeeper scanning for amber found amber everywhere.

**3. The SaaS-card kit.** Four identical rounded cards in a row, one
`borderRadius: 12` on every object regardless of what it was, the same soft
grey shadow under each, and a decorative 3D gradient above the data. That
combination is the single most recognisable "generated dashboard" silhouette
there is.

## The idea

The app as a piece of industrial equipment. A graphite **chassis** — the nav
rail, the sign-in panel, the hub banners — framing a bright **work surface**.
Hairlines carry the structure; shadow is reserved for things that genuinely
float (menus, dialogs, tooltips, toasts), so "this is above the page" stays
meaningful.

The chassis does **not** invert with the colour scheme. It's the frame around
the work, not part of it, which also gives the product a recognisable
silhouette in both modes.

## Tokens

`src/theme/tokens.ts` is the source of truth; `src/app/globals.css` mirrors
the few that MUI's theme can't reach (chassis, radii, easings, chart ramp).

### Colour

Interactive is now a cobalt — `#1F51E0` light, `#7CA0FF` dark. It's borrowed
from the blue pedestrian-warning spot a forklift projects onto a warehouse
floor: a colour that already means "look here" in this room, and one that
collides with nothing semantic. Amber now means low stock and nothing else.

Neutrals are cool concrete (`#EFF1F4` canvas), not cream. Cream plus a warm
clay accent is the most common generated-page palette going, and it's also
just wrong for this subject.

Every value is checked to WCAG AA (4.5:1) against the surface it's used on;
the ratio is noted beside each token in `tokens.ts`.

The categorical chart ramp (`--series-1..6`) is deliberately separate from
the status palette. A brand slice filled with warning-amber reads as "this
brand is in trouble" — a claim the chart is not making.

### Type

IBM Plex Sans and IBM Plex Mono. Plex was drawn for engineering and technical
documentation: real character without being a display face, and a mono
companion actually designed to sit beside the sans rather than bolted on.

Mono is functional, not decorative. It's applied via an explicit `.numeric`
class — never blanket-applied to `<td>` — and only to things a person
*compares*: quantities, part numbers, bin codes, money, dates. Tabular
figures make a column of quantities scannable; distinguishable `0/O` and
`1/l` matter when part numbers render at 12px.

Small labels are just small. No tracked-out all-caps eyebrows anywhere,
including table headers.

### Shape

Radius carries hierarchy instead of one value on everything: chip 5, control
8, panel 14, sheet 18. A status chip and a data panel are not the same kind
of object and shouldn't share a corner.

## Structural decisions worth knowing

**The KPI row is one divided panel, not N cards** (`stat-cluster.tsx`). Four
cards say "four unrelated things". These are four readings off one system,
meant to be compared. The dividers are the parent's background showing
through a 1px grid gap, so there are no per-cell borders to double at the
seams and nothing to special-case when the column count changes at a
breakpoint.

**The 3D hero is gone from the dashboard.** It cost the top 256px of the
screen people open to find out what's wrong this morning, pushed the actual
readings below the fold on a laptop, and pulled a ~400KB three.js chunk onto
the highest-traffic route to render decoration. It's kept on `/login`,
`/accept-invite` and the three hub pages — routes with nothing else competing
for the space, where it earns its weight.

**Sign-in is a full-bleed split**, not a card floating on a background. A
centred card wastes a whole screen to frame a 380px form.

**Fewer frames.** The low-stock block used to be a titled card wrapping a
bordered table inside a titled section — three frames for one list. Now the
section label names it and the table draws its own panel.

## Motion

One orchestrated, non-user-triggered moment in the entire app: the KPI
cluster's cells resolving left to right on first paint, like a panel of
gauges coming up when equipment is switched on.

Everything else answers something a person did — the rail indicator springing
between nav items, a chevron nudging on hover, a tab underline sliding, a row
tinting. `MotionFadeIn` was reduced to opacity-only; it used to also slide up
4px, which meant every widget on the dashboard independently slid into place
on load. Hover-lift-plus-shadow was removed from the hub link cards; the
border lights up instead, so a page of links stops twitching.

`prefers-reduced-motion` is honoured globally in `globals.css` and again per
component through the existing `useReducedMotion` hook.

## Dark mode

There was a dark colour scheme in the old theme, but it defined only
backgrounds and brand colours — no text, no dividers — so it was never
really usable. It's now fully specified, defaults to `system`, and has a
header toggle that persists.

`InitColorSchemeScript` in `layout.tsx` applies the saved scheme before first
paint. Its `attribute="class"` **must** stay matched to
`cssVariables.colorSchemeSelector` in `theme.ts`; if they drift, dark-mode
users get a full-brightness white flash on every server navigation.

## Two gotchas that will bite you

**1. Never use `theme.palette.x.main` for a colour that has to react to the
scheme.** With `cssVariables` enabled, that returns the *default* scheme's
literal hex, baked in at render. It does not update when someone switches to
dark. This already had the charts rendering light-mode fills on a dark panel;
they now hand Recharts `var(--mui-palette-*)` strings, which SVG
`fill`/`stroke` accept and the browser re-resolves. Use literal `var()`
strings in `styleOverrides` too.

**2. No function-valued `sx` in anything a Server Component renders.** MUI's
components are all `"use client"`, so a callback `sx` can't cross the
boundary — and it fails at runtime, not build time. `KpiCard`, `StatusBadge`,
`EmptyState`, `PageHeader` and friends use static objects with
`var(--mui-palette-*)` and `color-mix()` throughout. Keep them that way.

## What changed in tests

One assertion, deliberately. `recent-activity-widget.test.tsx` checked for
the exact string `"...(SAMPLE-0001) · Jane Warehouse"`. Actor attribution now
renders on its own line — the joined string wrapped badly in a narrow column
and buried the event — so the test checks both strings separately, plus that
the actor is absent when unknown.

## Before you run it

This was written without a package install, so it has never been compiled.
Syntax is verified (`tsc` parse pass over every file, clean), but types are
not.

```
npm install
npm run format      # nothing here has been through prettier
npm run typecheck
npm run lint
npm test
npm run dev
```

The likeliest breakages are `sx` prop shapes and the MUI v9
`InitColorSchemeScript` import path.

## Loose ends

- `motion-stagger.tsx` is now unused — the KPI cluster owns that job. Delete
  it once you're happy, or repurpose it.
- `LoadingState`'s `cards` variant is kept for backwards compatibility but no
  longer called; `cluster` replaced it on the dashboard.
- The three.js scenes were repointed to the new accents, but the `leadHue`
  prop values are still the strings `"amber"` / `"electric"`. Renaming them
  is a pure rename across three hub pages with no design payoff — left alone
  on purpose.
- `hero-scene-*` compositions themselves weren't redesigned, only recoloured.
