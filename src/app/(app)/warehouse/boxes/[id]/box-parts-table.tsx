"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRightIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { ComboboxOption } from "@/components/shared/combobox";
import { StockMovementDialog } from "@/features/inventory/stock-movement-dialog";
import type { BoxPartRow } from "@/features/warehouse/queries";
import type { InventoryStatus } from "@/types/database";

const STATUS_LABEL: Record<InventoryStatus, string> = {
  active: "Active",
  discontinued: "Discontinued",
  damaged: "Damaged",
};

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  active: "success",
  discontinued: "secondary",
  damaged: "destructive",
};

type BoxPartsTableProps = {
  boxId: string;
  parts: BoxPartRow[];
  boxOptions: ComboboxOption[];
  canTransfer: boolean;
};

/**
 * The box detail page's contents list (phase4.md §4), linking each part
 * back to its Phase 3 detail page. The "Transfer" shortcut reuses Phase
 * 3's `StockMovementDialog`/`recordStockMovement` verbatim (phase4.md's
 * last §4 bullet) - moving a part to a different box always goes through
 * the movement ledger, never a second, parallel box-change path.
 */
function BoxPartsTable({
  boxId,
  parts,
  boxOptions,
  canTransfer,
}: BoxPartsTableProps) {
  const [transferring, setTransferring] = React.useState<BoxPartRow | null>(
    null,
  );

  const columns: ColumnDef<BoxPartRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Part",
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          style={{ display: "block", textDecoration: "none" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.original.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: "var(--font-roboto-mono)" }}
          >
            {row.original.partNumber}
          </Typography>
        </Link>
      ),
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <Typography
          sx={{ fontFamily: "var(--font-roboto-mono)" }}
          variant="body2"
        >
          {row.original.quantity}
        </Typography>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={STATUS_LABEL[row.original.status]}
          tone={STATUS_TONE[row.original.status]}
        />
      ),
    },
    ...(canTransfer
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: BoxPartRow } }) => (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowLeftRightIcon size={16} />}
                  onClick={() => setTransferring(row.original)}
                >
                  Transfer
                </Button>
              </Box>
            ),
          } satisfies ColumnDef<BoxPartRow, unknown>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={parts}
        getRowId={(row) => row.id}
        emptyState={{
          title: "This box is empty",
          description: "No parts are currently assigned here.",
        }}
      />

      {transferring ? (
        <StockMovementDialog
          partId={transferring.id}
          currentQuantity={transferring.quantity}
          currentBoxId={boxId}
          boxOptions={boxOptions}
          open={transferring !== null}
          onOpenChange={(open) => {
            if (!open) setTransferring(null);
          }}
          initialType="transfer"
        />
      ) : null}
    </>
  );
}

export { BoxPartsTable };
