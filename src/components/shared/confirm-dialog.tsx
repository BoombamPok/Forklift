"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
};

/**
 * The one confirmation pattern for destructive/consequential actions
 * (delete, merge, stock adjust, transfer, restore) per CLAUDE.md - always
 * states what happens, to what, and whether it can be undone via
 * `description`.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      role="alertdialog"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          disabled={loading}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={variant === "destructive" ? "error" : "primary"}
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? "Working…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { ConfirmDialog };
