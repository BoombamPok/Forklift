import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
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

const TREND_ICON: Record<TrendDirection, LucideIcon> = {
  up: ArrowUpRightIcon,
  down: ArrowDownRightIcon,
  flat: MinusIcon,
};

// Static objects (no theme-callback functions) - KpiCard is rendered from
// Server Components, and MUI's components are all "use client", so a
// function-valued sx prop can't cross that boundary (runtime error, not a
// build-time one). var(--mui-palette-*) + color-mix() stand in for the
// theme.palette.x/alpha() calls a client-only sx callback would use.
const TONE_TILE_SX: Record<KpiTone, object> = {
  default: {
    bgcolor: "var(--mui-palette-action-selected)",
    color: "var(--mui-palette-text-secondary)",
  },
  success: {
    bgcolor: "var(--mui-palette-success-main)",
    color: "#FFFFFF",
  },
  warning: {
    bgcolor: "var(--mui-palette-warning-main)",
    color: "#FFFFFF",
  },
  destructive: {
    bgcolor: "var(--mui-palette-error-main)",
    color: "#FFFFFF",
  },
  info: {
    bgcolor: "var(--signal-display)",
    color: "#1A0E07",
  },
};

/**
 * One headline metric.
 *
 * Icon tile on the left, label and reading on the right, movement
 * underneath. The tile is a solid fill rather than a tint because at
 * 44px it is the thing that lets someone find the right card without
 * reading any of them - which is the entire job of a KPI row.
 *
 * `tone` colours only the tile. It never colours the number: a red "0"
 * under "Out of stock" would be saying the opposite of what is true, and
 * tone here is a category cue, not a judgement about the current value.
 */
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  sx,
}: KpiCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
        height: "100%",
        px: 2.25,
        py: 2.25,
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--mui-palette-divider)",
        bgcolor: "background.paper",
        transition:
          "border-color 160ms var(--ease-standard), transform 160ms var(--ease-out)",
        "&:hover": { borderColor: "var(--mui-palette-text-disabled)" },
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
        {Icon ? (
          <Box
            aria-hidden
            sx={{
              display: "flex",
              width: 44,
              height: 44,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-control)",
              ...TONE_TILE_SX[tone],
            }}
          >
            <Icon size={21} strokeWidth={2} />
          </Box>
        ) : null}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="span"
            noWrap
            sx={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "text.secondary",
            }}
          >
            {label}
          </Typography>
          <Typography
            component="p"
            className="numeric"
            sx={{
              mt: 0.25,
              fontSize: { xs: "1.5rem", lg: "1.75rem" },
              fontWeight: 600,
              lineHeight: 1.15,
              color: "text.primary",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>

      {trend && TrendIcon ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: "auto",
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          <TrendIcon
            aria-hidden
            size={14}
            strokeWidth={2.4}
            style={{ flexShrink: 0, color: TREND_COLOR[trend.direction] }}
          />
          <Box component="span">{trend.label}</Box>
        </Box>
      ) : null}
    </Box>
  );
}

export { KpiCard, type KpiTone };
