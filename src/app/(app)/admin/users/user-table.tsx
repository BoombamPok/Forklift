"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
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

const STATUS_TONE: Record<UserListRow["status"], StatusTone> = {
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
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.fullName ?? "—"}
        </Typography>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <Typography variant="body2" color="text.secondary">
          {row.original.email}
        </Typography>
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
            size="small"
            value={row.original.role}
            disabled={isSelf}
            onChange={(event: SelectChangeEvent) =>
              handleRoleChange(row.original, event.target.value)
            }
            sx={{ width: 144 }}
          >
            {ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={STATUS_LABEL[row.original.status]}
          tone={STATUS_TONE[row.original.status]}
        />
      ),
    },
    {
      id: "lastSignInAt",
      accessorKey: "lastSignInAt",
      header: "Last sign-in",
      cell: ({ row }) => (
        <Typography variant="body2" color="text.secondary">
          {row.original.lastSignInAt
            ? new Date(row.original.lastSignInAt).toLocaleDateString()
            : "Never"}
        </Typography>
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
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              label={isDeactivated ? "Reactivate user" : "Deactivate user"}
              disabled={isSelf}
              onClick={() => setTogglingActive(row.original)}
            >
              {isDeactivated ? (
                <PowerIcon size={16} />
              ) : (
                <PowerOffIcon size={16} />
              )}
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="contained"
          startIcon={<PlusIcon size={16} />}
          onClick={() => setInviteOpen(true)}
        >
          Invite user
        </Button>
      </Box>

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
    </Box>
  );
}

export { UserTable };
