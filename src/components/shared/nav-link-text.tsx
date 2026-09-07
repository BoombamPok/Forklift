"use client";

import * as React from "react";
import NextLink from "next/link";
import MuiLink from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";

type NavLinkTextProps = {
  href: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * `<Link href>` styled as MUI's inline text `Link` - same reason as
 * `NavLinkBox`/`NavLinkButton`: `next/link`'s `Link` is a component
 * reference (a function), so passing it as `component=` from a Server
 * Component to MUI's Link (always a Client Component) breaks RSC
 * serialization at runtime.
 */
function NavLinkText({ href, children, sx }: NavLinkTextProps) {
  return (
    <MuiLink component={NextLink} href={href} sx={sx}>
      {children}
    </MuiLink>
  );
}

export { NavLinkText };
