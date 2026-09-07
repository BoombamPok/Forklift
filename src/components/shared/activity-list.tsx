import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/shared/empty-state";

type ActivityTone = "positive" | "negative" | "neutral";

type ActivityItem = {
  id: string;
  description: string;
  timestamp: string;
  tone?: ActivityTone;
};

type ActivityListProps = {
  items: ActivityItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

const TONE_COLOR: Record<ActivityTone, string> = {
  positive: "success.main",
  negative: "error.main",
  neutral: "text.disabled",
};

/**
 * The activity-list primitive dashboard/detail screens build on. `tone`
 * is an optional small color cue (e.g. inbound vs outbound movement) -
 * purely decorative context, the description text always stands on its
 * own without it.
 */
function ActivityList({
  items,
  emptyTitle = "No activity yet",
  emptyDescription = "Actions taken across the app will show up here.",
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
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item.id}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderRadius: 2,
            px: 1,
            py: 1,
            fontSize: "0.875rem",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box
            aria-hidden
            sx={{
              mt: 0.8,
              width: 6,
              height: 6,
              flexShrink: 0,
              borderRadius: "50%",
              bgcolor: TONE_COLOR[item.tone ?? "neutral"],
            }}
          />
          <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }}>
            {item.description}
          </Typography>
          <Typography
            component="time"
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {item.timestamp}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export { ActivityList, type ActivityItem, type ActivityTone };
