import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

/**
 * Page title/context + global search foundation, per phase1.md #19. The
 * search input is intentionally disabled - the real search engine is a
 * later phase, this only establishes where it will live.
 */
function Header({ title, onOpenMobileNav }: HeaderProps) {
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

      <h1 className="min-w-0 truncate text-sm font-semibold text-foreground">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <SearchInput
          placeholder="Search (coming soon)"
          disabled
          className="hidden w-64 sm:block"
        />
      </div>
    </header>
  );
}

export { Header };
