import type { MovementType } from "@/types/database";

export type MovementDirection = "in" | "out" | "none";

/**
 * Classifies a stock_movements row's net effect on quantity: `in`/
 * `returned` are inbound, `out`/`damaged` are outbound, `transfer` has
 * no net quantity change so it's excluded entirely, and `adjust` is
 * classified by the sign of its own `quantity_change`. Shared by the
 * dashboard's chart/activity feed (phase2c.md) and the inventory part
 * detail page's movement history (phase3.md §6) - extracted here once
 * both needed it, rather than duplicated.
 */
export function classifyMovement(
  type: MovementType,
  quantityChange: number,
): MovementDirection {
  switch (type) {
    case "in":
    case "returned":
      return "in";
    case "out":
    case "damaged":
      return "out";
    case "transfer":
      return "none";
    case "adjust":
      if (quantityChange > 0) return "in";
      if (quantityChange < 0) return "out";
      return "none";
  }
}

const MOVEMENT_VERB: Record<MovementType, string> = {
  in: "Received",
  out: "Shipped",
  transfer: "Transferred",
  adjust: "Adjusted",
  damaged: "Marked damaged",
  returned: "Returned",
};

/**
 * Plain-language description of a movement ("Received 25 × Sample Oil
 * Filter (SAMPLE-0001)") instead of a raw enum value - the one place
 * this phrasing is decided, so the dashboard feed and the part detail
 * page's history always agree.
 */
export function describeMovement(
  type: MovementType,
  quantityChange: number,
  part: { part_number: string; name: string } | null,
): string {
  const verb = MOVEMENT_VERB[type];
  const quantity = Math.abs(quantityChange);
  const partLabel = part ? `${part.name} (${part.part_number})` : "a part";
  return `${verb} ${quantity} × ${partLabel}`;
}
