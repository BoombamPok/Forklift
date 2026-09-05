import * as React from "react";

import { cn } from "@/lib/utils";
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

const TONE_DOT: Record<ActivityTone, string> = {
  positive: "bg-success",
  negative: "bg-destructive",
  neutral: "bg-muted-foreground/40",
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
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
        >
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              TONE_DOT[item.tone ?? "neutral"],
            )}
          />
          <span className="min-w-0 flex-1 text-foreground">
            {item.description}
          </span>
          <time className="shrink-0 text-xs text-muted-foreground">
            {item.timestamp}
          </time>
        </li>
      ))}
    </ul>
  );
}

export { ActivityList, type ActivityItem, type ActivityTone };
