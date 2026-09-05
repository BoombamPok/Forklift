import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// This section is per-user by definition - never let it be statically
// prerendered. (Relying only on cookies() to trigger that automatically
// is fragile: getCurrentUser() intentionally returns early, before ever
// calling cookies(), when Supabase isn't configured yet, which would
// otherwise let a build bake in a single cached "signed out" shell.)
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <AppShell user={user ? { name: user.name, email: user.email } : null}>
      {children}
    </AppShell>
  );
}
