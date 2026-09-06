import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { toErrorKind } from "@/lib/errors";
import { getModelList } from "@/features/catalogue/queries";

const TOP_MODEL_COUNT = 5;

/**
 * Ranks catalogue models by `compatiblePartCount` (already computed by
 * Phase 5's `getModelList`, src/features/catalogue/queries.ts) rather than
 * any sales/popularity metric this app doesn't track - "most parts
 * registered as fitting this model" is the real, honest number available.
 * Its own widget/Suspense boundary, same pattern as the rest of the
 * dashboard.
 */
async function TopModelsWidget() {
  let models;
  try {
    models = await getModelList({});
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top models</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  const topModels = models
    .filter((model) => model.compatiblePartCount > 0)
    .sort((a, b) => b.compatiblePartCount - a.compatiblePartCount)
    .slice(0, TOP_MODEL_COUNT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top models</CardTitle>
      </CardHeader>
      <CardContent>
        {topModels.length === 0 ? (
          <EmptyState
            title="No compatibility data yet"
            description="Link parts to models in the catalogue to see this list."
          />
        ) : (
          <MotionFadeIn>
            <ul className="space-y-1">
              {topModels.map((model, index) => (
                <li key={model.id}>
                  <Link
                    href={`/catalogue/models/${model.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {model.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {model.brandName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {model.compatiblePartCount}
                    </span>
                    <ChevronRightIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </MotionFadeIn>
        )}
      </CardContent>
    </Card>
  );
}

export { TopModelsWidget };
