import * as React from "react";
import {
  AlertTriangleIcon,
  LockIcon,
  SearchXIcon,
  ServerCrashIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ErrorKind } from "@/lib/errors";

const ERROR_PRESETS: Record<
  ErrorKind,
  { icon: LucideIcon; title: string; description: string }
> = {
  permission: {
    icon: LockIcon,
    title: "You don't have access to this",
    description: "Ask an administrator if you believe this is a mistake.",
  },
  "not-found": {
    icon: SearchXIcon,
    title: "Not found",
    description: "This item may have been moved, renamed, or removed.",
  },
  network: {
    icon: ServerCrashIcon,
    title: "Connection problem",
    description: "Check your connection and try again.",
  },
  unexpected: {
    icon: AlertTriangleIcon,
    title: "Something went wrong",
    description: "Please try again. The issue has been logged.",
  },
};

type ErrorStateProps = {
  kind?: ErrorKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * Never render raw database/Supabase error text here - map it to one of
 * these kinds server-side first (see lib/errors.ts).
 */
function ErrorState({
  kind = "unexpected",
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const preset = ERROR_PRESETS[kind];
  const Icon = preset.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <Icon aria-hidden className="size-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {title ?? preset.title}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description ?? preset.description}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
