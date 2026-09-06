import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPartLabelsById } from "@/features/reports/shared";
import { getStockAgingRows } from "@/features/reports/aging";
import { rangeToTimestamps, type DateRange } from "@/features/reports/schema";
import type { MovementType } from "@/types/database";

export const ALL_MOVEMENT_TYPES: MovementType[] = [
  "in",
  "out",
  "transfer",
  "adjust",
  "damaged",
  "returned",
];

type RawMovementRow = {
  inventory_part_id: string;
  movement_type: MovementType;
  quantity_change: number;
  created_at: string;
};

/**
 * The one range-bound fetch of `stock_movements` shared by the movement
 * chart/summary and the fast/slow-movers report (phase6.md §6 - "share a
 * common date-range-filtered movement query where practical").
 */
async function fetchMovementsInRange(
  range: DateRange,
): Promise<RawMovementRow[]> {
  const { since, until } = rangeToTimestamps(range);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("inventory_part_id, movement_type, quantity_change, created_at")
    .gte("created_at", since)
    .lte("created_at", until);

  if (error) throw error;
  return data ?? [];
}

function daysBetween(from: string, to: string): number {
  const ms =
    new Date(`${to}T00:00:00.000Z`).getTime() -
    new Date(`${from}T00:00:00.000Z`).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export type MovementTypeDay = { date: string } & Record<MovementType, number>;

function emptyDay(date: string): MovementTypeDay {
  return {
    date,
    in: 0,
    out: 0,
    transfer: 0,
    adjust: 0,
    damaged: 0,
    returned: 0,
  };
}

/**
 * Daily totals for every one of the 6 real movement types over the
 * selected range (phase6.md §4 - the dashboard's own chart deliberately
 * collapses this to inbound/outbound; this report is the place for the
 * full picture). Every day in the range is present even at zero, same
 * "continuous x-axis" convention as `getStockMovementSeries`
 * (src/features/dashboard/activity.ts).
 */
export async function getMovementTypeSeries(
  range: DateRange,
): Promise<MovementTypeDay[]> {
  const rows = await fetchMovementsInRange(range);

  const days = new Map<string, MovementTypeDay>();
  const dayCount = daysBetween(range.from, range.to) + 1;
  for (let i = 0; i < dayCount; i++) {
    const day = new Date(`${range.from}T00:00:00.000Z`);
    day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    days.set(key, emptyDay(key));
  }

  for (const row of rows) {
    const bucket = days.get(row.created_at.slice(0, 10));
    if (!bucket) continue;
    bucket[row.movement_type] += Math.abs(row.quantity_change);
  }

  return [...days.values()];
}

export type MovementTypeSummaryRow = {
  type: MovementType;
  totalQuantity: number;
  movementCount: number;
};

/** One row per movement type for the range - the chart's supporting table. */
export async function getMovementTypeSummary(
  range: DateRange,
): Promise<MovementTypeSummaryRow[]> {
  const rows = await fetchMovementsInRange(range);

  const totals = new Map(
    ALL_MOVEMENT_TYPES.map((type) => [type, { qty: 0, count: 0 }]),
  );
  for (const row of rows) {
    const bucket = totals.get(row.movement_type)!;
    bucket.qty += Math.abs(row.quantity_change);
    bucket.count += 1;
  }

  return ALL_MOVEMENT_TYPES.map((type) => ({
    type,
    totalQuantity: totals.get(type)!.qty,
    movementCount: totals.get(type)!.count,
  }));
}

export type MoverRow = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  quantityMoved: number;
  movementCount: number;
};

const FAST_MOVER_LIMIT = 20;

/**
 * Ranks parts by `sum(abs(quantity_change))` over non-`transfer`
 * movements in the selected range (phase6.md §5's accepted default -
 * see `docs/decisions/` for whether this was overridden). Top 20 by
 * that ranking.
 */
export async function getFastMovers(
  range: DateRange,
  limit = FAST_MOVER_LIMIT,
): Promise<MoverRow[]> {
  const rows = (await fetchMovementsInRange(range)).filter(
    (row) => row.movement_type !== "transfer",
  );

  const totals = new Map<string, { qty: number; count: number }>();
  for (const row of rows) {
    const bucket = totals.get(row.inventory_part_id) ?? { qty: 0, count: 0 };
    bucket.qty += Math.abs(row.quantity_change);
    bucket.count += 1;
    totals.set(row.inventory_part_id, bucket);
  }

  const partIds = [...totals.keys()];
  if (partIds.length === 0) return [];

  const labelsById = await getPartLabelsById(partIds);

  return partIds
    .map((id) => {
      const label = labelsById.get(id);
      if (!label) return null;
      const totalsForPart = totals.get(id)!;
      return {
        id,
        partNumber: label.partNumber,
        name: label.name,
        brandName: label.brandName,
        quantityMoved: totalsForPart.qty,
        movementCount: totalsForPart.count,
      };
    })
    .filter((row): row is MoverRow => row !== null)
    .sort((a, b) => b.quantityMoved - a.quantityMoved)
    .slice(0, limit);
}

export type SlowMoverRow = {
  id: string;
  partNumber: string;
  name: string;
  brandName: string | null;
  lastActivityAt: string;
  hasMovementHistory: boolean;
};

/**
 * Live parts with zero qualifying (non-`transfer`) movements in the
 * selected range, sorted longest-idle-first via `getStockAgingRows`
 * (src/features/reports/aging.ts) - phase6.md §5 ties slow movers to the
 * same ordering as the Stock Aging report rather than inventing a
 * second one.
 */
export async function getSlowMovers(range: DateRange): Promise<SlowMoverRow[]> {
  const rows = (await fetchMovementsInRange(range)).filter(
    (row) => row.movement_type !== "transfer",
  );
  const movedPartIds = new Set(rows.map((row) => row.inventory_part_id));

  const aging = await getStockAgingRows();

  return aging
    .filter((row) => !movedPartIds.has(row.id))
    .map(
      ({
        id,
        partNumber,
        name,
        brandName,
        lastActivityAt,
        hasMovementHistory,
      }) => ({
        id,
        partNumber,
        name,
        brandName,
        lastActivityAt,
        hasMovementHistory,
      }),
    );
}
