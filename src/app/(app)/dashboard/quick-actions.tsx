import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  ChevronRightIcon,
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
      <CardContent className="-my-1 divide-y divide-border/70">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 py-2.5 text-sm font-medium text-foreground transition-colors first:pt-1 last:pb-1 hover:text-primary"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="flex-1">{action.label}</span>
              <ChevronRightIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { QuickActions };
