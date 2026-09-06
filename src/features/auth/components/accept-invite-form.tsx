"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, LockIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shared/form";
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

  const form = useForm<SetPasswordValues>({
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
      <p className="text-sm text-muted-foreground">Checking your invite…</p>
    );
  }

  if (status === "invalid") {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertDescription>
          This invite link is invalid or has expired. Ask an admin to send a new
          one.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <div className="relative">
                <LockIcon
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-2.5 my-auto size-3.5 text-muted-foreground"
                />
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    className="pl-8"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <div className="relative">
                <LockIcon
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-2.5 my-auto size-3.5 text-muted-foreground"
                />
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    className="pl-8"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2Icon aria-hidden className="animate-spin" />
              Setting password…
            </>
          ) : (
            "Set password and sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}

export { AcceptInviteForm };
