import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  ClockIcon,
  LayersIcon,
  WalletIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

const REPORTS: ReportLink[] = [
  {
    href: "/reports/valuation",
    title: "Inventory valuation",
    description: "Cost-basis value of stock on hand, by category and brand.",
    icon: WalletIcon,
    tone: "bg-success/10 text-success",
  },
  {
    href: "/reports/movements",
    title: "Stock movement",
    description: "Every movement type over a selected date range.",
    icon: ActivityIcon,
    tone: "bg-info/10 text-info",
  },
  {
    href: "/reports/low-stock",
    title: "Low stock & out of stock",
    description: "The full list of parts that need attention right now.",
    icon: AlertTriangleIcon,
    tone: "bg-warning/15 text-warning-foreground",
  },
  {
    href: "/reports/movers",
    title: "Fast & slow movers",
    description: "Which parts move the most - and which haven't moved at all.",
    icon: ArrowUpDownIcon,
    tone: "bg-primary/10 text-primary",
  },
  {
    href: "/reports/aging",
    title: "Stock aging",
    description: "How long each part has sat without activity.",
    icon: ClockIcon,
    tone: "bg-muted text-muted-foreground",
  },
  {
    href: "/reports/occupancy",
    title: "Warehouse occupancy",
    description: "Box occupancy for every rack, across every warehouse.",
    icon: WarehouseIcon,
    tone: "bg-destructive/10 text-destructive",
  },
  {
    href: "/reports/catalogue-coverage",
    title: "Catalogue coverage",
    description: "How much of the catalogue is linked and verified.",
    icon: LayersIcon,
    tone: "bg-info/10 text-info",
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
            <Link key={report.href} href={report.href} className="group">
              <Card interactive className="h-full">
                <CardHeader>
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                      report.tone,
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                  </div>
                  <CardTitle className="flex items-center gap-1.5 pt-2">
                    {report.title}
                    <ArrowRightIcon
                      aria-hidden
                      className="size-3.5 text-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </CardTitle>
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
