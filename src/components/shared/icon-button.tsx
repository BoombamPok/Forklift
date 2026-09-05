import * as React from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VariantProps } from "class-variance-authority";

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "size"> &
  Pick<VariantProps<typeof buttonVariants>, "variant"> & {
    label: string;
    size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  };

/**
 * A button that shows only an icon. `label` is required and doubles as the
 * accessible name (aria-label) and the hover tooltip, since an icon alone
 * never satisfies WCAG 2.1 AA labeling on its own.
 */
function IconButton({
  label,
  size = "icon",
  variant = "ghost",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={label}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export { IconButton };
