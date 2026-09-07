import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type SectionLabelProps = {
  children: React.ReactNode;
  /** Optional right-hand slot, e.g. a "See all" link. */
  action?: React.ReactNode;
};

/**
 * Divides a long screen into named bands.
 *
 * The rule that runs to the right of the label is doing real work: it
 * tells you where a section starts without adding another boxed
 * container, which is how dashboards end up as boxes inside boxes inside
 * boxes. Sentence case, normal tracking - no all-caps eyebrow.
 */
function SectionLabel({ children, action }: SectionLabelProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Typography
        component="h3"
        sx={{
          flexShrink: 0,
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "text.secondary",
        }}
      >
        {children}
      </Typography>
      <Box
        aria-hidden
        sx={{ flex: 1, height: "1px", bgcolor: "var(--rule)" }}
      />
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  );
}

export { SectionLabel };
