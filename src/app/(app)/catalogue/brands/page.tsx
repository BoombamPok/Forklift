import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBrandList } from "@/features/catalogue/queries";
import { BrandTable } from "../brand-table";

export default async function CatalogueBrandsPage() {
  const user = await requireRole("catalogue.view");

  let rows;
  try {
    rows = await getBrandList();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Brands"
        description="The manufacturers behind every model and catalogue part."
      />

      <BrandTable rows={rows} canManage={can(user.role, "catalogue.manage")} />
    </Box>
  );
}
