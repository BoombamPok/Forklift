import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpDownIcon,
  ClockIcon,
  LayersIcon,
  WalletIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const REPORTS: ReportLink[] = [
  {
    href: "/reports/valuation",
    title: "Inventory valuation",
    description: "Cost-basis value of stock on hand, by category and brand.",
    icon: WalletIcon,
  },
  {
    href: "/reports/movements",
    title: "Stock movement",
    description: "Every movement type over a selected date range.",
    icon: ActivityIcon,
  },
  {
    href: "/reports/low-stock",
    title: "Low stock & out of stock",
    description: "The full list of parts that need attention right now.",
    icon: AlertTriangleIcon,
  },
  {
    href: "/reports/movers",
    title: "Fast & slow movers",
    description: "Which parts move the most - and which haven't moved at all.",
    icon: ArrowUpDownIcon,
  },
  {
    href: "/reports/aging",
    title: "Stock aging",
    description: "How long each part has sat without activity.",
    icon: ClockIcon,
  },
  {
    href: "/reports/occupancy",
    title: "Warehouse occupancy",
    description: "Box occupancy for every rack, across every warehouse.",
    icon: WarehouseIcon,
  },
  {
    href: "/reports/catalogue-coverage",
    title: "Catalogue coverage",
    description: "How much of the catalogue is linked and verified.",
    icon: LayersIcon,
  },
];

/**
 * `/reports`'s real overview (phase6.md §4 goal #1), replacing the
 * Phase 1 placeholder. Deliberately just a set of links - per phase6.md
 * §9/CLAUDE.md's "don't overwhelm users with analytics", this page must
 * not become a dashboard crammed with every chart at once.
 */
export default async function ReportsPage() {
  await requireRole("reports.view");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Reports
        </h2>
        <p className="text-sm text-muted-foreground">
          Inventory value, stock movement, and warehouse/catalogue coverage -
          answering real business questions from real data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon
                      aria-hidden
                      className="size-4 text-muted-foreground"
                    />
                  </div>
                  <CardTitle className="pt-2">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
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
