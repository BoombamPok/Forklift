"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  importCatalogueParts,
  type ImportReport,
} from "@/features/admin/actions";

function ImportPanel() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<ImportReport | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setReport(null);
    setLoading(true);

    const text = await file.text();
    const result = await importCatalogueParts(text);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setReport(result.data);
    if (result.data.inserted > 0) {
      toast.success(`${result.data.inserted} part(s) imported`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          onChange={handleFileChange}
          className="max-w-sm"
        />
        {loading ? (
          <span className="text-sm text-muted-foreground">Importing…</span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon /> Choose file
          </Button>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
          <p>
            <span className="font-medium text-foreground">
              {report.inserted}
            </span>{" "}
            imported,{" "}
            <span className="font-medium text-foreground">
              {report.skipped}
            </span>{" "}
            skipped (already existed),{" "}
            <span className="font-medium text-foreground">
              {report.errors.length}
            </span>{" "}
            row error(s).
          </p>
          {report.errors.length > 0 ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-muted-foreground">
              {report.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { ImportPanel };
