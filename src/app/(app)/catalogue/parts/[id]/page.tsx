import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerificationBadge } from "@/components/shared/verification-badge";
import type { ComboboxOption } from "@/components/shared/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {detail.name}
            </h2>
            <VerificationBadge status={detail.verificationStatus} />
            {detail.isFastener ? (
              <StatusBadge label="Fastener" tone="outline" />
            ) : null}
            {detail.deletedAt ? (
              <StatusBadge label="Deleted" tone="destructive" />
            ) : null}
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {detail.partNumber}
          </p>
        </div>

        <CataloguePartActions
          partId={detail.id}
          partNumber={detail.partNumber}
          name={detail.name}
          canManage={canManage}
          canPromote={canPromote}
          isDeleted={detail.deletedAt !== null}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Brand: </span>
              {detail.brand?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Category: </span>
              {detail.category?.name ?? "—"}
            </p>
            {detail.subCategory ? (
              <p>
                <span className="text-muted-foreground">Sub-category: </span>
                {detail.subCategory}
              </p>
            ) : null}
            {detail.assemblyGroup ? (
              <p>
                <span className="text-muted-foreground">Assembly group: </span>
                {detail.assemblyGroup}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">OEM reference: </span>
              {detail.oemReference ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Capacity range: </span>
              {detail.capacityRangeKg ?? "—"}
            </p>
            {detail.sources.length > 0 ? (
              <p>
                <span className="text-muted-foreground">Source(s): </span>
                {detail.sources.join(", ")}
              </p>
            ) : null}
            {detail.description ? (
              <p className="text-muted-foreground">{detail.description}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.linkedInventoryParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Catalogue only - not currently stocked.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {detail.linkedInventoryParts.map((part) => (
                  <li key={part.id}>
                    <Link
                      href={`/inventory/${part.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {part.name}
                    </Link>{" "}
                    <span className="font-mono text-muted-foreground">
                      ({part.partNumber})
                    </span>{" "}
                    <span className="text-muted-foreground">
                      · qty {part.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cross-references</CardTitle>
        </CardHeader>
        <CardContent>
          <CrossRefList
            partId={detail.id}
            crossRefs={detail.crossRefs}
            canEdit={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compatible models</CardTitle>
        </CardHeader>
        <CardContent>
          <CompatibilityList
            cataloguePartId={detail.id}
            rows={detail.compatibility}
            modelOptions={modelOptions}
            canEdit={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
