"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type NavLinkBoxProps = {
  href: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
};

/**
 * `<Box component={Link}>` styled as a link - pulled into its own Client
 * Component because a component *reference* (like `Link`) is a function,
 * and passing a function as a prop from a Server Component to a Client
 * Component (which is what MUI's Box always is) breaks RSC serialization
 * at runtime, not build time. Rendering `Link` from inside this
 * "use client" module instead of receiving it as a prop sidesteps that -
 * only serializable props (href, sx, children) cross the boundary.
 */
function NavLinkBox({ href, children, sx, className }: NavLinkBoxProps) {
  return (
    <Box component={Link} href={href} sx={sx} className={className}>
      {children}
    </Box>
  );
}

export { NavLinkBox };
