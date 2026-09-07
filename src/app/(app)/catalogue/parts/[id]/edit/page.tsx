import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  getBrandOptions,
  getCataloguePartDetail,
  getCategoryOptions,
} from "@/features/catalogue/queries";
import { CataloguePartForm } from "../../catalogue-part-form";

export default async function EditCataloguePartPage(
  props: PageProps<"/catalogue/parts/[id]/edit">,
) {
  await requireRole("catalogue.manage");
  const { id } = await props.params;

  let detail, brandOptions, categoryOptions;
  try {
    [detail, brandOptions, categoryOptions] = await Promise.all([
      getCataloguePartDetail(id),
      getBrandOptions(),
      getCategoryOptions(),
    ]);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PageHeader title="Edit catalogue part" />
      <CataloguePartForm
        mode="edit"
        partId={id}
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        defaultValues={{
          partNumber: detail.partNumber,
          name: detail.name,
          brandId: detail.brand?.id,
          categoryId: detail.category?.id,
          subCategory: detail.subCategory ?? undefined,
          assemblyGroup: detail.assemblyGroup ?? undefined,
          isFastener: detail.isFastener,
          capacityRangeKg: detail.capacityRangeKg ?? undefined,
          oemReference: detail.oemReference ?? undefined,
          description: detail.description ?? undefined,
          verificationStatus: detail.verificationStatus,
        }}
      />
    </Box>
  );
}
