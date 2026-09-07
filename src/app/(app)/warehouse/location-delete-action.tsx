"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IconButton } from "@/components/shared/icon-button";
import type { ActionResult } from "@/lib/errors";
import type { DeleteOutcome } from "@/features/warehouse/actions";

type LocationDeleteActionProps = {
  entityLabel: string;
  warningDescription: string;
  onDelete: () => Promise<ActionResult<DeleteOutcome>>;
  onDeleted: () => void;
  variant?: "icon" | "button";
};

/**
 * The one delete trigger for warehouses/racks/shelves/boxes (phase4.md §5):
 * calls the cascade soft-delete RPC and tells the two possible outcomes
 * apart. If any inventory_parts are still assigned anywhere in the
 * subtree, nothing was deleted - this shows exactly which parts are
 * blocking removal, each linking to its Phase 3 detail page, rather than
 * a generic "can't delete" error.
 */
function LocationDeleteAction({
  entityLabel,
  warningDescription,
  onDelete,
  onDeleted,
  variant = "icon",
}: LocationDeleteActionProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [blockedOpen, setBlockedOpen] = React.useState(false);
  const [blockedBy, setBlockedBy] = React.useState<DeleteOutcome["blockedBy"]>(
    [],
  );
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await onDelete();
    setLoading(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    if (!result.data.deleted) {
      setBlockedBy(result.data.blockedBy);
      setBlockedOpen(true);
      return;
    }

    toast.success(`${entityLabel} deleted`);
    onDeleted();
  }

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          label={`Delete ${entityLabel.toLowerCase()}`}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon size={16} />
        </IconButton>
      ) : (
        <Button
          type="button"
          variant="outlined"
          color="error"
          startIcon={<Trash2Icon size={16} />}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete this ${entityLabel.toLowerCase()}?`}
        description={warningDescription}
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleConfirm}
      />

      <Dialog
        open={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Can&apos;t delete this {entityLabel.toLowerCase()} yet
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          <DialogContentText>
            {blockedBy.length} part{blockedBy.length === 1 ? "" : "s"} still
            stored here or beneath it. Move or reassign{" "}
            {blockedBy.length === 1 ? "it" : "them"} first, then try again.
          </DialogContentText>
          <Box
            component="ul"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              m: 0,
              p: 0,
              listStyle: "none",
              maxHeight: 256,
              overflowY: "auto",
            }}
          >
            {blockedBy.map((part) => (
              <Typography component="li" variant="body2" key={part.id}>
                <MuiLink component={Link} href={`/inventory/${part.id}`}>
                  {part.name}{" "}
                  <Box
                    component="span"
                    sx={{
                      color: "text.secondary",
                      fontFamily: "var(--font-plex-mono)",
                    }}
                  >
                    ({part.partNumber})
                  </Box>
                </MuiLink>
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            variant="contained"
            onClick={() => setBlockedOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export { LocationDeleteAction };
