import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { HierarchyBreadcrumb } from "@/components/shared/hierarchy-breadcrumb";
import type { ComboboxOption } from "@/components/shared/combobox";
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {detail.name}
            </Typography>
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {detail.brand.name}
            {detail.modelCode ? ` · ${detail.modelCode}` : ""}
            {detail.fuelType ? ` · ${detail.fuelType}` : ""}
          </Typography>
        </Box>

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
      </Box>

      <Card>
        <CardHeader
          title="Compatible parts"
          slotProps={{ title: { component: "h3" } }}
        />
        <CardContent>
          <CompatiblePartsTable parts={detail.compatibleParts} />
        </CardContent>
      </Card>
    </Box>
  );
}
