import * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";

type ActivityItem = {
  id: string;
  description: string;
  timestamp: string;
};

type ActivityListProps = {
  items: ActivityItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

/**
 * The activity-list primitive dashboard/detail screens build on (phase1.md
 * #48) - real activity/audit data starts flowing in Phase 2+.
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
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start justify-between gap-3 text-sm"
        >
          <span className="text-foreground">{item.description}</span>
          <time className="shrink-0 text-xs text-muted-foreground">
            {item.timestamp}
          </time>
        </li>
      ))}
    </ul>
  );
}

export { ActivityList, type ActivityItem };
