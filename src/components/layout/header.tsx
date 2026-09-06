import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

/**
 * Page title/context + global search (phase1.md #19 shell, wired up per
 * phase2c.md's "2e").
 */
function Header({ title, onOpenMobileNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md lg:px-6">
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

      <h1 className="min-w-0 truncate font-heading text-base font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch className="hidden w-64 sm:block" />
      </div>
    </header>
  );
}

export { Header };
