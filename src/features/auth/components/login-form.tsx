"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { login } from "@/features/auth/actions";
import { loginSchema, type LoginValues } from "@/features/auth/schema";

function LoginForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const errorRef = React.useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = await login(values);
    if (!result.success) {
      setFormError(result.error.message);
    }
  }

  React.useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5}>
        {formError ? (
          <Alert
            severity="error"
            ref={errorRef}
            tabIndex={-1}
            icon={<AlertCircleIcon size={18} />}
          >
            {formError}
          </Alert>
        ) : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          autoFocus
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MailIcon size={16} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
          {...register("email")}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
                    size="small"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Hide typed characters"
                        : "Show typed characters"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={16} aria-hidden />
                    ) : (
                      <EyeIcon size={16} aria-hidden />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          {...register("password")}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
    </Box>
  );
}

export { LoginForm };
