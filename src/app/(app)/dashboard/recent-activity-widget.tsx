import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import {
  ActivityList,
  type ActivityTone,
} from "@/components/shared/activity-list";
import { ErrorState } from "@/components/shared/error-state";
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
        <CardContent>
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
      <CardContent>
        <ActivityList
          items={items.map((item) => ({
            id: item.id,
            description: item.description,
            // Attribution gets its own line. Joining it on with a middot
            // produced one long unbreakable string that wrapped badly in
            // a narrow column and buried the event itself.
            meta: item.actorName ?? undefined,
            timestamp: formatRelativeTime(item.timestamp),
            tone: DIRECTION_TONE[item.direction],
          }))}
        />
      </CardContent>
    </Card>
  );
}

export { RecentActivityWidget };
