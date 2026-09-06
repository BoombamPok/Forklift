import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPartLabelsById } from "@/features/reports/shared";

export type StockAgingRow = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  quantity: number;
  lastActivityAt: string;
  hasMovementHistory: boolean;
};

/**
 * Time since each live inventory part's most recent non-`transfer`
 * movement (phase6.md §4/§6) - a transfer doesn't represent stock being
 * used or replenished, so it never resets the aging clock, matching
 * Phase 2c's transfer-exclusion precedent for the dashboard's movement
 * chart (`src/lib/stock-movements.ts`'s `classifyMovement`). A part that
 * has never moved reads as sitting since it was created
 * (`hasMovementHistory: false`), never a fabricated "0 days idle".
 * Deliberately unbounded by date range - unlike the movement/movers
 * reports, "how long has this been sitting" needs to look arbitrarily
 * far back. Sorted oldest-activity-first; `getSlowMovers`
 * (src/features/reports/movements.ts) reuses this exact ordering per
 * phase6.md §5.
 */
export async function getStockAgingRows(): Promise<StockAgingRow[]> {
  const supabase = await createClient();

  const { data: parts, error } = await supabase
    .from("inventory_parts")
    .select("id, part_number, name, quantity, created_at")
    .is("deleted_at", null);
  if (error) throw error;

  const partIds = (parts ?? []).map((p) => p.id);

  const lastActivityByPart = new Map<string, string>();
  if (partIds.length > 0) {
    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("inventory_part_id, created_at")
      .in("inventory_part_id", partIds)
      .neq("movement_type", "transfer");
    if (movementsError) throw movementsError;

    for (const movement of movements ?? []) {
      const current = lastActivityByPart.get(movement.inventory_part_id);
      if (!current || movement.created_at > current) {
        lastActivityByPart.set(movement.inventory_part_id, movement.created_at);
      }
    }
  }

  const labelsById = await getPartLabelsById(partIds);

  return (parts ?? [])
    .map((part) => {
      const lastMovementAt = lastActivityByPart.get(part.id);
      return {
        id: part.id,
        partNumber: part.part_number,
        name: part.name,
        brandName: labelsById.get(part.id)?.brandName ?? null,
        quantity: part.quantity,
        lastActivityAt: lastMovementAt ?? part.created_at,
        hasMovementHistory: lastMovementAt !== undefined,
      };
    })
    .sort((a, b) =>
      a.lastActivityAt < b.lastActivityAt
        ? -1
        : a.lastActivityAt > b.lastActivityAt
          ? 1
          : 0,
    );
}
