import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/shared/toaster";
import { ThemeRegistry } from "@/theme/theme-registry";
import "./globals.css";

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
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body>
        <ThemeRegistry>
          {children}
          <Toaster position="top-right" />
        </ThemeRegistry>
      </body>
    </html>
  );
}
