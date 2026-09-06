"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { IconButton } from "@/components/shared/icon-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { setUserActive, updateUserRole } from "@/features/admin/actions";
import type { UserListRow } from "@/features/admin/queries";
import { ROLES } from "@/lib/permissions";
import { ROLE_LABELS } from "./role-labels";
import { InviteUserDialog } from "./invite-user-dialog";

type UserTableProps = {
  rows: UserListRow[];
  currentUserId: string;
};

const STATUS_VARIANT: Record<
  UserListRow["status"],
  "success" | "warning" | "destructive"
> = {
  active: "success",
  invited: "warning",
  deactivated: "destructive",
};

const STATUS_LABEL: Record<UserListRow["status"], string> = {
  active: "Active",
  invited: "Invited — pending",
  deactivated: "Deactivated",
};

function UserTable({ rows, currentUserId }: UserTableProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [togglingActive, setTogglingActive] =
    React.useState<UserListRow | null>(null);
  const [toggleLoading, setToggleLoading] = React.useState(false);

  async function handleRoleChange(row: UserListRow, role: string) {
    const result = await updateUserRole(row.id, {
      role: role as UserListRow["role"],
    });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function handleConfirmToggle() {
    if (!togglingActive) return;
    setToggleLoading(true);
    const activate = togglingActive.status === "deactivated";
    const result = await setUserActive(togglingActive.id, activate);
    setToggleLoading(false);
    setTogglingActive(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(activate ? "User reactivated" : "User deactivated");
    router.refresh();
  }

  const columns: ColumnDef<UserListRow, unknown>[] = [
    {
      id: "name",
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.fullName ?? "—"}
        </span>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: "role",
      header: "Role",
      enableSorting: false,
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId;
        return (
          <Select
            value={row.original.role}
            disabled={isSelf}
            onValueChange={(value) => handleRoleChange(row.original, value)}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "lastSignInAt",
      accessorKey: "lastSignInAt",
      header: "Last sign-in",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.lastSignInAt
            ? new Date(row.original.lastSignInAt).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId;
        const isDeactivated = row.original.status === "deactivated";
        return (
          <div className="flex justify-end">
            <IconButton
              label={isDeactivated ? "Reactivate user" : "Deactivate user"}
              disabled={isSelf}
              onClick={() => setTogglingActive(row.original)}
            >
              {isDeactivated ? <PowerIcon /> : <PowerOffIcon />}
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setInviteOpen(true)}>
          <PlusIcon /> Invite user
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={{ title: "No users yet" }}
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={togglingActive !== null}
        onOpenChange={(open) => !open && setTogglingActive(null)}
        title={
          togglingActive?.status === "deactivated"
            ? "Reactivate this user?"
            : "Deactivate this user?"
        }
        description={
          togglingActive?.status === "deactivated"
            ? "They'll be able to sign in again immediately."
            : "They'll be signed out and unable to sign in until reactivated. Their history and records are kept."
        }
        confirmLabel={
          togglingActive?.status === "deactivated" ? "Reactivate" : "Deactivate"
        }
        variant={
          togglingActive?.status === "deactivated" ? "default" : "destructive"
        }
        loading={toggleLoading}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}

export { UserTable };
