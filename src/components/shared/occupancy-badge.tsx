import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

type OccupancyBadgeProps = {
  boxesOccupied: number;
  boxesTotal: number;
  className?: string;
};

/**
 * The one occupancy indicator used at every level (warehouse/rack/shelf) -
 * a plain, honest ratio against real `inventory_parts.box_id` counts, never
 * a chart or a fabricated "capacity" figure (phase4.md §3/§9: this phase
 * shows current occupancy, not trends - that's Phase 6). The meter is a
 * direct visualization of that same ratio, not a separate metric.
 */
function OccupancyBadge({
  boxesOccupied,
  boxesTotal,
  className,
}: OccupancyBadgeProps) {
  if (boxesTotal === 0) {
    return <StatusBadge label="No boxes yet" tone="secondary" />;
  }

  const percentage = Math.round((boxesOccupied / boxesTotal) * 100);

  return (
    <div
      role="img"
      aria-label={`${boxesOccupied} of ${boxesTotal} boxes occupied`}
      className={cn("flex items-center gap-2", className)}
    >
      <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            boxesOccupied === 0 ? "bg-transparent" : "bg-foreground/60",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {boxesOccupied}/{boxesTotal}
      </span>
    </div>
  );
}

export { OccupancyBadge };
