import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type PosterFallbackProps = {
  sx?: SxProps<Theme>;
  /** Which accent hue the static gradient should lean toward. */
  tone?: "primary" | "electric" | "dual";
};

/**
 * Static, zero-JS stand-in for a 3D hero scene - shown on
 * prefers-reduced-motion, below the `lg:` breakpoint (desktop-first,
 * per CLAUDE.md's §8, is not waived even for the visual-identity reset),
 * or before the real Canvas has mounted. Pure CSS radial gradients, no
 * WebGL, no motion.
 */
function PosterFallback({ sx, tone = "dual" }: PosterFallbackProps) {
  return (
    <Box
      aria-hidden
      sx={[
        {
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(tone === "primary" || tone === "dual") && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "36rem",
            height: "36rem",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            opacity: 0.6,
            filter: "blur(64px)",
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--mui-palette-primary-main), transparent 70%), transparent 70%)",
          }}
        />
      )}
      {(tone === "electric" || tone === "dual") && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "28rem",
            height: "28rem",
            transform: "translate(-25%, -25%)",
            borderRadius: "50%",
            opacity: 0.5,
            filter: "blur(64px)",
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--mui-palette-secondary-main), transparent 72%), transparent 70%)",
          }}
        />
      )}
    </Box>
  );
}

export { PosterFallback };
