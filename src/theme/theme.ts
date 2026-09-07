import { createTheme } from "@mui/material/styles";

/**
 * Material Design theme - full reset away from the previous dark-glass/
 * 3D concept toward Material's own visual language (elevation, rounded
 * surfaces, ripple interaction, standard typography roles). The warm
 * amber brand accent is kept as `primary` for continuity; everything
 * else (shape, elevation, typography scale, component defaults) follows
 * Material conventions rather than the previous custom system.
 */
const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          // #C2703A (the "brand" amber) only clears 3.7:1 against white -
          // below WCAG AA's 4.5:1 floor for normal text/button labels.
          // Darkened the same way the original CLAUDE.md palette's
          // primary once was, verified against axe - see PROGRESS.md.
          main: "#A05826",
          light: "#E8A464",
          dark: "#7A431F",
          contrastText: "#FFFFFF",
        },
        secondary: {
          // Same contrast issue as primary - #2F7F9E only cleared 4.52:1,
          // too thin a margin. Darkened for a safer margin (7.6:1).
          main: "#1F5A72",
          light: "#5FB8E0",
          dark: "#153E4E",
          contrastText: "#FFFFFF",
        },
        error: { main: "#B3261E" },
        warning: { main: "#8A5300" },
        info: { main: "#0B61A4" },
        success: { main: "#2E7D32" },
        background: {
          default: "#FAF9F7",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#1C1B1A",
          secondary: "#5C5955",
        },
        divider: "rgba(28,27,26,0.12)",
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#E8A464",
          light: "#F0BE8E",
          dark: "#C2703A",
          contrastText: "#1C1B1A",
        },
        secondary: {
          main: "#5FB8E0",
          light: "#8ED0EC",
          dark: "#2F7F9E",
          contrastText: "#1C1B1A",
        },
        background: {
          default: "#141312",
          paper: "#1F1E1C",
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, Helvetica, Arial, sans-serif",
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1.05rem" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
  },
});

export { theme };
