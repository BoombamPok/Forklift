"use client";

import * as React from "react";
import NextLink from "next/link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

export type BreadcrumbTrailItem = { label: string; href?: string };

type HierarchyBreadcrumbProps = {
  items: BreadcrumbTrailItem[];
};

/**
 * The Warehouse / Rack / Shelf / Box trail (phase4.md §9) - every segment
 * but the current page is a real link, not decorative text. Generic over
 * `items` so it isn't specific to warehouse browsing depth (4 levels)
 * versus e.g. a future 2- or 3-level trail elsewhere. A "use client" leaf
 * (purely presentational, no client-only state) so it can safely render
 * `<Link>` via MUI's `component=` without the Server-Component RSC gotcha
 * documented elsewhere in this codebase.
 */
function HierarchyBreadcrumb({ items }: HierarchyBreadcrumbProps) {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.href) {
          return (
            <Typography
              key={`${item.label}-${index}`}
              color="text.primary"
              aria-current="page"
            >
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={`${item.label}-${index}`}
            component={NextLink}
            href={item.href}
            underline="hover"
            color="inherit"
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

export { HierarchyBreadcrumb };
