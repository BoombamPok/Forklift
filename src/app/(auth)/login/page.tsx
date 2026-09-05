import { BoxesIcon } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <BoxesIcon aria-hidden className="size-8 text-primary" />
          <h1 className="font-heading text-lg font-semibold">ForkStock</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage inventory and warehouse operations.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
