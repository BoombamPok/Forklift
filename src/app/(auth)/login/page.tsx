import { BoxesIcon } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";
import { FeatureList } from "@/features/auth/components/feature-list";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { SceneLoader } from "@/components/three/scene-loader";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-10">
      <div aria-hidden className="bg-ambient-glow" />
      <div aria-hidden className="bg-ambient-glow-electric" />

      <MotionFadeIn className="relative w-full max-w-5xl">
        <div className="glass-panel relative flex w-full flex-col overflow-hidden rounded-2xl shadow-glow-primary lg:min-h-[600px] lg:flex-row">
          <div className="relative hidden w-full flex-col justify-between overflow-hidden px-10 py-10 text-foreground lg:flex lg:max-w-md xl:max-w-lg">
            <SceneLoader
              variant="login"
              posterTone="dual"
              className="absolute inset-0 z-0"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-background via-background/40 to-background/10"
            />

            <div className="relative z-10 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-accent-electric shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                <BoxesIcon aria-hidden className="size-4.5 text-white" />
              </div>
              <h2 className="font-heading text-base font-semibold tracking-tight">
                ForkStock
              </h2>
              <span className="ml-1 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Warehouse OS
              </span>
            </div>

            <div className="relative z-10 space-y-8">
              <p className="font-heading text-3xl leading-[1.15] font-medium tracking-tight text-balance">
                Find the right part, know whether you have it, and know exactly
                where it is.
              </p>
              <FeatureList className="space-y-2.5" />
            </div>

            <p className="relative z-10 text-xs text-muted-foreground">
              Forklift spare-parts inventory &amp; warehouse management
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:items-start lg:border-l lg:border-border/70 lg:px-14 lg:py-10">
            <div className="flex w-full max-w-sm flex-col items-center gap-2 pb-6 text-center lg:items-start lg:text-left">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-electric shadow-sm lg:hidden">
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

            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        </div>
      </MotionFadeIn>
    </div>
  );
}
