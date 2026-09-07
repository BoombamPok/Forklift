import * as React from "react";
import { SceneLoader } from "@/components/three/scene-loader";

type HubHeroProps = {
  title: string;
  description: string;
  /** Rotates which accent leads the 3D composition, so catalogue/reports/
   * admin don't all look identical. */
  leadHue?: "amber" | "electric";
  actions?: React.ReactNode;
};

/**
 * Shared glass-panel + 3D banner for the three hub pages (catalogue,
 * reports, admin) - they're plain link grids with no dense data to
 * protect, the safest place to go big on decoration. Extracted once a
 * third caller needed the identical header shape, per this codebase's
 * existing extract-on-third-caller convention.
 */
function HubHero({
  title,
  description,
  leadHue = "amber",
  actions,
}: HubHeroProps) {
  return (
    <div className="glass-panel relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl px-6 py-6 shadow-glow-primary sm:min-h-64 sm:px-8">
      <SceneLoader
        variant="hub"
        leadHue={leadHue}
        posterTone={leadHue === "amber" ? "primary" : "electric"}
        className="absolute inset-0 z-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-background from-50% to-transparent"
      />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-prose space-y-1.5">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export { HubHero };
