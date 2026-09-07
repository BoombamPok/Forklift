import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * The shared title + description + optional action row every non-hub
 * page opens with. Kept deliberately simple (no back-link, unlike
 * `ReportHeader`) since most pages reach their parent via the sidebar,
 * not a breadcrumb.
 *
 * The description is capped near 70 characters per line. Full-width
 * measure across a 1440px work surface is the fastest way to make a
 * dense app tiring to read.
 */
function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h2">
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, maxWidth: "62ch" }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {action ? (
        <Box sx={{ display: "flex", flexShrink: 0, gap: 1 }}>{action}</Box>
      ) : null}
    </Box>
  );
}

export { PageHeader };
