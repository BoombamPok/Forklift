"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountUser = { name: string; email: string };

type AccountMenuProps = {
  user?: AccountUser | null;
  onSignOut?: () => void;
};

/**
 * Sidebar footer account area. With no `user` yet (auth not wired), this
 * shows a neutral placeholder rather than fabricating a name/email.
 */
function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-2.5 px-2 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                <UserIcon className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-left text-sm">
              {user?.name ?? "Account"}
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-sidebar-foreground/50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {user ? (
            <div className="px-1.5 py-1 text-xs text-muted-foreground">
              {user.email}
            </div>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <SettingsIcon /> Administration
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
            <LogOutIcon /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { AccountMenu, type AccountUser };
