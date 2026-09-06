import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { firstParam } from "@/lib/search-params";
import { ErrorState } from "@/components/shared/error-state";
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
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Models
        </h2>
        <p className="text-sm text-muted-foreground">
          Forklift models and the parts known to be compatible with them.
        </p>
      </div>

      <div className="space-y-3">
        <ModelFilters brandOptions={brandOptions} brandId={brandId} />
        <ModelTable
          rows={models}
          brandOptions={brandOptions}
          modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
          canManage={canManage}
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold tracking-tight">
          Model families
        </h3>
        <ModelFamilyTable
          rows={families}
          brandOptions={brandOptions}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
