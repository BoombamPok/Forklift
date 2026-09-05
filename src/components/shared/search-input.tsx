import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/shared/icon-button";

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  onClear?: () => void;
};

function SearchInput({
  className,
  value,
  onClear,
  ...props
}: SearchInputProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : !!value;

  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {hasValue && onClear ? (
        <IconButton
          label="Clear search"
          size="icon-xs"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={onClear}
        >
          <XIcon />
        </IconButton>
      ) : null}
    </div>
  );
}

export { SearchInput };
