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
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={<Typography variant="h6">Quick actions</Typography>}
        sx={{ pb: 1.5, borderBottom: "1px solid var(--rule)" }}
      />
      <CardContent sx={{ flex: 1, pt: 1, px: 1.25, pb: 1.25 }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <NavLinkBox
              key={action.href}
              href={action.href}
              className="action"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderRadius: "var(--radius-control)",
                px: 1.25,
                py: 1.25,
                textDecoration: "none",
                color: "text.primary",
                fontSize: "0.8438rem",
                fontWeight: 500,
                transition: "background-color 140ms var(--ease-standard)",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  display: "flex",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-chip)",
                  border: "1px solid var(--mui-palette-divider)",
                  bgcolor: "background.default",
                  color: "text.secondary",
                  transition:
                    "color 140ms var(--ease-standard), border-color 140ms var(--ease-standard), background-color 140ms var(--ease-standard)",
                  ".action:hover &": {
                    color: "primary.main",
                    borderColor:
                      "color-mix(in srgb, var(--mui-palette-primary-main) 40%, transparent)",
                    bgcolor:
                      "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
                  },
                }}
              >
                <Icon size={15} />
              </Box>
              <Box component="span" sx={{ flex: 1 }}>
                {action.label}
              </Box>
              {/* The chevron slides a little on hover - the only thing
                  moving is the affordance that says "this navigates". */}
              <Box
                aria-hidden
                sx={{
                  display: "flex",
                  flexShrink: 0,
                  color: "text.disabled",
                  transition: "transform 140ms var(--ease-standard), color 140ms var(--ease-standard)",
                  ".action:hover &": {
                    transform: "translateX(2px)",
                    color: "text.secondary",
                  },
                }}
              >
                <ChevronRightIcon size={15} />
              </Box>
            </NavLinkBox>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { QuickActions };
