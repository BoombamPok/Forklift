import { requireRole } from "@/lib/auth/require-role";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default async function AdminPage() {
  await requireRole("users.manage");

  return (
    <PlaceholderPage
      phase={7}
      description="Users, roles, permissions, warehouse configuration, and import/export tools."
    />
  );
}
