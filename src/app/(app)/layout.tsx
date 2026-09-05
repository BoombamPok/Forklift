"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getPageTitle } from "@/lib/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return <AppShell title={getPageTitle(pathname)}>{children}</AppShell>;
}
