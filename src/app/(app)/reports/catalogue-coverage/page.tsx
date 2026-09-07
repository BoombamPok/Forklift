import { LayersIcon, LinkIcon, UnlinkIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { KpiCard } from "@/components/shared/kpi-card";
import { ErrorState } from "@/components/shared/error-state";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { getCatalogueCoverageSummary } from "@/features/reports/catalogue-coverage";
import type { VerificationStatus } from "@/types/database";
import { ReportHeader } from "../report-header";

const VERIFICATION_ORDER: VerificationStatus[] = [
  "verified",
  "unverified",
  "uncertain",
];

/**
 * `/reports/catalogue-coverage` (phase6.md §4 goal #8) - how much of
 * the catalogue is linked to live inventory, and the verification-
 * status split for both catalogue parts and compatibility links, from
 * `getCatalogueCoverageSummary` (src/features/reports/
 * catalogue-coverage.ts). Reuses Phase 5's linkage/verification data as
 * recorded - no new catalogue schema.
 */
export default async function CatalogueCoverageReportPage() {
  await requireRole("reports.view");

  let summary;
  try {
    summary = await getCatalogueCoverageSummary();
  } catch (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ReportHeader
          title="Catalogue coverage"
          description="How much of the catalogue is linked and verified."
        />
        <ErrorState kind={toErrorKind(error)} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <ReportHeader
        title="Catalogue coverage"
        description="How much of the catalogue is linked and verified."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <KpiCard
          label="Catalogue parts"
          value={summary.totalParts}
          icon={LayersIcon}
          tone="info"
        />
        <KpiCard
          label="Linked to inventory"
          value={summary.linkedParts}
          icon={LinkIcon}
          tone="success"
        />
        <KpiCard
          label="Not yet in inventory"
          value={summary.unlinkedParts}
          icon={UnlinkIcon}
          tone="warning"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Catalogue parts by verification status
          </Typography>
          <Paper
            variant="outlined"
            sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}
          >
            {VERIFICATION_ORDER.map((status) => (
              <Box
                key={status}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <VerificationBadge status={status} />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "var(--font-roboto-mono)" }}
                >
                  {summary.partVerification[status]}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Compatibility links by verification status
          </Typography>
          <Paper
            variant="outlined"
            sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}
          >
            {VERIFICATION_ORDER.map((status) => (
              <Box
                key={status}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <VerificationBadge status={status} />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "var(--font-roboto-mono)" }}
                >
                  {summary.compatibilityVerification[status]}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
