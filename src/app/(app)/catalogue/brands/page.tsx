import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { getBrandList } from "@/features/catalogue/queries";
import { BrandTable } from "../brand-table";

export default async function CatalogueBrandsPage() {
  const user = await requireRole("catalogue.view");

  let rows;
  try {
    rows = await getBrandList();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Brands
        </h2>
        <p className="text-sm text-muted-foreground">
          The manufacturers behind every model and catalogue part.
        </p>
      </div>

      <BrandTable rows={rows} canManage={can(user.role, "catalogue.manage")} />
    </div>
  );
}
