import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import type { VerificationStatus } from "@/types/database";

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: "Verified",
  unverified: "Unverified",
  uncertain: "Uncertain",
};

const VERIFICATION_TONE: Record<VerificationStatus, StatusTone> = {
  verified: "success",
  unverified: "outline",
  uncertain: "warning",
};

type VerificationBadgeProps = {
  status: VerificationStatus;
};

/**
 * The one verification-status indicator (phase5.md §3 goal #6/§9) -
 * every catalogue part or compatibility row shows this, never bare text,
 * so `unverified`/`uncertain` never reads as visually indistinguishable
 * from confirmed fact.
 */
function VerificationBadge({ status }: VerificationBadgeProps) {
  return (
    <StatusBadge
      label={VERIFICATION_LABEL[status]}
      tone={VERIFICATION_TONE[status]}
    />
  );
}

export { VerificationBadge };
