import * as React from "react";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type StatusTone = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
  className?: string;
};

/**
 * Every status shown to a user (inventory status, movement type, role, etc.)
 * should go through this so tone usage stays consistent app-wide instead of
 * each feature inventing its own color choice for "in stock" vs "low stock".
 */
function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <Badge variant={tone} className={className}>
      {label}
    </Badge>
  );
}

export { StatusBadge, type StatusTone };
