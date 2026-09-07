import Box from "@mui/material/Box";

import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { getUserList } from "@/features/admin/queries";
import { UserTable } from "./user-table";

export default async function AdminUsersPage() {
  const user = await requireRole("users.manage");

  let rows;
  try {
    rows = await getUserList();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Users & Roles"
        description="Invite people and manage their role and account status."
      />

      <UserTable rows={rows} currentUserId={user.id} />
    </Box>
  );
}
