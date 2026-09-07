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
 *
 * The faint diagonal hatch is the one piece of ornament in the design and
 * it is here on purpose: it borrows the marking used on an unassigned bay
 * or an out-of-service slot on a warehouse floor, so an empty region
 * reads as "nothing is stored here yet" rather than as a component that
 * failed to load. A dashed border - the usual choice - says "drop zone",
 * which is a promise this app doesn't keep.
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
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--mui-palette-divider)",
        backgroundImage:
          "repeating-linear-gradient(135deg, var(--mui-palette-action-hover) 0 1px, transparent 1px 9px)",
        px: 3,
        py: 6,
        textAlign: "center",
        ...sx,
      }}
    >
      {Icon ? (
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-control)",
            border: "1px solid var(--mui-palette-divider)",
            bgcolor: "background.paper",
            color: "text.secondary",
          }}
        >
          <Icon size={18} />
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
            sx={{ mt: 0.25, maxWidth: "42ch", mx: "auto" }}
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
