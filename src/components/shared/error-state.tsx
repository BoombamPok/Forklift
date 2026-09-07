import * as React from "react";
import {
  AlertTriangleIcon,
  LockIcon,
  SearchXIcon,
  ServerCrashIcon,
  type LucideIcon,
} from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";

import type { ErrorKind } from "@/lib/errors";

const ERROR_PRESETS: Record<
  ErrorKind,
  { icon: LucideIcon; title: string; description: string }
> = {
  permission: {
    icon: LockIcon,
    title: "You don't have access to this",
    description: "Ask an administrator if you believe this is a mistake.",
  },
  "not-found": {
    icon: SearchXIcon,
    title: "Not found",
    description: "This item may have been moved, renamed, or removed.",
  },
  network: {
    icon: ServerCrashIcon,
    title: "Connection problem",
    description: "Check your connection and try again.",
  },
  unexpected: {
    icon: AlertTriangleIcon,
    title: "Something went wrong",
    description: "Please try again. The issue has been logged.",
  },
};

type ErrorStateProps = {
  kind?: ErrorKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Kept for callers not yet migrated off Tailwind utility classes. */
  className?: string;
  sx?: SxProps<Theme>;
};

/**
 * Never render raw database/Supabase error text here - map it to one of
 * these kinds server-side first (see lib/errors.ts).
 */
function ErrorState({
  kind = "unexpected",
  title,
  description,
  onRetry,
  className,
  sx,
}: ErrorStateProps) {
  const preset = ERROR_PRESETS[kind];
  const Icon = preset.icon;

  return (
    <Box
      role="alert"
      className={className}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        px: 3,
        py: 6,
        textAlign: "center",
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          bgcolor:
            "color-mix(in srgb, var(--mui-palette-error-main) 10%, transparent)",
        }}
      >
        <Icon aria-hidden size={20} color="var(--mui-palette-error-main)" />
      </Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title ?? preset.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320 }}
        >
          {description ?? preset.description}
        </Typography>
      </Box>
      {onRetry ? (
        <Button variant="outlined" size="small" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Box>
  );
}

export { ErrorState };
