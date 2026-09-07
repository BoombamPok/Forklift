import Box from "@mui/material/Box";

type StatusTone =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "outline";

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
};

// Static objects (no theme-callback functions) - these get rendered from
// Server Components too, and MUI's components are all "use client", so a
// function-valued sx prop can't cross that boundary (fails at runtime,
// not build time). var(--mui-palette-*) + color-mix() replace the
// theme.palette.x/alpha() calls a client-only sx callback would use.
const TONE_COLOR: Record<StatusTone, string> = {
  default: "var(--mui-palette-text-secondary)",
  secondary: "var(--mui-palette-text-secondary)",
  success: "var(--mui-palette-success-main)",
  warning: "var(--mui-palette-warning-main)",
  destructive: "var(--mui-palette-error-main)",
  info: "var(--mui-palette-info-main)",
  outline: "var(--mui-palette-text-disabled)",
};

const TONE_SX: Record<StatusTone, object> = {
  default: {
    bgcolor: "var(--mui-palette-action-selected)",
    borderColor: "transparent",
    color: "var(--mui-palette-text-primary)",
  },
  secondary: {
    bgcolor: "var(--mui-palette-action-hover)",
    borderColor: "transparent",
    color: "var(--mui-palette-text-secondary)",
  },
  success: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-success-main) 9%, transparent)",
    borderColor: "color-mix(in srgb, var(--mui-palette-success-main) 24%, transparent)",
    color: "var(--mui-palette-success-main)",
  },
  warning: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-warning-main) 11%, transparent)",
    borderColor: "color-mix(in srgb, var(--mui-palette-warning-main) 26%, transparent)",
    color: "var(--mui-palette-warning-main)",
  },
  destructive: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 9%, transparent)",
    borderColor: "color-mix(in srgb, var(--mui-palette-error-main) 26%, transparent)",
    color: "var(--mui-palette-error-main)",
  },
  info: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-info-main) 9%, transparent)",
    borderColor: "color-mix(in srgb, var(--mui-palette-info-main) 24%, transparent)",
    color: "var(--mui-palette-info-main)",
  },
  outline: {
    bgcolor: "transparent",
    borderColor: "var(--mui-palette-divider)",
    color: "var(--mui-palette-text-primary)",
  },
};

/**
 * Every status shown to a user (inventory status, movement type, role,
 * etc.) should go through this so tone usage stays consistent app-wide
 * instead of each feature inventing its own color choice for "in stock"
 * vs "low stock".
 *
 * Two changes from the old chip: a hairline border, so a badge on a
 * tinted row still has an edge; and a solid pip in the tone colour, so
 * the status survives a greyscale print, a projector, and the ~8% of men
 * with red-green colour vision deficiency who would otherwise be reading
 * "Critical" and "In stock" as the same wash. The label alone already
 * carries the meaning - the pip just makes the scan faster.
 */
function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <Box
      component="span"
      data-variant={tone}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.625,
        maxWidth: "100%",
        border: "1px solid",
        borderRadius: "var(--radius-chip)",
        px: 0.75,
        py: "1px",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        ...TONE_SX[tone],
      }}
    >
      <Box
        aria-hidden
        component="span"
        sx={{
          width: 5,
          height: 5,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: TONE_COLOR[tone],
        }}
      />
      <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </Box>
    </Box>
  );
}

export { StatusBadge, type StatusTone };
