import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { VerificationBadge } from "@/components/shared/verification-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModelCompatiblePart } from "@/features/catalogue/queries";

type CompatiblePartsTableProps = {
  parts: ModelCompatiblePart[];
};

/**
 * Read-only compatibility view on the model detail page (phase5.md §5's
 * accepted decision - the part detail page is the primary editor). Each
 * row shows that part's own `capacity_range_kg` as recorded, never one
 * derived/averaged figure for the model (ADR 0008) - two rows for the
 * same model can legitimately show different values.
 */
function CompatiblePartsTable({ parts }: CompatiblePartsTableProps) {
  if (parts.length === 0) {
    return (
      <EmptyState
        title="No compatible parts recorded yet"
        description="Add a compatibility link from a catalogue part's detail page."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Part</TableHead>
          <TableHead>Capacity range</TableHead>
          <TableHead>Verification</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parts.map((part) => (
          <TableRow key={part.compatibilityId}>
            <TableCell>
              <Link
                href={`/catalogue/parts/${part.partId}`}
                className="block hover:underline"
              >
                <p className="font-medium text-foreground">{part.partName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {part.partNumber}
                </p>
              </Link>
            </TableCell>
            <TableCell>{part.capacityRangeKg ?? "—"}</TableCell>
            <TableCell>
              <VerificationBadge status={part.verificationStatus} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { CompatiblePartsTable };
