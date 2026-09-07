"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PackageIcon,
  SearchIcon,
  TagIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

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
  sx?: SxProps<Theme>;
};

/**
 * Header search - a dropdown under the input rather than a dedicated
 * results page. Hand-rolled listbox (not MUI's Autocomplete, which has
 * its own state model that would require re-deriving this component's
 * debounced-server-call + keyboard-nav behavior, already e2e-tested)
 * since results come from a debounced server call and need per-kind
 * badges, not plain text options - only the presentation layer here is
 * MUI, the logic/ARIA structure is unchanged.
 */
function GlobalSearch({ sx }: GlobalSearchProps) {
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
    <Box sx={{ position: "relative", ...sx }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search parts, brands, models…"
        value={query}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-listbox"
        aria-activedescendant={
          activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={16} />
              </InputAdornment>
            ),
            endAdornment: query.length > 0 && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear search"
                  size="small"
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <XIcon size={14} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {showPanel ? (
        <Paper
          id="global-search-listbox"
          role="listbox"
          aria-label="Search results"
          elevation={4}
          sx={{
            position: "absolute",
            top: "100%",
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1,
            mt: 1,
            width: 352,
            maxWidth: "90vw",
            p: 0.5,
          }}
        >
          {isPending ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 2,
              }}
            >
              <CircularProgress size={16} aria-hidden />
              <Typography variant="body2" color="text.secondary">
                Searching…
              </Typography>
            </Box>
          ) : state.status === "error" ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2 }}
            >
              Something went wrong. Try again.
            </Typography>
          ) : results.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 2, py: 2 }}
            >
              No results for &ldquo;{debouncedQuery}&rdquo;.
            </Typography>
          ) : (
            <List disablePadding>
              {results.map((result, index) => {
                const Icon = RESULT_ICON[result.kind];
                return (
                  <ListItemButton
                    key={`${result.kind}-${result.id}`}
                    id={`global-search-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigateTo(result)}
                    sx={{ borderRadius: 1.5, gap: 1.5 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1.5,
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                      }}
                    >
                      <Icon aria-hidden size={14} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 500 }}
                      >
                        {result.title}
                      </Typography>
                      {result.subtitle ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{
                            display: "block",
                            fontFamily: "var(--font-plex-mono)",
                          }}
                        >
                          {result.subtitle}
                        </Typography>
                      ) : null}
                    </Box>
                    {result.badge ? (
                      <Box sx={{ flexShrink: 0 }}>
                        <StatusBadge
                          label={result.badge.label}
                          tone={result.badge.tone}
                        />
                      </Box>
                    ) : null}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Paper>
      ) : null}
    </Box>
  );
}

export { GlobalSearch };
