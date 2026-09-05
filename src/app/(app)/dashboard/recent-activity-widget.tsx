import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 * Its own widget/Suspense boundary (phase2c.md) so this can't be taken
 * down by a stock-movement chart failure, or vice versa.
 */
async function RecentActivityWidget() {
  let items;
  try {
    items = await getRecentActivity();
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
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
