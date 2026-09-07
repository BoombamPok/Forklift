import * as React from "react";
import type { LucideIcon } from "lucide-react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/material/styles";

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
  up: "success.main",
  down: "error.main",
  flat: "text.secondary",
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
};

const TONE_ACCENT: Record<KpiTone, string> = {
  default: "text.disabled",
  success: "success.main",
  warning: "warning.main",
  destructive: "error.main",
  info: "info.main",
};

/**
 * The KPI primitive dashboard/report screens build on. `tone` tints the
 * icon chip to match what the metric means (e.g. warning for low stock)
 * - purely a semantic color cue, not a claim the card is interactive, so
 * no hover/press affordance is added here.
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
    <Card sx={{ position: "relative", overflow: "hidden", ...sx }}>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 3,
          bgcolor: TONE_ACCENT[tone],
        }}
      />
      <CardContent sx={{ pt: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            {label}
          </Typography>
          {Icon ? (
            <Box
              sx={{
                display: "flex",
                width: 32,
                height: 32,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1.5,
                ...TONE_CHIP_SX[tone],
              }}
            >
              <Icon aria-hidden size={16} />
            </Box>
          ) : null}
        </Box>
        <Typography
          sx={{
            mt: 1,
            fontFamily: "var(--font-roboto-mono)",
            fontSize: "1.75rem",
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </Typography>
        {trend ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              color: TREND_COLOR[trend.direction],
            }}
          >
            {trend.label}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { KpiCard, type KpiTone };
