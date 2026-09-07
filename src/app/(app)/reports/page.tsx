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
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { HubHero } from "@/components/premium/hub-hero";
import { NavLinkBox } from "@/components/shared/nav-link-box";

type ReportLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const REPORTS: ReportLink[] = [
  {
    href: "/reports/valuation",
    title: "Inventory valuation",
    description: "Cost-basis value of stock on hand, by category and brand.",
    icon: WalletIcon,
    color: "success.main",
  },
  {
    href: "/reports/movements",
    title: "Stock movement",
    description: "Every movement type over a selected date range.",
    icon: ActivityIcon,
    color: "info.main",
  },
  {
    href: "/reports/low-stock",
    title: "Low stock & out of stock",
    description: "The full list of parts that need attention right now.",
    icon: AlertTriangleIcon,
    color: "warning.main",
  },
  {
    href: "/reports/movers",
    title: "Fast & slow movers",
    description: "Which parts move the most - and which haven't moved at all.",
    icon: ArrowUpDownIcon,
    color: "primary.main",
  },
  {
    href: "/reports/aging",
    title: "Stock aging",
    description: "How long each part has sat without activity.",
    icon: ClockIcon,
    color: "text.secondary",
  },
  {
    href: "/reports/occupancy",
    title: "Warehouse occupancy",
    description: "Box occupancy for every rack, across every warehouse.",
    icon: WarehouseIcon,
    color: "error.main",
  },
  {
    href: "/reports/catalogue-coverage",
    title: "Catalogue coverage",
    description: "How much of the catalogue is linked and verified.",
    icon: LayersIcon,
    color: "info.main",
  },
];

/**
 * `/reports`'s real overview - deliberately just a set of links, not a
 * dashboard crammed with every chart at once.
 */
export default async function ReportsPage() {
  await requireRole("reports.view");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <HubHero
        title="Reports"
        description="Inventory value, stock movement, and warehouse/catalogue coverage - answering real business questions from real data."
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
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <NavLinkBox
              key={report.href}
              href={report.href}
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
                      width: 36,
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                      color: report.color,
                      transition: "transform 150ms",
                      ".group:hover &": { transform: "scale(1.08)" },
                    }}
                  >
                    <Icon aria-hidden size={18} />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      mt: 1.5,
                    }}
                  >
                    <Typography variant="h6">{report.title}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        opacity: 0,
                        transition: "opacity 150ms, transform 150ms",
                        ".group:hover &": {
                          opacity: 1,
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <ArrowRightIcon aria-hidden size={14} />
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {report.description}
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
