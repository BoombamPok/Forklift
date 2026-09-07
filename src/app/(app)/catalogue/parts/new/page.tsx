import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/shared/page-header";
import {
  getBrandOptions,
  getCategoryOptions,
} from "@/features/catalogue/queries";
import { CataloguePartForm } from "../catalogue-part-form";

export default async function NewCataloguePartPage() {
  await requireRole("catalogue.manage");

  const [brandOptions, categoryOptions] = await Promise.all([
    getBrandOptions(),
    getCategoryOptions(),
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PageHeader title="Add catalogue part" />
      <CataloguePartForm
        mode="create"
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
      />
    </Box>
  );
}
