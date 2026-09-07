import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { firstParam } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import {
  getBrandOptions,
  getCataloguePartList,
  getCategoryOptions,
  type CatalogueSortColumn,
} from "@/features/catalogue/queries";
import type { VerificationStatus } from "@/types/database";
import { PartsFilters } from "./parts-filters";
import { PartsTable } from "./parts-table";

const PAGE_SIZE = 20;
const SORT_COLUMNS: CatalogueSortColumn[] = [
  "part_number",
  "name",
  "verification_status",
];
const VERIFICATION_STATUSES: VerificationStatus[] = [
  "verified",
  "unverified",
  "uncertain",
];

/**
 * The real, paginated/searchable/filterable catalogue parts list
 * (phase5.md §4), replacing the Phase 1 placeholder.
 */
export default async function CataloguePartsPage(
  props: PageProps<"/catalogue/parts">,
) {
  const user = await requireRole("catalogue.view");
  const searchParams = await props.searchParams;

  const page = Math.max(1, Number(firstParam(searchParams.page)) || 1);
  const sortByParam = firstParam(searchParams.sortBy);
  const sortBy = SORT_COLUMNS.includes(sortByParam as CatalogueSortColumn)
    ? (sortByParam as CatalogueSortColumn)
    : "part_number";
  const sortDir = firstParam(searchParams.sortDir) === "desc" ? "desc" : "asc";

  const search = firstParam(searchParams.q);
  const brandId = firstParam(searchParams.brandId);
  const categoryId = firstParam(searchParams.categoryId);

  const fastenerParam = firstParam(searchParams.fastener);
  const isFastener =
    fastenerParam === "yes" ? true : fastenerParam === "no" ? false : undefined;

  const verificationParam = firstParam(searchParams.verification);
  const verificationStatus = VERIFICATION_STATUSES.includes(
    verificationParam as VerificationStatus,
  )
    ? (verificationParam as VerificationStatus)
    : undefined;

  let rows, totalCount, brandOptions, categoryOptions;
  try {
    [{ rows, totalCount }, brandOptions, categoryOptions] = await Promise.all([
      getCataloguePartList({
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir,
        search,
        brandId,
        categoryId,
        isFastener,
        verificationStatus,
      }),
      getBrandOptions(),
      getCategoryOptions(),
    ]);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Parts
          </h2>
          <p className="text-sm text-muted-foreground">
            The master catalogue - part numbers, OEM references, and
            cross-references.
          </p>
        </div>
        {can(user.role, "catalogue.manage") ? (
          <Button asChild variant="gradient">
            <Link href="/catalogue/parts/new">
              <PlusIcon /> Add part
            </Link>
          </Button>
        ) : null}
      </div>

      <PartsFilters
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        search={search}
        brandId={brandId}
        categoryId={categoryId}
        fastener={fastenerParam}
        verificationStatus={verificationParam}
      />

      <PartsTable
        rows={rows}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
