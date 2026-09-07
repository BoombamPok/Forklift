"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { OccupancyBadge } from "@/components/shared/occupancy-badge";
import type { OccupancyRollupRow } from "@/features/reports/occupancy";

const columns: ColumnDef<OccupancyRollupRow, unknown>[] = [
  { accessorKey: "warehouseName", header: "Warehouse" },
  { accessorKey: "rackCode", header: "Rack" },
  {
    accessorKey: "shelfCount",
    header: "Shelves",
    cell: ({ row }) => (
      <Typography
        sx={{ fontFamily: "var(--font-roboto-mono)" }}
        variant="body2"
      >
        {row.original.shelfCount}
      </Typography>
    ),
  },
  {
    id: "occupancy",
    header: "Occupancy",
    cell: ({ row }) => (
      <OccupancyBadge
        boxesOccupied={row.original.boxesOccupied}
        boxesTotal={row.original.boxesTotal}
      />
    ),
  },
];

function OccupancyTable({ rows }: { rows: OccupancyRollupRow[] }) {
  return (
    <DataTable columns={columns} data={rows} getRowId={(row) => row.rackId} />
  );
}

export { OccupancyTable };
