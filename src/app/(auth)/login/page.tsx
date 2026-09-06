import { BoxesIcon } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";
import { FeatureList } from "@/features/auth/components/feature-list";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh bg-background">
      <div className="relative hidden w-full max-w-md flex-col justify-between overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex xl:max-w-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-sidebar-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-black/20 to-transparent"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-sidebar-primary to-orange-400 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            <BoxesIcon aria-hidden className="size-4.5 text-white" />
          </div>
          <span className="font-heading text-base font-semibold tracking-tight">
            ForkStock
          </span>
          <span className="ml-1 rounded-sm bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
            Warehouse OS
          </span>
        </div>

        <div className="relative space-y-8">
          <p className="font-heading text-3xl leading-[1.15] font-medium tracking-tight text-balance">
            Find the right part, know whether you have it, and know exactly
            where it is.
          </p>
          <FeatureList className="space-y-2.5" />
        </div>

        <p className="relative text-xs text-sidebar-foreground/40">
          Forklift spare-parts inventory &amp; warehouse management
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <MotionFadeIn className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 pb-6 text-center lg:items-start lg:text-left">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-sm lg:hidden">
              <BoxesIcon aria-hidden className="size-5 text-white" />
            </div>
            <span className="font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
              Secure sign-in
            </span>
            <h1 className="font-heading text-lg font-semibold tracking-tight lg:text-2xl">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage inventory and warehouse operations for ForkStock.
            </p>
          </div>

          <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
            <LoginForm />
          </div>
        </MotionFadeIn>
      </div>
    </div>
  );
}
