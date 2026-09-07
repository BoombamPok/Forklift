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
import { VerificationBadge } from "@/components/shared/verification-badge";
import { NavLinkText } from "@/components/shared/nav-link-text";
import type { ComboboxOption } from "@/components/shared/combobox";
import {
  getCataloguePartDetail,
  getModelOptions,
} from "@/features/catalogue/queries";
import { CataloguePartActions } from "./catalogue-part-actions";
import { CrossRefList } from "./cross-ref-list";
import { CompatibilityList } from "./compatibility-list";

export default async function CataloguePartDetailPage(
  props: PageProps<"/catalogue/parts/[id]">,
) {
  const user = await requireRole("catalogue.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getCataloguePartDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const canManage = can(user.role, "catalogue.manage");
  const canPromote =
    can(user.role, "inventory.create") &&
    detail.linkedInventoryParts.length === 0;

  let modelOptions: ComboboxOption[] = [];
  if (canManage) modelOptions = await getModelOptions();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
            <VerificationBadge status={detail.verificationStatus} />
            {detail.isFastener ? (
              <StatusBadge label="Fastener" tone="outline" />
            ) : null}
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "var(--font-plex-mono)" }}
          >
            {detail.partNumber}
          </Typography>
        </Box>

        <CataloguePartActions
          partId={detail.id}
          partNumber={detail.partNumber}
          name={detail.name}
          canManage={canManage}
          canPromote={canPromote}
          isDeleted={detail.deletedAt !== null}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Card>
          <CardHeader
            title="Details"
            slotProps={{ title: { component: "h3" } }}
          />
          <CardContent
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Typography variant="body2">
              <Box component="span" sx={{ color: "text.secondary" }}>
                Brand:{" "}
              </Box>
              {detail.brand?.name ?? "—"}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ color: "text.secondary" }}>
                Category:{" "}
              </Box>
              {detail.category?.name ?? "—"}
            </Typography>
            {detail.subCategory ? (
              <Typography variant="body2">
                <Box component="span" sx={{ color: "text.secondary" }}>
                  Sub-category:{" "}
                </Box>
                {detail.subCategory}
              </Typography>
            ) : null}
            {detail.assemblyGroup ? (
              <Typography variant="body2">
                <Box component="span" sx={{ color: "text.secondary" }}>
                  Assembly group:{" "}
                </Box>
                {detail.assemblyGroup}
              </Typography>
            ) : null}
            <Typography variant="body2">
              <Box component="span" sx={{ color: "text.secondary" }}>
                OEM reference:{" "}
              </Box>
              {detail.oemReference ?? "—"}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ color: "text.secondary" }}>
                Capacity range:{" "}
              </Box>
              {detail.capacityRangeKg ?? "—"}
            </Typography>
            {detail.sources.length > 0 ? (
              <Typography variant="body2">
                <Box component="span" sx={{ color: "text.secondary" }}>
                  Source(s):{" "}
                </Box>
                {detail.sources.join(", ")}
              </Typography>
            ) : null}
            {detail.description ? (
              <Typography variant="body2" color="text.secondary">
                {detail.description}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Inventory"
            slotProps={{ title: { component: "h3" } }}
          />
          <CardContent>
            {detail.linkedInventoryParts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Catalogue only - not currently stocked.
              </Typography>
            ) : (
              <Box
                component="ul"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                  m: 0,
                  pl: 0,
                  listStyle: "none",
                }}
              >
                {detail.linkedInventoryParts.map((part) => (
                  <Typography component="li" variant="body2" key={part.id}>
                    <NavLinkText
                      href={`/inventory/${part.id}`}
                      sx={{ fontWeight: 500, color: "text.primary" }}
                    >
                      {part.name}
                    </NavLinkText>{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-plex-mono)",
                      }}
                    >
                      ({part.partNumber})
                    </Box>{" "}
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      · qty {part.quantity}
                    </Box>
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardHeader
          title="Cross-references"
          slotProps={{ title: { component: "h3" } }}
        />
        <CardContent>
          <CrossRefList
            partId={detail.id}
            crossRefs={detail.crossRefs}
            canEdit={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Compatible models"
          slotProps={{ title: { component: "h3" } }}
        />
        <CardContent>
          <CompatibilityList
            cataloguePartId={detail.id}
            rows={detail.compatibility}
            modelOptions={modelOptions}
            canEdit={canManage}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
