import { PlusIcon } from "lucide-react";
import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { firstParam } from "@/lib/search-params";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { NavLinkButton } from "@/components/shared/nav-link-button";
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Parts"
        description="The master catalogue - part numbers, OEM references, and cross-references."
        action={
          can(user.role, "catalogue.manage") ? (
            <NavLinkButton
              href="/catalogue/parts/new"
              variant="contained"
              startIcon={<PlusIcon size={16} />}
            >
              Add part
            </NavLinkButton>
          ) : null
        }
      />

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
    </Box>
  );
}
