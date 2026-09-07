import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  getBoxOptions,
  getCatalogueOptions,
  getInventoryPartDetail,
} from "@/features/inventory/queries";
import { PartForm } from "../../part-form";

export default async function EditInventoryPartPage(
  props: PageProps<"/inventory/[id]/edit">,
) {
  await requireRole("inventory.edit");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getInventoryPartDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const [boxOptions, catalogueOptions] = await Promise.all([
    getBoxOptions(),
    getCatalogueOptions(),
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PageHeader title={`Edit ${detail.name}`} />
      <PartForm
        mode="edit"
        partId={detail.id}
        boxOptions={boxOptions}
        catalogueOptions={catalogueOptions}
        defaultValues={{
          partNumber: detail.partNumber,
          name: detail.name,
          boxId: detail.boxId ?? undefined,
          catalogueId: detail.catalogueLink?.id,
          purchaseCost: detail.purchaseCost ?? undefined,
          sellingPrice: detail.sellingPrice ?? undefined,
          status: detail.status,
          notes: detail.notes ?? undefined,
          minStock: detail.minStock ?? undefined,
        }}
      />
    </Box>
  );
}
