import * as React from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";

type HeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onOpenMobileNav: () => void;
};

/**
 * Page title/context + global search foundation, per phase1.md #19. The
 * search input is intentionally disabled - the real search engine is a
 * later phase, this only establishes where it will live.
 */
function Header({ title, description, actions, onOpenMobileNav }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-ml-1.5 lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
      >
        <MenuIcon />
      </Button>

      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {description}
          </p>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SearchInput
          placeholder="Search (coming soon)"
          disabled
          className="hidden w-64 sm:block"
        />
        {actions}
      </div>
    </header>
  );
}

export { Header };
