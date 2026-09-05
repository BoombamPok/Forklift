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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  className?: string;
  /**
   * Server-driven pagination/sorting (phase3.md's inventory list): when
   * `manualPagination`/`manualSorting` is true, `data` is assumed to
   * already be the current page in the current sort order, and
   * `onPaginationChange`/`onSortingChange` are the only way the state
   * changes - the table never paginates/sorts client-side. Every one of
   * these is optional and off by default, so every existing caller
   * (LowStockTable, etc.) is unaffected.
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
 * screens). Establishes the architecture per phase1.md #23 - actual
 * inventory/catalogue tables are wired up starting Phase 3.
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
  className,
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
          aria-label="Select all rows"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
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
      />
    );
  }

  if (isLoading) {
    return <LoadingState variant="table" rows={pageSize > 8 ? 8 : pageSize} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  const pageCount = manualPagination
    ? (manualPageCount ?? 0)
    : table.getPageCount();

  return (
    <div className={cn("space-y-3", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ml-2.5 h-7 gap-1 px-2.5 font-medium"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sortDirection === "asc" ? (
                          <ArrowUpIcon className="size-3.5" />
                        ) : sortDirection === "desc" ? (
                          <ArrowDownIcon className="size-3.5" />
                        ) : (
                          <ArrowUpDownIcon className="size-3.5 opacity-40" />
                        )}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
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

      {pageCount > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
          </p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon /> Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { DataTable };
