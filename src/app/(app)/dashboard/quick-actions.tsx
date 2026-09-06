import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  PlusIcon,
  WarehouseIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can, type Role } from "@/lib/permissions";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Every action here links to a real, already-built page - no invoicing/
 * sales/CRM shortcuts (out of scope per CLAUDE.md's defined V1 scope).
 * Gated by the same `can()` permission table the rest of the app uses,
 * so e.g. Read-Only never sees create actions it can't complete.
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
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-4" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { QuickActions };
