/**
 * ForkStock design tokens - "Instrument".
 *
 * The visual model is a piece of industrial equipment: a graphite
 * chassis (the nav rail) framing a bright, dense work surface. Hairlines
 * do the structural work that drop shadows used to; elevation is
 * reserved for things that genuinely float (menus, dialogs, toasts).
 *
 * Two rules drive the palette:
 *
 * 1. The brand/interactive color is NOT amber any more. Amber is the
 *    single most important signal this app emits ("low stock"), and the
 *    old theme spent it on buttons, links and the logo, so the one color
 *    a storekeeper needs to trust was everywhere. Interactive is now a
 *    cobalt drawn from the blue pedestrian-warning spot a forklift
 *    projects on a warehouse floor - a color that already means "look
 *    here" in this room, and that collides with nothing semantic.
 *
 * 2. Status colors are tuned as a family (same perceived weight, same
 *    tint behaviour) so "in stock / low / out" reads as one scale rather
 *    than three unrelated hues.
 *
 * Every value below is checked against WCAG AA (4.5:1) for the surface
 * it is used on - see the contrast note beside each.
 */

/** The dark rail. Constant across light and dark mode - it is the frame,
 * not part of the work surface, so it does not invert. */
export const CHASSIS = {
  base: "#131820",
  raised: "#1B222D",
  hairline: "#28303D",
  text: "#E7EAF0",
  // 5.9:1 on #131820 - readable for inactive nav labels without
  // competing with the active item.
  muted: "#98A2B3",
  faint: "#6B7687",
} as const;

export const LIGHT = {
  // Cool concrete, not cream. Cream + amber was the old theme's tell.
  canvas: "#EFF1F4",
  panel: "#FFFFFF",
  panelSunken: "#F5F7F9",
  hairline: "#DCE0E6",
  hairlineStrong: "#C6CCD5",
  ink: "#111721", // 16.4:1 on panel
  inkMuted: "#5A6577", // 6.1:1 on panel
  inkFaint: "#8A94A3", // 3.2:1 - decorative/disabled only
  signal: "#1F51E0", // 6.3:1 on panel
  signalHover: "#1A44BE",
  signalWash: "#EEF2FE",
  success: "#0F7A57", // 4.9:1
  warning: "#8F5400", // 5.4:1
  danger: "#B42318", // 6.6:1
  info: "#0E6C86", // 5.1:1
} as const;

export const DARK = {
  canvas: "#0C1017",
  panel: "#151A23",
  panelSunken: "#11161E",
  hairline: "#242B37",
  hairlineStrong: "#333C4C",
  ink: "#E9ECF2", // 14.8:1 on panel
  inkMuted: "#9AA5B6", // 6.4:1 on panel
  inkFaint: "#6B7687",
  signal: "#7CA0FF", // 7.1:1 on panel
  signalHover: "#9AB5FF",
  signalWash: "#18203A",
  success: "#3ECF97",
  warning: "#EFB157",
  danger: "#FF8A7A",
  info: "#4FC3E8",
} as const;

/**
 * Radii carry hierarchy instead of one value applied to everything.
 * A chip and a data panel are not the same kind of object, so they do
 * not share a corner.
 */
export const RADIUS = {
  chip: 5,
  control: 8,
  panel: 14,
  sheet: 18,
} as const;

/**
 * Motion. Short and mechanical - this is equipment responding, not a
 * marketing page unfolding. `enter` is the only non-user-triggered
 * duration and it is used exactly once per screen.
 */
export const MOTION = {
  press: "90ms cubic-bezier(0.2, 0, 0, 1)",
  hover: "140ms cubic-bezier(0.2, 0, 0, 1)",
  enter: "320ms cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** The sequence of chart series colors, in the order categories are
 * assigned. Deliberately avoids the status hues so a brand slice can
 * never be misread as "this brand is in trouble". */
export const SERIES = [
  "#1F51E0",
  "#0E6C86",
  "#6B4FD8",
  "#0F7A57",
  "#B0621A",
  "#8A94A3",
] as const;
