import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  ChevronRightIcon,
  PlusIcon,
  WarehouseIcon,
} from "lucide-react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NavLinkBox } from "@/components/shared/nav-link-box";
import { can, type Role } from "@/lib/permissions";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Every action here links to a real, already-built page - no invoicing/
 * sales/CRM shortcuts. Gated by the same `can()` permission table the
 * rest of the app uses, so e.g. Read-Only never sees create actions it
 * can't complete.
 */
function getActionsForRole(role: Role): QuickAction[] {
  const actions: QuickAction[] = [];
  if (can(role, "inventory.create")) {
    actions.push({
      label: "Add part to inventory",
      href: "/inventory/new",
      icon: PlusIcon,
    });
  }
  if (can(role, "catalogue.manage")) {
    actions.push({
      label: "Add catalogue part",
      href: "/catalogue/parts/new",
      icon: BookOpenIcon,
    });
  }
  actions.push({
    label: "Browse warehouse",
    href: "/warehouse",
    icon: WarehouseIcon,
  });
  actions.push({
    label: "View reports",
    href: "/reports",
    icon: BarChart3Icon,
  });
  return actions;
}

type QuickActionsProps = {
  role: Role;
};

function QuickActions({ role }: QuickActionsProps) {
  const actions = getActionsForRole(role);

  return (
    <Card>
      <CardHeader title={<Typography variant="h6">Quick actions</Typography>} />
      <CardContent
        sx={{
          pt: 0,
          "& > a:not(:last-child)": { borderBottom: 1, borderColor: "divider" },
        }}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <NavLinkBox
              key={action.href}
              href={action.href}
              className="group"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1.25,
                textDecoration: "none",
                color: "text.primary",
                fontSize: "0.875rem",
                fontWeight: 500,
                "&:hover": { color: "primary.main" },
              }}
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
                  transition: "transform 150ms",
                  ".group:hover &": { transform: "scale(1.05)" },
                }}
              >
                <Icon aria-hidden size={16} />
              </Box>
              <Box component="span" sx={{ flex: 1 }}>
                {action.label}
              </Box>
              <ChevronRightIcon
                aria-hidden
                size={16}
                style={{ flexShrink: 0, opacity: 0.5 }}
              />
            </NavLinkBox>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { QuickActions };
