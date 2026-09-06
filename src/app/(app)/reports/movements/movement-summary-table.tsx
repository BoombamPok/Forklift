"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import type { MovementTypeSummaryRow } from "@/features/reports/movements";
import type { MovementType } from "@/types/database";

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  in: "In",
  out: "Out",
  transfer: "Transfer",
  adjust: "Adjust",
  damaged: "Damaged",
  returned: "Returned",
};

const columns: ColumnDef<MovementTypeSummaryRow, unknown>[] = [
  {
    accessorKey: "type",
    header: "Movement type",
    cell: ({ row }) => MOVEMENT_TYPE_LABEL[row.original.type],
  },
  {
    accessorKey: "totalQuantity",
    header: "Total quantity",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.totalQuantity}
      </span>
    ),
  },
  {
    accessorKey: "movementCount",
    header: "Movements",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {row.original.movementCount}
      </span>
    ),
  },
];

type MovementSummaryTableProps = { rows: MovementTypeSummaryRow[] };

function MovementSummaryTable({ rows }: MovementSummaryTableProps) {
  return (
    <DataTable columns={columns} data={rows} getRowId={(row) => row.type} />
  );
}

export { MovementSummaryTable };
