"use client";

import * as React from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import type { ErrorKind } from "@/lib/errors";

const SELECTION_COLUMN_ID = "__select__";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  isLoading?: boolean;
  error?: { kind?: ErrorKind; message?: string; onRetry?: () => void };
  emptyState?: { title: string; description?: string };
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  pageSize?: number;
  sx?: SxProps<Theme>;
  /**
   * Server-driven pagination/sorting: when `manualPagination`/
   * `manualSorting` is true, `data` is assumed to already be the current
   * page in the current sort order, and `onPaginationChange`/
   * `onSortingChange` are the only way the state changes - the table
   * never paginates/sorts client-side. Every one of these is optional
   * and off by default, so every existing caller is unaffected.
   */
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
};

/**
 * The one reusable table pattern the app builds on (sorting, pagination,
 * row selection, loading/empty/error states, horizontal scroll on small
 * screens).
 */
function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading,
  error,
  emptyState = { title: "Nothing here yet" },
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  pageSize = 20,
  sx,
  manualPagination = false,
  pageCount: manualPageCount,
  pagination: controlledPagination,
  onPaginationChange,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    [],
  );
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    onSortingChange?.(next);
    if (!controlledSorting) setInternalSorting(next);
  };

  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });
  const pagination = controlledPagination ?? internalPagination;
  const setPagination = (
    updater:
      | { pageIndex: number; pageSize: number }
      | ((old: { pageIndex: number; pageSize: number }) => {
          pageIndex: number;
          pageSize: number;
        }),
  ) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    onPaginationChange?.(next);
    if (!controlledPagination) setInternalPagination(next);
  };

  const [internalSelection, setInternalSelection] =
    React.useState<RowSelectionState>({});

  const effectiveSelection = rowSelection ?? internalSelection;
  const setSelection = (
    updater:
      RowSelectionState | ((old: RowSelectionState) => RowSelectionState),
  ) => {
    const next =
      typeof updater === "function" ? updater(effectiveSelection) : updater;
    onRowSelectionChange?.(next);
    if (!rowSelection) setInternalSelection(next);
  };

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableRowSelection) return columns;
    const selectionColumn: ColumnDef<TData, unknown> = {
      id: SELECTION_COLUMN_ID,
      header: ({ table }) => (
        <Checkbox
          size="small"
          slotProps={{ input: { "aria-label": "Select all rows" } }}
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            !table.getIsAllPageRowsSelected() &&
            table.getIsSomePageRowsSelected()
          }
          onChange={(_, checked) => table.toggleAllPageRowsSelected(checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          size="small"
          slotProps={{ input: { "aria-label": "Select row" } }}
          checked={row.getIsSelected()}
          onChange={(_, checked) => row.toggleSelected(checked)}
        />
      ),
      enableSorting: false,
      size: 32,
    };
    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection: effectiveSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setSelection,
    onPaginationChange: setPagination,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination,
    manualSorting,
    pageCount: manualPagination ? (manualPageCount ?? -1) : undefined,
  });

  if (error) {
    return (
      <ErrorState
        kind={error.kind}
        description={error.message}
        onRetry={error.onRetry}
        sx={{
          borderRadius: "var(--radius-panel)",
          bgcolor: "background.paper",
          ...sx,
        }}
      />
    );
  }

  if (isLoading) {
    // LoadingState's table variant already draws the panel frame and the
    // row rules, so wrapping it in another Paper would double the border.
    return (
      <LoadingState
        variant="table"
        rows={pageSize > 8 ? 8 : pageSize}
        sx={sx}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        sx={sx}
      />
    );
  }

  const pageCount = manualPagination
    ? (manualPageCount ?? 0)
    : table.getPageCount();

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: "var(--radius-panel)",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {/* The header stays put while the body scrolls - on a 200-row
          inventory list, losing the column labels two screens down is
          the difference between reading a number and guessing at it. */}
      <TableContainer sx={{ maxHeight: { lg: 640 } }}>
        <Table size="small" stickyHeader>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <TableCell
                      key={header.id}
                      sx={{
                        bgcolor: "background.default",
                        borderBottom: "1px solid var(--mui-palette-divider)",
                        py: 1.25,
                      }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <TableSortLabel
                          active={!!sortDirection}
                          direction={sortDirection || "asc"}
                          onClick={header.column.getToggleSortingHandler()}
                          IconComponent={() =>
                            sortDirection === "asc" ? (
                              <ArrowUpIcon
                                size={14}
                                style={{ marginLeft: 4 }}
                              />
                            ) : sortDirection === "desc" ? (
                              <ArrowDownIcon
                                size={14}
                                style={{ marginLeft: 4 }}
                              />
                            ) : (
                              <ArrowUpDownIcon
                                size={14}
                                style={{ marginLeft: 4, opacity: 0.4 }}
                              />
                            )
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </TableSortLabel>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                selected={row.getIsSelected()}
                hover
                sx={{
                  "& .MuiTableCell-root": {
                    borderBottom: "1px solid var(--rule)",
                  },
                  "&.Mui-selected": {
                    bgcolor: "color-mix(in srgb, var(--mui-palette-primary-main) 7%, transparent)",
                  },
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--mui-palette-divider)",
            bgcolor: "background.default",
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Page{" "}
            <Box
              component="span"
              className="numeric"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {table.getState().pagination.pageIndex + 1}
            </Box>{" "}
            of <Box component="span" className="numeric">{pageCount}</Box>
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<ChevronLeftIcon size={16} />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              endIcon={<ChevronRightIcon size={16} />}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </Box>
        </Box>
      ) : null}
    </Paper>
  );
}

export { DataTable };
