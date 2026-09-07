import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { firstParam } from "@/lib/search-params";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import type { ComboboxOption } from "@/components/shared/combobox";
import {
  getBrandOptions,
  getModelFamilyList,
  getModelFamilyOptions,
  getModelList,
} from "@/features/catalogue/queries";
import { ModelFilters } from "./model-filters";
import { ModelTable } from "./model-table";
import { ModelFamilyTable } from "./model-family-table";

export default async function CatalogueModelsPage(
  props: PageProps<"/catalogue/models">,
) {
  const user = await requireRole("catalogue.view");
  const searchParams = await props.searchParams;
  const brandId = firstParam(searchParams.brandId);
  const canManage = can(user.role, "catalogue.manage");

  let brandOptions: ComboboxOption[], models, families;
  try {
    [brandOptions, models, families] = await Promise.all([
      getBrandOptions(),
      getModelList({ brandId }),
      getModelFamilyList(),
    ]);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const modelFamilyOptionsByBrand: Record<string, ComboboxOption[]> = {};
  await Promise.all(
    brandOptions.map(async (brand) => {
      modelFamilyOptionsByBrand[brand.value] = await getModelFamilyOptions(
        brand.value,
      );
    }),
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <PageHeader
        title="Models"
        description="Forklift models and the parts known to be compatible with them."
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <ModelFilters brandOptions={brandOptions} brandId={brandId} />
        <ModelTable
          rows={models}
          brandOptions={brandOptions}
          modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
          canManage={canManage}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Model families
        </Typography>
        <ModelFamilyTable
          rows={families}
          brandOptions={brandOptions}
          canManage={canManage}
        />
      </Box>
    </Box>
  );
}
