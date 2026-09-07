import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Bricolage_Grotesque,
  Roboto,
  Roboto_Mono,
} from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeRegistry } from "@/theme/theme-registry";
import "./globals.css";

// Legacy fonts - still referenced by pages not yet migrated off
// shadcn/Tailwind. Removed once every page is on MUI (see PROGRESS.md).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  weight: "variable",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ForkStock",
    template: "%s · ForkStock",
  },
  description:
    "Forklift spare-parts inventory, warehouse locations, and stock history for warehouse teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${displayFont.variable} ${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeRegistry>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </ThemeRegistry>
      </body>
    </html>
  );
}
