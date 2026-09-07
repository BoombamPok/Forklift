import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import {
  ActivityList,
  type ActivityTone,
} from "@/components/shared/activity-list";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { toErrorKind } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/utils";
import {
  getRecentActivity,
  type MovementDirection,
} from "@/features/dashboard/activity";

const DIRECTION_TONE: Record<MovementDirection, ActivityTone> = {
  in: "positive",
  out: "negative",
  none: "neutral",
};

/**
 * Its own widget/Suspense boundary so this can't be taken down by, or
 * take down, the stock-movement chart next to it.
 */
async function RecentActivityWidget() {
  let items;
  try {
    items = await getRecentActivity();
  } catch (error) {
    return (
      <Card>
        <CardHeader
          title={<Typography variant="h6">Recent activity</Typography>}
        />
        <CardContent sx={{ pt: 0 }}>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">Recent activity</Typography>}
      />
      <CardContent sx={{ pt: 0 }}>
        <MotionFadeIn>
          <ActivityList
            items={items.map((item) => ({
              id: item.id,
              description: item.actorName
                ? `${item.description} · ${item.actorName}`
                : item.description,
              timestamp: formatRelativeTime(item.timestamp),
              tone: DIRECTION_TONE[item.direction],
            }))}
          />
        </MotionFadeIn>
      </CardContent>
    </Card>
  );
}

export { RecentActivityWidget };
