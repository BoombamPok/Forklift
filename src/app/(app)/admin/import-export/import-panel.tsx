"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          onChange={handleFileChange}
          hidden
        />
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Importing…
          </Typography>
        ) : (
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<UploadIcon size={16} />}
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
        )}
      </Box>

      {error ? (
        <Alert severity="error" icon={<AlertCircleIcon size={18} />}>
          {error}
        </Alert>
      ) : null}

      {report ? (
        <Paper
          variant="outlined"
          sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}
        >
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 500 }}>
              {report.inserted}
            </Box>{" "}
            imported,{" "}
            <Box component="span" sx={{ fontWeight: 500 }}>
              {report.skipped}
            </Box>{" "}
            skipped (already existed),{" "}
            <Box component="span" sx={{ fontWeight: 500 }}>
              {report.errors.length}
            </Box>{" "}
            row error(s).
          </Typography>
          {report.errors.length > 0 ? (
            <Box
              component="ul"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                m: 0,
                pl: 2.5,
                maxHeight: 160,
                overflowY: "auto",
                color: "text.secondary",
              }}
            >
              {report.errors.map((e, i) => (
                <Typography component="li" variant="body2" key={i}>
                  Row {e.row}: {e.message}
                </Typography>
              ))}
            </Box>
          ) : null}
        </Paper>
      ) : null}
    </Box>
  );
}

export { ImportPanel };
