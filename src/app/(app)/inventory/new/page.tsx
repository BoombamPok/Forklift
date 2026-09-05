import { requireRole } from "@/lib/auth/require-role";
import { getBoxOptions, getCatalogueOptions } from "@/features/inventory/queries";
import { PartForm } from "../part-form";

export default async function NewInventoryPartPage() {
  await requireRole("inventory.create");

  const [boxOptions, catalogueOptions] = await Promise.all([
    getBoxOptions(),
    getCatalogueOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Add part
      </h2>
      <PartForm
        mode="create"
        boxOptions={boxOptions}
        catalogueOptions={catalogueOptions}
      />
    </div>
  );
}
