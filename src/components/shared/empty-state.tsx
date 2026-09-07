import * as React from "react";
import type { LucideIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Kept for callers not yet migrated off Tailwind utility classes. */
  className?: string;
  sx?: SxProps<Theme>;
};

/**
 * Standard empty-state pattern: what's empty, why it might be, what to do
 * next. Never render a bare "No data." per CLAUDE.md UX rules.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      role="status"
      className={className}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 3,
        border: 1,
        borderStyle: "dashed",
        borderColor: "divider",
        bgcolor: "action.hover",
        px: 3,
        py: 6,
        textAlign: "center",
        ...sx,
      }}
    >
      {Icon ? (
        <Box
          sx={{
            display: "flex",
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "action.selected",
          }}
        >
          <Icon aria-hidden size={20} />
        </Box>
      ) : null}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 320 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}

export { EmptyState };
