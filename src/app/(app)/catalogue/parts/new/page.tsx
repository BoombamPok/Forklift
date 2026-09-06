import { requireRole } from "@/lib/auth/require-role";
import {
  getBrandOptions,
  getCategoryOptions,
} from "@/features/catalogue/queries";
import { CataloguePartForm } from "../catalogue-part-form";

export default async function NewCataloguePartPage() {
  await requireRole("catalogue.manage");

  const [brandOptions, categoryOptions] = await Promise.all([
    getBrandOptions(),
    getCategoryOptions(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Add catalogue part
      </h2>
      <CataloguePartForm
        mode="create"
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
