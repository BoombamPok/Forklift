import { ArrowRightIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { can } from "@/lib/permissions";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { HubHero } from "@/components/premium/hub-hero";
import { NavLinkButton } from "@/components/shared/nav-link-button";
import { getBrandList, getCategoryList } from "@/features/catalogue/queries";
import { CategoryTable } from "./category-table";

/**
 * `/catalogue`'s overview - brand cards with real model/part counts
 * (never placeholders), plus category management inline as a simple
 * flat list rather than its own route.
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <HubHero
        title="Catalogue"
        description="Brands, models, and parts - what fits what, browsed by brand."
        leadHue="amber"
        actions={
          <>
            <NavLinkButton href="/catalogue/brands" variant="outlined">
              Manage brands
            </NavLinkButton>
            <NavLinkButton href="/catalogue/models" variant="outlined">
              Browse models
            </NavLinkButton>
            <NavLinkButton href="/catalogue/parts" variant="contained">
              Browse parts
            </NavLinkButton>
          </>
        }
      />

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
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent>
                <Typography variant="h6">{brand.name}</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mt: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Models
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-plex-mono)",
                        fontSize: "1.125rem",
                        fontWeight: 600,
                      }}
                    >
                      {brand.modelCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Parts
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-plex-mono)",
                        fontSize: "1.125rem",
                        fontWeight: 600,
                      }}
                    >
                      {brand.partCount}
                    </Typography>
                  </Box>
                </Box>
                <NavLinkButton
                  href={`/catalogue/models?brandId=${brand.id}`}
                  size="small"
                  endIcon={<ArrowRightIcon size={14} />}
                  sx={{ mt: 1.5, ml: -1 }}
                >
                  View models
                </NavLinkButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="h6">Categories</Typography>
        <CategoryTable rows={categories} canManage={canManage} />
      </Box>
    </Box>
  );
}
