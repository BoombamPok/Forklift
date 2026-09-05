import * as React from "react";
import { CircleDashedIcon } from "lucide-react";

type PlaceholderPageProps = {
  phase: number;
  description?: string;
};

/**
 * Route stub for a section whose real implementation belongs to a later
 * phase (see CLAUDE.md #19 - do not implement future-phase functionality
 * early). This establishes the route now without pretending the feature
 * exists.
 */
function PlaceholderPage({ phase, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <CircleDashedIcon aria-hidden className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Coming in Phase {phase}
        </p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { PlaceholderPage };
