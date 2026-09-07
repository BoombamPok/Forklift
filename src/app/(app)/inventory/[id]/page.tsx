import { MapPinIcon, PackageIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import {
  getBoxOptions,
  getInventoryPartDetail,
  getPartImages,
  getPartMovementHistory,
} from "@/features/inventory/queries";
import type { InventoryStatus } from "@/types/database";
import { PartActions } from "./part-actions";
import { PartImagesGallery } from "./part-images-gallery";
import { PartMovementHistory } from "./part-movement-history";

const STATUS_LABEL: Record<InventoryStatus, string> = {
  active: "Active",
  discontinued: "Discontinued",
  damaged: "Damaged",
};

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  active: "success",
  discontinued: "secondary",
  damaged: "destructive",
};

export default async function InventoryPartDetailPage(
  props: PageProps<"/inventory/[id]">,
) {
  const user = await requireRole("inventory.view");
  const { id } = await props.params;

  let detail;
  try {
    detail = await getInventoryPartDetail(id);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  const [history, images, boxOptions] = await Promise.all([
    getPartMovementHistory(id, {
      partNumber: detail.partNumber,
      name: detail.name,
    }),
    getPartImages(id),
    getBoxOptions(),
  ]);

  const canEdit = can(user.role, "inventory.edit");
  const canDelete = can(user.role, "inventory.delete");
  const canRecordMovement =
    canEdit ||
    can(user.role, "inventory.adjust") ||
    can(user.role, "inventory.transfer");

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
            <StatusBadge
              label={STATUS_LABEL[detail.status]}
              tone={STATUS_TONE[detail.status]}
            />
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "var(--font-roboto-mono)" }}
          >
            {detail.partNumber}
          </Typography>
        </Box>

        <PartActions
          partId={detail.id}
          currentQuantity={detail.quantity}
          currentBoxId={detail.boxId}
          boxOptions={boxOptions}
          canEdit={canEdit}
          canDelete={canDelete}
          canRecordMovement={canRecordMovement}
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
            title={
              <Box
                component="span"
                sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
              >
                <PackageIcon
                  aria-hidden
                  size={16}
                  color="var(--mui-palette-info-main)"
                />
                Quantity &amp; location
              </Box>
            }
            slotProps={{ title: { component: "h3" } }}
          />
          <CardContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <Typography
              data-testid="part-quantity"
              sx={{
                fontFamily: "var(--font-roboto-mono)",
                fontSize: "1.875rem",
                lineHeight: 1,
                fontWeight: 600,
              }}
            >
              {detail.quantity}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <MapPinIcon
                aria-hidden
                size={16}
                style={{ marginTop: 2, flexShrink: 0, opacity: 0.6 }}
              />
              {detail.location ? (
                <Typography variant="body2" color="text.secondary">
                  {detail.location.warehouseName} / Rack{" "}
                  {detail.location.rackCode} / Shelf {detail.location.shelfCode}{" "}
                  / Box {detail.location.boxCode}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No location assigned
                </Typography>
              )}
            </Box>
            {detail.minStock !== null ? (
              <Typography variant="body2" color="text.secondary">
                Low-stock threshold: {detail.minStock}
              </Typography>
            ) : null}
            {detail.notes ? (
              <Typography variant="body2" color="text.secondary">
                {detail.notes}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Catalogue link"
            subheader={
              detail.catalogueLink ? "Catalogue + Inventory" : "Inventory only"
            }
            slotProps={{ title: { component: "h3" } }}
          />
          <CardContent>
            {detail.catalogueLink ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {detail.catalogueLink.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: "var(--font-roboto-mono)" }}
                >
                  {detail.catalogueLink.partNumber}
                </Typography>
                {detail.catalogueLink.brandName ? (
                  <Typography variant="body2" color="text.secondary">
                    Brand: {detail.catalogueLink.brandName}
                  </Typography>
                ) : null}
                {detail.catalogueLink.oemReference ? (
                  <Typography variant="body2" color="text.secondary">
                    OEM ref: {detail.catalogueLink.oemReference}
                  </Typography>
                ) : null}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                This part isn&apos;t linked to a catalogue entry.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardHeader title="Images" slotProps={{ title: { component: "h3" } }} />
        <CardContent>
          <PartImagesGallery
            partId={detail.id}
            images={images}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Movement history"
          slotProps={{ title: { component: "h3" } }}
        />
        <CardContent>
          <PartMovementHistory items={history} />
        </CardContent>
      </Card>
    </Box>
  );
}
