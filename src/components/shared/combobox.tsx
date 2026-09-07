"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  label?: string;
  sx?: SxProps<Theme>;
  className?: string;
};

/**
 * Searchable single-select, e.g. picking a brand/model/category from a
 * list too long for a plain Select. A thin wrapper over MUI's Autocomplete
 * that keeps the app's plain-string `value`/`onChange` contract instead of
 * exposing the full option object, so every caller stays unaware of the
 * swap from the old Command+Popover combobox.
 */
function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyText = "No matches found.",
  disabled,
  error,
  helperText,
  label,
  sx,
  className,
}: ComboboxProps) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_event, option) => onChange(option?.value ?? "")}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      disabled={disabled}
      noOptionsText={emptyText}
      className={className}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}

export { Combobox, type ComboboxOption };
