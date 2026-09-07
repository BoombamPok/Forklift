import {
  ChevronRightIcon,
  FileSpreadsheetIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { HubHero } from "@/components/premium/hub-hero";
import { NavLinkBox } from "@/components/shared/nav-link-box";

const ADMIN_SECTIONS = [
  {
    label: "Users & Roles",
    description: "Invite people, and manage their role and account status.",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    label: "Warehouse configuration",
    description: "Manage warehouses, racks, shelves, and boxes.",
    href: "/warehouse",
    icon: WarehouseIcon,
  },
  {
    label: "Import & Export",
    description: "Bulk-export catalogue parts to CSV, or import new ones.",
    href: "/admin/import-export",
    icon: FileSpreadsheetIcon,
  },
];

export default async function AdminPage() {
  await requireRole("users.manage");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <HubHero
        title="Administration"
        description="Users, roles, warehouse configuration, and catalogue import/export."
        leadHue="electric"
      />

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
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <NavLinkBox
              key={section.href}
              href={section.href}
              className="group"
              sx={{ display: "block", height: "100%", textDecoration: "none" }}
            >
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 150ms, box-shadow 150ms",
                  ".group:hover &": {
                    transform: "translateY(-3px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 1.5,
                          bgcolor:
                            "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
                          color: "primary.main",
                        }}
                      >
                        <Icon aria-hidden size={16} />
                      </Box>
                      <Typography variant="h6">{section.label}</Typography>
                    </Box>
                    <ChevronRightIcon
                      aria-hidden
                      size={16}
                      style={{ flexShrink: 0, opacity: 0.5 }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                  >
                    {section.description}
                  </Typography>
                </CardContent>
              </Card>
            </NavLinkBox>
          );
        })}
      </Box>
    </Box>
  );
}
