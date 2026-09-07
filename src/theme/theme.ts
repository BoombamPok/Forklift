import { createTheme } from "@mui/material/styles";
import { CHASSIS, DARK, LIGHT, MOTION, RADIUS } from "./tokens";

/**
 * The "Instrument" theme.
 *
 * Everything visual in the app is decided here rather than per-screen -
 * the component overrides below are what let ~200 files that were never
 * touched still come out looking like the new design. Two conventions
 * matter if you extend this:
 *
 * - Use literal `var(--mui-palette-*)` strings, not `theme.palette.x`,
 *   in styleOverrides. With `cssVariables` on, `theme.palette` resolves
 *   to the *default* scheme's value at build time, so a style written
 *   that way silently stays light-mode-colored in dark mode.
 * - Surfaces are separated by 1px hairlines, not by shadow. Shadow is
 *   reserved for genuinely floating layers (Menu, Dialog, Popover,
 *   Tooltip) so that "this thing is above the page" stays meaningful.
 */
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: LIGHT.signal,
          dark: LIGHT.signalHover,
          light: "#5B7FEA",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: LIGHT.info,
          dark: "#0A5468",
          light: "#3E97B2",
          contrastText: "#FFFFFF",
        },
        error: { main: LIGHT.danger, dark: "#8E1A12", light: "#E4574B" },
        warning: { main: LIGHT.warning, dark: "#6E4100", light: "#C4841F" },
        info: { main: LIGHT.info, dark: "#0A5468", light: "#3E97B2" },
        success: { main: LIGHT.success, dark: "#0A5C41", light: "#3AA37D" },
        background: {
          default: LIGHT.canvas,
          paper: LIGHT.panel,
        },
        text: {
          primary: LIGHT.ink,
          secondary: LIGHT.inkMuted,
          disabled: LIGHT.inkFaint,
        },
        divider: LIGHT.hairline,
        action: {
          hover: "rgba(17,23,33,0.035)",
          selected: "rgba(17,23,33,0.06)",
          focus: "rgba(31,81,224,0.14)",
        },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: DARK.signal,
          dark: "#5C86F5",
          light: DARK.signalHover,
          contrastText: "#0B1020",
        },
        secondary: {
          main: DARK.info,
          dark: "#2E9CBF",
          light: "#7FD8F2",
          contrastText: "#0B1020",
        },
        error: { main: DARK.danger, dark: "#E0604F", light: "#FFB0A4" },
        warning: { main: DARK.warning, dark: "#CE9440", light: "#F7CB8A" },
        info: { main: DARK.info, dark: "#2E9CBF", light: "#7FD8F2" },
        success: { main: DARK.success, dark: "#22A97A", light: "#77E3B8" },
        background: {
          default: DARK.canvas,
          paper: DARK.panel,
        },
        text: {
          primary: DARK.ink,
          secondary: DARK.inkMuted,
          disabled: DARK.inkFaint,
        },
        divider: DARK.hairline,
        action: {
          hover: "rgba(233,236,242,0.05)",
          selected: "rgba(233,236,242,0.09)",
          focus: "rgba(124,160,255,0.2)",
        },
      },
    },
  },

  shape: { borderRadius: RADIUS.control },

  /**
   * IBM Plex Sans for everything a person reads, IBM Plex Mono for
   * everything a person *compares* - part numbers, bin codes, quantities,
   * money. Plex Mono is not decoration here: tabular figures are what
   * make a column of quantities scannable, and part numbers are strings
   * where 0/O and 1/l have to be distinguishable at 12px.
   */
  typography: {
    fontFamily: "var(--font-plex-sans), system-ui, sans-serif",
    h1: { fontSize: "2.125rem", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.15 },
    h2: { fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h3: { fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.25 },
    h4: { fontSize: "1.1875rem", fontWeight: 600, letterSpacing: "-0.016em", lineHeight: 1.3 },
    h5: { fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", lineHeight: 1.35 },
    h6: { fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.006em", lineHeight: 1.4 },
    subtitle1: { fontSize: "0.9375rem", fontWeight: 500 },
    subtitle2: { fontSize: "0.8125rem", fontWeight: 600, letterSpacing: 0 },
    body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
    body2: { fontSize: "0.8438rem", lineHeight: 1.5 },
    // Note: no uppercase, no letter-spaced "eyebrow" treatment. Small
    // labels are just small - tracked-out caps read as decoration and
    // slow down scanning in a dense table header.
    caption: { fontSize: "0.75rem", lineHeight: 1.45, letterSpacing: 0 },
    overline: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: 0, textTransform: "none" },
    button: { fontSize: "0.8438rem", fontWeight: 600, letterSpacing: "-0.002em", textTransform: "none" },
  },

  /**
   * A deliberately shallow shadow ramp. Index 1-2 are hairline-plus-hint
   * (used by panels that need a touch of lift), 8+ are real floating
   * layers. The default MUI ramp's 24 near-identical greys is what makes
   * stock Material dashboards look soft and undifferentiated.
   */
  shadows: [
    "none",
    "0 1px 2px rgba(15,22,36,0.05)",
    "0 2px 6px rgba(15,22,36,0.06)",
    "0 4px 12px rgba(15,22,36,0.07)",
    "0 6px 16px rgba(15,22,36,0.08)",
    "0 8px 20px rgba(15,22,36,0.09)",
    "0 10px 24px rgba(15,22,36,0.10)",
    "0 12px 28px rgba(15,22,36,0.11)",
    "0 16px 32px rgba(15,22,36,0.12)",
    "0 18px 36px rgba(15,22,36,0.13)",
    "0 20px 40px rgba(15,22,36,0.14)",
    "0 22px 44px rgba(15,22,36,0.15)",
    "0 24px 48px rgba(15,22,36,0.16)",
    "0 26px 52px rgba(15,22,36,0.17)",
    "0 28px 56px rgba(15,22,36,0.18)",
    "0 30px 60px rgba(15,22,36,0.19)",
    "0 32px 64px rgba(15,22,36,0.20)",
    "0 34px 68px rgba(15,22,36,0.21)",
    "0 36px 72px rgba(15,22,36,0.22)",
    "0 38px 76px rgba(15,22,36,0.23)",
    "0 40px 80px rgba(15,22,36,0.24)",
    "0 42px 84px rgba(15,22,36,0.25)",
    "0 44px 88px rgba(15,22,36,0.26)",
    "0 46px 92px rgba(15,22,36,0.27)",
    "0 48px 96px rgba(15,22,36,0.28)",
  ],

  components: {
    /* ---------------------------------------------------------------- */
    /* Surfaces                                                          */
    /* ---------------------------------------------------------------- */
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          "--Paper-overlay": "none",
        },
        outlined: {
          borderColor: "var(--mui-palette-divider)",
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.panel,
          border: "1px solid var(--mui-palette-divider)",
          backgroundImage: "none",
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: { padding: "16px 18px 10px" },
        title: { fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.006em" },
        subheader: { fontSize: "0.8125rem", marginTop: 2 },
        action: { alignSelf: "center", margin: 0 },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "0 18px 18px",
          "&:last-child": { paddingBottom: 18 },
        },
      },
    },

    /* ---------------------------------------------------------------- */
    /* Controls                                                          */
    /* ---------------------------------------------------------------- */
    MuiButtonBase: {
      // Ripple is the loudest "this is Material" tell there is, and on a
      // dense operations screen it fires constantly. Replaced everywhere
      // with a fast tint + 1px press displacement, which reads as a
      // physical button rather than a splash.
      defaultProps: { disableRipple: true },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          paddingInline: 14,
          minHeight: 36,
          transition: `background-color ${MOTION.hover}, border-color ${MOTION.hover}, color ${MOTION.hover}, transform ${MOTION.press}`,
          "&:active": { transform: "translateY(1px)" },
          "&.Mui-focusVisible": {
            outline: "2px solid var(--mui-palette-primary-main)",
            outlineOffset: 2,
          },
        },
        sizeSmall: { minHeight: 30, paddingInline: 10, fontSize: "0.8125rem" },
        sizeLarge: { minHeight: 42, paddingInline: 20, fontSize: "0.9375rem" },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", backgroundColor: "var(--mui-palette-primary-dark)" },
        },
        outlined: {
          borderColor: "var(--mui-palette-divider)",
          color: "var(--mui-palette-text-primary)",
          "&:hover": {
            borderColor: "var(--mui-palette-text-disabled)",
            backgroundColor: "var(--mui-palette-action-hover)",
          },
        },
        text: {
          "&:hover": { backgroundColor: "var(--mui-palette-action-hover)" },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          transition: `background-color ${MOTION.hover}, color ${MOTION.hover}`,
          "&.Mui-focusVisible": {
            outline: "2px solid var(--mui-palette-primary-main)",
            outlineOffset: 1,
          },
        },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          borderColor: "var(--mui-palette-divider)",
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },

    /* ---------------------------------------------------------------- */
    /* Inputs                                                            */
    /* ---------------------------------------------------------------- */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          backgroundColor: "var(--mui-palette-background-paper)",
          transition: `box-shadow ${MOTION.hover}, border-color ${MOTION.hover}`,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-divider)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-text-disabled)",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px var(--mui-palette-action-focus)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: "var(--mui-palette-primary-main)",
          },
        },
        input: {
          fontSize: "0.875rem",
          "&::placeholder": { color: "var(--mui-palette-text-disabled)", opacity: 1 },
        },
        sizeSmall: { fontSize: "0.875rem" },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: "0.875rem" },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: "0.75rem", marginInline: 2 },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: { borderRadius: 4, padding: 6 },
      },
    },

    /* ---------------------------------------------------------------- */
    /* Data display                                                      */
    /* ---------------------------------------------------------------- */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.chip,
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 22,
        },
        label: { paddingInline: 8 },
        sizeSmall: { height: 20, fontSize: "0.7188rem" },
      },
    },

    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: "separate", borderSpacing: 0 },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid var(--mui-palette-divider)",
          fontSize: "0.8438rem",
          paddingBlock: 10,
        },
        head: {
          // Sentence case, not tracked-out caps. The uppercase table
          // header is the single most recognisable piece of generic
          // dashboard chrome and it costs legibility for nothing.
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: 0,
          textTransform: "none",
          color: "var(--mui-palette-text-secondary)",
          backgroundColor: "var(--mui-palette-background-paper)",
          whiteSpace: "nowrap",
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: `background-color ${MOTION.hover}`,
          "&:last-of-type .MuiTableCell-root": { borderBottom: "none" },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 34 },
        indicator: {
          height: 2,
          borderRadius: 2,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 34,
          padding: "6px 12px",
          fontSize: "0.8125rem",
          fontWeight: 500,
          textTransform: "none",
          color: "var(--mui-palette-text-secondary)",
          transition: `color ${MOTION.hover}`,
          "&.Mui-selected": { fontWeight: 600, color: "var(--mui-palette-text-primary)" },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "var(--mui-palette-divider)" },
      },
    },

    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: {
        root: { backgroundColor: "var(--mui-palette-action-hover)" },
        rounded: { borderRadius: RADIUS.control },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { fontSize: "0.8125rem", fontWeight: 600 },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.panel,
          border: "1px solid var(--mui-palette-divider)",
          fontSize: "0.8438rem",
          alignItems: "flex-start",
        },
        standard: { backgroundColor: "var(--mui-palette-background-paper)" },
        icon: { paddingTop: 9 },
      },
    },

    /* ---------------------------------------------------------------- */
    /* Floating layers - the only things allowed real shadow             */
    /* ---------------------------------------------------------------- */
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.panel,
          border: "1px solid var(--mui-palette-divider)",
          boxShadow: "0 12px 32px rgba(11,16,26,0.16)",
          marginTop: 4,
        },
        list: { padding: 6 },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 34,
          fontSize: "0.8438rem",
          gap: 2,
          transition: `background-color ${MOTION.hover}`,
        },
      },
    },

    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.panel,
          border: "1px solid var(--mui-palette-divider)",
          boxShadow: "0 12px 32px rgba(11,16,26,0.16)",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.sheet,
          border: "1px solid var(--mui-palette-divider)",
          boxShadow: "0 24px 64px rgba(11,16,26,0.24)",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: "1.0625rem", fontWeight: 600, padding: "20px 22px 6px" },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: "6px 22px 12px" },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "12px 22px 20px", gap: 8 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          backgroundColor: CHASSIS.base,
          color: CHASSIS.text,
          fontSize: "0.75rem",
          fontWeight: 500,
          paddingInline: 8,
          paddingBlock: 5,
        },
        arrow: { color: CHASSIS.base },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { border: "none", backgroundImage: "none" },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.control,
          transition: `background-color ${MOTION.hover}, color ${MOTION.hover}`,
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 32, color: "inherit" },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: 3, backgroundColor: "var(--mui-palette-action-selected)" },
        bar: { borderRadius: 3 },
      },
    },
  },
});

export { theme };
