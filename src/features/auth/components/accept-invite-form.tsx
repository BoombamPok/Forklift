"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, LockIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { createClient } from "@/lib/supabase/client";
import {
  setPasswordSchema,
  type SetPasswordValues,
} from "@/features/auth/schema";

/**
 * Consumes a Supabase invite email link. The browser client
 * (`detectSessionInUrl`, on by default) picks up the invite's session
 * tokens from the URL as soon as it's constructed - there's no server-side
 * step, since only the browser ever sees the URL fragment. Once a session
 * exists, the invitee sets their own password and lands on the dashboard.
 */
function AcceptInviteForm() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setStatus(data.session ? "ready" : "invalid");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: SetPasswordValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      setFormError("Couldn't set your password. Please try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <Typography variant="body2" color="text.secondary">
        Checking your invite…
      </Typography>
    );
  }

  if (status === "invalid") {
    return (
      <Alert severity="error" icon={<AlertCircleIcon size={18} />}>
        This invite link is invalid or has expired. Ask an admin to send a new
        one.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5}>
        {formError ? (
          <Alert severity="error" icon={<AlertCircleIcon size={18} />}>
            {formError}
          </Alert>
        ) : null}

        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon size={16} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
          {...register("password")}
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          fullWidth
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon size={16} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting ? "Setting password…" : "Set password and sign in"}
        </Button>
      </Stack>
    </Box>
  );
}

export { AcceptInviteForm };
