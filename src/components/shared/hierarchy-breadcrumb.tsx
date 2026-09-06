import * as React from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbTrailItem = { label: string; href?: string };

type HierarchyBreadcrumbProps = {
  items: BreadcrumbTrailItem[];
};

/**
 * The Warehouse / Rack / Shelf / Box trail (phase4.md §9) - every segment
 * but the current page is a real link, not decorative text. Generic over
 * `items` so it isn't specific to warehouse browsing depth (4 levels)
 * versus e.g. a future 2- or 3-level trail elsewhere.
 */
function HierarchyBreadcrumb({ items }: HierarchyBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { HierarchyBreadcrumb };
