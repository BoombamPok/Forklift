"use client";

import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

type SearchInputProps = Omit<
  React.ComponentProps<typeof TextField>,
  "type" | "className"
> & {
  onClear?: () => void;
  sx?: SxProps<Theme>;
  className?: string;
};

function SearchInput({ sx, value, onClear, ...props }: SearchInputProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : !!value;

  return (
    <TextField
      type="search"
      size="small"
      value={value}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon size={16} aria-hidden />
            </InputAdornment>
          ),
          endAdornment:
            hasValue && onClear ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={onClear}
                >
                  <XIcon size={14} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
        },
      }}
      {...props}
    />
  );
}

export { SearchInput };
