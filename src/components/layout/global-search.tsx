"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PackageIcon, TagIcon, TruckIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  searchGlobal,
  type SearchResult,
  type SearchResultKind,
} from "@/features/search/actions";

const DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type SearchState =
  { status: "error" } | { status: "results"; results: SearchResult[] };

const RESULT_ICON: Record<SearchResultKind, LucideIcon> = {
  part: PackageIcon,
  brand: TagIcon,
  model: TruckIcon,
};

type GlobalSearchProps = {
  className?: string;
};

/**
 * Header search (phase2c.md's "2e") - a dropdown under the input rather
 * than a dedicated results page, per the spec's own judgment call that a
 * dropdown suffices at this scope. Hand-rolled listbox (not the existing
 * Combobox, which filters a fixed local option list) since results come
 * from a debounced server call and need per-kind badges, not plain text
 * options.
 */
function GlobalSearch({ className }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [state, setState] = React.useState<SearchState>({
    status: "results",
    results: [],
  });
  const [isPending, startTransition] = React.useTransition();
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const latestRequest = React.useRef(0);

  React.useEffect(() => {
    if (debouncedQuery.length === 0) return;

    const requestId = ++latestRequest.current;

    startTransition(async () => {
      try {
        const results = await searchGlobal(debouncedQuery);
        if (requestId === latestRequest.current) {
          setState({ status: "results", results });
          setActiveIndex(-1);
        }
      } catch {
        if (requestId === latestRequest.current) {
          setState({ status: "error" });
          setActiveIndex(-1);
        }
      }
    });
  }, [debouncedQuery]);

  const results = state.status === "results" ? state.results : [];
  const showPanel = open && query.trim().length > 0;

  function navigateTo(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      navigateTo(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <SearchInput
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-listbox"
        aria-activedescendant={
          activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined
        }
        placeholder="Search parts, brands, models…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onKeyDown={handleKeyDown}
        onClear={() => {
          setQuery("");
          setOpen(false);
        }}
      />

      {showPanel ? (
        <div
          id="global-search-listbox"
          role="listbox"
          aria-label="Search results"
          className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {isPending ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              Searching…
            </div>
          ) : state.status === "error" ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Something went wrong. Try again.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No results for &ldquo;{debouncedQuery}&rdquo;.
            </p>
          ) : (
            <ul>
              {results.map((result, index) => {
                const Icon = RESULT_ICON[result.kind];
                return (
                  <li key={`${result.kind}-${result.id}`}>
                    <button
                      id={`global-search-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                        index === activeIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => navigateTo(result)}
                    >
                      <Icon
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {result.title}
                        </span>
                        {result.subtitle ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {result.badge ? (
                        <StatusBadge
                          label={result.badge.label}
                          tone={result.badge.tone}
                          className="shrink-0"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { GlobalSearch };
