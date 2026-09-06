import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getLinkedCataloguePartIds } from "@/features/catalogue/queries";
import type { VerificationStatus } from "@/types/database";

export type VerificationBreakdown = Record<VerificationStatus, number>;

export type CatalogueCoverageSummary = {
  totalParts: number;
  linkedParts: number;
  unlinkedParts: number;
  partVerification: VerificationBreakdown;
  compatibilityVerification: VerificationBreakdown;
};

function emptyBreakdown(): VerificationBreakdown {
  return { verified: 0, unverified: 0, uncertain: 0 };
}

/**
 * How much of the catalogue is linked to live inventory, and the
 * `verification_status` split across catalogue parts and compatibility
 * links (phase6.md §4 goal #8) - reuses Phase 5's linkage data as-is via
 * `getLinkedCataloguePartIds` (src/features/catalogue/queries.ts), no
 * new catalogue schema.
 */
export async function getCatalogueCoverageSummary(): Promise<CatalogueCoverageSummary> {
  const supabase = await createClient();

  const [
    { data: parts, error: partsError },
    { data: compatRows, error: compatError },
  ] = await Promise.all([
    supabase
      .from("catalogue_parts")
      .select("id, verification_status")
      .is("deleted_at", null),
    supabase.from("compatibility").select("verification_status"),
  ]);
  if (partsError) throw partsError;
  if (compatError) throw compatError;

  const partVerification = emptyBreakdown();
  for (const part of parts ?? []) {
    partVerification[part.verification_status] += 1;
  }

  const compatibilityVerification = emptyBreakdown();
  for (const row of compatRows ?? []) {
    compatibilityVerification[row.verification_status] += 1;
  }

  const linkedIds = await getLinkedCataloguePartIds(
    (parts ?? []).map((part) => part.id),
  );

  return {
    totalParts: (parts ?? []).length,
    linkedParts: linkedIds.size,
    unlinkedParts: (parts ?? []).length - linkedIds.size,
    partVerification,
    compatibilityVerification,
  };
}
