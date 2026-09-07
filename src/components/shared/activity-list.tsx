import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/shared/empty-state";

type ActivityTone = "positive" | "negative" | "neutral";

type ActivityItem = {
  id: string;
  description: string;
  timestamp: string;
  /** Who did it, when that's known. Rendered on its own line rather than
   * appended to the description with a separator. */
  meta?: string;
  tone?: ActivityTone;
};

type ActivityListProps = {
  items: ActivityItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

const TONE_COLOR: Record<ActivityTone, string> = {
  positive: "var(--mui-palette-success-main)",
  negative: "var(--mui-palette-error-main)",
  neutral: "var(--mui-palette-text-disabled)",
};

/**
 * The activity-list primitive dashboard/detail screens build on.
 *
 * Items are separated by a hairline and connected by a continuous rule
 * behind the tone markers, so a run of movements reads as one ledger
 * rather than a stack of unrelated rows - which is what stock history
 * actually is.
 *
 * `tone` is a small colour cue (inbound vs outbound); the description
 * text always stands on its own without it.
 */
function ActivityList({
  items,
  emptyTitle = "No activity yet",
  emptyDescription = "Stock movements recorded against any part will appear here.",
}: ActivityListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        // The spine behind the markers. Inset from top and bottom so it
        // reads as connecting the entries, not as a stray border.
        "&::before": {
          content: '""',
          position: "absolute",
          left: "4px",
          top: 14,
          bottom: 14,
          width: "1px",
          bgcolor: "var(--rule)",
        },
      }}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item.id}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            py: 1.25,
            "& + &": { borderTop: "1px solid var(--rule)" },
          }}
        >
          <Box
            aria-hidden
            sx={{
              mt: "5px",
              width: 9,
              height: 9,
              flexShrink: 0,
              borderRadius: "50%",
              border: "2px solid var(--mui-palette-background-paper)",
              bgcolor: TONE_COLOR[item.tone ?? "neutral"],
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
              {item.description}
            </Typography>
            {item.meta ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.25 }}
              >
                {item.meta}
              </Typography>
            ) : null}
          </Box>
          <Typography
            component="time"
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, mt: "1px", whiteSpace: "nowrap" }}
          >
            {item.timestamp}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export { ActivityList, type ActivityItem, type ActivityTone };
