import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getBrandList, getCategoryList } from "@/features/catalogue/queries";
import { CategoryTable } from "./category-table";

/**
 * `/catalogue`'s overview (phase5.md §4 goal #1) - brand cards with real
 * model/part counts (never placeholders), plus category management
 * inline as a "simple, flat list" section rather than its own route
 * (phase5.md §4's explicit "don't over-build a separate elaborate page"
 * guidance for categories).
 */
export default async function CataloguePage() {
  const user = await requireRole("catalogue.view");
  const canManage = can(user.role, "catalogue.manage");

  let brands, categories;
  try {
    [brands, categories] = await Promise.all([
      getBrandList(),
      getCategoryList(),
    ]);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Catalogue
          </h2>
          <p className="text-sm text-muted-foreground">
            Brands, models, and parts - what fits what, browsed by brand.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/catalogue/brands">Manage brands</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogue/models">Browse models</Link>
          </Button>
          <Button asChild>
            <Link href="/catalogue/parts">Browse parts</Link>
          </Button>
        </div>
      </div>

      {brands.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description={
            canManage
              ? "Add a brand to start building out the catalogue."
              : "An admin or manager hasn't added a brand yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <CardTitle>{brand.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Models</dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums">
                      {brand.modelCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Parts</dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums">
                      {brand.partCount}
                    </dd>
                  </div>
                </dl>
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                  <Link href={`/catalogue/models?brandId=${brand.id}`}>
                    View models <ArrowRightIcon />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold tracking-tight">
          Categories
        </h3>
        <CategoryTable rows={categories} canManage={canManage} />
      </div>
    </div>
  );
}
