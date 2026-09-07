import * as React from "react";
import type { LucideIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type TrendDirection = "up" | "down" | "flat";
type KpiTone = "default" | "success" | "warning" | "destructive" | "info";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
  trend?: {
    direction: TrendDirection;
    label: string;
  };
  sx?: SxProps<Theme>;
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: "var(--mui-palette-success-main)",
  down: "var(--mui-palette-error-main)",
  flat: "var(--mui-palette-text-secondary)",
};

// Static objects (no theme-callback functions) - KpiCard is rendered from
// Server Components, and MUI's components are all "use client", so a
// function-valued sx prop can't cross that boundary (runtime error, not a
// build-time one). var(--mui-palette-*) + color-mix() stand in for the
// theme.palette.x/alpha() calls a client-only sx callback would use.
const TONE_CHIP_SX: Record<KpiTone, object> = {
  default: {
    bgcolor: "var(--mui-palette-action-selected)",
    color: "var(--mui-palette-text-secondary)",
  },
  success: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-success-main) 13%, transparent)",
    color: "var(--mui-palette-success-main)",
  },
  warning: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-warning-main) 15%, transparent)",
    color: "var(--mui-palette-warning-main)",
  },
  destructive: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 13%, transparent)",
    color: "var(--mui-palette-error-main)",
  },
  info: {
    bgcolor: "color-mix(in srgb, var(--mui-palette-info-main) 13%, transparent)",
    color: "var(--mui-palette-info-main)",
  },
};

/**
 * One reading in a `StatCluster`. It draws no border and no radius of its
 * own - the cluster owns the frame and the rules between cells - so a
 * KpiCard on its own outside a cluster is intentionally not a card.
 *
 * `tone` tints only the icon and the dot beside the label. It never tints
 * the number: a red "0" under "Out of stock" would be saying the opposite
 * of what is true, and tone here is a category cue, not a judgement about
 * the current value.
 */
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  sx,
}: KpiCardProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        minWidth: 0,
        px: 2.25,
        py: 2,
        bgcolor: "background.paper",
        transition: "background-color 140ms var(--ease-standard)",
        "&:hover": { bgcolor: "background.default" },
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography
          component="span"
          noWrap
          sx={{
            minWidth: 0,
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
        {Icon ? (
          <Box
            aria-hidden
            sx={{
              display: "flex",
              width: 26,
              height: 26,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-chip)",
              ...TONE_CHIP_SX[tone],
            }}
          >
            <Icon size={14} strokeWidth={2.1} />
          </Box>
        ) : null}
      </Box>

      <Typography
        component="p"
        className="numeric"
        sx={{
          fontSize: { xs: "1.75rem", lg: "2rem" },
          fontWeight: 600,
          lineHeight: 1,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>

      {trend ? (
        <Typography
          component="span"
          sx={{
            fontSize: "0.75rem",
            lineHeight: 1.3,
            color: TREND_COLOR[trend.direction],
          }}
        >
          {trend.label}
        </Typography>
      ) : null}
    </Box>
  );
}

export { KpiCard, type KpiTone };
