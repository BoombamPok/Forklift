import * as React from "react";
import { cn } from "@/lib/utils";

type GradientTextProps = React.ComponentProps<"span"> & {
  tone?: "primary" | "electric";
};

/**
 * Renders `children` as a single text node inside one element - do not
 * split characters/words into separate spans here. Screen readers and
 * Playwright's getByRole/getByText both compute the accessible name from
 * the full text content of the element; splitting it risks silently
 * changing that name for anything e2e-asserted (headings, button labels).
 */
function GradientText({
  className,
  tone = "primary",
  ...props
}: GradientTextProps) {
  return (
    <span
      data-slot="gradient-text"
      className={cn(
        "bg-clip-text text-transparent",
        tone === "primary"
          ? "bg-[linear-gradient(135deg,var(--foreground),var(--primary))]"
          : "bg-[linear-gradient(135deg,var(--foreground),var(--accent-electric))]",
        className,
      )}
      {...props}
    />
  );
}

export { GradientText };
