"use client";

import * as React from "react";
import Link from "next/link";
import Button from "@mui/material/Button";

type NavLinkButtonProps = Omit<React.ComponentProps<typeof Button>, "href"> & {
  href: string;
};

/**
 * `<Button component={Link}>` - pulled into its own Client Component for
 * the same reason as `NavLinkBox`: a component *reference* (`Link`) is a
 * function, and passing a function as a prop from a Server Component to
 * a Client Component (which MUI's Button always is) breaks RSC
 * serialization at runtime. Rendering `Link` from inside this "use
 * client" module instead of receiving it as a prop sidesteps that.
 */
function NavLinkButton({ href, ...props }: NavLinkButtonProps) {
  // MUI's polymorphic `component` typing doesn't resolve cleanly through
  // a wrapper's own prop type; the runtime behavior is well-established
  // (Button + component=Link is MUI's documented Next.js Link pattern).
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Button component={Link as any} href={href} {...props} />
  );
}

export { NavLinkButton };
