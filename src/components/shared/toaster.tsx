"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

/**
 * The one toast notification renderer, mounted once at the app root.
 * Icon set matches the app's success/info/warning/error/loading
 * vocabulary used everywhere else (StatusBadge tones, alerts).
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      icons={{
        success: <CircleCheckIcon size={16} />,
        info: <InfoIcon size={16} />,
        warning: <TriangleAlertIcon size={16} />,
        error: <OctagonXIcon size={16} />,
        loading: (
          <Loader2Icon
            size={16}
            style={{ animation: "toaster-spin 1s linear infinite" }}
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--mui-palette-background-paper)",
          "--normal-text": "var(--mui-palette-text-primary)",
          "--normal-border": "var(--mui-palette-divider)",
          "--border-radius": "10px",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
