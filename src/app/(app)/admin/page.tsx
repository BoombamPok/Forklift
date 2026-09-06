import Link from "next/link";
import {
  ChevronRightIcon,
  FileSpreadsheetIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Administration
        </h2>
        <p className="text-sm text-muted-foreground">
          Users, roles, warehouse configuration, and catalogue import/export.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card interactive className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      {section.label}
                    </span>
                    <ChevronRightIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
