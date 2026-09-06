import { requireRole } from "@/lib/auth/require-role";
import { toErrorKind } from "@/lib/errors";
import { ErrorState } from "@/components/shared/error-state";
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
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Users &amp; Roles
        </h2>
        <p className="text-sm text-muted-foreground">
          Invite people and manage their role and account status.
        </p>
      </div>

      <UserTable rows={rows} currentUserId={user.id} />
    </div>
  );
}
