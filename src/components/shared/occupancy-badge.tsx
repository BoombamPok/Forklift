import { StatusBadge } from "@/components/shared/status-badge";

type OccupancyBadgeProps = {
  boxesOccupied: number;
  boxesTotal: number;
};

/**
 * The one occupancy indicator used at every level (warehouse/rack/shelf) -
 * a plain, honest ratio against real `inventory_parts.box_id` counts, never
 * a chart or a fabricated "capacity" figure (phase4.md §3/§9: this phase
 * shows current occupancy, not trends - that's Phase 6).
 */
function OccupancyBadge({ boxesOccupied, boxesTotal }: OccupancyBadgeProps) {
  if (boxesTotal === 0) {
    return <StatusBadge label="No boxes yet" tone="secondary" />;
  }

  return (
    <StatusBadge
      label={`${boxesOccupied}/${boxesTotal} boxes occupied`}
      tone={boxesOccupied === 0 ? "secondary" : "outline"}
    />
  );
}

export { OccupancyBadge };
