import { DownloadIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportPanel } from "./import-panel";

export default async function AdminImportExportPage() {
  await requireRole("users.manage");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Import &amp; Export
        </h2>
        <p className="text-sm text-muted-foreground">
          Bulk-manage catalogue parts as a CSV file.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Download every catalogue part as a CSV file, including brand and
            category names.
          </p>
          <Button asChild variant="outline">
            <a href="/admin/catalogue-export">
              <DownloadIcon /> Export catalogue parts
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload a CSV file in the same format as the export above to bulk-
            create new catalogue parts. Rows that match an existing part (same
            brand and part number) are skipped, never overwritten.
          </p>
          <ImportPanel />
        </CardContent>
      </Card>
    </div>
  );
}
