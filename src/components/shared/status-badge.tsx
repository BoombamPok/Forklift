import Chip from "@mui/material/Chip";

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
const TONE_SX: Record<StatusTone, object> = {
  default: {
    bgcolor: "var(--mui-palette-action-selected)",
    color: "var(--mui-palette-text-primary)",
  },
  secondary: {
    bgcolor: "var(--mui-palette-action-hover)",
    color: "var(--mui-palette-text-secondary)",
  },
  success: {
    bgcolor:
      "color-mix(in srgb, var(--mui-palette-success-main) 12%, transparent)",
    color: "var(--mui-palette-success-dark)",
  },
  warning: {
    bgcolor:
      "color-mix(in srgb, var(--mui-palette-warning-main) 14%, transparent)",
    color: "var(--mui-palette-warning-dark)",
  },
  destructive: {
    bgcolor:
      "color-mix(in srgb, var(--mui-palette-error-main) 12%, transparent)",
    color: "var(--mui-palette-error-dark)",
  },
  info: {
    bgcolor:
      "color-mix(in srgb, var(--mui-palette-info-main) 12%, transparent)",
    color: "var(--mui-palette-info-dark)",
  },
  outline: {
    bgcolor: "transparent",
    color: "var(--mui-palette-text-primary)",
    border: "1px solid var(--mui-palette-divider)",
  },
};

/**
 * Every status shown to a user (inventory status, movement type, role, etc.)
 * should go through this so tone usage stays consistent app-wide instead of
 * each feature inventing its own color choice for "in stock" vs "low stock".
 */
function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <Chip
      label={label}
      size="small"
      data-variant={tone}
      sx={{ fontWeight: 600, ...TONE_SX[tone] }}
    />
  );
}

export { StatusBadge, type StatusTone };
