import { DownloadIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/shared/page-header";
import { ImportPanel } from "./import-panel";

export default async function AdminImportExportPage() {
  await requireRole("users.manage");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Import & Export"
        description="Bulk-manage catalogue parts as a CSV file."
      />

      <Card>
        <CardHeader title="Export" slotProps={{ title: { component: "h3" } }} />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download every catalogue part as a CSV file, including brand and
            category names.
          </Typography>
          <Button
            component="a"
            href="/admin/catalogue-export"
            variant="outlined"
            startIcon={<DownloadIcon size={16} />}
          >
            Export catalogue parts
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Import" slotProps={{ title: { component: "h3" } }} />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file in the same format as the export above to
            bulk-create new catalogue parts. Rows that match an existing part
            (same brand and part number) are skipped, never overwritten.
          </Typography>
          <ImportPanel />
        </CardContent>
      </Card>
    </Box>
  );
}
