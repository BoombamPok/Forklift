import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import type { ComboboxOption } from "@/components/shared/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBrandOptions,
  getModelDetail,
  getModelFamilyOptions,
} from "@/features/catalogue/queries";
import { CompatiblePartsTable } from "./compatible-parts-table";
import { ModelDetailActions } from "./model-detail-actions";

export default async function CatalogueModelDetailPage(
  props: PageProps<"/catalogue/models/[id]">,
) {
  const user = await requireRole("catalogue.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getModelDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const canManage = can(user.role, "catalogue.manage");

  let brandOptions: ComboboxOption[] = [];
  let modelFamilyOptionsByBrand: Record<string, ComboboxOption[]> = {};
  if (canManage) {
    brandOptions = await getBrandOptions();
    const entries = await Promise.all(
      brandOptions.map(
        async (brand) =>
          [brand.value, await getModelFamilyOptions(brand.value)] as const,
      ),
    );
    modelFamilyOptionsByBrand = Object.fromEntries(entries);
  }

  return (
    <div className="space-y-6">
      <HierarchyBreadcrumb
        items={[
          { label: "Catalogue", href: "/catalogue" },
          {
            label: detail.brand.name,
            href: `/catalogue/models?brandId=${detail.brand.id}`,
          },
          ...(detail.modelFamily ? [{ label: detail.modelFamily.name }] : []),
          { label: detail.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {detail.name}
            </h2>
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {detail.brand.name}
            {detail.modelCode ? ` · ${detail.modelCode}` : ""}
            {detail.fuelType ? ` · ${detail.fuelType}` : ""}
          </p>
        </div>

        {canManage ? (
          <ModelDetailActions
            modelId={detail.id}
            brandOptions={brandOptions}
            modelFamilyOptionsByBrand={modelFamilyOptionsByBrand}
            defaultValues={{
              name: detail.name,
              brandId: detail.brand.id,
              modelFamilyId: detail.modelFamily?.id,
              modelCode: detail.modelCode ?? undefined,
              fuelType: detail.fuelType ?? undefined,
            }}
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compatible parts</CardTitle>
        </CardHeader>
        <CardContent>
          <CompatiblePartsTable parts={detail.compatibleParts} />
        </CardContent>
      </Card>
    </div>
  );
}
