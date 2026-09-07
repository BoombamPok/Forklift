import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Toaster } from "@/components/shared/toaster";
import { ThemeRegistry } from "@/theme/theme-registry";
import "./globals.css";

/**
 * IBM Plex Sans / Plex Mono, not Roboto.
 *
 * Roboto is Material's default, which is exactly the problem - it makes
 * any MUI app read as "an MUI app". Plex was drawn for engineering and
 * technical documentation: it has real character (the flared stems, the
 * cut of the `a` and `g`) without being a display face, and its mono
 * companion is genuinely designed to sit next to the sans rather than
 * being a different family bolted on.
 *
 * Mono is not styling. Part numbers are strings where 0/O and 1/l have
 * to be distinguishable at 12px, and a column of quantities is only
 * scannable with tabular figures.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ForkStock",
    template: "%s · ForkStock",
  },
  description:
    "Forklift spare-parts inventory, warehouse locations, and stock history for warehouse teams.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFF1F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1017" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        {/*
          Applies the saved color scheme class before first paint. Without
          it a user on dark mode gets a full-brightness white flash on
          every navigation that hits the server, which is the single most
          expensive-feeling bug a themed app can ship. `attribute` must
          match `colorSchemeSelector` in theme.ts.
        */}
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <ThemeRegistry>
          {children}
          <Toaster position="bottom-right" />
        </ThemeRegistry>
      </body>
    </html>
  );
}
