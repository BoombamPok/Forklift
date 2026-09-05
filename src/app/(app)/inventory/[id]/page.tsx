import { MapPinIcon, PackageIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {detail.name}
            </h2>
            <StatusBadge
              label={STATUS_LABEL[detail.status]}
              tone={STATUS_TONE[detail.status]}
            />
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {detail.partNumber}
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon aria-hidden className="size-4 text-info" />
              Quantity &amp; location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-3xl leading-none font-semibold tabular-nums">
              {detail.quantity}
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              {detail.location ? (
                <span>
                  {detail.location.warehouseName} / Rack{" "}
                  {detail.location.rackCode} / Shelf {detail.location.shelfCode}{" "}
                  / Box {detail.location.boxCode}
                </span>
              ) : (
                <span>No location assigned</span>
              )}
            </div>
            {detail.minStock !== null ? (
              <p className="text-sm text-muted-foreground">
                Low-stock threshold: {detail.minStock}
              </p>
            ) : null}
            {detail.notes ? (
              <p className="text-sm text-muted-foreground">{detail.notes}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalogue link</CardTitle>
            <CardDescription>
              {detail.catalogueLink
                ? "Catalogue + Inventory"
                : "Inventory only"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.catalogueLink ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">
                  {detail.catalogueLink.name}
                </p>
                <p className="font-mono text-muted-foreground">
                  {detail.catalogueLink.partNumber}
                </p>
                {detail.catalogueLink.brandName ? (
                  <p className="text-muted-foreground">
                    Brand: {detail.catalogueLink.brandName}
                  </p>
                ) : null}
                {detail.catalogueLink.oemReference ? (
                  <p className="text-muted-foreground">
                    OEM ref: {detail.catalogueLink.oemReference}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This part isn&apos;t linked to a catalogue entry.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <PartImagesGallery
            partId={detail.id}
            images={images}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement history</CardTitle>
        </CardHeader>
        <CardContent>
          <PartMovementHistory items={history} />
        </CardContent>
      </Card>
    </div>
  );
}
