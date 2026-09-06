import { LayersIcon, LinkIcon, UnlinkIcon } from "lucide-react";

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
      <div className="space-y-6">
        <ReportHeader
          title="Catalogue coverage"
          description="How much of the catalogue is linked and verified."
        />
        <ErrorState kind={toErrorKind(error)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Catalogue coverage"
        description="How much of the catalogue is linked and verified."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Catalogue parts by verification status
          </h3>
          <div className="space-y-2 rounded-lg border border-border p-4">
            {VERIFICATION_ORDER.map((status) => (
              <div key={status} className="flex items-center justify-between">
                <VerificationBadge status={status} />
                <span className="font-mono text-sm tabular-nums">
                  {summary.partVerification[status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Compatibility links by verification status
          </h3>
          <div className="space-y-2 rounded-lg border border-border p-4">
            {VERIFICATION_ORDER.map((status) => (
              <div key={status} className="flex items-center justify-between">
                <VerificationBadge status={status} />
                <span className="font-mono text-sm tabular-nums">
                  {summary.compatibilityVerification[status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
