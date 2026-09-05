import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "@/types/database";

const CHART_WINDOW_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;

export type StockMovementDay = {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string;
  inbound: number;
  outbound: number;
};

type MovementDirection = "in" | "out" | "none";

/**
 * Classifies a stock_movements row for the chart (phase2c.md, decision
 * followed as recommended - see PROGRESS.md rather than a dedicated ADR
 * since it wasn't overridden): `in`/`returned` are inbound, `out`/
 * `damaged` are outbound, `transfer` has no net quantity change so it's
 * excluded from the chart entirely, and `adjust` is classified by the
 * sign of its own `quantity_change`.
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

/**
 * Daily inbound/outbound totals for the last 30 UTC calendar days
 * (including today), with every day present even at zero so the chart's
 * x-axis is continuous rather than skipping quiet days.
 */
export async function getStockMovementSeries(): Promise<StockMovementDay[]> {
  const supabase = await createClient();

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (CHART_WINDOW_DAYS - 1));

  const { data, error } = await supabase
    .from("stock_movements")
    .select("movement_type, quantity_change, created_at")
    .gte("created_at", since.toISOString());

  if (error) throw error;

  const days = new Map<string, StockMovementDay>();
  for (let i = 0; i < CHART_WINDOW_DAYS; i++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    days.set(key, { date: key, inbound: 0, outbound: 0 });
  }

  for (const row of data ?? []) {
    const bucket = days.get(row.created_at.slice(0, 10));
    if (!bucket) continue;

    const direction = classifyMovement(row.movement_type, row.quantity_change);
    const amount = Math.abs(row.quantity_change);
    if (direction === "in") bucket.inbound += amount;
    else if (direction === "out") bucket.outbound += amount;
  }

  return Array.from(days.values());
}

export type RecentActivityItem = {
  id: string;
  description: string;
  timestamp: string;
  /** Null both when no actor was recorded and when RLS hides the actor's
   * profile from the current viewer - the two are indistinguishable from
   * here, so neither is presented as an error or as "Unknown". */
  actorName: string | null;
};

const MOVEMENT_VERB: Record<MovementType, string> = {
  in: "Received",
  out: "Shipped",
  transfer: "Transferred",
  adjust: "Adjusted",
  damaged: "Marked damaged",
  returned: "Returned",
};

function describeMovement(
  type: MovementType,
  quantityChange: number,
  part: { part_number: string; name: string } | null,
): string {
  const verb = MOVEMENT_VERB[type];
  const quantity = Math.abs(quantityChange);
  const partLabel = part ? `${part.name} (${part.part_number})` : "a part";
  return `${verb} ${quantity} × ${partLabel}`;
}

/**
 * Last `limit` stock movements, each described in plain language with
 * the part it affected and (when visible to this viewer) who did it.
 * Deliberately three small queries instead of a PostgREST embed: this
 * hand-authored `types/database.ts` doesn't declare `Relationships`, so
 * embedded selects can't be typed against it, and the row volume here
 * doesn't yet justify solving that - see docs/decisions or `getLowStockCount`
 * for the same "fetch flat, join in JS" precedent from Phase 2a.
 */
export async function getRecentActivity(
  limit = RECENT_ACTIVITY_LIMIT,
): Promise<RecentActivityItem[]> {
  const supabase = await createClient();

  const { data: movements, error } = await supabase
    .from("stock_movements")
    .select(
      "id, movement_type, quantity_change, created_at, inventory_part_id, created_by",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!movements || movements.length === 0) return [];

  const partIds = [...new Set(movements.map((m) => m.inventory_part_id))];
  const actorIds = [
    ...new Set(
      movements
        .map((m) => m.created_by)
        .filter((id): id is string => id !== null),
    ),
  ];

  const [
    { data: parts, error: partsError },
    { data: actors, error: actorsError },
  ] = await Promise.all([
    supabase
      .from("inventory_parts")
      .select("id, part_number, name")
      .in("id", partIds),
    actorIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (partsError) throw partsError;
  if (actorsError) throw actorsError;

  const partById = new Map((parts ?? []).map((p) => [p.id, p]));
  const actorNameById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));

  return movements.map((movement) => ({
    id: movement.id,
    description: describeMovement(
      movement.movement_type,
      movement.quantity_change,
      partById.get(movement.inventory_part_id) ?? null,
    ),
    timestamp: movement.created_at,
    actorName:
      (movement.created_by && actorNameById.get(movement.created_by)) || null,
  }));
}
