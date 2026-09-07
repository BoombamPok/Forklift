import Link from "next/link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { EmptyState } from "@/components/shared/empty-state";
import { VerificationBadge } from "@/components/shared/verification-badge";
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
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Part</TableCell>
            <TableCell>Capacity range</TableCell>
            <TableCell>Verification</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.compatibilityId}>
              <TableCell>
                <Link
                  href={`/catalogue/parts/${part.partId}`}
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {part.partName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: "var(--font-plex-mono)" }}
                  >
                    {part.partNumber}
                  </Typography>
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
    </TableContainer>
  );
}

export { CompatiblePartsTable };
