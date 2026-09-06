import { requireRole } from "@/lib/auth/require-role";
import { firstParam } from "@/lib/search-params";
import {
  getBoxOptions,
  getCatalogueOptions,
} from "@/features/inventory/queries";
import type { PartFormValues } from "@/features/inventory/schema";
import { PartForm } from "../part-form";

/**
 * The catalogue part detail page's "Promote to inventory" shortcut
 * (phase5.md §4 goal #5) lands here with `catalogueId`/`partNumber`/
 * `name` query params - this is the one place they're read, then handed
 * to `PartForm` as ordinary `defaultValues`, exactly like any other
 * pre-filled create form. No second create flow: this is the same page
 * and the same `createPart` Server Action every other new inventory
 * part goes through.
 */
export default async function NewInventoryPartPage(
  props: PageProps<"/inventory/new">,
) {
  await requireRole("inventory.create");
  const searchParams = await props.searchParams;

  const [boxOptions, catalogueOptions] = await Promise.all([
    getBoxOptions(),
    getCatalogueOptions(),
  ]);

  const promotedDefaults: Partial<PartFormValues> = {};
  const catalogueId = firstParam(searchParams.catalogueId);
  const partNumber = firstParam(searchParams.partNumber);
  const name = firstParam(searchParams.name);
  if (catalogueId) promotedDefaults.catalogueId = catalogueId;
  if (partNumber) promotedDefaults.partNumber = partNumber;
  if (name) promotedDefaults.name = name;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Add part
      </h2>
      <PartForm
        mode="create"
        boxOptions={boxOptions}
        catalogueOptions={catalogueOptions}
        defaultValues={promotedDefaults}
      />
    </div>
  );
}
