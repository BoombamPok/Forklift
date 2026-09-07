"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useColorScheme } from "@mui/material/styles";
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
  // Was hard-coded to "light", which meant a full-brightness toast card
  // firing over a dark screen. Sonner accepts "system" and resolves it
  // itself, so the only case needing help is an explicit override.
  const { mode } = useColorScheme();

  return (
    <Sonner
      theme={mode ?? "system"}
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
          "--border-radius": "var(--radius-panel)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
