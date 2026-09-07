"use client";

import * as React from "react";
import MuiIconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

type IconButtonProps = Omit<
  React.ComponentProps<typeof MuiIconButton>,
  "size" | "color"
> & {
  label: string;
  size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
  variant?: "ghost" | "destructive";
};

const SIZE_MAP: Record<
  NonNullable<IconButtonProps["size"]>,
  "small" | "medium"
> = {
  "icon-xs": "small",
  "icon-sm": "small",
  icon: "medium",
  "icon-lg": "medium",
};

const COLOR_MAP: Record<
  NonNullable<IconButtonProps["variant"]>,
  "default" | "error"
> = {
  ghost: "default",
  destructive: "error",
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
    <Tooltip title={label}>
      <MuiIconButton
        type="button"
        size={SIZE_MAP[size]}
        color={COLOR_MAP[variant]}
        aria-label={label}
        {...props}
      >
        {children}
      </MuiIconButton>
    </Tooltip>
  );
}

export { IconButton };
