"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { inviteUser } from "@/features/admin/actions";
import {
  inviteUserSchema,
  type InviteUserValues,
} from "@/features/admin/schema";
import { ROLES } from "@/lib/permissions";
import { ROLE_LABELS } from "./role-labels";

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { fullName: "", email: "", role: "staff" },
  });

  async function handleSubmit(values: InviteUserValues) {
    setFormError(null);
    const result = await inviteUser(values);
    if (!result.success) {
      setFormError(result.error.message);
      return;
    }
    toast.success(`Invite sent to ${values.email}`);
    form.reset({ fullName: "", email: "", role: "staff" });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        form.reset({ fullName: "", email: "", role: "staff" });
        onOpenChange(false);
      }}
      maxWidth="xs"
      fullWidth
    >
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogTitle>Invite a user</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Full name"
                autoFocus
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="email"
                autoComplete="email"
                label="Email"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Role"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Sending…" : "Send invite"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export { InviteUserDialog };
