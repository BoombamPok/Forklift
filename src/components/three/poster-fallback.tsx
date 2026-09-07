import { cn } from "@/lib/utils";

type PosterFallbackProps = {
  className?: string;
  /** Which accent hue the static gradient should lean toward. */
  tone?: "primary" | "electric" | "dual";
};

/**
 * Static, zero-JS stand-in for a 3D hero scene - shown on
 * prefers-reduced-motion, below the `lg:` breakpoint (desktop-first,
 * per CLAUDE.md's §8, is not waived even for the visual-identity reset),
 * or before the real Canvas has mounted. Pure CSS radial gradients, no
 * WebGL, no motion.
 */
function PosterFallback({ className, tone = "dual" }: PosterFallbackProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {(tone === "primary" || tone === "dual") && (
        <div
          className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 70%), transparent 70%)",
          }}
        />
      )}
      {(tone === "electric" || tone === "dual") && (
        <div
          className="absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 translate-x-1/4 translate-y-1/4 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--accent-electric), transparent 72%), transparent 70%)",
          }}
        />
      )}
    </div>
  );
}

export { PosterFallback };
